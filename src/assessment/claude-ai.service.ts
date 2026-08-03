import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { FuzzyResult } from './fuzzy-engine.service.js';
import { SoilInput } from './fuzzy-engine.service.js';
import { RecommendationDto } from './dto/assessment-response.dto.js';

export interface AiOutput {
  recommendations: RecommendationDto[];
}

@Injectable()
export class ClaudeAiService {
  private readonly logger = new Logger(ClaudeAiService.name);
  private readonly client: Anthropic | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    } else {
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — AI recommendations will use rule-based fallback',
      );
      this.client = null;
    }
  }

  async generateRecommendations(
    fuzzyResult: FuzzyResult,
    input: SoilInput,
  ): Promise<AiOutput> {
    if (!this.client) {
      return this.ruleBasedFallback(fuzzyResult);
    }

    const prompt = this.buildPrompt(fuzzyResult, input);

    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text)
        .join('');

      return this.parseAiResponse(text, fuzzyResult);
    } catch (err) {
      this.logger.warn(
        `Claude API call failed: ${(err as Error).message}. Using fallback.`,
      );
      return this.ruleBasedFallback(fuzzyResult);
    }
  }

  private buildPrompt(fuzzyResult: FuzzyResult, input: SoilInput): string {
    const paramSummary = Object.entries(fuzzyResult.scores)
      .map(
        ([k, v]) =>
          `${k}: ${(input as unknown as Record<string, number>)[k]} (score: ${v.toFixed(2)})`,
      )
      .join('\n');

    return `You are an expert agronomist specialising in Nigerian smallholder farming. Analyse the following soil assessment result and provide actionable recommendations.

            Crop: ${fuzzyResult.crop}
            Suitability Class: ${fuzzyResult.suitabilityClass} — ${fuzzyResult.suitabilityLabel}
            Match Score: ${fuzzyResult.adjustedSI.toFixed(2)}
            Critical factors: ${fuzzyResult.criticalFactors.join(', ') || 'None'}
            Limiting factors: ${fuzzyResult.limitingFactors.join(', ') || 'None'}

            Soil Parameters:
            ${paramSummary}

            Respond with a JSON object in this exact format:
            {
              "recommendations": [
                {
                  "title": "Short title (3-6 words)",
                  "subtitle": "Severity tag e.g. 'Critical Improvement Needed' or 'Recommended for Yield Stability'",
                  "detail": "Specific, actionable advice a smallholder farmer in Nigeria can follow.",
                  "is_critical": true
                }
              ]
            }

            Provide 3-5 recommendations. Set is_critical to true only for critical/limiting factors. Focus on the critical and limiting factors first.`;
  }

  private parseAiResponse(text: string, fuzzyResult: FuzzyResult): AiOutput {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]) as {
        recommendations?: unknown[];
      };

      const recommendations: RecommendationDto[] = Array.isArray(
        parsed.recommendations,
      )
        ? parsed.recommendations
            .filter(
              (r): r is Record<string, unknown> =>
                typeof r === 'object' && r !== null,
            )
            .map((r) => ({
              title: typeof r['title'] === 'string' ? r['title'] : '',
              subtitle: typeof r['subtitle'] === 'string' ? r['subtitle'] : '',
              detail: typeof r['detail'] === 'string' ? r['detail'] : '',
              isCritical: r['is_critical'] === true,
            }))
        : [];

      if (recommendations.length === 0)
        throw new Error('Empty recommendations');

      return { recommendations };
    } catch {
      return this.ruleBasedFallback(fuzzyResult);
    }
  }

  private ruleBasedFallback(fuzzyResult: FuzzyResult): AiOutput {
    const recommendations: RecommendationDto[] = [];

    if (fuzzyResult.criticalFactors.length > 0) {
      recommendations.push({
        title: 'Critical Soil Factors Detected',
        subtitle: 'Immediate Action Required',
        detail: `Critically limiting factors: ${fuzzyResult.criticalFactors.join(', ')}. Immediate soil amendment is required before planting ${fuzzyResult.crop}.`,
        isCritical: true,
      });
    }

    if (fuzzyResult.limitingFactors.length > 0) {
      recommendations.push({
        title: 'Improve Limiting Parameters',
        subtitle: 'Recommended for Yield Stability',
        detail: `Moderately limiting factors: ${fuzzyResult.limitingFactors.join(', ')}. Targeted improvement of these parameters will increase yield potential.`,
        isCritical: false,
      });
    }

    const phScore = fuzzyResult.scores['ph'] ?? 1;
    if (phScore < 0.5) {
      recommendations.push({
        title: 'Correct Soil pH',
        subtitle: 'Critical Improvement Needed',
        detail:
          'Soil pH is outside optimal range. Apply lime to raise pH or sulphur to lower pH as appropriate. Retest after 3-6 months.',
        isCritical: true,
      });
    }

    const omScore = fuzzyResult.scores['organicMatter'] ?? 1;
    if (omScore < 0.5) {
      recommendations.push({
        title: 'Boost Organic Matter',
        subtitle: 'Recommended for Soil Health',
        detail:
          'Organic matter is low. Incorporate compost, farmyard manure, or crop residues to improve soil structure and nutrient retention.',
        isCritical: false,
      });
    }

    const drainageScore = fuzzyResult.scores['drainage'] ?? 1;
    if (drainageScore < 0.5) {
      recommendations.push({
        title: 'Improve Drainage',
        subtitle: 'Recommended for Water Management',
        detail: `Drainage conditions are suboptimal for ${fuzzyResult.crop}. Consider raised beds, ridges, or drainage channels to improve water management.`,
        isCritical: false,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push(
        {
          title: 'Conditions Are Favourable',
          subtitle: 'Maintain Current Practices',
          detail: `Soil conditions are ${fuzzyResult.suitabilityLabel.toLowerCase()} for ${fuzzyResult.crop} cultivation. Maintain current soil management practices including regular organic matter addition.`,
          isCritical: false,
        },
        {
          title: 'Annual Soil Testing',
          subtitle: 'Ongoing Best Practice',
          detail:
            'Monitor soil pH and nutrient levels annually and apply fertiliser based on soil test results.',
          isCritical: false,
        },
      );
    } else {
      recommendations.push({
        title: 'Annual Soil Testing',
        subtitle: 'Ongoing Best Practice',
        detail:
          'Conduct a comprehensive soil test annually and apply NPK fertiliser based on results to maintain optimal nutrient balance.',
        isCritical: false,
      });
    }

    return { recommendations };
  }
}
