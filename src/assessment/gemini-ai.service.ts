import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

import { FuzzyResult, SoilInput } from './fuzzy-engine.service.js';
import { RecommendationDto } from './dto/assessment-response.dto.js';

export interface AiOutput {
  recommendations: RecommendationDto[];
}

@Injectable()
export class GeminiAiService {
  private readonly logger = new Logger(GeminiAiService.name);
  private readonly client: GoogleGenAI | null;

  private readonly model = 'gemini-3.5-flash-lite';

  constructor(private readonly config: ConfigService) {
    const apiKey = (
      config.get<string>('GEMINI_API_KEY') ??
      config.get<string>('GOOGLE_API_KEY') ??
      ''
    ).trim();

    if (apiKey) {
      this.client = new GoogleGenAI({
        apiKey,
      });
    } else {
      this.client = null;

      this.logger.warn(
        'GEMINI_API_KEY or GOOGLE_API_KEY not set — AI recommendations will use rule-based fallback',
      );
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
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,

        config: {
          temperature: 0.2,
          maxOutputTokens: 1024,

          responseMimeType: 'application/json',

          responseSchema: {
            type: Type.OBJECT,

            properties: {
              recommendations: {
                type: Type.ARRAY,

                items: {
                  type: Type.OBJECT,

                  properties: {
                    title: {
                      type: Type.STRING,
                    },

                    subtitle: {
                      type: Type.STRING,
                    },

                    detail: {
                      type: Type.STRING,
                    },

                    is_critical: {
                      type: Type.BOOLEAN,
                    },
                  },

                  required: ['title', 'subtitle', 'detail', 'is_critical'],
                },
              },
            },

            required: ['recommendations'],
          },
        },
      });

      const text = response.text;

      if (!text) {
        throw new Error('Gemini returned an empty response');
      }

