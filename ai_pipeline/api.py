"""
FASTAPI MICROSERVICE CHO MÔ HÌNH DỰ BÁO AI
Cung cấp REST API cho Backend NestJS gọi để lấy dữ liệu dự báo 24 giờ tới
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from predict_service import forecast_next_24h

app = FastAPI(
    title="Air Quality AI Forecast Microservice",
    description="Dịch vụ suy luận mô hình AI (XGBoost/LSTM) dự báo chất lượng không khí và thời tiết",
    version="1.0.0"
)

# Cho phép NestJS Backend và NextJS Frontend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Air Quality AI Prediction Engine",
        "version": "1.0.0"
    }

@app.get("/api/ai/forecast-24h")
def get_24h_forecast(
    lat: float = Query(21.0285, description="Vĩ độ (Latitude)"),
    lon: float = Query(105.8542, description="Kinh độ (Longitude)")
):
    """
    Dự báo chất lượng không khí (PM2.5, AQI) và thời tiết trong 24 giờ tiếp theo
    dựa trên mô hình Machine Learning.
    """
    try:
        predictions = forecast_next_24h(lat=lat, lon=lon)
        return {
            "success": True,
            "latitude": lat,
            "longitude": lon,
            "totalHours": len(predictions),
            "forecast": predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi dự báo: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
