import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { HealthService } from './health.service';
import {
    CreateHealthRecommendationDto,
    QueryHealthRecommendationsDto,
    UpdateHealthRecommendationDto,
} from './dto/health-recommendation.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Health (Khuyến cáo Y tế)')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Public()
    @Get('recommendations')
    @ApiOperation({
        summary: 'Lấy khuyến cáo sức khỏe cá nhân hóa theo dải AQI và nhóm đối tượng',
        description: 'Phân loại theo 4 nhóm: GENERAL, CHILDREN, RESPIRATORY, FITNESS hoặc ALL.',
    })
    getRecommendations(@Query() query: QueryHealthRecommendationsDto) {
        return this.healthService.getRecommendations(query);
    }

    @Public()
    @Get('guidelines')
    @ApiOperation({
        summary: 'Lấy cẩm nang hướng dẫn phòng hộ toàn diện cho cả 6 cấp độ ô nhiễm',
    })
    getAllGuidelines() {
        return this.healthService.getAllGuidelines();
    }

    @Post('recommendations')
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[ADMIN] Tạo khuyến cáo y tế mới' })
    createRecommendation(@Body() dto: CreateHealthRecommendationDto) {
        return this.healthService.createRecommendation(dto);
    }

    @Patch('recommendations/:id')
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[ADMIN] Cập nhật khuyến cáo y tế' })
    @ApiParam({ name: 'id', description: 'ID khuyến cáo (UUID)' })
    updateRecommendation(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateHealthRecommendationDto,
    ) {
        return this.healthService.updateRecommendation(id, dto);
    }

    @Delete('recommendations/:id')
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[ADMIN] Xóa khuyến cáo y tế' })
    @ApiParam({ name: 'id', description: 'ID khuyến cáo (UUID)' })
    deleteRecommendation(@Param('id', ParseUUIDPipe) id: string) {
        return this.healthService.deleteRecommendation(id);
    }
}
