import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ForecastController } from './forecast.controller';
import { ForecastService } from './forecast.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [
        HttpModule,
        PrismaModule,
    ],
    controllers: [ForecastController],
    providers: [ForecastService],
    exports: [ForecastService],
})
export class ForecastModule {}
