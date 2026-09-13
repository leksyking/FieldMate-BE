import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { getModelToken } from '@nestjs/mongoose';
import request from 'supertest';

import { AssessmentController } from '../src/assessment/assessment.controller';
import { AssessmentService } from '../src/assessment/assessment.service';
import { FuzzyEngineService } from '../src/assessment/fuzzy-engine.service';
import { GeminiAiService, AiOutput } from '../src/assessment/gemini-ai.service';
import { Assessment } from '../src/assessment/schemas/assessment.schema';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const mockAiOutput: AiOutput = {
  recommendations: [
    {
      title: 'Conditions Are Favourable',
      subtitle: 'Maintain Current Practices',
      detail:
        'The soil is highly suitable for maize. Maintain current nutrient levels.',
      isCritical: false,
    },
    {
      title: 'Monitor Soil pH',
      subtitle: 'Ongoing Best Practice',
      detail:
        'pH at 6.5 is within the optimal range. Continue monitoring annually.',
      isCritical: false,
    },
    {
      title: 'Sustain Organic Matter',
      subtitle: 'Recommended for Soil Health',
      detail:
        'Organic matter at medium level is good. Add compost periodically to sustain levels.',
      isCritical: false,
    },
    {
      title: 'Annual Soil Testing',
      subtitle: 'Ongoing Best Practice',
      detail:
        'Apply NPK fertiliser at recommended rates based on periodic soil tests.',
      isCritical: false,
    },
  ],
};

const mockAssessmentModel = {
  create: jest.fn().mockResolvedValue({}),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    }),
  }),
};

describe('Assessment (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
      ],
      controllers: [AssessmentController],
      providers: [
        AssessmentService,
        FuzzyEngineService,
        {
          provide: GeminiAiService,
          useValue: {
            generateRecommendations: jest.fn().mockResolvedValue(mockAiOutput),
          },
        },
        {
          provide: getModelToken(Assessment.name),
          useValue: mockAssessmentModel,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/assessment/evaluate', () => {
    it('ideal maize conditions → S1 with ≥0.80 score', async () => {
      const payload = {
        crop: 'Maize',
        ph: 6.5,
        electricalConductivity: 0.5,
        nitrogen: 150,
        phosphorus: 25,
        potassium: 150,
        soilMoisture: 25,
        soilTemperature: 28.5,
        ambientTemperature: 32,
        ambientHumidity: 65,
        soilTexture: 'Loam',
        drainageClass: 'Well',
        organicMatterLevel: 'Medium',
        slopeClass: 'Gentle',
        soilDepth: 120,
      };

      const res = await request(app.getHttpServer())
        .post('/api/assessment/evaluate')
        .send(payload)
        .expect(201);

      expect(res.body.suitability_class).toBe('S1');
      expect(res.body.match_score).toBeGreaterThanOrEqual(0.8);
      expect(res.body.parameters).toHaveLength(10);
      expect(res.body.recommendations).toBeInstanceOf(Array);
      expect(res.body.recommendations.length).toBeGreaterThan(0);
      expect(res.body.crop).toBe('Maize');
      expect(res.body.assessment_id).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.alternative_crops).toBeInstanceOf(Array);
    });

    it('poor soil conditions → non-S1 class with limiting factors', async () => {
      const payload = {
        crop: 'Maize',
        ph: 4.0,
        electricalConductivity: 1.5,
        nitrogen: 20,
        phosphorus: 5,
        potassium: 40,
        soilMoisture: 15,
        soilTemperature: 20,
        ambientTemperature: 25,
        ambientHumidity: 45,
        soilTexture: 'Sandy',
        drainageClass: 'Poor',
        organicMatterLevel: 'Low',
        slopeClass: 'Steep',
        soilDepth: 20,
      };

      const res = await request(app.getHttpServer())
        .post('/api/assessment/evaluate')
        .send(payload)
        .expect(201);

      expect(['S2', 'S3', 'N']).toContain(res.body.suitability_class);
      expect(res.body.match_score).toBeLessThan(0.8);
      expect(res.body.parameters).toHaveLength(10);
    });

    it('returns 400 for invalid crop name', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/assessment/evaluate')
        .send({
          crop: 'InvalidCrop',
          ph: 6.5,
          electricalConductivity: 0.5,
          nitrogen: 150,
          phosphorus: 25,
          potassium: 150,
          soilMoisture: 25,
          soilTemperature: 28.5,
          ambientTemperature: 32,
          ambientHumidity: 65,
          soilTexture: 'Loam',
          drainageClass: 'Well',
          organicMatterLevel: 'Medium',
          slopeClass: 'Gentle',
          soilDepth: 120,
        })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/assessment/evaluate')
        .send({ crop: 'Maize', ph: 6.5 })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });

    it('returns 400 for pH out of range', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/assessment/evaluate')
        .send({
          crop: 'Maize',
          ph: 15,
          electricalConductivity: 0.5,
          nitrogen: 150,
          phosphorus: 25,
          potassium: 150,
          soilMoisture: 25,
          soilTemperature: 28.5,
          ambientTemperature: 32,
          ambientHumidity: 65,
          soilTexture: 'Loam',
          drainageClass: 'Well',
          organicMatterLevel: 'Medium',
          slopeClass: 'Gentle',
          soilDepth: 120,
        })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });
  });

  describe('GET /api/assessment/history', () => {
    it('returns an array', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/assessment/history')
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
    });

    it('accepts optional crop query parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/assessment/history?crop=Maize')
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('Response structure validation', () => {
    it('all Flutter-required fields are present in response', async () => {
      const payload = {
        crop: 'Rice',
        ph: 5.5,
        electricalConductivity: 0.6,
        nitrogen: 140,
        phosphorus: 20,
        potassium: 130,
        soilMoisture: 30,
        soilTemperature: 27,
        ambientTemperature: 31,
        ambientHumidity: 70,
        soilTexture: 'SiltyLoam',
        drainageClass: 'ModeratelyWell',
        organicMatterLevel: 'Medium',
        slopeClass: 'Flat',
        soilDepth: 80,
      };

      const res = await request(app.getHttpServer())
        .post('/api/assessment/evaluate')
        .send(payload)
        .expect(201);

      // Top-level fields
      expect(res.body).toHaveProperty('suitability_class');
      expect(res.body).toHaveProperty('match_score');
      expect(res.body).toHaveProperty('assessment_id');
      expect(res.body).toHaveProperty('crop');
      expect(res.body).toHaveProperty('suitability_label');
      expect(res.body).toHaveProperty('parameters');
      expect(res.body).toHaveProperty('recommendations');
      expect(res.body).toHaveProperty('alternative_crops');
      expect(res.body).toHaveProperty('timestamp');

      // Per-parameter fields
      const param = res.body.parameters[0];
      expect(param).toHaveProperty('display_value');
      expect(param).toHaveProperty('is_limiting');
      expect(param).toHaveProperty('is_critical');
      expect(param).toHaveProperty('score');
      expect(param).toHaveProperty('name');
      expect(param).toHaveProperty('value');
      expect(param).toHaveProperty('unit');
    });
  });
});
