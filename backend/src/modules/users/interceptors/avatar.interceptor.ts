import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// ─── Thư mục lưu avatar ─────────────────────────────────────────
const AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');

// Tạo thư mục nếu chưa tồn tại
if (!existsSync(AVATAR_UPLOAD_DIR)) {
    mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}

// ─── Allowed image types ────────────────────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Multer config ──────────────────────────────────────────────
export const AvatarInterceptor = FileInterceptor('avatar', {
    storage: diskStorage({
        destination: AVATAR_UPLOAD_DIR,
        filename: (_req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const ext = extname(file.originalname).toLowerCase();
            cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
    }),
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
    },
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return cb(
                new BadRequestException(
                    'Chỉ chấp nhận file ảnh: JPEG, PNG, WebP hoặc GIF',
                ),
                false,
            );
        }
        cb(null, true);
    },
});

export const AVATAR_BASE_URL_KEY = 'APP_URL';