      return this.parseAiResponse(text, fuzzyResult);
    } catch (err) {
      this.logger.warn(
        `Gemini API call failed: ${
          err instanceof Error ? err.message : String(err)
        }. Using fallback.`,
      );

      return this.ruleBasedFallback(fuzzyResult);
    }
  }

  private buildPrompt(fuzzyResult: FuzzyResult, input: SoilInput): string {
    const paramSummary = Object.entries(fuzzyResult.scores)
      .map(([key, score]) => {
        const value = (input as unknown as Record<string, number>)[key];

        return `${key}: ${value} (fuzzy score: ${score.toFixed(2)})`;
      })
      .join('\n');

    return `
You are an agricultural recommendation assistant specialising in
smallholder farming in Nigeria.

Your task is to provide practical soil-management recommendations
based ONLY on the supplied soil assessment.

IMPORTANT RULES:

1. Do not change, reinterpret, or override the suitability class.
2. Do not invent soil measurements.
3. Do not introduce parameters that were not supplied.
4. Prioritise critical factors and limiting factors.
5. Recommendations must be practical for a Nigerian smallholder farmer.
6. Keep recommendations concise and actionable.
7. If a soil amendment is suggested, explain what the farmer should do.
8. Do not claim that a recommendation guarantees a particular yield.
9. Do not provide a recommendation that contradicts the supplied
   suitability assessment.
10. The fuzzy engine is the authoritative source for suitability;
    you are only generating recommendations.

ASSESSMENT

Crop:
${fuzzyResult.crop}

Suitability Class:
${fuzzyResult.suitabilityClass}

Suitability Label:
${fuzzyResult.suitabilityLabel}

Match Score:
${fuzzyResult.adjustedSI.toFixed(2)}

Critical Factors:
${fuzzyResult.criticalFactors.join(', ') || 'None'}

Limiting Factors:
${fuzzyResult.limitingFactors.join(', ') || 'None'}

SOIL PARAMETERS AND FUZZY SCORES:

${paramSummary}

Generate between 3 and 5 recommendations.

Each recommendation must contain:

- title: 3-6 words
- subtitle: short severity/action label
- detail: practical advice a Nigerian smallholder farmer can follow
- is_critical: true only when the recommendation addresses a
  critical or strongly limiting factor

Return ONLY the requested JSON structure.
`;
  }

  private parseAiResponse(text: string, fuzzyResult: FuzzyResult): AiOutput {
    try {
      const parsed = JSON.parse(text) as {
        recommendations?: unknown[];
      };

      if (!Array.isArray(parsed.recommendations)) {
        throw new Error('Invalid recommendations format');
      }

      const recommendations: RecommendationDto[] = parsed.recommendations
        .filter(
          (recommendation): recommendation is Record<string, unknown> =>
            typeof recommendation === 'object' && recommendation !== null,
        )
        .map((recommendation) => ({
          title:
            typeof recommendation['title'] === 'string'
              ? recommendation['title']
              : '',

          subtitle:
            typeof recommendation['subtitle'] === 'string'
              ? recommendation['subtitle']
              : '',

          detail:
            typeof recommendation['detail'] === 'string'
              ? recommendation['detail']
              : '',

          isCritical: recommendation['is_critical'] === true,
          ...(recommendation['is_critical'] === undefined && {
            isCritical: recommendation['isCritical'] === true,
          }),
        }))
        .filter(
          (recommendation) =>
            recommendation.title &&
            recommendation.subtitle &&
            recommendation.detail,
        );

      if (recommendations.length === 0) {
        throw new Error('Empty recommendations');
      }

      return {
        recommendations: recommendations.slice(0, 5),
      };
    } catch (err) {
      this.logger.warn(
        `Failed to parse Gemini response: ${
          err instanceof Error ? err.message : String(err)
        }. Using fallback.`,
      );

      return this.ruleBasedFallback(fuzzyResult);
    }
  }

  private ruleBasedFallback(fuzzyResult: FuzzyResult): AiOutput {
    const recommendations: RecommendationDto[] = [];

    if (fuzzyResult.criticalFactors.length > 0) {
      recommendations.push({
        title: 'Critical Soil Factors Detected',
        subtitle: 'Immediate Action Required',
        detail: `Critically limiting factors: ${fuzzyResult.criticalFactors.join(
          ', ',
        )}. Immediate soil improvement may be required before planting ${
          fuzzyResult.crop
        }.`,
        isCritical: true,
      });
    }

    if (fuzzyResult.limitingFactors.length > 0) {
      recommendations.push({
        title: 'Improve Limiting Parameters',
        subtitle: 'Recommended for Yield Stability',
        detail: `Moderately limiting factors: ${fuzzyResult.limitingFactors.join(
          ', ',
        )}. Targeted improvement of these parameters can improve the soil's suitability for ${
          fuzzyResult.crop
        }.`,
        isCritical: false,
      });
    }

    const phScore = fuzzyResult.scores['ph'] ?? 1;

    if (phScore < 0.5) {
      recommendations.push({
        title: 'Correct Soil pH',
        subtitle: 'Critical Improvement Needed',
        detail:
          'Soil pH is outside the preferred range. Apply an appropriate amendment based on a soil test and local agronomic guidance. Retest the soil after amendment.',
        isCritical: true,
      });
    }

    const omScore = fuzzyResult.scores['organicMatter'] ?? 1;

    if (omScore < 0.5) {
      recommendations.push({
        title: 'Boost Organic Matter',
        subtitle: 'Recommended for Soil Health',
        detail:
          'Organic matter is low. Incorporate suitable compost, well-decomposed manure, or crop residues to improve soil structure and nutrient retention.',
        isCritical: false,
      });
    }

    const drainageScore = fuzzyResult.scores['drainage'] ?? 1;

    if (drainageScore < 0.5) {
      recommendations.push({
        title: 'Improve Drainage',
        subtitle: 'Recommended for Water Management',
        detail: `Drainage conditions are suboptimal for ${fuzzyResult.crop}. Consider appropriate field drainage practices such as ridging, raised beds, or drainage channels where suitable.`,
        isCritical: false,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Conditions Are Favourable',
        subtitle: 'Maintain Current Practices',
        detail: `Soil conditions are ${fuzzyResult.suitabilityLabel.toLowerCase()} for ${fuzzyResult.crop} cultivation. Maintain good soil-management practices and continue monitoring soil fertility.`,
        isCritical: false,
      });
    }

    recommendations.push({
      title: 'Annual Soil Testing',
      subtitle: 'Ongoing Best Practice',
      detail:
        'Conduct periodic soil testing and use the results to guide nutrient and soil-management decisions.',
      isCritical: false,
    });

    return {
      recommendations: recommendations.slice(0, 5),
    };
  }
}
