import { PartialType } from '@nestjs/swagger';
import { CreateFeeTypeDto } from './create-fee_module.dto';

export class UpdateFeeTypeDto extends PartialType(CreateFeeTypeDto) {}
