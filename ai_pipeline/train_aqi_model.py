"""
PIPELINE HUẤN LUYỆN MÔ HÌNH DỰ BÁO CHẤT LƯỢNG KHÔNG KHÍ (PM2.5 / AQI)
Đồ án: Hệ thống giám sát và dự báo chất lượng không khí, thời tiết kết hợp cảnh báo sức khỏe.
Mô hình: So sánh XGBoost vs LSTM (Deep Learning)
Nguồn dữ liệu: Open-Meteo Historical API (Hà Nội: 21.0285, 105.8542)
"""

import os
import requests
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

# Thư viện Machine Learning & Deep Learning
import xgboost as xgb
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

# Thiết lập seed để kết quả ổn định
np.random.seed(42)
tf.random.set_seed(42)

# ==============================================================================
# BƯỚC 1: THU THẬP DỮ LIỆU TỪ OPEN-METEO API (MIỄN PHÍ, KHÔNG CẦN API KEY)
# ==============================================================================
def fetch_training_data(lat=21.0285, lon=105.8542, start_date="2023-01-01", end_date="2024-12-31"):
    print(f"[1/5] Đang tải dữ liệu thời tiết & không khí từ {start_date} đến {end_date}...")
    
    # 1. Tải dữ liệu thời tiết lịch sử (Nhiệt độ, Độ ẩm, Gió, Áp suất)
    weather_url = "https://archive-api.open-meteo.com/v1/archive"
    weather_params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m",
        "timezone": "Asia/Bangkok"
    }
    w_res = requests.get(weather_url, params=weather_params).json()
    df_weather = pd.DataFrame(w_res["hourly"])
    df_weather["time"] = pd.to_datetime(df_weather["time"])

    # 2. Tải dữ liệu chất lượng không khí lịch sử (PM2.5, PM10, CO, NO2)
    air_url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    air_params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide",
        "timezone": "Asia/Bangkok"
    }
    a_res = requests.get(air_url, params=air_params).json()
    df_air = pd.DataFrame(a_res["hourly"])
    df_air["time"] = pd.to_datetime(df_air["time"])

    # Kết hợp 2 bảng theo mốc thời gian
    df = pd.merge(df_weather, df_air, on="time", how="inner")
    print(f"-> Thu thập thành công {len(df)} mẫu dữ liệu theo giờ.")
    return df

# ==============================================================================
# BƯỚC 2: TIỀN XỬ LÝ & TẠO ĐẶC TRƯNG (FEATURE ENGINEERING)
# ==============================================================================
def preprocess_features(df):
    print("[2/5] Đang tiền xử lý dữ liệu và tạo đặc trưng...")
    
    # Sắp xếp theo thời gian
    df = df.sort_values("time").reset_index(drop=True)

    # 1. Điền giá trị khuyết bằng phép nội suy tuyến tính (Linear Interpolation)
    numeric_cols = [c for c in df.columns if c != "time"]
    df[numeric_cols] = df[numeric_cols].interpolate(method="linear").bfill().ffill()

    # 2. Đặc trưng chu kỳ thời gian (Giờ trong ngày và Tháng trong năm dạng Sin/Cos)
    df["hour"] = df["time"].dt.hour
    df["month"] = df["time"].dt.month
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12.0)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12.0)

    # 3. Đặc trưng trễ (Lag features) - nồng độ 1h, 3h, 6h, 24h trước
    for lag in [1, 3, 6, 24]:
        df[f"pm2_5_lag_{lag}"] = df["pm2_5"].shift(lag)

    # 4. Target: Dự báo PM2.5 tại t+1 (dùng rolling inference để dự báo 24h)
    df["target_pm2_5"] = df["pm2_5"].shift(-1)

    # Loại bỏ các dòng NaN sinh ra do shift
    df = df.dropna().reset_index(drop=True)
    return df

# ==============================================================================
# BƯỚC 3: CHUẨN BỊ TẬP TRAIN / TEST & SCALING
# ==============================================================================
def prepare_datasets(df):
    print("[3/5] Phân chia Train/Test theo thời gian...")
    
    feature_cols = [
        "temperature_2m", "relative_humidity_2m", "surface_pressure", "wind_speed_10m",
        "pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide",
        "hour_sin", "hour_cos", "month_sin", "month_cos",
        "pm2_5_lag_1", "pm2_5_lag_3", "pm2_5_lag_6", "pm2_5_lag_24"
    ]
    
    X = df[feature_cols].values
    y = df["target_pm2_5"].values

    # Giữ nguyên thứ tự thời gian: 80% Train, 20% Test
    train_size = int(len(df) * 0.8)
    X_train, X_test = X[:train_size], X[train_size:]
    y_train, y_test = y[:train_size], y[train_size:]

    # Chuẩn hóa dữ liệu về khoảng [0, 1] cho Neural Network
    scaler_X = MinMaxScaler()
    X_train_scaled = scaler_X.fit_transform(X_train)
    X_test_scaled = scaler_X.transform(X_test)

    scaler_y = MinMaxScaler()
    y_train_scaled = scaler_y.fit_transform(y_train.reshape(-1, 1)).ravel()
    y_test_scaled = scaler_y.transform(y_test.reshape(-1, 1)).ravel()

    # Lưu scaler để backend sử dụng khi suy luận
    os.makedirs("models", exist_ok=True)
    joblib.dump(scaler_X, "models/scaler_X.pkl")
    joblib.dump(scaler_y, "models/scaler_y.pkl")
    joblib.dump(feature_cols, "models/feature_cols.pkl")

    return X_train, X_test, y_train, y_test, X_train_scaled, X_test_scaled, y_train_scaled, y_test_scaled, scaler_y, feature_cols

