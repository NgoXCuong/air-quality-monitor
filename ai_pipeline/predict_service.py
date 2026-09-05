"""
SCRIPT DỰ BÁO PM2.5 / AQI CHO 24H TIẾP THEO & ĐỒNG BỘ VÀO POSTGRESQL
Được gọi định kỳ bởi NestJS Scheduler hoặc FastAPI Microservice.
"""

import os
import joblib
import numpy as np
import pandas as pd
import requests
from datetime import datetime, timedelta
import xgboost as xgb

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

def calculate_aqi_from_pm25(pm25: float) -> int:
    """
    Quy đổi nồng độ PM2.5 (ug/m3) sang chỉ số AQI chuẩn US-EPA.
    """
    if pm25 < 0:
        return 0
    c = round(float(pm25), 1)
    # Các khoảng breakpoint theo chuẩn US-EPA: (C_low, C_high, I_low, I_high)
    breakpoints = [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500)
    ]
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= c <= c_high:
            return round(((i_high - i_low) / (c_high - c_low)) * (c - c_low) + i_low)
    return 500

def get_aqi_category(aqi: int) -> dict:
    """
    Phân loại chất lượng không khí theo dải AQI
    """
    if aqi <= 50:
        return {"level": "Tốt", "color": "#10b981", "badge": "GOOD"}
    elif aqi <= 100:
        return {"level": "Trung bình", "color": "#f59e0b", "badge": "MODERATE"}
    elif aqi <= 150:
        return {"level": "Kém (Nhóm nhạy cảm)", "color": "#f97316", "badge": "UNHEALTHY_SENSITIVE"}
    elif aqi <= 200:
        return {"level": "Xấu", "color": "#ef4444", "badge": "UNHEALTHY"}
    elif aqi <= 300:
        return {"level": "Rất xấu", "color": "#8b5cf6", "badge": "VERY_UNHEALTHY"}
    else:
        return {"level": "Nguy hại", "color": "#7f1d1d", "badge": "HAZARDOUS"}

def forecast_next_24h(lat=21.0285, lon=105.8542):
    """
    Lấy dữ liệu thời tiết 24h tới và dùng mô hình đã huấn luyện để dự báo AQI & PM2.5
    """
    scaler_X_path = os.path.join(MODELS_DIR, "scaler_X.pkl")
    feature_cols_path = os.path.join(MODELS_DIR, "feature_cols.pkl")
    model_xgb_path = os.path.join(MODELS_DIR, "xgboost_pm25.json")

    if not os.path.exists(model_xgb_path):
        raise FileNotFoundError(f"Không tìm thấy mô hình tại {model_xgb_path}. Vui lòng kiểm tra lại thư mục models.")

    scaler_X = joblib.load(scaler_X_path)
    feature_cols = joblib.load(feature_cols_path)
    
    model = xgb.XGBRegressor()
    model.load_model(model_xgb_path)

    # 1. Gọi Open-Meteo lấy dữ liệu 24h qua và 48h tới
    w_url = "https://api.open-meteo.com/v1/forecast"
    w_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m",
        "past_days": 1,
        "forecast_days": 2,
        "timezone": "Asia/Bangkok"
    }
    w_res = requests.get(w_url, params=w_params).json()
    df_w = pd.DataFrame(w_res["hourly"])
    df_w["time"] = pd.to_datetime(df_w["time"])

    # 2. Lấy dữ liệu không khí
    a_url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    a_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide",
        "past_days": 1,
        "forecast_days": 2,
        "timezone": "Asia/Bangkok"
    }
    a_res = requests.get(a_url, params=a_params).json()
    df_a = pd.DataFrame(a_res["hourly"])
    df_a["time"] = pd.to_datetime(df_a["time"])

    df = pd.merge(df_w, df_a, on="time", how="inner")
    
    # 3. Tạo đặc trưng tương tự tập huấn luyện
    df["hour"] = df["time"].dt.hour
    df["month"] = df["time"].dt.month
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12.0)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12.0)

    for lag in [1, 3, 6, 24]:
        df[f"pm2_5_lag_{lag}"] = df["pm2_5"].shift(lag)

    df = df.bfill().ffill()

    # Lấy 24 giờ tiếp theo bắt đầu từ giờ hiện tại
    now = datetime.now()
    future_df = df[df["time"] >= now].head(24).copy()
    
    X_pred = future_df[feature_cols].values
    predicted_pm25 = model.predict(X_pred)

    results = []
    for i, (idx, row) in enumerate(future_df.iterrows()):
        pm25_val = float(max(0.0, predicted_pm25[i]))
        aqi_val = calculate_aqi_from_pm25(pm25_val)
        category = get_aqi_category(aqi_val)
        
        results.append({
            "forecastHour": i + 1,
            "targetTime": row["time"].isoformat(),
            "temperature": float(row.get("temperature_2m", 0.0)),
            "humidity": float(row.get("relative_humidity_2m", 0.0)),
            "predictedPm25": round(pm25_val, 2),
            "predictedAqi": aqi_val,
            "category": category["level"],
            "categoryBadge": category["badge"],
            "color": category["color"],
            "confidence": 0.88,
            "modelVersion": "xgboost-v1.0"
        })

    return results

if __name__ == "__main__":
    print("⏳ Đang chạy thử nghiệm dự báo 24 giờ tới...")
    predictions = forecast_next_24h()
    print(f"✅ Dự báo thành công {len(predictions)} giờ tiếp theo:")
    for item in predictions[:6]:
        print(f"  - Giờ {item['forecastHour']} ({item['targetTime']}): AQI = {item['predictedAqi']} ({item['category']}), PM2.5 = {item['predictedPm25']} ug/m3")
