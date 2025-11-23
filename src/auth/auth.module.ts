import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RefreshStrategy } from './refresh.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule, // IMPROVED: Consider making it global in app.module instead
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),// need to change later
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy, 
    RefreshStrategy,
    // IMPROVED: Consider adding JwtAuthGuard and RefreshTokenGuard here as providers
    // if you want them available as injectable services
  ],
  exports: [
    AuthService,
    // IMPROVED: Consider exporting JwtStrategy if other modules need JWT validation
    // JwtStrategy,
    // IMPROVED: Consider exporting PassportModule if other modules need passport
    // PassportModule,
  ],
})
export class AuthModule {}