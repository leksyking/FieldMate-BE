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
  ) { }

  async runAssessment(
    request: AssessmentRequestDto,
  ): Promise<AssessmentResponseDto> {
    const { values: soilInput, displayValues } = this.extractSoilInput(request);
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
      // Use the pre-built human-readable display value (original sensor units / label)
      const displayValue = displayValues[paramKey] ?? '';
      return {
        name: req.displayName,
        score: Math.round(score * 100) / 100,
        displayValue,
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

  private extractSoilInput(request: AssessmentRequestDto): {
    values: ReturnType<typeof this.buildSoilValues>;
    displayValues: Record<string, string>;
  } {
    const s = request.sensor;
    const ft = request.field_tests;
    const values = this.buildSoilValues(s, ft);
    const displayValues: Record<string, string> = {
      ph: `${s.soil_ph} pH`,
      organicMatter: ft.organic_matter,
      nitrogen: `${s.nitrogen} mg/kg`,
      phosphorus: `${s.phosphorus} ppm`,
      potassium: `${s.potassium} mg/kg`,
      ec: `${s.electrical_conductivity} dS/m`,
      drainage: ft.drainage_class,
      soilDepth: `${ft.soil_depth_cm} cm`,
      slope: ft.slope_class,
      rainfall: `${values.rainfall} mm/yr`,
    };
    return { values, displayValues };
  }

  private buildSoilValues(
    s: AssessmentRequestDto['sensor'],
    ft: AssessmentRequestDto['field_tests'],
  ) {
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

  /**
   * Maps categorical organic matter level to a representative numeric % value.
   *
   * IMPORTANT: The returned value must sit firmly within the plateau region [b, c]
   * of every crop's organicMatter trapezoidal MF, not on or beyond boundary d.
   * – Low    → 1.5 % (above minimum a for most crops)
   * – Moderate → 3.0 % (mid-range plateau)
   * – High   → 5.0 % (comfortably inside plateau c; avoids hitting boundary d=6)
   */
  private mapOrganicMatterLevel(level: string): number {
    const mapping: Record<string, number> = {
      Low: 1.5,
      Moderate: 3.0,
      High: 5.0,
    };
    return mapping[level] ?? 1.5;
  }

  private mapNitrogen(nitrogenMgKg: number): number {
    // Sensor reads mg/kg; MF thresholds are in % (g per 100 g soil)
    // 1 mg/kg = 0.0001 % → divide by 10 000
    return nitrogenMgKg / 10000;
  }

  private mapPotassium(potassiumMgKg: number): number {
    // Convert mg/kg to cmolc/kg (divide by 391 for K⁺, MW=39.1, valence=1)
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
      '0–2% (Flat)': 1,
      '2–5% (Gentle)': 3,
      '5–8% (Moderate)': 6,
      '>8% (Steep)': 15,
    };
    return mapping[slopeClass] ?? 1;
  }

  private estimateRainfallFromMoisture(moisture: number): number {
    // Estimate annual rainfall (mm/yr) from volumetric soil moisture (%)
    // Higher moisture suggests higher rainfall region; capped at a realistic max
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
