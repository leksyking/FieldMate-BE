import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VALID_CROPS } from '../crop-requirements.data';

export class SensorDataDto {
  @ApiProperty({
    description: 'Soil pH from sensor reading',
    minimum: 0,
    maximum: 14,
    example: 6.5,
  })
  @IsNumber()
  @Min(0)
  @Max(14)
  soil_ph: number = 6.5;

  @ApiProperty({
    description: 'Electrical conductivity (dS/m)',
    minimum: 0,
    maximum: 10,
    example: 0.5,
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  electrical_conductivity: number = 0.5;

  @ApiProperty({
    description: 'Nitrogen content (mg/kg)',
    minimum: 0,
    maximum: 1999,
    example: 150,
  })
  @IsNumber()
  @Min(0)
  @Max(1999)
  nitrogen: number = 150;

  @ApiProperty({
    description: 'Phosphorus content (mg/kg)',
    minimum: 0,
    maximum: 1999,
    example: 25,
  })
  @IsNumber()
  @Min(0)
  @Max(1999)
  phosphorus: number = 25;

  @ApiProperty({
    description: 'Potassium content (mg/kg)',
    minimum: 0,
    maximum: 1999,
    example: 150,
  })
  @IsNumber()
  @Min(0)
  @Max(1999)
  potassium: number = 150;

  @ApiProperty({
    description: 'Soil moisture content (%)',
    minimum: 0,
    maximum: 100,
    example: 25,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  soil_moisture: number = 25;

  @ApiProperty({
    description: 'Soil temperature (°C)',
    minimum: -10,
    maximum: 60,
    example: 28.5,
  })
  @IsNumber()
  @Min(-10)
  @Max(60)
  soil_temperature: number = 28.5;

  @ApiProperty({
    description: 'Ambient air temperature (°C)',
    minimum: -20,
    maximum: 60,
    example: 32,
  })
  @IsNumber()
  @Min(-20)
  @Max(60)
  ambient_temperature: number = 32;

  @ApiProperty({
    description: 'Ambient relative humidity (%)',
    minimum: 0,
    maximum: 100,
    example: 65,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  ambient_humidity: number = 65;
}

export class FieldTestsDto {
  @ApiProperty({
    description: 'Soil texture classification',
    enum: [
      'Clay',
      'SiltyClay',
      'Sandy',
      'SandyLoam',
      'Loam',
      'SiltyLoam',
      'Silt',
    ],
    example: 'Loam',
  })
  @IsIn([
    'Clay',
    'SiltyClay',
    'Sandy',
    'SandyLoam',
    'Loam',
    'SiltyLoam',
    'Silt',
  ])
  soil_texture: string = 'Loam';

  @ApiProperty({
    description: 'Drainage class',
    enum: ['VeryPoor', 'Poor', 'ModeratelyWell', 'Well', 'Excessive'],
    example: 'Well',
  })
  @IsIn(['VeryPoor', 'Poor', 'ModeratelyWell', 'Well', 'Excessive'])
  drainage_class: string = 'Well';

  @ApiProperty({
    description: 'Organic matter level category',
    enum: ['Low', 'Moderate', 'High'],
    example: 'Moderate',
  })
  @IsIn(['Low', 'Moderate', 'High'])
  organic_matter: string = 'Moderate';

  @ApiProperty({
    description: 'Slope class (label or percentage range)',
    example: '2–5% (Gentle)',
  })
  @IsString()
  slope_class: string = 'Gentle';

  @ApiProperty({
    description: 'Effective soil depth (cm)',
    minimum: 0,
    maximum: 500,
    example: 120,
  })
  @IsNumber()
  @Min(0)
  @Max(500)
  soil_depth_cm: number = 120;
}

export class LocationDto {
  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    minimum: -90,
    maximum: 90,
    example: 7.4898,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    minimum: -180,
    maximum: 180,
    example: 4.5579,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class AssessmentRequestDto {
  @ApiProperty({
    description: 'Target crop for soil suitability assessment',
    enum: VALID_CROPS,
    example: 'Maize',
  })
  @IsIn(VALID_CROPS)
  crop: string = 'Maize';

  @ApiProperty({
    description: 'Sensor readings from the soil probe',
    type: SensorDataDto,
  })
  @ValidateNested()
  @Type(() => SensorDataDto)
  sensor: SensorDataDto = new SensorDataDto();

  @ApiProperty({
    description: 'Manual field test observations',
    type: FieldTestsDto,
  })
  @ValidateNested()
  @Type(() => FieldTestsDto)
  field_tests: FieldTestsDto = new FieldTestsDto();

  @ApiPropertyOptional({
    description: 'GPS location of the assessment site',
    type: LocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

export class BatchAssessmentRequestDto {
  @ApiProperty({
    description: 'Array of assessment requests to process',
    type: [AssessmentRequestDto],
  })
  requests: AssessmentRequestDto[] = [];
}
