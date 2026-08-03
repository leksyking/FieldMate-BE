export interface TrapezoidalMF {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface ParameterRequirement {
  mf: TrapezoidalMF;
  weight: number;
  displayName: string;
  unit: string;
}

export interface CropRequirements {
  parameters: Record<string, ParameterRequirement>;
}

export type CropName =
  | 'Maize'
  | 'Rice'
  | 'Cowpea'
  | 'Yam'
  | 'Cocoa'
  | 'Oil Palm'
  | 'Groundnut'
  | 'Vegetables'
  | 'Plantain'
  | 'Cassava';

export const VALID_CROPS: CropName[] = [
  'Maize',
  'Rice',
  'Cowpea',
  'Yam',
  'Cocoa',
  'Oil Palm',
  'Groundnut',
  'Vegetables',
  'Plantain',
  'Cassava',
];

export const CROP_REQUIREMENTS: Record<CropName, CropRequirements> = {
  Maize: {
    parameters: {
      ph: {
        mf: { a: 5.0, b: 5.8, c: 7.0, d: 7.5 },
        weight: 0.15,
        displayName: 'Soil pH',
        unit: 'pH',
      },
      organicMatter: {
        mf: { a: 1.0, b: 2.0, c: 5.0, d: 6.0 },
        weight: 0.1,
        displayName: 'Organic Matter',
        unit: '%',
      },
      nitrogen: {
        mf: { a: 0.08, b: 0.15, c: 0.4, d: 0.5 },
        weight: 0.12,
        displayName: 'Nitrogen',
        unit: '%',
      },
      phosphorus: {
        mf: { a: 8, b: 15, c: 50, d: 70 },
        weight: 0.1,
        displayName: 'Phosphorus',
        unit: 'ppm',
      },
      potassium: {
        mf: { a: 0.2, b: 0.35, c: 1.0, d: 1.5 },
        weight: 0.1,
        displayName: 'Potassium',
        unit: 'cmolc/kg',
      },
      ec: {
        mf: { a: 0.0, b: 0.2, c: 1.0, d: 1.8 },
        weight: 0.08,
        displayName: 'Electrical Conductivity',
        unit: 'dS/m',
      },
      drainage: {
        mf: { a: 2, b: 3, c: 5, d: 5 },
        weight: 0.12,
        displayName: 'Drainage',
        unit: '(1-5)',
      },
      soilDepth: {
        mf: { a: 30, b: 60, c: 200, d: 200 },
        weight: 0.1,
        displayName: 'Soil Depth',
        unit: 'cm',
      },
      slope: {
        mf: { a: 0, b: 0, c: 8, d: 15 },
        weight: 0.08,
        displayName: 'Slope',
        unit: '%',
      },
      rainfall: {
        mf: { a: 500, b: 700, c: 1200, d: 1500 },
        weight: 0.05,
        displayName: 'Rainfall',
        unit: 'mm/yr',
      },
    },
  },

  Rice: {
    // Rice is unique in preferring lower drainage scores.
    parameters: {
      ph: {
        mf: { a: 4.5, b: 5.5, c: 6.5, d: 7.0 },
        weight: 0.15,
        displayName: 'Soil pH',
        unit: 'pH',
      },
      organicMatter: {
        mf: { a: 1.5, b: 2.5, c: 6.0, d: 7.0 },
        weight: 0.1,
        displayName: 'Organic Matter',
        unit: '%',
      },
      nitrogen: {
        mf: { a: 0.1, b: 0.18, c: 0.45, d: 0.55 },
        weight: 0.12,
        displayName: 'Nitrogen',
        unit: '%',
      },
      phosphorus: {
        mf: { a: 10, b: 20, c: 60, d: 80 },
        weight: 0.1,
        displayName: 'Phosphorus',
        unit: 'ppm',
      },
      potassium: {
        mf: { a: 0.15, b: 0.3, c: 0.9, d: 1.2 },
        weight: 0.1,
        displayName: 'Potassium',
        unit: 'cmolc/kg',
      },
      ec: {
        mf: { a: 0.0, b: 0.2, c: 1.0, d: 1.8 },
        weight: 0.08,
        displayName: 'Electrical Conductivity',
        unit: 'dS/m',
      },
      drainage: {
        mf: { a: 1, b: 1, c: 3, d: 4 },
        weight: 0.12,
        displayName: 'Drainage',
        unit: '(1-5)',
      },
      soilDepth: {
        mf: { a: 25, b: 50, c: 200, d: 200 },
        weight: 0.1,
        displayName: 'Soil Depth',
        unit: 'cm',
      },
      slope: {
        mf: { a: 0, b: 0, c: 5, d: 10 },
        weight: 0.08,
        displayName: 'Slope',
        unit: '%',
      },
      rainfall: {
        mf: { a: 900, b: 1200, c: 2500, d: 3000 },
        weight: 0.05,
        displayName: 'Rainfall',
        unit: 'mm/yr',
      },
    },
  },

  Cowpea: {
    parameters: {
      ph: {
        mf: { a: 5.0, b: 5.5, c: 7.0, d: 7.5 },
        weight: 0.15,
        displayName: 'Soil pH',
        unit: 'pH',
      },
      organicMatter: {
        mf: { a: 0.8, b: 1.5, c: 4.0, d: 5.0 },
        weight: 0.1,
        displayName: 'Organic Matter',
        unit: '%',
      },
      nitrogen: {
        mf: { a: 0.05, b: 0.1, c: 0.35, d: 0.45 },
        weight: 0.1,
        displayName: 'Nitrogen',
        unit: '%',
      },
      phosphorus: {
        mf: { a: 8, b: 12, c: 40, d: 60 },
        weight: 0.12,
        displayName: 'Phosphorus',
        unit: 'ppm',
      },
      potassium: {
        mf: { a: 0.15, b: 0.25, c: 0.8, d: 1.2 },
        weight: 0.1,
        displayName: 'Potassium',
        unit: 'cmolc/kg',
      },
      ec: {
        mf: { a: 0.0, b: 0.2, c: 1.0, d: 1.8 },
        weight: 0.08,
        displayName: 'Electrical Conductivity',
        unit: 'dS/m',
      },
      drainage: {
        mf: { a: 2, b: 3, c: 5, d: 5 },
        weight: 0.12,
        displayName: 'Drainage',
        unit: '(1-5)',
      },
      soilDepth: {
        mf: { a: 25, b: 40, c: 150, d: 200 },
        weight: 0.1,
        displayName: 'Soil Depth',
        unit: 'cm',
      },
      slope: {
        mf: { a: 0, b: 0, c: 10, d: 18 },
        weight: 0.08,
        displayName: 'Slope',
        unit: '%',
      },
      rainfall: {
        mf: { a: 400, b: 600, c: 1100, d: 1400 },
        weight: 0.05,
        displayName: 'Rainfall',
        unit: 'mm/yr',
      },
    },
  },

  Yam: {
    parameters: {
      ph: {
        mf: { a: 5.0, b: 5.5, c: 6.5, d: 7.0 },
        weight: 0.12,
        displayName: 'Soil pH',
        unit: 'pH',
      },
      organicMatter: {
        mf: { a: 1.5, b: 2.5, c: 6.0, d: 7.0 },
        weight: 0.12,
        displayName: 'Organic Matter',
        unit: '%',
      },
      nitrogen: {
        mf: { a: 0.1, b: 0.18, c: 0.4, d: 0.5 },
        weight: 0.1,
        displayName: 'Nitrogen',
        unit: '%',
      },
      phosphorus: {
        mf: { a: 10, b: 18, c: 50, d: 70 },
        weight: 0.1,
        displayName: 'Phosphorus',
        unit: 'ppm',
      },
      potassium: {
        mf: { a: 0.3, b: 0.5, c: 1.2, d: 1.8 },
        weight: 0.12,
        displayName: 'Potassium',
        unit: 'cmolc/kg',
      },
      ec: {
        mf: { a: 0.0, b: 0.2, c: 1.0, d: 1.8 },
        weight: 0.08,
        displayName: 'Electrical Conductivity',
        unit: 'dS/m',
      },
      drainage: {
        mf: { a: 3, b: 4, c: 5, d: 5 },
        weight: 0.13,
        displayName: 'Drainage',
        unit: '(1-5)',
      },
      soilDepth: {
        mf: { a: 50, b: 80, c: 200, d: 200 },
        weight: 0.13,
        displayName: 'Soil Depth',
        unit: 'cm',
      },
      slope: {
        mf: { a: 0, b: 0, c: 8, d: 15 },
        weight: 0.07,
        displayName: 'Slope',
        unit: '%',
      },
      rainfall: {
        mf: { a: 900, b: 1200, c: 2000, d: 2500 },
        weight: 0.03,
        displayName: 'Rainfall',
        unit: 'mm/yr',
      },
    },
  },

  Cocoa: {
    parameters: {
      ph: {
        mf: { a: 5.0, b: 5.5, c: 6.5, d: 7.0 },
        weight: 0.12,
        displayName: 'Soil pH',
        unit: 'pH',
      },
      organicMatter: {
        mf: { a: 2.0, b: 3.0, c: 7.0, d: 8.0 },
        weight: 0.12,
        displayName: 'Organic Matter',
        unit: '%',
      },
      nitrogen: {
        mf: { a: 0.12, b: 0.2, c: 0.45, d: 0.55 },
        weight: 0.1,
        displayName: 'Nitrogen',
        unit: '%',
      },
      phosphorus: {
        mf: { a: 10, b: 15, c: 50, d: 70 },
        weight: 0.1,
        displayName: 'Phosphorus',
        unit: 'ppm',
      },
      potassium: {
        mf: { a: 0.2, b: 0.4, c: 1.0, d: 1.5 },
        weight: 0.12,
        displayName: 'Potassium',
        unit: 'cmolc/kg',
      },
      ec: {
        mf: { a: 0.0, b: 0.2, c: 1.0, d: 1.8 },
        weight: 0.08,
        displayName: 'Electrical Conductivity',
        unit: 'dS/m',
      },
      drainage: {
        mf: { a: 2, b: 3, c: 5, d: 5 },
        weight: 0.1,
        displayName: 'Drainage',
        unit: '(1-5)',
      },
      soilDepth: {
        mf: { a: 80, b: 120, c: 200, d: 200 },
        weight: 0.12,
        displayName: 'Soil Depth',
        unit: 'cm',
      },
      slope: {
        mf: { a: 0, b: 0, c: 10, d: 20 },
        weight: 0.07,
        displayName: 'Slope',
        unit: '%',
      },
      rainfall: {
        mf: { a: 1200, b: 1500, c: 2500, d: 3000 },
        weight: 0.05,
        displayName: 'Rainfall',
        unit: 'mm/yr',
      },
    },
  },

  'Oil Palm': {
    parameters: {
      ph: {
        mf: { a: 4.5, b: 5.0, c: 6.5, d: 7.0 },
        weight: 0.12,
        displayName: 'Soil pH',
        unit: 'pH',
      },
      organicMatter: {
        mf: { a: 1.5, b: 2.5, c: 6.0, d: 7.0 },
        weight: 0.12,
        displayName: 'Organic Matter',
        unit: '%',
      },
      nitrogen: {
        mf: { a: 0.1, b: 0.18, c: 0.45, d: 0.55 },
        weight: 0.1,
        displayName: 'Nitrogen',
        unit: '%',
      },
      phosphorus: {
        mf: { a: 10, b: 15, c: 50, d: 70 },
        weight: 0.1,
        displayName: 'Phosphorus',
        unit: 'ppm',
      },
      potassium: {
        mf: { a: 0.25, b: 0.4, c: 1.2, d: 1.8 },
        weight: 0.12,
        displayName: 'Potassium',
        unit: 'cmolc/kg',
      },
      ec: {
        mf: { a: 0.0, b: 0.2, c: 1.0, d: 1.8 },
        weight: 0.08,
        displayName: 'Electrical Conductivity',
        unit: 'dS/m',
      },
      drainage: {
        mf: { a: 2, b: 3, c: 5, d: 5 },
        weight: 0.12,
        displayName: 'Drainage',
        unit: '(1-5)',
      },
      soilDepth: {
        mf: { a: 80, b: 120, c: 200, d: 200 },
        weight: 0.12,
        displayName: 'Soil Depth',
        unit: 'cm',
      },
      slope: {
        mf: { a: 0, b: 0, c: 12, d: 20 },
        weight: 0.07,
        displayName: 'Slope',
        unit: '%',
      },
      rainfall: {
        mf: { a: 1500, b: 1800, c: 3000, d: 3500 },
        weight: 0.05,
        displayName: 'Rainfall',
        unit: 'mm/yr',
      },
    },
  },

  Groundnut: {
    parameters: {
      ph: {
        mf: { a: 5.0, b: 5.5, c: 7.0, d: 7.5 },
        weight: 0.15,
        displayName: 'Soil pH',
        unit: 'pH',
      },
      organicMatter: {
        mf: { a: 0.8, b: 1.5, c: 4.0, d: 5.0 },
        weight: 0.1,
        displayName: 'Organic Matter',
        unit: '%',
      },
      nitrogen: {
        mf: { a: 0.05, b: 0.1, c: 0.3, d: 0.4 },
        weight: 0.08,
        displayName: 'Nitrogen',
        unit: '%',
      },
      phosphorus: {
        mf: { a: 10, b: 18, c: 50, d: 70 },
        weight: 0.12,
        displayName: 'Phosphorus',
        unit: 'ppm',
      },
      potassium: {
        mf: { a: 0.15, b: 0.25, c: 0.8, d: 1.2 },
        weight: 0.1,
        displayName: 'Potassium',
        unit: 'cmolc/kg',
      },
      ec: {
        mf: { a: 0.0, b: 0.2, c: 1.0, d: 1.8 },
        weight: 0.08,
        displayName: 'Electrical Conductivity',
        unit: 'dS/m',
      },
      drainage: {
        mf: { a: 3, b: 4, c: 5, d: 5 },
        weight: 0.15,
        displayName: 'Drainage',
        unit: '(1-5)',
      },
      soilDepth: {
        mf: { a: 40, b: 60, c: 200, d: 200 },
        weight: 0.1,
        displayName: 'Soil Depth',
        unit: 'cm',
      },
      slope: {
        mf: { a: 0, b: 0, c: 10, d: 18 },
        weight: 0.07,
        displayName: 'Slope',
        unit: '%',
      },
      rainfall: {
        mf: { a: 400, b: 600, c: 1100, d: 1400 },
        weight: 0.05,
        displayName: 'Rainfall',
        unit: 'mm/yr',
      },
    },
  },

  Vegetables: {
    parameters: {
      ph: {
        mf: { a: 5.5, b: 6.0, c: 7.0, d: 7.5 },
        weight: 0.15,
        displayName: 'Soil pH',
        unit: 'pH',
      },
      organicMatter: {
        mf: { a: 2.0, b: 3.0, c: 7.0, d: 8.0 },
        weight: 0.12,
        displayName: 'Organic Matter',
        unit: '%',
      },
      nitrogen: {
        mf: { a: 0.12, b: 0.2, c: 0.5, d: 0.6 },
        weight: 0.12,
        displayName: 'Nitrogen',
        unit: '%',
      },
      phosphorus: {
        mf: { a: 15, b: 25, c: 80, d: 100 },
        weight: 0.12,
        displayName: 'Phosphorus',
        unit: 'ppm',
      },
      potassium: {
        mf: { a: 0.25, b: 0.4, c: 1.2, d: 1.8 },
        weight: 0.1,
        displayName: 'Potassium',
        unit: 'cmolc/kg',
      },
      ec: {
        mf: { a: 0.0, b: 0.2, c: 1.0, d: 1.8 },
        weight: 0.08,
        displayName: 'Electrical Conductivity',
        unit: 'dS/m',
      },
      drainage: {
        mf: { a: 3, b: 4, c: 5, d: 5 },
        weight: 0.12,
        displayName: 'Drainage',
        unit: '(1-5)',
      },
      soilDepth: {
        mf: { a: 30, b: 50, c: 150, d: 200 },
        weight: 0.1,
        displayName: 'Soil Depth',
        unit: 'cm',
      },
      slope: {
        mf: { a: 0, b: 0, c: 5, d: 12 },
        weight: 0.07,
        displayName: 'Slope',
        unit: '%',
      },
      rainfall: {
        mf: { a: 600, b: 900, c: 1500, d: 2000 },
        weight: 0.02,
        displayName: 'Rainfall',
        unit: 'mm/yr',
      },
    },
  },

  Plantain: {
    parameters: {
      ph: {
        mf: { a: 5.0, b: 5.5, c: 7.0, d: 7.5 },
        weight: 0.12,
        displayName: 'Soil pH',
        unit: 'pH',
      },
      organicMatter: {
        mf: { a: 2.0, b: 3.0, c: 7.0, d: 8.0 },
        weight: 0.12,
        displayName: 'Organic Matter',
        unit: '%',
      },
      nitrogen: {
        mf: { a: 0.12, b: 0.2, c: 0.45, d: 0.55 },
        weight: 0.1,
        displayName: 'Nitrogen',
        unit: '%',
      },
      phosphorus: {
        mf: { a: 10, b: 18, c: 55, d: 75 },
        weight: 0.1,
        displayName: 'Phosphorus',
        unit: 'ppm',
      },
      potassium: {
        mf: { a: 0.3, b: 0.5, c: 1.5, d: 2.0 },
        weight: 0.15,
        displayName: 'Potassium',
        unit: 'cmolc/kg',
      },
      ec: {
        mf: { a: 0.0, b: 0.2, c: 1.0, d: 1.8 },
        weight: 0.08,
        displayName: 'Electrical Conductivity',
        unit: 'dS/m',
      },
      drainage: {
        mf: { a: 2, b: 3, c: 4, d: 5 },
        weight: 0.1,
        displayName: 'Drainage',
        unit: '(1-5)',
      },
      soilDepth: {
        mf: { a: 60, b: 100, c: 200, d: 200 },
        weight: 0.12,
        displayName: 'Soil Depth',
        unit: 'cm',
      },
      slope: {
        mf: { a: 0, b: 0, c: 8, d: 15 },
        weight: 0.07,
        displayName: 'Slope',
        unit: '%',
      },
      rainfall: {
        mf: { a: 1000, b: 1500, c: 2500, d: 3000 },
        weight: 0.04,
        displayName: 'Rainfall',
        unit: 'mm/yr',
      },
    },
  },

  Cassava: {
    parameters: {
      ph: {
        mf: { a: 4.5, b: 5.0, c: 7.0, d: 7.5 },
        weight: 0.12,
        displayName: 'Soil pH',
        unit: 'pH',
      },
      organicMatter: {
        mf: { a: 0.5, b: 1.0, c: 4.0, d: 5.0 },
        weight: 0.1,
        displayName: 'Organic Matter',
        unit: '%',
      },
      nitrogen: {
        mf: { a: 0.05, b: 0.1, c: 0.35, d: 0.45 },
        weight: 0.08,
        displayName: 'Nitrogen',
        unit: '%',
      },
      phosphorus: {
        mf: { a: 6, b: 10, c: 40, d: 60 },
        weight: 0.1,
        displayName: 'Phosphorus',
        unit: 'ppm',
      },
      potassium: {
        mf: { a: 0.15, b: 0.25, c: 0.9, d: 1.3 },
        weight: 0.12,
        displayName: 'Potassium',
        unit: 'cmolc/kg',
      },
      ec: {
        mf: { a: 0.0, b: 0.2, c: 1.0, d: 1.8 },
        weight: 0.08,
        displayName: 'Electrical Conductivity',
        unit: 'dS/m',
      },
      drainage: {
        mf: { a: 2, b: 3, c: 5, d: 5 },
        weight: 0.13,
        displayName: 'Drainage',
        unit: '(1-5)',
      },
      soilDepth: {
        mf: { a: 30, b: 60, c: 200, d: 200 },
        weight: 0.12,
        displayName: 'Soil Depth',
        unit: 'cm',
      },
      slope: {
        mf: { a: 0, b: 0, c: 12, d: 22 },
        weight: 0.1,
        displayName: 'Slope',
        unit: '%',
      },
      rainfall: {
        mf: { a: 500, b: 750, c: 2000, d: 2500 },
        weight: 0.05,
        displayName: 'Rainfall',
        unit: 'mm/yr',
      },
    },
  },
};
