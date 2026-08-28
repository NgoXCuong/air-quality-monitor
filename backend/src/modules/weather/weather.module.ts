import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        HttpModule.register({
            timeout: 8000,
            maxRedirects: 3,
        }),
    ],
    controllers: [WeatherController],
    providers: [WeatherService],
    exports: [WeatherService],
})
export class WeatherModule {}
