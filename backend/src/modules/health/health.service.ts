import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateHealthRecommendationDto,
    QueryHealthRecommendationsDto,
    UpdateHealthRecommendationDto,
} from './dto/health-recommendation.dto';

export interface HealthAdviceItem {
    id?: string;
    minAqi: number;
    maxAqi: number;
    targetGroup: string;
    title: string;
    description: string;
    actions: string[];
}

// BỘ KHUYẾN CÁO TIÊU CHUẨN Y TẾ THEO 4 NHÓM ĐỐI TƯỢNG (WHO & US-EPA)
export const STANDARD_HEALTH_GUIDELINES: HealthAdviceItem[] = [
    // 1. DẢI AQI 0 - 50: TỐT (GOOD)
    {
        minAqi: 0,
        maxAqi: 50,
        targetGroup: 'GENERAL',
        title: 'Chất lượng không khí trong lành tuyệt đối',
        description: 'Chỉ số không khí rất an toàn, không có nguy cơ gây hại đối với sức khỏe cộng đồng.',
        actions: [
            'Thoải mái sinh hoạt, vui chơi và làm việc ngoài trời',
            'Mở toàn bộ cửa sổ để đón luồng khí tự nhiên thông thoáng nhà cửa',
            'Rất thích hợp cho các chuyến dã ngoại và hoạt động ngoài trời',
        ],
    },
    {
        minAqi: 0,
        maxAqi: 50,
        targetGroup: 'CHILDREN',
        title: 'Trẻ em & Trẻ sơ sinh: Điều kiện lý tưởng',
        description: 'Không khí sạch giúp hệ hô hấp non nớt của trẻ phát triển khỏe mạnh và toàn diện.',
        actions: [
            'Cho trẻ tắm nắng và vui chơi vận động ngoài trời vào sáng sớm',
            'Khuyến khích trẻ tham gia các môn thể thao ngoài trời',
        ],
    },
    {
        minAqi: 0,
        maxAqi: 50,
        targetGroup: 'RESPIRATORY',
        title: 'Bệnh nhân hô hấp: Thời điểm an toàn',
        description: 'Nguy cơ bùng phát cơn hen suyễn hoặc viêm xoang dị ứng là cực kỳ thấp.',
        actions: [
            'Không cần hạn chế thời gian ở ngoài trời',
            'Tiếp tục duy trì đơn thuốc kiểm soát dự phòng thường quy',
        ],
    },
    {
        minAqi: 0,
        maxAqi: 50,
        targetGroup: 'FITNESS',
        title: 'Vận động viên & Thể thao: Điều kiện hoàn hảo',
        description: 'Lượng oxy dồi dào, không chứa chất kích ứng đường thở trong quá trình hô hấp sâu.',
        actions: [
            'Rất thích hợp chạy bộ cự ly dài, đạp xe và tập gym ngoài trời',
            'Thời điểm tối ưu để nâng cao dung tích sống của phổi',
        ],
    },

    // 2. DẢI AQI 51 - 100: TRUNG BÌNH (MODERATE)
    {
        minAqi: 51,
        maxAqi: 100,
        targetGroup: 'GENERAL',
        title: 'Chất lượng không khí ở mức chấp nhận được',
        description: 'Đa số mọi người có thể tiếp tục các hoạt động thường ngày mà không gặp trở ngại.',
        actions: [
            'Người khỏe mạnh có thể sinh hoạt ngoài trời bình thường',
            'Vệ sinh mắt và rửa mũi bằng nước muối sinh lý sau khi đi đường xa về',
        ],
    },
    {
        minAqi: 51,
        maxAqi: 100,
        targetGroup: 'CHILDREN',
        title: 'Trẻ nhỏ: Theo dõi triệu chứng nhạy cảm',
        description: 'Một số trẻ có cơ địa quá mẫn cảm có thể bắt đầu hắt hơi nhẹ hoặc ngứa mũi.',
        actions: [
            'Giữ ấm cổ họng khi vui chơi vào sáng sớm hoặc chiều muộn',
            'Nhắc nhở trẻ uống đủ nước ấm trong ngày',
        ],
    },
    {
        minAqi: 51,
        maxAqi: 100,
        targetGroup: 'RESPIRATORY',
        title: 'Bệnh nhân Hen & Dị ứng: Bắt đầu chú ý',
        description: 'Nồng độ bụi lơ lửng có thể gây kích thích nhẹ niêm mạc phế quản nhạy cảm.',
        actions: [
            'Mang theo bình xịt cắt cơn khi ra khỏi nhà',
            'Hạn chế hít thở quá sâu tại các nút giao thông đông đúc',
        ],
    },
    {
        minAqi: 51,
        maxAqi: 100,
        targetGroup: 'FITNESS',
        title: 'Thể thao ngoài trời: Vận động vừa sức',
        description: 'Vẫn có thể tập luyện bình thường nhưng nên tránh các cung đường có nhiều khói xe buýt, xe tải.',
        actions: [
            'Chọn công viên hoặc khu vực nhiều cây xanh để chạy bộ',
            'Uống nhiều nước để hỗ trợ đường hô hấp làm sạch tự nhiên',
        ],
    },

    // 3. DẢI AQI 101 - 150: KÉM (UNHEALTHY FOR SENSITIVE GROUPS)
    {
        minAqi: 101,
        maxAqi: 150,
        targetGroup: 'GENERAL',
        title: 'Không khí kém - Nhóm nhạy cảm chịu ảnh hưởng',
        description: 'Nồng độ bụi mịn PM2.5 tăng đáng kể, bắt đầu ảnh hưởng xấu tới sức khỏe người nhạy cảm.',
        actions: [
            'Chủ động đeo khẩu trang khi tham gia giao thông trên đường',
            'Đóng cửa sổ trong khung giờ cao điểm xe cộ (7h - 9h sáng, 17h - 19h tối)',
            'Vệ sinh đường thở bằng nước muối sinh lý 0.9% mỗi tối',
        ],
    },
    {
        minAqi: 101,
        maxAqi: 150,
        targetGroup: 'CHILDREN',
        title: 'Cảnh báo trẻ nhỏ: Hạn chế hoạt động ngoài trời',
        description: 'Tốc độ thở của trẻ nhanh gấp đôi người lớn khiến lượng bụi mịn hấp thụ vào phế nang cao hơn.',
        actions: [
            'Hạn chế cho trẻ chơi ngoài sân trường vào giờ ra chơi',
            'Bắt buộc trẻ đeo khẩu trang ôm sát mặt khi bố mẹ chở xe máy',
            'Tăng cường các trò chơi kích thích trí tuệ trong nhà',
        ],
    },
    {
        minAqi: 101,
        maxAqi: 150,
        targetGroup: 'RESPIRATORY',
        title: 'Cảnh báo hô hấp: Bụi kích ứng phế quản',
        description: 'Bụi mịn dễ gây ngứa họng, ho dai dẳng và kích hoạt cơn hen cấp tính.',
        actions: [
            'Đeo khẩu trang đạt chuẩn N95 hoặc KF94 có gọng ôm sát sống mũi',
            'Luôn sẵn sàng bình xịt Ventolin / Berodual bên người',
            'Bật máy lọc không khí ở chế độ gió vừa trong phòng ngủ',
        ],
    },
    {
        minAqi: 101,
        maxAqi: 150,
        targetGroup: 'FITNESS',
        title: 'Người tập thể thao: Giảm cường độ hoặc tập trong nhà',
        description: 'Khi vận động mạnh, nhịp thở sâu kéo lượng bụi mịn thâm nhập sâu vào phế nang tăng gấp 8-10 lần.',
        actions: [
            'Chuyển buổi chạy bộ ngoài trời sang tập máy chạy bộ hoặc gym trong nhà',
            'Nếu tập ngoài trời, chỉ đi bộ nhẹ nhàng vào thời điểm chỉ số thấp nhất trong ngày',
        ],
    },

    // 4. DẢI AQI 151 - 200: XẤU (UNHEALTHY)
    {
        minAqi: 151,
        maxAqi: 200,
        targetGroup: 'GENERAL',
        title: 'Cảnh báo ô nhiễm xấu: Nguy hại sức khỏe cộng đồng',
        description: 'Chất lượng không khí gây ảnh hưởng xấu tới đường hô hấp của tất cả mọi người.',
        actions: [
            'Bắt buộc đeo khẩu trang chống bụi mịn N95 có van lọc khi ra ngoài',
            'Đóng kín cửa sổ và bật máy lọc không khí có màng HEPA trong phòng',
            'Uống nhiều nước ấm, bổ sung vitamin C để tăng cường hệ miễn dịch',
        ],
    },
    {
        minAqi: 151,
        maxAqi: 200,
        targetGroup: 'CHILDREN',
        title: 'Cảnh báo khẩn cấp: Không cho trẻ ra ngoài trời',
        description: 'Bụi PM2.5 xâm nhập phế quản gây viêm đường hô hấp trên và viêm phế quản co thắt ở trẻ.',
        actions: [
            'Không tổ chức hoạt động thể dục hay ngoại khóa ngoài trời cho học sinh',
            'Giữ môi trường sống trong nhà sạch sẽ, lau nhà bằng khăn ẩm tránh bụi bay',
            'Đưa trẻ đi khám ngay nếu có biểu hiện thở khò khè hoặc thở rít',
        ],
    },
    {
        minAqi: 151,
        maxAqi: 200,
        targetGroup: 'RESPIRATORY',
        title: 'Nguy cơ bùng phát hen cấp tính & COPD',
        description: 'Tỷ lệ nhập viện do đợt cấp COPD và hen suyễn tăng vọt khi AQI vượt ngưỡng 150.',
        actions: [
            'Tuyệt đối ở trong phòng kín có thiết bị lọc khí',
            'Dùng thuốc xịt dự phòng đúng giờ theo chỉ định của bác sĩ',
            'Liên hệ cơ sở y tế gần nhất nếu cảm giác tức ngực hoặc khó thở tăng dần',
        ],
    },
    {
        minAqi: 151,
        maxAqi: 200,
        targetGroup: 'FITNESS',
        title: 'Dừng hoàn toàn tập thể dục ngoài trời',
        description: 'Tập luyện ngoài trời lúc này gây hại cho tim mạch và phổi nhiều hơn lợi ích thể lực mang lại.',
        actions: [
            'Hủy bỏ các buổi chạy bộ ngoài trời, đạp xe hoặc đá bóng',
            'Tập yoga, giãn cơ hoặc thể lực nhẹ nhàng trong phòng kín có lọc khí',
        ],
    },

    // 5. DẢI AQI 201 - 300: RẤT XẤU (VERY UNHEALTHY)
    {
        minAqi: 201,
        maxAqi: 300,
        targetGroup: 'GENERAL',
        title: 'Báo động đỏ: Ô nhiễm không khí rất xấu',
        description: 'Cảnh báo khẩn cấp về sức khỏe đối với toàn thể cư dân trong khu vực.',
        actions: [
            'Ở trong nhà càng nhiều càng tốt, đóng chặt tất cả các cửa',
            'Chỉ ra ngoài khi thực sự cần thiết và bắt buộc đeo khẩu trang chuyên dụng N95/N99',
            'Bật máy lọc không khí công suất tối đa liên tục 24/24',
        ],
    },
    {
        minAqi: 201,
        maxAqi: 300,
        targetGroup: 'CHILDREN',
        title: 'Báo động đỏ: Cách ly trẻ khỏi không khí ngoài trời',
        description: 'Nguy cơ tổn thương biểu mô phổi lâu dài đối với trẻ nhỏ.',
        actions: [
            'Học sinh nên được nghỉ học hoặc chuyển sang học trực tuyến nếu trường không có lọc khí',
            'Giữ trẻ trong phòng kín có lọc không khí đạt chuẩn',
        ],
    },
    {
        minAqi: 201,
        maxAqi: 300,
        targetGroup: 'RESPIRATORY',
        title: 'Báo động khẩn cấp y tế: Bệnh nhân tim mạch & hô hấp',
        description: 'Nguy cơ suy hô hấp cấp và biến cố tim mạch rất cao.',
        actions: [
            'Không bước chân ra ngoài trời dưới bất kỳ hình thức nào',
            'Chuẩn bị sẵn máy đo SpO2 và bình oxy y tế dự phòng nếu cần',
        ],
    },
    {
        minAqi: 201,
        maxAqi: 300,
        targetGroup: 'FITNESS',
        title: 'Nghiêm cấm vận động gắng sức ngoài trời',
        description: 'Lượng bụi mịn PM2.5 đi thẳng vào dòng máu có thể gây co thắt mạch vành.',
        actions: [
            'Chỉ vận động nhẹ nhàng trong phòng kín',
            'Nghỉ ngơi và theo dõi nhịp tim',
        ],
    },

    // 6. DẢI AQI 301 - 500: NGUY HẠI (HAZARDOUS)
    {
        minAqi: 301,
        maxAqi: 500,
        targetGroup: 'GENERAL',
        title: 'Tình trạng khẩn cấp: Ô nhiễm mức Nguy hại',
        description: 'Toàn bộ dân số chịu ảnh hưởng nghiêm trọng đến tính mạng và sức khỏe.',
        actions: [
            'Ban bố tình trạng khẩn cấp về chất lượng không khí',
            'Tránh mọi hoạt động ngoài trời, niêm phong khe cửa sổ',
            'Sử dụng khẩu trang phòng độc chuyên dụng nếu buộc phải di chuyển',
        ],
    },
    {
        minAqi: 301,
        maxAqi: 500,
        targetGroup: 'CHILDREN',
        title: 'Tình trạng khẩn cấp: Bảo vệ tối đa trẻ nhỏ',
        description: 'Không khí chứa hàm lượng chất độc hại ở mức báo động quốc gia.',
        actions: [
            'Ở phòng kín cách ly hoàn toàn với không khí ngoài trời',
            'Theo dõi sát nhịp thở của trẻ',
        ],
    },
    {
        minAqi: 301,
        maxAqi: 500,
        targetGroup: 'RESPIRATORY',
        title: 'Tình trạng khẩn cấp: Người bệnh mãn tính',
        description: 'Nguy cơ tử vong và suy hô hấp cấp tính nghiêm trọng.',
        actions: [
            'Liên hệ bác sĩ chuyên khoa hoặc đường dây nóng cấp cứu y tế',
            'Bật hệ thống lọc khí áp suất dương nếu có điều kiện',
        ],
    },
    {
        minAqi: 301,
        maxAqi: 500,
        targetGroup: 'FITNESS',
        title: 'Tình trạng khẩn cấp: Đình chỉ mọi hoạt động',
        description: 'Tuyệt đối không vận động thể lực.',
        actions: [
            'Ở yên trong nhà, giữ bình tĩnh và nghỉ ngơi hoàn toàn',
        ],
    },
];

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * GET /health/recommendations
     * Lấy danh sách khuyến cáo theo chỉ số AQI và nhóm đối tượng
     */
    async getRecommendations(dto: QueryHealthRecommendationsDto): Promise<HealthAdviceItem[]> {
        const targetGroup = dto.targetGroup || 'ALL';
        const aqi = dto.aqi !== undefined ? dto.aqi : 75;

        // 1. Tìm trong PostgreSQL Database
        try {
            const whereClause: any = {
                minAqi: { lte: aqi },
                maxAqi: { gte: aqi },
            };

            if (targetGroup !== 'ALL') {
                whereClause.targetGroup = targetGroup;
            }

            const dbItems = await this.prisma.healthRecommendation.findMany({
                where: whereClause,
                orderBy: { targetGroup: 'asc' },
            });

            // Nếu DB có dữ liệu và đã có mảng actions chuẩn
            if (dbItems.length > 0 && dbItems.some((item) => Array.isArray(item.actions) && item.actions.length > 0)) {
                return dbItems.map((item) => ({
                    id: item.id,
                    minAqi: item.minAqi,
                    maxAqi: item.maxAqi,
                    targetGroup: item.targetGroup,
                    title: item.title,
                    description: item.description,
                    actions: Array.isArray(item.actions) ? (item.actions as string[]) : [],
                }));
            }
        } catch (error) {
            this.logger.warn(`Lỗi khi đọc bảng HealthRecommendation từ DB: ${error?.message}`);
        }

        // 2. Fallback: Lấy từ bộ khuyến cáo tiêu chuẩn chuẩn y khoa
        this.logger.log(`⚡ Cung cấp bộ khuyến cáo y khoa chuẩn cho AQI=${aqi}, nhóm=${targetGroup}`);
        let matched = STANDARD_HEALTH_GUIDELINES.filter(
            (item) => item.minAqi <= aqi && item.maxAqi >= aqi,
        );

        if (targetGroup !== 'ALL') {
            const groupMatched = matched.filter((item) => item.targetGroup === targetGroup);
            if (groupMatched.length > 0) {
                matched = groupMatched;
            }
        }

        return matched;
    }

    /**
     * GET /health/guidelines
     * Lấy cẩm nang toàn diện tất cả các dải AQI
     */
    async getAllGuidelines() {
        return {
            totalCategories: 6,
            totalGuidelines: STANDARD_HEALTH_GUIDELINES.length,
            guidelines: STANDARD_HEALTH_GUIDELINES,
        };
    }

    /**
     * POST /health/recommendations (Admin)
     */
    async createRecommendation(dto: CreateHealthRecommendationDto) {
        return this.prisma.healthRecommendation.create({
            data: {
                minAqi: dto.minAqi,
                maxAqi: dto.maxAqi,
                targetGroup: dto.targetGroup,
                title: dto.title,
                description: dto.description,
                actions: dto.actions || [],
            },
        });
    }

    /**
     * PATCH /health/recommendations/:id (Admin)
     */
    async updateRecommendation(id: string, dto: UpdateHealthRecommendationDto) {
        const found = await this.prisma.healthRecommendation.findUnique({ where: { id } });
        if (!found) {
            throw new NotFoundException(`Không tìm thấy khuyến cáo có ID: ${id}`);
        }

        return this.prisma.healthRecommendation.update({
            where: { id },
            data: {
                ...(dto.minAqi !== undefined ? { minAqi: dto.minAqi } : {}),
                ...(dto.maxAqi !== undefined ? { maxAqi: dto.maxAqi } : {}),
                ...(dto.targetGroup !== undefined ? { targetGroup: dto.targetGroup } : {}),
                ...(dto.title !== undefined ? { title: dto.title } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.actions !== undefined ? { actions: dto.actions } : {}),
            },
        });
    }

    /**
     * DELETE /health/recommendations/:id (Admin)
     */
    async deleteRecommendation(id: string) {
        const found = await this.prisma.healthRecommendation.findUnique({ where: { id } });
        if (!found) {
            throw new NotFoundException(`Không tìm thấy khuyến cáo có ID: ${id}`);
        }

        return this.prisma.healthRecommendation.delete({ where: { id } });
    }
}
