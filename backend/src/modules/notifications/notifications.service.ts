import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AlertType, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { QueryNotificationsDto, TestAlertDto } from './dto/query-notifications.dto';

function getAqiAlertInfo(aqi: number) {
    if (aqi <= 50) {
        return {
            level: 'Tốt',
            color: '#10b981',
            shortAdvice: 'Không khí trong lành, rất an toàn.',
            advice: 'Chỉ số không khí rất an toàn. Bạn và gia đình có thể yên tâm tận hưởng các hoạt động ngoài trời.',
        };
    }
    if (aqi <= 100) {
        return {
            level: 'Trung bình',
            color: '#f59e0b',
            shortAdvice: 'Người nhạy cảm nên chú ý.',
            advice: 'Chất lượng không khí ở mức chấp nhận được. Người có bệnh lý hô hấp nên mang khẩu trang khi ra ngoài.',
        };
    }
    if (aqi <= 150) {
        return {
            level: 'Kém (Nhạy cảm)',
            color: '#f97316',
            shortAdvice: 'Người bệnh hô hấp, trẻ nhỏ cần đeo khẩu trang.',
            advice: 'Nồng độ bụi mịn PM2.5 tăng. Bệnh nhân hen suyễn, trẻ nhỏ và người cao tuổi nên hạn chế hoạt động mạnh ngoài trời.',
        };
    }
    if (aqi <= 200) {
        return {
            level: 'Xấu (Unhealthy)',
            color: '#ef4444',
            shortAdvice: 'Bắt buộc đeo khẩu trang N95 khi ra ngoài.',
            advice: 'Chất lượng không khí gây hại cho sức khỏe mọi người. Bắt buộc đeo khẩu trang N95, đóng cửa sổ và bật máy lọc không khí trong phòng.',
        };
    }
    if (aqi <= 300) {
        return {
            level: 'Rất xấu (Very Unhealthy)',
            color: '#8b5cf6',
            shortAdvice: 'Hạn chế tối đa ra ngoài đường.',
            advice: 'Cảnh báo khẩn cấp: Mọi người nên ở trong nhà, tránh xa các trục đường giao thông và theo dõi sát triệu chứng hô hấp.',
        };
    }
    return {
        level: 'Nguy hại (Hazardous)',
        color: '#7f1d1d',
        shortAdvice: 'Tình trạng khẩn cấp về ô nhiễm không khí.',
        advice: 'Tình trạng khẩn cấp sức khỏe nghiêm trọng. Tuyệt đối không ra ngoài trời và niêm phong khe cửa sổ.',
    };
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) {}

    /**
     * Lấy danh sách thông báo của người dùng kèm phân trang
     */
    async getUserNotifications(userId: string, query: QueryNotificationsDto) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (query.status) where.status = query.status;
        if (query.type) where.type = query.type;

        const [total, unreadCount, notifications] = await Promise.all([
            this.prisma.notification.count({ where }),
            this.prisma.notification.count({ where: { userId, status: NotificationStatus.UNREAD } }),
            this.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    location: {
                        select: { id: true, name: true, province: true },
                    },
                },
            }),
        ]);

        return {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
            unreadCount,
            data: notifications,
        };
    }

    /**
     * Đếm số lượng thông báo chưa đọc của người dùng
     */
    async getUnreadCount(userId: string) {
        const unreadCount = await this.prisma.notification.count({
            where: { userId, status: NotificationStatus.UNREAD },
        });
        return { unreadCount };
    }

    /**
     * Đánh dấu 1 thông báo là đã đọc
     */
    async markAsRead(userId: string, id: string) {
        const item = await this.prisma.notification.findFirst({
            where: { id, userId },
        });

        if (!item) {
            throw new NotFoundException('Không tìm thấy thông báo hoặc bạn không có quyền truy cập.');
        }

        return this.prisma.notification.update({
            where: { id },
            data: { status: NotificationStatus.READ },
        });
    }

    /**
     * Đánh dấu toàn bộ thông báo của người dùng là đã đọc
     */
    async markAllAsRead(userId: string) {
        const result = await this.prisma.notification.updateMany({
            where: { userId, status: NotificationStatus.UNREAD },
            data: { status: NotificationStatus.READ },
        });
        return { message: 'Đã đánh dấu tất cả thông báo là đã đọc.', updatedCount: result.count };
    }

    /**
     * Xóa 1 thông báo
     */
    async deleteNotification(userId: string, id: string) {
        const item = await this.prisma.notification.findFirst({
            where: { id, userId },
        });

        if (!item) {
            throw new NotFoundException('Không tìm thấy thông báo cần xóa.');
        }

        await this.prisma.notification.delete({ where: { id } });
        return { message: 'Đã xóa thông báo thành công.' };
    }

    /**
     * TỰ ĐỘNG PHÁT HIỆN VÀ PHÁT CẢNH BÁO Ô NHIỄM VƯỢT NGƯỠNG (Core Alert Engine)
     */
    async checkAndDispatchAqiAlerts(
        locationId: string,
        aqi: number,
        pm25: number,
        locationName: string,
    ) {
        if (aqi < 100) {
            return { dispatched: 0, reason: 'Chất lượng không khí ở mức an toàn, không kích hoạt cảnh báo.' };
        }

        const info = getAqiAlertInfo(aqi);
        this.logger.log(`⚠️ Kiểm tra cảnh báo ô nhiễm: ${locationName} - AQI: ${aqi} (${info.level})`);

        // 1. Tìm tất cả người dùng quan tâm đến địa điểm này (Yêu thích hoặc có bật cảnh báo)
        const [favoriteUsers, allUsersWithSettings] = await Promise.all([
            this.prisma.favoriteLocation.findMany({
                where: { locationId },
                include: { user: { include: { settings: true } } },
            }),
            this.prisma.user.findMany({
                where: { status: true },
                include: { settings: true },
            }),
        ]);

        // Tập hợp danh sách người dùng không trùng lặp
        const userMap = new Map<string, any>();
        favoriteUsers.forEach((f) => {
            if (f.user) userMap.set(f.user.id, f.user);
        });

        // Nếu AQI vượt ngưỡng 150 (Mức xấu) -> Cảnh báo toàn bộ người dùng có bật emailAlerts
        if (aqi >= 150) {
            allUsersWithSettings.forEach((u) => {
                userMap.set(u.id, u);
            });
        }

        const eligibleUsers = Array.from(userMap.values());
        let dispatchedCount = 0;
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

        for (const user of eligibleUsers) {
            const prefs = (user.settings?.preferences as any) || {};
            const userThreshold = prefs.aqiThreshold !== undefined ? Number(prefs.aqiThreshold) : 150;
            const emailAlertsEnabled = prefs.emailAlerts !== false;

            // Kiểm tra xem chỉ số có vượt ngưỡng cài đặt của người dùng không
            if (aqi < userThreshold) continue;

            // CHỐNG SPAM: Kiểm tra xem trong 4 giờ qua đã gửi cảnh báo địa phương này cho user chưa
            const recentNotification = await this.prisma.notification.findFirst({
                where: {
                    userId: user.id,
                    locationId,
                    type: AlertType.AQI,
                    createdAt: { gte: fourHoursAgo },
                },
            });

            if (recentNotification) {
                continue; // Bỏ qua để tránh spam hộp thư
            }

            // 1. Tạo thông báo trong ứng dụng (In-app Notification)
            await this.prisma.notification.create({
                data: {
                    userId: user.id,
                    locationId,
                    type: AlertType.AQI,
                    title: `⚠️ Cảnh báo ô nhiễm: ${locationName} (AQI ${aqi})`,
                    message: `Chỉ số chất lượng không khí tại ${locationName} đo được là ${aqi} (PM2.5: ${pm25} µg/m³), thuộc mức ${info.level}. ${info.shortAdvice}`,
                    metadata: {
                        aqi,
                        pm25,
                        locationName,
                        level: info.level,
                        color: info.color,
                    },
                    status: NotificationStatus.UNREAD,
                },
            });

            // 2. Gửi email cảnh báo trực tiếp (nếu người dùng bật emailAlerts)
            if (emailAlertsEnabled && user.email) {
                this.mailService
                    .sendAqiAlertEmail(user.email, {
                        locationName,
                        aqi,
                        pm25,
                        level: info.level,
                        color: info.color,
                        advice: info.advice,
                    })
                    .catch((err) => {
                        this.logger.error(`Không thể gửi email cảnh báo tới ${user.email}: ${err?.message}`);
                    });
            }

            dispatchedCount++;
        }

        this.logger.log(`📢 Đã gửi cảnh báo ô nhiễm tới ${dispatchedCount} người dùng.`);
        return {
            totalEligible: eligibleUsers.length,
            dispatchedCount,
            locationName,
            aqi,
        };
    }

    /**
     * Kích hoạt cảnh báo thử nghiệm (Admin Testing)
     */
    async dispatchTestAlert(dto: TestAlertDto) {
        const aqi = dto.aqi || 165;
        const pm25 = dto.pm25 || 82.5;
        const locationName = dto.locationName || 'Hà Nội';

        let targetLocationId = dto.locationId;
        if (!targetLocationId) {
            const loc = await this.prisma.location.findFirst();
            targetLocationId = loc?.id;
        }

        if (!targetLocationId) {
            throw new NotFoundException('Không tìm thấy địa điểm để gửi cảnh báo thử nghiệm.');
        }

        return this.checkAndDispatchAqiAlerts(targetLocationId, aqi, pm25, locationName);
    }
}
