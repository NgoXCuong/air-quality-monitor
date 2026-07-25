import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { QueryFavoritesDto } from './dto/query-favorites.dto';

// ─────────────────────────────────────────────
// Helper: loại bỏ thông tin nhạy cảm
// ─────────────────────────────────────────────
function sanitizeUser(user: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    isVerified: boolean;
    avatar: string | null;
    phone: string | null;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    // ─────────────────────────────────────────
    // PART 1 – User Profile (Self)
    // ─────────────────────────────────────────

    async getMyProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { settings: true },
        });

        if (!user) throw new NotFoundException('Không tìm thấy người dùng');

        return {
            message: 'Lấy thông tin thành công',
            data: {
                ...sanitizeUser(user),
                settings: user.settings?.preferences ?? null,
            },
        };
    }

    async updateMyProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Không tìm thấy người dùng');

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.fullName !== undefined && { fullName: dto.fullName }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.avatar !== undefined && { avatar: dto.avatar }),
            },
        });

        return {
            message: 'Cập nhật thông tin thành công',
            data: sanitizeUser(updated),
        };
    }

    async deleteMyAccount(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Không tìm thấy người dùng');

        // Soft delete: deactivate account instead of hard delete
        await this.prisma.user.update({
            where: { id: userId },
            data: { status: false },
        });

        // Invalidate all sessions
        await this.prisma.refreshToken.deleteMany({ where: { userId } });

        return {
            message: 'Tài khoản đã được vô hiệu hóa',
            data: null,
        };
    }

    // ─────────────────────────────────────────
    // PART 1b – Avatar Upload / Delete
    // ─────────────────────────────────────────

    async uploadAvatar(userId: string, file: Express.Multer.File) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Không tìm thấy người dùng');

        // Xóa file avatar cũ (nếu là file nội bộ)
        if (user.avatar) {
            this._deleteLocalAvatarFile(user.avatar);
        }

        // Tạo URL trỏ tới file vừa upload
        const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
        const avatarUrl = `${appUrl}/uploads/avatars/${file.filename}`;

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
        });

        return {
            message: 'Tải ảnh đại diện thành công',
            data: {
                avatarUrl: updated.avatar,
            },
        };
    }

    async deleteAvatar(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Không tìm thấy người dùng');

        if (!user.avatar) {
            throw new BadRequestException('Người dùng chưa có ảnh đại diện');
        }

        // Xóa file vật lý nếu là URL nội bộ
        this._deleteLocalAvatarFile(user.avatar);

        await this.prisma.user.update({
            where: { id: userId },
            data: { avatar: null },
        });

        return {
            message: 'Đã xóa ảnh đại diện',
            data: null,
        };
    }

    /** Xóa file vật lý nếu là URL nội bộ (chứa /uploads/avatars/) */
    private _deleteLocalAvatarFile(avatarUrl: string) {
        try {
            if (avatarUrl.includes('/uploads/avatars/')) {
                const filename = avatarUrl.split('/uploads/avatars/').pop();
                if (filename) {
                    const filePath = join(process.cwd(), 'uploads', 'avatars', filename);
                    if (existsSync(filePath)) {
                        unlinkSync(filePath);
                    }
                }
            }
        } catch {
            // Không throw lỗi nếu không xóa được file cũ
        }
    }

    // ─────────────────────────────────────────
    // PART 2 – User Settings
    // ─────────────────────────────────────────

    async getMySettings(userId: string) {
        const settings = await this.prisma.userSettings.findUnique({
            where: { userId },
        });

        const defaultPreferences = {
            emailAlerts: true,
            pushAlerts: true,
            aqiThreshold: 100,
            language: 'vi',
        };

        return {
            message: 'Lấy cài đặt thành công',
            data: settings?.preferences ?? defaultPreferences,
        };
    }

    async updateMySettings(userId: string, dto: UpdateSettingsDto) {
        // Build partial preferences object from provided fields
        const incoming: Record<string, unknown> = {};
        if (dto.emailAlerts !== undefined) incoming.emailAlerts = dto.emailAlerts;
        if (dto.pushAlerts !== undefined) incoming.pushAlerts = dto.pushAlerts;
        if (dto.aqiThreshold !== undefined) incoming.aqiThreshold = dto.aqiThreshold;
        if (dto.language !== undefined) incoming.language = dto.language;

        const existing = await this.prisma.userSettings.findUnique({
            where: { userId },
        });

        const merged = {
            ...(existing?.preferences as Record<string, unknown> ?? {}),
            ...incoming,
        };

        const settings = await this.prisma.userSettings.upsert({
            where: { userId },
            create: { userId, preferences: merged as Prisma.InputJsonValue },
            update: { preferences: merged as Prisma.InputJsonValue },
        });

        return {
            message: 'Cập nhật cài đặt thành công',
            data: settings.preferences,
        };
    }

    // ─────────────────────────────────────────
    // PART 3 – Favorite Locations
    // ─────────────────────────────────────────

    async getMyFavorites(userId: string) {
        const favorites = await this.prisma.favoriteLocation.findMany({
            where: { userId },
            include: { location: true },
            orderBy: { createdAt: 'desc' },
        });

        return {
            message: 'Lấy danh sách địa điểm yêu thích thành công',
            data: favorites.map((f) => ({
                id: f.id,
                addedAt: f.createdAt,
                location: f.location,
            })),
        };
    }

    async searchMyFavorites(userId: string, query: QueryFavoritesDto) {
        const { search, province, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.FavoriteLocationWhereInput = {
            userId,
            location: {
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { province: { contains: search, mode: 'insensitive' } },
                        { district: { contains: search, mode: 'insensitive' } },
                        { ward: { contains: search, mode: 'insensitive' } },
                    ],
                }),
                ...(province && {
                    province: { contains: province, mode: 'insensitive' },
                }),
            },
        };

        const [favorites, total] = await this.prisma.$transaction([
            this.prisma.favoriteLocation.findMany({
                where,
                include: { location: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.favoriteLocation.count({ where }),
        ]);

        return {
            message: 'Tìm kiếm địa điểm yêu thích thành công',
            data: {
                items: favorites.map((f) => ({
                    id: f.id,
                    addedAt: f.createdAt,
                    location: f.location,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        };
    }

    async addFavorite(userId: string, locationId: string) {
        // Check if location exists
        const location = await this.prisma.location.findUnique({
            where: { id: locationId },
        });
        if (!location) throw new NotFoundException('Không tìm thấy địa điểm');

        // Check duplicate
        const exists = await this.prisma.favoriteLocation.findUnique({
            where: { userId_locationId: { userId, locationId } },
        });
        if (exists) throw new BadRequestException('Địa điểm đã có trong danh sách yêu thích');

        const favorite = await this.prisma.favoriteLocation.create({
            data: { userId, locationId },
            include: { location: true },
        });

        return {
            message: 'Thêm địa điểm yêu thích thành công',
            data: {
                id: favorite.id,
                addedAt: favorite.createdAt,
                location: favorite.location,
            },
        };
    }

    async removeFavorite(userId: string, locationId: string) {
        const favorite = await this.prisma.favoriteLocation.findUnique({
            where: { userId_locationId: { userId, locationId } },
        });
        if (!favorite) throw new NotFoundException('Địa điểm không có trong danh sách yêu thích');

        await this.prisma.favoriteLocation.delete({
            where: { userId_locationId: { userId, locationId } },
        });

        return {
            message: 'Đã xóa địa điểm khỏi danh sách yêu thích',
            data: null,
        };
    }

    // ─────────────────────────────────────────
    // PART 4 – Notifications
    // ─────────────────────────────────────────

    async getMyNotifications(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [notifications, total] = await this.prisma.$transaction([
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where: { userId } }),
        ]);

        return {
            message: 'Lấy thông báo thành công',
            data: {
                items: notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        };
    }

    async markNotificationAsRead(userId: string, notificationId: string) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification) throw new NotFoundException('Không tìm thấy thông báo');

        await this.prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'READ' },
        });

        return { message: 'Đã đánh dấu đọc', data: null };
    }

    async markAllNotificationsAsRead(userId: string) {
        await this.prisma.notification.updateMany({
            where: { userId, status: 'UNREAD' },
            data: { status: 'READ' },
        });

        return { message: 'Đã đánh dấu tất cả là đã đọc', data: null };
    }

    async deleteNotification(userId: string, notificationId: string) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification) throw new NotFoundException('Không tìm thấy thông báo');

        await this.prisma.notification.delete({ where: { id: notificationId } });

        return { message: 'Đã xóa thông báo', data: null };
    }

    async getUnreadNotificationCount(userId: string) {
        const count = await this.prisma.notification.count({
            where: { userId, status: 'UNREAD' },
        });

        return {
            message: 'Lấy số thông báo chưa đọc thành công',
            data: { count },
        };
    }

    // ─────────────────────────────────────────
    // PART 5 – Admin: User Management
    // ─────────────────────────────────────────

    async findAllUsers(query: QueryUsersDto) {
        const { page = 1, limit = 10, search, role, status } = query;
        const skip = (page - 1) * limit;

        const where = {
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
            ...(role !== undefined && { role }),
            ...(status !== undefined && { status }),
        };

        const [users, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    isVerified: true,
                    avatar: true,
                    phone: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            message: 'Lấy danh sách người dùng thành công',
            data: {
                items: users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        };
    }

    async findUserById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { settings: true, _count: { select: { favorites: true, notifications: true } } },
        });

        if (!user) throw new NotFoundException('Không tìm thấy người dùng');

        return {
            message: 'Lấy thông tin người dùng thành công',
            data: {
                ...sanitizeUser(user),
                settings: user.settings?.preferences ?? null,
                stats: {
                    favorites: user._count.favorites,
                    notifications: user._count.notifications,
                },
            },
        };
    }

    async adminUpdateUser(id: string, dto: AdminUpdateUserDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Không tìm thấy người dùng');

        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                ...(dto.role !== undefined && { role: dto.role }),
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.isVerified !== undefined && { isVerified: dto.isVerified }),
            },
        });

        return {
            message: 'Cập nhật người dùng thành công',
            data: sanitizeUser(updated),
        };
    }

    async adminDeleteUser(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Không tìm thấy người dùng');

        await this.prisma.user.delete({ where: { id } });

        return {
            message: 'Xóa người dùng thành công',
            data: null,
        };
    }

    async getAdminStats() {
        const [total, active, verified] = await this.prisma.$transaction([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { status: true } }),
            this.prisma.user.count({ where: { isVerified: true } }),
        ]);

        const byRole = await this.prisma.user.groupBy({
            by: ['role'],
            _count: { _all: true },
            orderBy: { _count: { role: 'desc' } },
        });

        return {
            message: 'Lấy thống kê người dùng thành công',
            data: {
                total,
                active,
                inactive: total - active,
                verified,
                unverified: total - verified,
                byRole: byRole.map((r) => ({ role: r.role, count: r._count._all })),
            },
        };
    }

    async exportUsersAsCsv(query: QueryUsersDto): Promise<string> {
        const { search, role, status } = query;

        const where = {
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
            ...(role !== undefined && { role }),
            ...(status !== undefined && { status }),
        };

        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isVerified: true,
                status: true,
                phone: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Build CSV
        const headers = ['ID', 'Email', 'Họ tên', 'Vai trò', 'Xác thực', 'Trạng thái', 'Điện thoại', 'Ngày tạo'];

        const rows = users.map((u) => [
            u.id,
            u.email,
            u.fullName ?? '',
            u.role,
            u.isVerified ? 'Đã xác thực' : 'Chưa xác thực',
            u.status ? 'Hoạt động' : 'Vô hiệu',
            u.phone ?? '',
            u.createdAt.toISOString(),
        ]);

        const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

        const csv = [
            headers.map(escape).join(','),
            ...rows.map((row) => row.map(String).map(escape).join(',')),
        ].join('\n');

        // UTF-8 BOM để Excel đọc đúng tiếng Việt
        return '\uFEFF' + csv;
    }
}
