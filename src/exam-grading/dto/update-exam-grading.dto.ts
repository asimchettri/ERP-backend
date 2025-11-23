import { PartialType } from '@nestjs/swagger';
import { EnterGradeDto } from './create-exam-grading.dto';

export class UpdateExamGradingDto extends PartialType(EnterGradeDto) {}