# ==============================================================================
# BƯỚC 4: HUẤN LUYỆN MÔ HÌNH (XGBOOST VS LSTM)
# ==============================================================================
def train_xgboost(X_train, y_train, X_test, y_test):
    print("\n--- [4.1] Đang huấn luyện XGBoost Regressor ---")
    model_xgb = xgb.XGBRegressor(
        n_estimators=300,
        learning_rate=0.03,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )
    model_xgb.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)
    
    # Dự đoán
    y_pred_xgb = model_xgb.predict(X_test)
    model_xgb.save_model("models/xgboost_pm25.json")
    return model_xgb, y_pred_xgb

def train_lstm(X_train_scaled, y_train_scaled, X_test_scaled, y_test_scaled, scaler_y):
    print("\n--- [4.2] Đang huấn luyện LSTM Deep Learning ---")
    
    # Reshape input sang dạng 3D cho LSTM: (samples, time_steps, features) với time_steps = 1
    X_train_lstm = X_train_scaled.reshape((X_train_scaled.shape[0], 1, X_train_scaled.shape[1]))
    X_test_lstm = X_test_scaled.reshape((X_test_scaled.shape[0], 1, X_test_scaled.shape[1]))

    model_lstm = Sequential([
        LSTM(64, return_sequences=True, input_shape=(1, X_train_scaled.shape[1])),
        Dropout(0.2),
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        Dense(16, activation='relu'),
        Dense(1)
    ])

    model_lstm.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), loss='mse')
    
    early_stop = EarlyStopping(monitor='val_loss', patience=7, restore_best_weights=True)
    
    model_lstm.fit(
        X_train_lstm, y_train_scaled,
        validation_data=(X_test_lstm, y_test_scaled),
        epochs=30,
        batch_size=64,
        callbacks=[early_stop],
        verbose=1
    )

    # Dự đoán và biến đổi ngược về thang đo thực tế
    y_pred_scaled = model_lstm.predict(X_test_lstm)
    y_pred_lstm = scaler_y.inverse_transform(y_pred_scaled).ravel()
    
    model_lstm.save("models/lstm_pm25.keras")
    return model_lstm, y_pred_lstm

# ==============================================================================
# BƯỚC 5: ĐÁNH GIÁ, SO SÁNH KẾT QUẢ & VẼ BIỂU ĐỒ (DÙNG CHO BÁO CÁO ĐỒ ÁN)
# ==============================================================================
def evaluate_and_plot(y_test, y_pred_xgb, y_pred_lstm):
    print("\n[5/5] ĐÁNH GIÁ HIỆU NĂNG MÔ HÌNH (DÙNG CHO BẢNG SỐ LIỆU BÁO CÁO):")
    
    metrics = {
        "Mô hình": ["XGBoost", "LSTM (Deep Learning)"],
        "MAE (ug/m3)": [
            round(mean_absolute_error(y_test, y_pred_xgb), 2),
            round(mean_absolute_error(y_test, y_pred_lstm), 2)
        ],
        "RMSE (ug/m3)": [
            round(np.sqrt(mean_squared_error(y_test, y_pred_xgb)), 2),
            round(np.sqrt(mean_squared_error(y_test, y_pred_lstm)), 2)
        ],
        "R2 Score": [
            round(r2_score(y_test, y_pred_xgb), 3),
            round(r2_score(y_test, y_pred_lstm), 3)
        ]
    }
    df_metrics = pd.DataFrame(metrics)
    print(df_metrics.to_string(index=False))

    # Vẽ biểu đồ so sánh thực tế vs dự đoán cho 150 giờ gần nhất
    sample_len = 150
    plt.figure(figsize=(14, 6))
    plt.plot(y_test[-sample_len:], label="Thực tế (Actual PM2.5)", color="black", linewidth=2)
    plt.plot(y_pred_xgb[-sample_len:], label="XGBoost Dự đoán", color="blue", linestyle="--", alpha=0.8)
    plt.plot(y_pred_lstm[-sample_len:], label="LSTM Dự đoán", color="red", linestyle="-.", alpha=0.8)
    plt.title("So Sánh Giá Trị PM2.5 Thực Tế vs Dự Đoán Của Mô Hình (Test Set)", fontsize=14)
    plt.xlabel("Số Giờ (Hours)", fontsize=12)
    plt.ylabel("Nồng độ PM2.5 (µg/m³)", fontsize=12)
    plt.legend(fontsize=12)
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.savefig("models/evaluation_chart.png", dpi=300, bbox_inches="tight")
    print("-> Biểu đồ so sánh đã được lưu tại: models/evaluation_chart.png")

if __name__ == "__main__":
    df_raw = fetch_training_data()
    df_processed = preprocess_features(df_raw)
    X_train, X_test, y_train, y_test, X_train_s, X_test_s, y_train_s, y_test_s, scaler_y, features = prepare_datasets(df_processed)
    
    # Train cả 2 mô hình
    _, y_pred_xgb = train_xgboost(X_train, y_train, X_test, y_test)
    _, y_pred_lstm = train_lstm(X_train_s, y_train_s, X_test_s, y_test_s, scaler_y)
    
    # Đánh giá & xuất bảng kết quả
    evaluate_and_plot(y_test, y_pred_xgb, y_pred_lstm)
    print("\n✅ HOÀN TẤT PIPELINE AI THÀNH CÔNG!")
