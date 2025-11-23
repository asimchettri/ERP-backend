import { 
  Body, 
  Controller, 
  Get, 
  Post, 
  UseGuards, 
  UnauthorizedException,
  HttpCode, // IMPROVED: Added for proper HTTP status codes
  HttpStatus, // IMPROVED: Added for proper HTTP status codes
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserWithRoles, AuthTokens } from './auth.types';

// IMPROVED: Move to DTOs folder (auth/dto/login.dto.ts)
interface LoginCredentials {
  email: string;
  password: string;
}

// IMPROVED: Consider adding API versioning: @Controller('v1/auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK) // IMPROVED: POST login should return 200, not 201
  async login(@Body() credentials: LoginCredentials): Promise<AuthTokens> {
    // IMPROVED: Validation logic should be in service, not controller
    const user = await this.authService.validateUser(
      credentials.email,
      credentials.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK) // IMPROVED: Added proper status code
  async refresh(@Body('refreshToken') refreshToken: string): Promise<AuthTokens> {
    // IMPROVED: Add validation for empty refreshToken
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return this.authService.refresh(refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: UserWithRoles): Promise<UserWithRoles> {
    return user;
  }

  // IMPROVED: Added logout endpoint
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string): Promise<{ message: string }> {
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }

  // IMPROVED: Added change password endpoint
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ): Promise<{ message: string }> {
    if (!oldPassword || !newPassword) {
      throw new UnauthorizedException('Old and new passwords are required');
    }
    return this.authService.changePassword(userId, oldPassword, newPassword);
  }

  // IMPROVED: Added register endpoint (if needed)
  // @Post('register')
  // @HttpCode(HttpStatus.CREATED)
  // async register(@Body() registerDto: RegisterDto): Promise<AuthTokens> {
  //   return this.authService.register(registerDto);
  // }
}