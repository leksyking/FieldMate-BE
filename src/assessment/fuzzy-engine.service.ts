import { Injectable } from '@nestjs/common';
import {
  CROP_REQUIREMENTS,
  CropName,
  TrapezoidalMF,
  VALID_CROPS,
} from './crop-requirements.data.js';

export interface SoilInput {
  ph: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ec: number;
  drainage: number;
  soilDepth: number;
  slope: number;
  rainfall: number;
}

// export interface ParameterScore {
//   score: number;
//   isLimiting: boolean;
//   isCritical: boolean;
// }

export interface FuzzyResult {
  crop: CropName;
  scores: Record<string, number>;
  weightedSI: number;
  adjustedSI: number;
  suitabilityClass: 'S1' | 'S2' | 'S3' | 'N';
  suitabilityLabel: string;
  limitingFactors: string[];
  criticalFactors: string[];
}

export interface CropRanking {
  crop: CropName;
  suitabilityClass: 'S1' | 'S2' | 'S3' | 'N';
  suitabilityLabel: string;
  adjustedSI: number;
}

const SUITABILITY_THRESHOLDS = {
  S1: 0.8,
  S2: 0.6,
  S3: 0.4,
} as const;

const LIMITING_THRESHOLD = 0.5;
const CRITICAL_THRESHOLD = 0.3;

@Injectable()
export class FuzzyEngineService {
  private trapezoidalMF(value: number, mf: TrapezoidalMF): number {
    const { a, b, c, d } = mf;

    if (value <= a || value >= d) return 0;
    if (value >= b && value <= c) return 1;

    if (value > a && value < b) {
      return b === a ? 1 : (value - a) / (b - a);
    }

    return d === c ? 0 : (d - value) / (d - c);
  }

  private classify(si: number): {
    cls: 'S1' | 'S2' | 'S3' | 'N';
    label: string;
  } {
    if (si >= SUITABILITY_THRESHOLDS.S1)
      return { cls: 'S1', label: 'Highly Suitable' };
    if (si >= SUITABILITY_THRESHOLDS.S2)
      return { cls: 'S2', label: 'Moderately Suitable' };
    if (si >= SUITABILITY_THRESHOLDS.S3)
      return { cls: 'S3', label: 'Marginally Suitable' };
    return { cls: 'N', label: 'Not Suitable' };
  }

  evaluateCrop(input: SoilInput, crop: CropName): FuzzyResult {
    const requirements = CROP_REQUIREMENTS[crop];
    const paramKeys = Object.keys(requirements.parameters);

    const scores: Record<string, number> = {};
    let weightedSum = 0;
    let totalWeight = 0;
    const limitingFactors: string[] = [];
    const criticalFactors: string[] = [];

    for (const key of paramKeys) {
      const req = requirements.parameters[key];
      const rawValue = (input as unknown as Record<string, number>)[key];
      const score = this.trapezoidalMF(rawValue, req.mf);

      scores[key] = score;
      weightedSum += score * req.weight;
      totalWeight += req.weight;

      if (score < CRITICAL_THRESHOLD) {
        criticalFactors.push(req.displayName);
      } else if (score < LIMITING_THRESHOLD) {
        limitingFactors.push(req.displayName);
      }
    }

    const weightedSI = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Apply most-limiting-factor override: critical factor caps SI at S3 boundary
    let adjustedSI = weightedSI;
    if (criticalFactors.length > 0) {
      adjustedSI = Math.min(weightedSI, SUITABILITY_THRESHOLDS.S3 - 0.01);
    }

    const { cls, label } = this.classify(adjustedSI);

    return {
      crop,
      scores,
      weightedSI: Math.round(weightedSI * 10000) / 10000,
      adjustedSI: Math.round(adjustedSI * 10000) / 10000,
      suitabilityClass: cls,
      suitabilityLabel: label,
      limitingFactors,
      criticalFactors,
    };
  }

  evaluateAllCrops(input: SoilInput): CropRanking[] {
    return VALID_CROPS.map((crop) => {
      const result = this.evaluateCrop(input, crop);
      return {
        crop,
        suitabilityClass: result.suitabilityClass,
        suitabilityLabel: result.suitabilityLabel,
        adjustedSI: result.adjustedSI,
      };
    }).sort((a, b) => b.adjustedSI - a.adjustedSI);
  }
}
