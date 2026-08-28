import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module';
import { AirQualityController } from './air-quality.controller';
import { AirQualityService } from './air-quality.service';

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        HttpModule.register({
            timeout: 8000,
            maxRedirects: 3,
        }),
    ],
    controllers: [AirQualityController],
    providers: [AirQualityService],
    exports: [AirQualityService],
})
export class AirQualityModule {}
