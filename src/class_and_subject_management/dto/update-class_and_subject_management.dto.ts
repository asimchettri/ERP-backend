// update-class_and_subject_management.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateClassDto, CreateSubjectDto } from './create-class_and_subject_management.dto';

export class UpdateClassDto extends PartialType(CreateClassDto) {}


