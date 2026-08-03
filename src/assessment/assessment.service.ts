import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { FuzzyEngineService } from './fuzzy-engine.service.js';
import { ClaudeAiService } from './claude-ai.service.js';
import { AssessmentRequestDto } from './dto/assessment-request.dto.js';
import {
  AssessmentResponseDto,
  ParameterResultDto,
  AlternativeCropDto,
} from './dto/assessment-response.dto.js';
import { CROP_REQUIREMENTS, type CropName } from './crop-requirements.data.js';
import { Assessment, AssessmentDocument } from './schemas/assessment.schema.js';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    private readonly fuzzyEngine: FuzzyEngineService,
    private readonly claudeAi: ClaudeAiService,
    @Optional()
    @InjectModel(Assessment.name)
    private readonly assessmentModel: Model<AssessmentDocument> | null,
  ) {}

  async runAssessment(
    request: AssessmentRequestDto,
  ): Promise<AssessmentResponseDto> {
    const soilInput = this.extractSoilInput(request);
    const fuzzyResult = this.fuzzyEngine.evaluateCrop(
      soilInput,
      request.crop as CropName,
    );
    const aiOutput = await this.claudeAi.generateRecommendations(
      fuzzyResult,
      soilInput,
    );

    const allCrops = this.fuzzyEngine.evaluateAllCrops(soilInput);
    const alternativeCrops: AlternativeCropDto[] = allCrops
      .filter((r) => r.crop !== request.crop)
      .slice(0, 5)
      .map((r) => ({
        name: r.crop,
        suitabilityClass: r.suitabilityClass,
        reason: `${r.suitabilityLabel} match with your current soil conditions (score: ${(r.adjustedSI * 100).toFixed(0)}%).`,
      }));

    const cropReq = CROP_REQUIREMENTS[request.crop as CropName];
    const parameters: ParameterResultDto[] = Object.entries(
      fuzzyResult.scores,
    ).map(([paramKey, score]) => {
      const req = cropReq.parameters[paramKey];
      const value = (soilInput as unknown as Record<string, number>)[paramKey];
      return {
        name: req.displayName,
        score: Math.round(score * 100) / 100,
        displayValue: `${value} ${req.unit}`,
        isLimiting: score < 0.5,
      };
    });

    const response: AssessmentResponseDto = {
      assessmentId: randomUUID(),
      crop: request.crop,
      suitabilityClass: fuzzyResult.suitabilityClass,
      suitabilityLabel: fuzzyResult.suitabilityLabel,
      matchScore: Math.round(fuzzyResult.adjustedSI * 100) / 100,
      parameters,
      recommendations: aiOutput.recommendations,
      alternatives: alternativeCrops,
    };

    await this.saveAssessment(request, response);
    return response;
  }

  async getHistory(crop?: string): Promise<AssessmentResponseDto[]> {
    if (!this.assessmentModel) {
      this.logger.warn('Database not available — history not accessible');
      return [];
    }

    try {
      const filter: Record<string, string> = {};
      if (crop) filter.crop = crop;

      const records = await this.assessmentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();

      return records.map(
        (r) => r.resultPayload as unknown as AssessmentResponseDto,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to fetch assessment history: ${(err as Error).message}`,
      );
      return [];
    }
  }

  private extractSoilInput(request: AssessmentRequestDto) {
    const s = request.sensor;
    const ft = request.field_tests;
    return {
      ph: s.soil_ph,
      organicMatter: this.mapOrganicMatterLevel(ft.organic_matter),
      nitrogen: this.mapNitrogen(s.nitrogen),
      phosphorus: s.phosphorus,
      potassium: this.mapPotassium(s.potassium),
      ec: s.electrical_conductivity,
      drainage: this.mapDrainageClass(ft.drainage_class),
      soilDepth: ft.soil_depth_cm,
      slope: this.mapSlopeClass(ft.slope_class),
      rainfall: this.estimateRainfallFromMoisture(s.soil_moisture),
    };
  }

  private mapOrganicMatterLevel(level: string): number {
    const mapping: Record<string, number> = {
      Low: 1.0,
      Moderate: 3.0,
      High: 6.0,
    };
    return mapping[level] ?? 1.0;
  }

  private mapNitrogen(nitrogenMgKg: number): number {
    // Convert mg/kg to % (mg/kg ÷ 10000 ≈ %)
    return nitrogenMgKg / 10000;
  }

  private mapPotassium(potassiumMgKg: number): number {
    // Convert mg/kg to cmolc/kg (mg/kg ÷ 391)
    return potassiumMgKg / 391;
  }

  private mapDrainageClass(drainageClass: string): number {
    const mapping: Record<string, number> = {
      VeryPoor: 1,
      Poor: 2,
      ModeratelyWell: 3,
      Well: 4,
      Excessive: 5,
    };
    return mapping[drainageClass] ?? 3;
  }

  private mapSlopeClass(slopeClass: string): number {
    const mapping: Record<string, number> = {
      '0–2% (Flat)': 0,
      '2–5% (Gentle)': 2,
      '5–8% (Moderate)': 8,
      '>8% (Steep)': 15,
    };
    return mapping[slopeClass] ?? 0;
  }

  private estimateRainfallFromMoisture(moisture: number): number {
    // Estimate annual rainfall from soil moisture (mm/year)
    // Higher moisture suggests higher rainfall region
    return Math.min(4000, 600 + moisture * 25);
  }

  private async saveAssessment(
    request: AssessmentRequestDto,
    response: AssessmentResponseDto,
  ): Promise<void> {
    if (!this.assessmentModel) {
      this.logger.warn('Database not configured — assessment not persisted');
      return;
    }

    try {
      await this.assessmentModel.create({
        crop: response.crop,
        suitabilityClass: response.suitabilityClass,
        matchScore: response.matchScore,
        rawInput: request as unknown as Record<string, unknown>,
        resultPayload: response as unknown as Record<string, unknown>,
        latitude: request.location?.latitude,
        longitude: request.location?.longitude,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to persist assessment to database: ${(err as Error).message}`,
      );
    }
  }
}
