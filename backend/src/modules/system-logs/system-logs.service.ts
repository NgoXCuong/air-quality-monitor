import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { LogLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSystemLogDto } from './dto/create-system-log.dto';
import { QuerySystemLogDto } from './dto/query-system-log.dto';

@Injectable()
export class SystemLogsService implements OnModuleInit {
    constructor(private readonly prisma: PrismaService) {}

    async onModuleInit() {
        await this.seedSampleLogsIfEmpty();
    }

    /**
     * Tự động gieo dữ liệu log mẫu nếu bảng SystemLog trong DB đang rỗng
     */
    async seedSampleLogsIfEmpty(): Promise<void> {
        const count = await this.prisma.systemLog.count();
        if (count > 0) return;

        const sampleLogs: Prisma.SystemLogCreateInput[] = [
            {
                level: LogLevel.INFO,
                context: 'SystemBootstrap',
                message: 'Hệ thống AI Air Quality Monitor khởi động thành công trên cổng 3001.',
                meta: { environment: 'production', nodeVersion: process.version },
            },
            {
                level: LogLevel.INFO,
                context: 'SchedulerService',
                message: 'Đã hoàn thành đồng bộ tự động dữ liệu quan trắc thời tiết và AQI từ Open-Meteo cho 10 trạm.',
                meta: { totalStations: 10, durationMs: 1250, timestamp: new Date().toISOString() },
            },
            {
                level: LogLevel.WARN,
                context: 'AqiThresholdWatcher',
                message: 'Trạm quan trắc Hoàn Kiếm, Hà Nội ghi nhận chỉ số AQI = 168 (Mức Xấu). Tự động kích hoạt cơ chế phát cảnh báo.',
                meta: { stationId: 'station-hn-01', aqi: 168, pm25: 88.5 },
            },
            {
                level: LogLevel.INFO,
                context: 'NotificationsService',
                message: 'Đã gửi thành công 12 email thông báo cảnh báo ô nhiễm không khí và 18 thông báo in-app cho người dùng.',
                meta: { dispatchedEmails: 12, dispatchedInApp: 18 },
            },
            {
                level: LogLevel.INFO,
                context: 'ForecastEngine',
                message: 'Mô hình học máy LSTM & XGBoost hoàn thành suy luận chuỗi thời gian 24 giờ cho 100% các trạm quan trắc.',
                meta: { modelVersion: 'v1.2-ensemble', stationsProcessed: 10, confidenceScore: 0.94 },
            },
            {
                level: LogLevel.ERROR,
                context: 'WeatherSyncWorker',
                message: 'Gặp sự cố kết nối tới trạm quan trắc dự phòng do độ trễ mạng vượt quá 5000ms. Hệ thống đã tự động kích hoạt bộ đệm CAMS fallback.',
                meta: { errorCode: 'ETIMEDOUT', retryAttempts: 3, provider: 'WAQI_BACKUP' },
            },
        ];

        for (const log of sampleLogs) {
            await this.prisma.systemLog.create({ data: log });
        }
    }

    /**
     * Lấy danh sách logs phân trang với bộ lọc đa tiêu chí
     */
    async findAll(query: QuerySystemLogDto) {
        const { page = 1, limit = 20, level, context, search, startDate, endDate } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.SystemLogWhereInput = {};

        if (level) {
            where.level = level;
        }

        if (context) {
            where.context = {
                contains: context,
                mode: 'insensitive',
            };
        }

        if (search) {
            where.message = {
                contains: search,
                mode: 'insensitive',
            };
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        const [total, items] = await Promise.all([
            this.prisma.systemLog.count({ where }),
            this.prisma.systemLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return {
            items,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    /**
     * Thống kê tổng quan trạng thái nhật ký hệ thống
     */
    async getStats() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [total, infoCount, warnCount, errorCount, last24hErrors, recentLogs] = await Promise.all([
            this.prisma.systemLog.count(),
            this.prisma.systemLog.count({ where: { level: LogLevel.INFO } }),
            this.prisma.systemLog.count({ where: { level: LogLevel.WARN } }),
            this.prisma.systemLog.count({ where: { level: LogLevel.ERROR } }),
            this.prisma.systemLog.count({
                where: {
                    level: LogLevel.ERROR,
                    createdAt: { gte: oneDayAgo },
                },
            }),
            this.prisma.systemLog.findMany({
                take: 100,
                select: { context: true },
            }),
        ]);

        // Tính top contexts phát sinh log nhiều nhất
        const contextCounts: Record<string, number> = {};
        for (const log of recentLogs) {
            contextCounts[log.context] = (contextCounts[log.context] || 0) + 1;
        }
        const topContexts = Object.entries(contextCounts)
            .map(([context, count]) => ({ context, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            total,
            byLevel: {
                INFO: infoCount,
                WARN: warnCount,
                ERROR: errorCount,
            },
            last24hErrors,
            topContexts,
            healthStatus: last24hErrors === 0 ? 'HEALTHY' : last24hErrors < 10 ? 'ATTENTION' : 'CRITICAL',
        };
    }

    /**
     * Xem chi tiết một bản ghi log
     */
    async findOne(id: string) {
        const log = await this.prisma.systemLog.findUnique({
            where: { id },
        });

        if (!log) {
            throw new NotFoundException(`Không tìm thấy bản ghi nhật ký với ID: ${id}`);
        }

        return log;
    }

    /**
     * Ghi nhận một log mới
     */
    async create(dto: CreateSystemLogDto) {
        return this.prisma.systemLog.create({
            data: {
                level: dto.level,
                context: dto.context,
                message: dto.message,
                meta: dto.meta || {},
            },
        });
    }

    /**
     * Tiện ích ghi log nhanh nội bộ cho các Service khác sử dụng
     */
    async log(level: LogLevel, context: string, message: string, meta?: Record<string, any>) {
        try {
            return await this.prisma.systemLog.create({
                data: {
                    level,
                    context,
                    message,
                    meta: meta || {},
                },
            });
        } catch (error) {
            // Tránh văng exception nếu DB ghi log gặp lỗi tạm thời
            console.error(`[SystemLogsService Error] Không thể ghi log vào DB:`, error);
        }
    }

    /**
     * Dọn dẹp nhật ký cũ hơn N ngày
     */
    async cleanup(days: number = 30) {
        const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const result = await this.prisma.systemLog.deleteMany({
            where: {
                createdAt: {
                    lt: threshold,
                },
            },
        });

        return {
            deletedCount: result.count,
            olderThanDays: days,
            thresholdDate: threshold.toISOString(),
        };
    }

    /**
     * Xóa một bản ghi log
     */
    async delete(id: string) {
        await this.findOne(id);
        await this.prisma.systemLog.delete({ where: { id } });
        return { success: true, message: `Đã xóa bản ghi nhật ký ${id} thành công.` };
    }
}
