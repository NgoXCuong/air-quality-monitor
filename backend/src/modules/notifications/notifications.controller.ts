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

import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto, TestAlertDto } from './dto/query-notifications.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';

@ApiTags('Notifications (Hệ thống Thông báo & Cảnh báo)')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    @ApiOperation({
        summary: 'Lấy danh sách thông báo của người dùng đăng nhập',
        description: 'Hỗ trợ phân trang, lọc theo trạng thái UNREAD/READ và loại cảnh báo AQI/WEATHER/HEALTH/SYSTEM.',
    })
    getUserNotifications(
        @CurrentUser() user: JwtPayload,
        @Query() query: QueryNotificationsDto,
    ) {
        return this.notificationsService.getUserNotifications(user.sub, query);
    }

    @Get('unread-count')
    @ApiOperation({
        summary: 'Lấy số lượng thông báo chưa đọc (hiển thị trên badge chuông thông báo)',
    })
    getUnreadCount(@CurrentUser() user: JwtPayload) {
        return this.notificationsService.getUnreadCount(user.sub);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Đánh dấu 1 thông báo là đã đọc' })
    @ApiParam({ name: 'id', description: 'ID thông báo (UUID)' })
    markAsRead(
        @CurrentUser() user: JwtPayload,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.notificationsService.markAsRead(user.sub, id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Đánh dấu toàn bộ thông báo là đã đọc' })
    markAllAsRead(@CurrentUser() user: JwtPayload) {
        return this.notificationsService.markAllAsRead(user.sub);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa 1 thông báo' })
    @ApiParam({ name: 'id', description: 'ID thông báo (UUID)' })
    deleteNotification(
        @CurrentUser() user: JwtPayload,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.notificationsService.deleteNotification(user.sub, id);
    }

    @Post('test-alert')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: '[ADMIN] Bắn thử nghiệm cảnh báo ô nhiễm vượt ngưỡng và gửi email',
    })
    dispatchTestAlert(@Body() dto: TestAlertDto) {
        return this.notificationsService.dispatchTestAlert(dto);
    }
}
