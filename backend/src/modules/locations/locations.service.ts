import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationsDto } from './dto/query-locations.dto';
import { SearchLocationDto } from './dto/search-location.dto';
import { NearbyLocationDto, SortOrder } from './dto/nearby-location.dto';
import { DEFAULT_VIETNAM_LOCATIONS } from '../../database/seed/vietnam-locations';

// Helper: Tính khoảng cách giữa 2 tọa độ theo công thức Haversine (km)
function calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

@Injectable()
export class LocationsService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * 1. API Tìm kiếm nhanh (Autocomplete cho Frontend)
     * GET /locations/search?keyword=Ha
     */
    async search(dto: SearchLocationDto) {
        const { keyword, limit = 10 } = dto;

        if (!keyword || keyword.trim().length === 0) {
            return this.prisma.location.findMany({
                take: limit,
                orderBy: { name: 'asc' },
            });
        }

        const trimmed = keyword.trim();

        return this.prisma.location.findMany({
            where: {
                OR: [
                    { name: { contains: trimmed, mode: 'insensitive' } },
                    { province: { contains: trimmed, mode: 'insensitive' } },
                    { district: { contains: trimmed, mode: 'insensitive' } },
                    { ward: { contains: trimmed, mode: 'insensitive' } },
                ],
            },
            take: limit,
            orderBy: { name: 'asc' },
        });
    }

    /**
     * 2. API Tìm địa điểm lân cận dựa trên GPS (Haversine Formula)
     * GET /locations/nearby?lat=21.0&lon=105.8&radius=20&sort=ASC&limit=10
     */
    async findNearby(dto: NearbyLocationDto) {
        const { lat, lon, radius = 20, limit = 10, sort = SortOrder.ASC } = dto;

        const allLocations = await this.prisma.location.findMany();

        const nearby = allLocations
            .map((loc) => {
                const distanceInKm = calculateHaversineDistance(
                    lat,
                    lon,
                    loc.latitude,
                    loc.longitude,
                );
                return {
                    ...loc,
                    distanceInKm: parseFloat(distanceInKm.toFixed(2)),
                };
            })
            .filter((loc) => loc.distanceInKm <= radius)
            .sort((a, b) => {
                return sort === SortOrder.ASC
                    ? a.distanceInKm - b.distanceInKm
                    : b.distanceInKm - a.distanceInKm;
            })
            .slice(0, limit);

        return nearby;
    }

    /**
     * 3. API Thống kê mở rộng (Dùng cho Admin Dashboard)
     * GET /locations/statistics
     */
    async getStatistics() {
        const [
            totalLocations,
            favoriteLocations,
            provincesGroup,
            latestWeatherRecords,
            latestAQIRecords,
            lastWeatherUpdate,
            lastAqiUpdate,
        ] = await Promise.all([
            this.prisma.location.count(),
            this.prisma.favoriteLocation.count(),
            this.prisma.location.groupBy({
                by: ['province'],
                where: { province: { not: null } },
            }),
            this.prisma.weatherData.count(),
            this.prisma.airQualityData.count(),
            this.prisma.weatherData.findFirst({
                orderBy: { timestamp: 'desc' },
                select: { timestamp: true },
            }),
            this.prisma.airQualityData.findFirst({
                orderBy: { timestamp: 'desc' },
                select: { timestamp: true },
            }),
        ]);

        // Tính thời điểm cập nhật dữ liệu gần đây nhất
        const timestamps = [
            lastWeatherUpdate?.timestamp,
            lastAqiUpdate?.timestamp,
        ].filter(Boolean) as Date[];

        const lastUpdate = timestamps.length > 0
            ? new Date(Math.max(...timestamps.map((t) => t.getTime())))
            : null;

        return {
            totalLocations,
            favoriteLocations,
            totalProvinces: provincesGroup.length,
            latestWeatherRecords,
            latestAQIRecords,
            lastUpdate,
        };
    }

    /**
     * 4. API Lấy tổng quan Thời tiết, AQI & Khuyên dùng Sức khỏe (BFF pattern)
     * GET /locations/:id/summary
     */
    async getSummary(id: string) {
        const location = await this.prisma.location.findUnique({
            where: { id },
        });

        if (!location) {
            throw new NotFoundException(`Không tìm thấy địa điểm với ID: ${id}`);
        }

        const [latestWeather, latestAirQuality, forecast] = await Promise.all([
            this.prisma.weatherData.findFirst({
                where: { locationId: id },
                orderBy: { timestamp: 'desc' },
            }),
            this.prisma.airQualityData.findFirst({
                where: { locationId: id },
                orderBy: { timestamp: 'desc' },
            }),
            this.prisma.forecastData.findMany({
                where: { locationId: id },
                orderBy: { forecastDate: 'asc' },
                take: 7,
            }),
        ]);

        // Tìm Khuyên dùng Sức khỏe tương ứng dựa trên AQI hiện tại
        let healthRecommendation: any = null;
        if (latestAirQuality?.aqi !== undefined && latestAirQuality?.aqi !== null) {
            const currentAqi = latestAirQuality.aqi;
            healthRecommendation = await this.prisma.healthRecommendation.findFirst({
                where: {
                    minAqi: { lte: currentAqi },
                    maxAqi: { gte: currentAqi },
                },
            });
        }

        return {
            location,
            weather: latestWeather ?? null,
            airQuality: latestAirQuality ?? null,
            forecast,
            healthRecommendation: healthRecommendation ?? null,
        };
    }

    /**
     * 5. API Quản lý Favorite Locations
     */
    async getMyFavorites(userId: string) {
        const favorites = await this.prisma.favoriteLocation.findMany({
            where: { userId },
            include: { location: true },
            orderBy: { createdAt: 'desc' },
        });

        return favorites.map((f) => ({
            id: f.id,
            addedAt: f.createdAt,
            location: f.location,
        }));
    }

    async addFavorite(userId: string, locationId: string) {
        const location = await this.prisma.location.findUnique({
            where: { id: locationId },
        });
        if (!location) {
            throw new NotFoundException('Không tìm thấy địa điểm');
        }

        const exists = await this.prisma.favoriteLocation.findUnique({
            where: { userId_locationId: { userId, locationId } },
        });
        if (exists) {
            throw new BadRequestException('Địa điểm đã có trong danh sách yêu thích');
        }

        const favorite = await this.prisma.favoriteLocation.create({
            data: { userId, locationId },
            include: { location: true },
        });

        return {
            id: favorite.id,
            addedAt: favorite.createdAt,
            location: favorite.location,
        };
    }

    async removeFavorite(userId: string, locationId: string) {
        const favorite = await this.prisma.favoriteLocation.findUnique({
            where: { userId_locationId: { userId, locationId } },
        });

        if (!favorite) {
            throw new NotFoundException('Địa điểm không có trong danh sách yêu thích');
        }

        await this.prisma.favoriteLocation.delete({
            where: { userId_locationId: { userId, locationId } },
        });

        return { message: 'Đã xóa địa điểm khỏi danh sách yêu thích' };
    }

    /**
     * Các hàm CRUD tiêu chuẩn cho Locations
     */
    async create(dto: CreateLocationDto) {
        const existing = await this.prisma.location.findFirst({
            where: {
                name: dto.name,
                province: dto.province ?? null,
            },
        });

        if (existing) {
            throw new ConflictException(
                `Địa điểm "${dto.name}" tại tỉnh "${dto.province || ''}" đã tồn tại.`,
            );
        }

        return this.prisma.location.create({
            data: {
                name: dto.name,
                province: dto.province,
                district: dto.district,
                ward: dto.ward,
                latitude: dto.latitude,
                longitude: dto.longitude,
                timezone: dto.timezone ?? 'Asia/Ho_Chi_Minh',
                country: dto.country ?? 'Vietnam',
            },
        });
    }

    async findAll(query: QueryLocationsDto) {
        const { page = 1, limit = 20, search, province } = query;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (province) {
            where.province = { contains: province, mode: 'insensitive' };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { province: { contains: search, mode: 'insensitive' } },
                { district: { contains: search, mode: 'insensitive' } },
                { ward: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.location.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.location.count({ where }),
        ]);

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const location = await this.prisma.location.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        favorites: true,
                        weather: true,
                        airQuality: true,
                    },
                },
            },
        });

        if (!location) {
            throw new NotFoundException(`Không tìm thấy địa điểm với ID: ${id}`);
        }

        return location;
    }

    async update(id: string, dto: UpdateLocationDto) {
        await this.findOne(id);

        return this.prisma.location.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        await this.prisma.location.delete({
            where: { id },
        });

        return { message: 'Đã xóa địa điểm thành công' };
    }

    async seedDefaultLocations() {
        const createdLocations: any[] = [];

        for (const loc of DEFAULT_VIETNAM_LOCATIONS) {
            const existing = await this.prisma.location.findFirst({
                where: { name: loc.name },
            });

            if (!existing) {
                const created = await this.prisma.location.create({
                    data: loc,
                });
                createdLocations.push(created);
            }
        }

        return {
            message: `Đã tự động khởi tạo ${createdLocations.length} địa điểm mới.`,
            seeded: createdLocations,
        };
    }
}
