npx prisma generate

[BƯỚC 1: XÁC THỰC & NGƯỜI DÙNG]
  ✅ Auth
  ✅ Users

[BƯỚC 2: QUẢN LÝ VỊ TRÍ & DỮ LIỆU THỜI TIẾT]
  ✅ 1. 📍 Locations         (Quản lý danh sách tỉnh/thành phố/tọa độ)
  ✅ 2. 🌤️ Weather           (Quản lý dữ liệu Thời tiết - Tách Module riêng)
  ✅ 3. 🌫️ Air Quality       (Quản lý chất lượng không khí & AQI - Tách Module riêng)
  ✅ 4. ⏰ Scheduler         (Cron Job 30 phút tự động đồng bộ dữ liệu vào DB)

[BƯỚC 3: NGHIỆP VỤ NÂNG CAO]
  5. 📈 Forecast         (Lưu dữ liệu dự báo ForecastData phục vụ AI)
  6. 🏥 Health           (Khuyên dùng sức khỏe theo dải chỉ số AQI)

[BƯỚC 4: THÔNG BÁO REALTIME]
  7. 🔔 Notifications    (Cảnh báo khi AQI xấu qua Email + lưu DB)
  8. ⚡ WebSocket        (Đẩy cảnh báo & dữ liệu AQI realtime lên UI)

[BƯỚC 5: TRỢ LÝ THÔNG MINH & GIAO DIỆN]
  9. 🤖 AI               (Trợ lý Gemini/OpenAI tư vấn sức khỏe & thời tiết)
  10. 📊 Dashboard       (Hoàn thiện UI: Bản đồ Heatmap, Biểu đồ Recharts, Cài đặt)