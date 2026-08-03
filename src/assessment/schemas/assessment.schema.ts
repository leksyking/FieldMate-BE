import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AssessmentDocument = HydratedDocument<Assessment>;

@Schema({ timestamps: true })
export class Assessment {
  @Prop({ required: true })
  crop: string;

  @Prop({ required: true })
  suitabilityClass: string;

  @Prop({ required: true })
  matchScore: number;

  @Prop({ type: Object })
  rawInput: Record<string, unknown>;

  @Prop({ type: Object })
  resultPayload: Record<string, unknown>;

  @Prop()
  locationName?: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);
