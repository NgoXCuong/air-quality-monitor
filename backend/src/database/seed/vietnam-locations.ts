export interface SeedLocation {
    name: string;
    province: string;
    district: string;
    latitude: number;
    longitude: number;
    timezone: string;
    country: string;
}

export const DEFAULT_VIETNAM_LOCATIONS: SeedLocation[] = [
    {
        name: 'Hà Nội',
        province: 'Hà Nội',
        district: 'Hoàn Kiếm',
        latitude: 21.0285,
        longitude: 105.8542,
        timezone: 'Asia/Ho_Chi_Minh',
        country: 'Vietnam',
    },
    {
        name: 'TP. Hồ Chí Minh',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        latitude: 10.8231,
        longitude: 106.6297,
        timezone: 'Asia/Ho_Chi_Minh',
        country: 'Vietnam',
    },
    {
        name: 'Đà Nẵng',
        province: 'Đà Nẵng',
        district: 'Hải Châu',
        latitude: 16.0544,
        longitude: 108.2022,
        timezone: 'Asia/Ho_Chi_Minh',
        country: 'Vietnam',
    },
    {
        name: 'Hải Phòng',
        province: 'Hải Phòng',
        district: 'Hồng Bàng',
        latitude: 20.8449,
        longitude: 106.6881,
        timezone: 'Asia/Ho_Chi_Minh',
        country: 'Vietnam',
    },
    {
        name: 'Cần Thơ',
        province: 'Cần Thơ',
        district: 'Ninh Kiều',
        latitude: 10.0452,
        longitude: 105.7469,
        timezone: 'Asia/Ho_Chi_Minh',
        country: 'Vietnam',
    },
    {
        name: 'Nha Trang',
        province: 'Khánh Hòa',
        district: 'Nha Trang',
        latitude: 12.2388,
        longitude: 109.1967,
        timezone: 'Asia/Ho_Chi_Minh',
        country: 'Vietnam',
    },
    {
        name: 'Đà Lạt',
        province: 'Lâm Đồng',
        district: 'Đà Lạt',
        latitude: 11.9404,
        longitude: 108.4583,
        timezone: 'Asia/Ho_Chi_Minh',
        country: 'Vietnam',
    },
    {
        name: 'Huế',
        province: 'Thừa Thiên Huế',
        district: 'Huế',
        latitude: 16.4637,
        longitude: 107.5909,
        timezone: 'Asia/Ho_Chi_Minh',
        country: 'Vietnam',
    },
    {
        name: 'Hạ Long',
        province: 'Quảng Ninh',
        district: 'Hạ Long',
        latitude: 20.9599,
        longitude: 107.0425,
        timezone: 'Asia/Ho_Chi_Minh',
        country: 'Vietnam',
    },
    {
        name: 'Vũng Tàu',
        province: 'Bà Rịa - Vũng Tàu',
        district: 'Vũng Tàu',
        latitude: 10.346,
        longitude: 107.0843,
        timezone: 'Asia/Ho_Chi_Minh',
        country: 'Vietnam',
    },
];
