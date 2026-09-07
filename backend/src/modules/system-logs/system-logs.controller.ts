import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { SystemLogsService } from './system-logs.service';
import { CleanupLogsDto, CreateSystemLogDto } from './dto/create-system-log.dto';
import { QuerySystemLogDto } from './dto/query-system-log.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('System Logs (Nhật ký Hệ thống)')
@Controller('system-logs')
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class SystemLogsController {
    constructor(private readonly systemLogsService: SystemLogsService) {}

    @Get()
    @ApiOperation({
        summary: '[ADMIN] Lấy danh sách nhật ký hệ thống (phân trang, lọc level, context, tìm kiếm)',
        description: 'Hỗ trợ lọc theo mức độ log (INFO, WARN, ERROR), tìm kiếm chuỗi thông điệp và khoảng thời gian.',
    })
    findAll(@Query() query: QuerySystemLogDto) {
        return this.systemLogsService.findAll(query);
    }

    @Get('stats')
    @ApiOperation({
        summary: '[ADMIN] Thống kê tổng quan trạng thái nhật ký & sự cố lỗi hệ thống',
        description: 'Trả về tổng số log, số lỗi phát sinh trong 24h, phân bổ theo cấp độ và top 5 module hoạt động nhiều nhất.',
    })
    getStats() {
        return this.systemLogsService.getStats();
    }

    @Delete('cleanup')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[ADMIN] Dọn dẹp các bản ghi nhật ký cũ hơn N ngày để tối ưu bộ nhớ',
        description: 'Xóa vĩnh viễn các dòng log có thời gian tạo vượt quá số ngày chỉ định (mặc định 30 ngày).',
    })
    cleanup(@Query() query: CleanupLogsDto) {
        return this.systemLogsService.cleanup(query.days);
    }

    @Get(':id')
    @ApiOperation({
        summary: '[ADMIN] Xem chi tiết một bản ghi nhật ký theo UUID',
        description: 'Trả về toàn bộ thông tin log bao gồm đối tượng metadata và dấu vết stack trace nếu có.',
    })
    @ApiParam({ name: 'id', description: 'ID bản ghi nhật ký (UUID)' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.systemLogsService.findOne(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: '[ADMIN] Ghi nhận một bản ghi nhật ký mới thủ công',
        description: 'Dành cho quản trị viên tạo ghi chú kiểm toán hoặc ghi nhận sự cố thủ công từ màn hình quản trị.',
    })
    create(@Body() dto: CreateSystemLogDto) {
        return this.systemLogsService.create(dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[ADMIN] Xóa một bản ghi nhật ký theo ID',
    })
    @ApiParam({ name: 'id', description: 'ID bản ghi nhật ký (UUID)' })
    delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.systemLogsService.delete(id);
    }
}
