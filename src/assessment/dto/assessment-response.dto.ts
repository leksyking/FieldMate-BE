import { ApiProperty } from '@nestjs/swagger';

export class ParameterResultDto {
  @ApiProperty({
    description: 'Parameter name',
    example: 'PH LEVEL',
  })
  name: string = '';

  @ApiProperty({
    description: 'Fuzzy membership score (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.85,
  })
  score: number = 0;

  @ApiProperty({
    description: 'Human-readable display value',
    example: '6.5',
  })
  displayValue: string = '';

  @ApiProperty({
    description: 'True if parameter is limiting (score < 0.5)',
    example: false,
  })
  isLimiting: boolean = false;
}

export class RecommendationDto {
  @ApiProperty({
    description: 'Short recommendation title',
    example: 'Address Nitrogen Deficiency',
  })
  title: string = '';

  @ApiProperty({
    description: 'Subtitle or severity tag',
    example: 'Critical Improvement Needed',
  })
  subtitle: string = '';

  @ApiProperty({
    description: 'Detailed actionable recommendation',
    example:
      'Apply 150kg/ha of NPK 20-10-10 or incorporate organic compost prior to planting.',
  })
  detail: string = '';

  @ApiProperty({
    description: 'True if this is a critical issue requiring immediate action',
    example: true,
  })
  isCritical: boolean = false;
}

export class AlternativeCropDto {
  @ApiProperty({
    description: 'Crop name',
    example: 'Cowpea',
  })
  name: string = '';

  @ApiProperty({
    description: 'FAO suitability class',
    enum: ['S1', 'S2', 'S3', 'N'],
    example: 'S1',
  })
  suitabilityClass: string = '';

  @ApiProperty({
    description: 'Reason this crop is a good alternative',
    example: 'Ideal for nitrogen fixation and dry-spell resilience.',
  })
  reason: string = '';
}

export class AssessmentResponseDto {
  @ApiProperty({
    description: 'Unique assessment identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  assessmentId: string = '';

  @ApiProperty({
    description: 'Assessed crop',
    example: 'Maize',
  })
  crop: string = '';

  @ApiProperty({
    description: 'FAO suitability classification',
    enum: ['S1', 'S2', 'S3', 'N'],
    example: 'S1',
  })
  suitabilityClass: string = '';

  @ApiProperty({
    description: 'Human-readable suitability label',
    example: 'Highly Suitable',
  })
  suitabilityLabel: string = '';

  @ApiProperty({
    description: 'Overall suitability score (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.94,
  })
  matchScore: number = 0;

  @ApiProperty({
    description: 'Location name',
    example: 'Ile-Ife, Osun State',
    required: false,
  })
  locationName?: string;

  @ApiProperty({
    description: 'Array of soil parameter assessments',
    type: [ParameterResultDto],
  })
  parameters: ParameterResultDto[] = [];

  @ApiProperty({
    description: 'Structured improvement recommendations',
    type: [RecommendationDto],
  })
  recommendations: RecommendationDto[] = [];

  @ApiProperty({
    description: 'Alternative crops suited to these soil conditions',
    type: [AlternativeCropDto],
  })
  alternatives: AlternativeCropDto[] = [];
}
