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
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationsDto } from './dto/query-locations.dto';
import { SearchLocationDto } from './dto/search-location.dto';
import { NearbyLocationDto } from './dto/nearby-location.dto';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) {}

    // ─────────────────────────────────────────
    // 1. SEARCH AUTOCOMPLETE (Public)
    // ─────────────────────────────────────────

    @Public()
    @Get('search')
    @ApiOperation({ summary: 'Tìm kiếm nhanh địa điểm cho Autocomplete Frontend' })
    @ApiQuery({ name: 'keyword', required: false, example: 'Ha' })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    search(@Query() dto: SearchLocationDto) {
        return this.locationsService.search(dto);
    }

    // ─────────────────────────────────────────
    // 2. NEARBY LOCATIONS (Public, GPS)
    // ─────────────────────────────────────────

    @Public()
    @Get('nearby')
    @ApiOperation({ summary: 'Tìm địa điểm lân cận vị trí hiện tại dựa trên GPS (Haversine)' })
    @ApiQuery({ name: 'lat', required: true, example: 21.0285 })
    @ApiQuery({ name: 'lon', required: true, example: 105.8542 })
    @ApiQuery({ name: 'radius', required: false, example: 20, description: 'Bán kính tính bằng km' })
    findNearby(@Query() dto: NearbyLocationDto) {
        return this.locationsService.findNearby(dto);
    }

    // ─────────────────────────────────────────
    // 3. STATISTICS (Public / Dashboard)
    // ─────────────────────────────────────────

    @Public()
    @Get('statistics')
    @ApiOperation({ summary: 'Thống kê tổng quan số lượng địa điểm (Dùng cho Admin/Dashboard)' })
    getStatistics() {
        return this.locationsService.getStatistics();
    }

    // ─────────────────────────────────────────
    // 4. FAVORITES MANAGEMENT (Authenticated User)
    // ─────────────────────────────────────────

    @Get('favorites')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách địa điểm yêu thích của tôi' })
    getMyFavorites(@CurrentUser() user: JwtPayload) {
        return this.locationsService.getMyFavorites(user.sub);
    }

    @Post('favorites/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thêm địa điểm vào danh sách yêu thích của tôi' })
    @ApiParam({ name: 'id', description: 'ID địa điểm (UUID)' })
    addFavorite(
        @CurrentUser() user: JwtPayload,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.locationsService.addFavorite(user.sub, id);
    }

    @Delete('favorites/:id')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa địa điểm khỏi danh sách yêu thích của tôi' })
    @ApiParam({ name: 'id', description: 'ID địa điểm (UUID)' })
    removeFavorite(
        @CurrentUser() user: JwtPayload,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.locationsService.removeFavorite(user.sub, id);
    }

    // ─────────────────────────────────────────
    // 5. WEATHER SUMMARY FOR DASHBOARD (Public)
    // ─────────────────────────────────────────

    @Public()
    @Get(':id/summary')
    @ApiOperation({ summary: 'Lấy tổng quan Thời tiết & AQI của 1 địa điểm (Tất cả trong 1 API)' })
    @ApiParam({ name: 'id', description: 'ID địa điểm (UUID)' })
    getSummary(@Param('id', ParseUUIDPipe) id: string) {
        return this.locationsService.getSummary(id);
    }

    // ─────────────────────────────────────────
    // 6. STANDARD CRUD & LISTING (Public / Admin)
    // ─────────────────────────────────────────

    @Public()
    @Get()
    @ApiOperation({ summary: 'Lấy danh sách địa điểm (Public, phân trang & lọc theo tỉnh)' })
    findAll(@Query() query: QueryLocationsDto) {
        return this.locationsService.findAll(query);
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin chi tiết địa điểm theo ID' })
    @ApiParam({ name: 'id', description: 'ID địa điểm (UUID)' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.locationsService.findOne(id);
    }

    @Post()
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[ADMIN] Thêm một địa điểm mới' })
    create(@Body() dto: CreateLocationDto) {
        return this.locationsService.create(dto);
    }

    @Post('seed')
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[ADMIN] Khởi tạo tự động các thành phố trọng điểm của Việt Nam' })
    seedDefaultLocations() {
        return this.locationsService.seedDefaultLocations();
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[ADMIN] Cập nhật thông tin địa điểm' })
    @ApiParam({ name: 'id', description: 'ID địa điểm (UUID)' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateLocationDto,
    ) {
        return this.locationsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[ADMIN] Xóa địa điểm' })
    @ApiParam({ name: 'id', description: 'ID địa điểm (UUID)' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.locationsService.remove(id);
    }
}
