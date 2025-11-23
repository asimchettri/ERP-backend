import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const GetSchool = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    
    // Handle case where user is not authenticated or schoolId is missing
    if (!request.user || !request.user.schoolId) {
      throw new BadRequestException('User or schoolId not found in request');
    }
    
    return request.user.schoolId;
  },
);