import { PrismaClient } from '@prisma/client';
import { DEFAULT_VIETNAM_LOCATIONS } from '../src/database/seed/vietnam-locations';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Seed Locations
    for (const loc of DEFAULT_VIETNAM_LOCATIONS) {
        const existing = await prisma.location.findFirst({
            where: { name: loc.name },
        });

        if (!existing) {
            await prisma.location.create({ data: loc });
            console.log(`  └─ Created Location: ${loc.name}`);
        }
    }

    // 2. Seed Default Health Recommendations
    const defaultRecommendations = [
        {
            minAqi: 0,
            maxAqi: 50,
            title: 'Tốt (Good)',
            description: 'Chất lượng không khí tốt, không ảnh hưởng tới sức khỏe. Thích hợp cho các hoạt động ngoài trời.',
        },
        {
            minAqi: 51,
            maxAqi: 100,
            title: 'Trung bình (Moderate)',
            description: 'Chất lượng không khí chấp nhận được. Nhóm nhạy cảm (trẻ em, người già) nên hạn chế hoạt động quá sức ngoài trời.',
        },
        {
            minAqi: 101,
            maxAqi: 150,
            title: 'Kém (Unhealthy for Sensitive Groups)',
            description: 'Người nhạy cảm có thể gặp các triệu chứng về hô hấp. Nên đeo khẩu trang khi ra ngoài.',
        },
        {
            minAqi: 151,
            maxAqi: 200,
            title: 'Xấu (Unhealthy)',
            description: 'Ảnh hưởng tới sức khỏe mọi người. Hạn chế ra ngoài và tập thể dục ngoài trời, đóng cửa sổ.',
        },
        {
            minAqi: 201,
            maxAqi: 300,
            title: 'Rất xấu (Very Unhealthy)',
            description: 'Cảnh báo sức khỏe khẩn cấp. Mọi người nên ở trong nhà, sử dụng máy lọc không khí.',
        },
        {
            minAqi: 301,
            maxAqi: 500,
            title: 'Nguy hại (Hazardous)',
            description: 'Nguy hiểm sức khỏe nghiêm trọng. Tránh hoàn toàn các hoạt động thể lực ngoài trời.',
        },
    ];

    for (const rec of defaultRecommendations) {
        const existing = await prisma.healthRecommendation.findFirst({
            where: { minAqi: rec.minAqi, maxAqi: rec.maxAqi },
        });

        if (!existing) {
            await prisma.healthRecommendation.create({ data: rec });
            console.log(`  └─ Created Health Recommendation: ${rec.title}`);
        }
    }

    console.log('✅ Database seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
