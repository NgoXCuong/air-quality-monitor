import {
    Body,
    Controller,
    Delete,
    Get,
    Header,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';

import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { QueryFavoritesDto } from './dto/query-favorites.dto';
import { AvatarInterceptor } from './interceptors/avatar.interceptor';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // ─────────────────────────────────────────
    // PART 1 – User Profile (Self)
    // ─────────────────────────────────────────

    @Get('me')
    @ApiOperation({ summary: 'Lấy thông tin hồ sơ của tôi' })
    getMyProfile(@CurrentUser() user: JwtPayload) {
        return this.usersService.getMyProfile(user.sub);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Cập nhật thông tin hồ sơ của tôi' })
    updateMyProfile(
        @CurrentUser() user: JwtPayload,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.usersService.updateMyProfile(user.sub, dto);
    }

    @Delete('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Vô hiệu hóa tài khoản của tôi (soft delete)' })
    deleteMyAccount(@CurrentUser() user: JwtPayload) {
        return this.usersService.deleteMyAccount(user.sub);
    }

    // ─────────────────────────────────────────
    // PART 1b – Avatar
    // ─────────────────────────────────────────

    @Post('me/avatar')
    @UseInterceptors(AvatarInterceptor)
    @ApiOperation({ summary: 'Upload ảnh đại diện (multipart/form-data, tối đa 5MB)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['avatar'],
            properties: {
                avatar: { type: 'string', format: 'binary', description: 'File ảnh (JPEG, PNG, WebP, GIF)' },
            },
        },
    })
    uploadAvatar(
        @CurrentUser() user: JwtPayload,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.usersService.uploadAvatar(user.sub, file);
    }

    @Delete('me/avatar')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Xóa ảnh đại diện hiện tại' })
    deleteAvatar(@CurrentUser() user: JwtPayload) {
        return this.usersService.deleteAvatar(user.sub);
    }

    // ─────────────────────────────────────────
    // PART 2 – User Settings
    // ─────────────────────────────────────────

    @Get('me/settings')
    @ApiOperation({ summary: 'Lấy cài đặt thông báo và hiển thị của tôi' })
    getMySettings(@CurrentUser() user: JwtPayload) {
        return this.usersService.getMySettings(user.sub);
    }

    @Patch('me/settings')
    @ApiOperation({ summary: 'Cập nhật cài đặt thông báo và hiển thị' })
    updateMySettings(
        @CurrentUser() user: JwtPayload,
        @Body() dto: UpdateSettingsDto,
    ) {
        return this.usersService.updateMySettings(user.sub, dto);
    }

    // ─────────────────────────────────────────
    // PART 3 – Favorite Locations
    // ─────────────────────────────────────────

    @Get('me/favorites')
    @ApiOperation({ summary: 'Lấy danh sách địa điểm yêu thích của tôi' })
    getMyFavorites(@CurrentUser() user: JwtPayload) {
        return this.usersService.getMyFavorites(user.sub);
    }

    @Get('me/favorites/search')
    @ApiOperation({ summary: 'Tìm kiếm trong danh sách địa điểm yêu thích (có phân trang)' })
    searchMyFavorites(
        @CurrentUser() user: JwtPayload,
        @Query() query: QueryFavoritesDto,
    ) {
        return this.usersService.searchMyFavorites(user.sub, query);
    }

    @Post('me/favorites/:locationId')
    @ApiOperation({ summary: 'Thêm địa điểm vào danh sách yêu thích' })
    @ApiParam({ name: 'locationId', description: 'ID địa điểm (UUID)' })
    addFavorite(
        @CurrentUser() user: JwtPayload,
        @Param('locationId', ParseUUIDPipe) locationId: string,
    ) {
        return this.usersService.addFavorite(user.sub, locationId);
    }

    @Delete('me/favorites/:locationId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Xóa địa điểm khỏi danh sách yêu thích' })
    @ApiParam({ name: 'locationId', description: 'ID địa điểm (UUID)' })
    removeFavorite(
        @CurrentUser() user: JwtPayload,
        @Param('locationId', ParseUUIDPipe) locationId: string,
    ) {
        return this.usersService.removeFavorite(user.sub, locationId);
    }

    // ─────────────────────────────────────────
    // PART 4 – Notifications
    // ─────────────────────────────────────────

    @Get('me/notifications')
    @ApiOperation({ summary: 'Lấy danh sách thông báo của tôi (có phân trang)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 20 })
    getMyNotifications(
        @CurrentUser() user: JwtPayload,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.usersService.getMyNotifications(
            user.sub,
            parseInt(page ?? '1', 10),
            parseInt(limit ?? '20', 10),
        );
    }

    @Get('me/notifications/unread-count')
    @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc' })
    getUnreadNotificationCount(@CurrentUser() user: JwtPayload) {
        return this.usersService.getUnreadNotificationCount(user.sub);
    }

    @Patch('me/notifications/read-all')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Đánh dấu tất cả thông báo là đã đọc' })
    markAllNotificationsAsRead(@CurrentUser() user: JwtPayload) {
        return this.usersService.markAllNotificationsAsRead(user.sub);
    }

    @Patch('me/notifications/:id/read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Đánh dấu một thông báo là đã đọc' })
    @ApiParam({ name: 'id', description: 'ID thông báo (UUID)' })
    markNotificationAsRead(
        @CurrentUser() user: JwtPayload,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.usersService.markNotificationAsRead(user.sub, id);
    }

    @Delete('me/notifications/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Xóa một thông báo' })
    @ApiParam({ name: 'id', description: 'ID thông báo (UUID)' })
    deleteNotification(
        @CurrentUser() user: JwtPayload,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.usersService.deleteNotification(user.sub, id);
    }

    // ─────────────────────────────────────────
    // PART 5 – Admin: User Management
    // ─────────────────────────────────────────

    @Get('admin/export')
    @Roles(Role.ADMIN)
    @Header('Content-Type', 'text/csv; charset=utf-8')
    @Header('Content-Disposition', 'attachment; filename="users.csv"')
    @ApiOperation({ summary: '[ADMIN] Xuất danh sách người dùng ra file CSV' })
    async exportUsers(
        @Query() query: QueryUsersDto,
        @Res() res: Response,
    ) {
        const csv = await this.usersService.exportUsersAsCsv(query);
        res.send(csv);
    }

    @Get('admin/stats')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Thống kê tổng quan người dùng' })
    getAdminStats() {
        return this.usersService.getAdminStats();
    }

    @Get('admin')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Lấy danh sách tất cả người dùng (có phân trang, tìm kiếm)' })
    findAllUsers(@Query() query: QueryUsersDto) {
        return this.usersService.findAllUsers(query);
    }

    @Get('admin/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Lấy chi tiết người dùng theo ID' })
    @ApiParam({ name: 'id', description: 'User ID (UUID)' })
    findUserById(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.findUserById(id);
    }

    @Patch('admin/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Cập nhật role, status, isVerified của người dùng' })
    @ApiParam({ name: 'id', description: 'User ID (UUID)' })
    adminUpdateUser(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AdminUpdateUserDto,
    ) {
        return this.usersService.adminUpdateUser(id, dto);
    }

    @Delete('admin/:id')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Xóa vĩnh viễn người dùng' })
    @ApiParam({ name: 'id', description: 'User ID (UUID)' })
    adminDeleteUser(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.adminDeleteUser(id);
    }
}
