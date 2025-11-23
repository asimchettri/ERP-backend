import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserWithRoles } from '../../auth/auth.types'; // IMPROVED: Import type for better type safety

// IMPROVED: Added type parameter for return type
export const CurrentUser = createParamDecorator(
  (data: keyof UserWithRoles | undefined, ctx: ExecutionContext): UserWithRoles | any => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as UserWithRoles; // IMPROVED: Type assertion

    // IMPROVED: Added safety check
    if (!user) {
      return null;
    }

    // If no specific field requested, return entire user object
    if (!data) {
      return user;
    }

    // Return specific field
    return user[data];
  },
);