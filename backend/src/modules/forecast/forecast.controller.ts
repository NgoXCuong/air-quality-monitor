import { Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { ForecastService } from './forecast.service';
import { Query24hForecastDto, QueryForecastHistoryDto } from './dto/query-forecast.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Forecast (Dự báo AI)')
@Controller('forecast')
export class ForecastController {
    constructor(private readonly forecastService: ForecastService) {}

    @Public()
    @Get('24h')
    @ApiOperation({
        summary: 'Dự báo chuỗi thời gian 24 giờ tiếp theo (AQI & PM2.5)',
        description: 'Tự động kiểm tra cache trong DB (1 giờ), gọi mô hình AI XGBoost/LSTM hoặc Open-Meteo CAMS Fallback.',
    })
    get24hForecast(@Query() query: Query24hForecastDto) {
        return this.forecastService.get24hForecast(query);
    }

    @Public()
    @Get('history')
    @ApiOperation({
        summary: 'Lịch sử dự báo và đánh giá sai số mô hình (MAE)',
        description: 'Lấy các bản ghi dự báo trong quá khứ để so sánh với chỉ số AQI thực tế.',
    })
    getForecastHistory(@Query() query: QueryForecastHistoryDto) {
        return this.forecastService.getForecastHistory(query);
    }

    @Post('generate')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '[ADMIN] Kích hoạt chạy dự báo AI hàng loạt cho tất cả các trạm',
        description: 'Chạy suy luận mô hình AI và lưu 24 giờ dự báo vào bảng AqiForecast trong PostgreSQL.',
    })
    generateForecastForAll() {
        return this.forecastService.generateForecastForAll(true);
    }
}
