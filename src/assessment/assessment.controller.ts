import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AssessmentService } from './assessment.service.js';
import { AssessmentRequestDto } from './dto/assessment-request.dto.js';
import { AssessmentResponseDto } from './dto/assessment-response.dto.js';

@ApiTags('Assessment')
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: 'Evaluate soil suitability for a single crop',
    description:
      'Performs fuzzy logic assessment based on 10 soil parameters and returns FAO suitability class with AI recommendations.',
  })
  @ApiBody({ type: AssessmentRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Soil assessment successful',
    type: AssessmentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request — missing or out-of-range parameters',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded (10 requests per minute)',
  })
  async evaluate(
    @Body() dto: AssessmentRequestDto,
  ): Promise<AssessmentResponseDto> {
    return this.assessmentService.runAssessment(dto);
  }

  // @Post('batch-evaluate')
  // @HttpCode(HttpStatus.CREATED)
  // @Throttle({ default: { ttl: 60000, limit: 5 } })
  // @ApiOperation({
  //   summary: 'Evaluate soil suitability for multiple requests',
  //   description:
  //     'Batch endpoint for evaluating multiple soil samples in a single request.',
  // })
  // @ApiBody({ type: BatchAssessmentRequestDto })
  // @ApiResponse({
  //   status: 201,
  //   description: 'Batch assessments successful',
  //   type: [AssessmentResponseDto],
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Invalid request format or parameters',
  // })
  // async batchEvaluate(
  //   @Body() dto: BatchAssessmentRequestDto,
  // ): Promise<AssessmentResponseDto[]> {
  //   return Promise.all(
  //     dto.requests.map((req) => this.assessmentService.runAssessment(req)),
  //   );
  // }

  // @Get('history')
  // @ApiOperation({
  //   summary: 'Retrieve assessment history',
  //   description:
  //     'Returns the last 20 saved assessments, optionally filtered by crop. Requires MongoDB to be configured.',
  // })
  // @ApiQuery({
  //   name: 'crop',
  //   required: false,
  //   description: 'Filter by crop name (optional)',
  //   example: 'Maize',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'History retrieved successfully',
  //   type: [AssessmentResponseDto],
  // })
  // async getHistory(
  //   @Query('crop') crop?: string,
  // ): Promise<AssessmentResponseDto[]> {
  //   return this.assessmentService.getHistory(crop);
  // }
}
