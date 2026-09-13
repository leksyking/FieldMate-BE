import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssessmentController } from './assessment.controller.js';
import { AssessmentService } from './assessment.service.js';
import { FuzzyEngineService } from './fuzzy-engine.service.js';
import { GeminiAiService } from './gemini-ai.service.js';
import { Assessment, AssessmentSchema } from './schemas/assessment.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assessment.name, schema: AssessmentSchema },
    ]),
  ],
  controllers: [AssessmentController],
  providers: [AssessmentService, FuzzyEngineService, GeminiAiService],
})
export class AssessmentModule {}
