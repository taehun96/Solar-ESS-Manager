# 모델 예측 API
from app.db import get_connection, close_connection
from flask import Blueprint, jsonify
import traceback, pickle
import pandas as pd
from pathlib import Path

# lux -> 일사량 변환
def lux_to_insolation(lux):
    wm2 = lux * 0.0079
    mj = wm2 * 0.0036
    return mj

# 모델 불러오기
MODEL_PATH = Path(__file__).parent.parent.parent.parent / "models" / "rf_best_model.pkl"

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

# Blueprint 생성
energy_bp = Blueprint("energy", __name__)

# 모델 예측 API
@energy_bp.route("/api/energy/predict", methods=["post"])
def predict_generation():
    """
    1h, 2h, 3h 뒤 발전량 예측
    """
    # DB에서 데이터 조회
    conn, cursor = None, None
    try:
        # DB 연결
        conn, cursor = get_connection()
        if conn is None:
            print("모델 예측 : DB 연결 실패")
            return jsonify({"message": "DB 연결 실패"}), 503
        
        sql = """
            SELECT
                YEAR(timestamp) as year,
                MONTH(timestamp) as month,
                DAY(timestamp) as day,
                HOUR(timestamp) as time,
                solar_w as generation,
                LAG(solar_w, 1) OVER (ORDER BY timestamp) as prev_generation,
                LAG(solar_w, 24) OVER (ORDER BY timestamp) as yesterday_generation,
                lux
            FROM sun_data
            ORDER BY timestamp DESC
            LIMIT 1
        """
        cursor.execute(sql)
        latest_data = cursor.fetchone()

        if not latest_data:
            print("모델 예측 : 데이터가 존재하지 않습니다.")
            return jsonify({"message": "데이터가 존재하지 않습니다."}), 404

        # 일사량 데이터로 변환
        latest_data["insolation"] = lux_to_insolation(latest_data["lux"])
        del latest_data["lux"]  # lux 제거

        # DataFrame으로 변환
        X = pd.DataFrame([latest_data])

        # 모델 예측
        y = model.predict(X)

        # 결과 출력 딕셔너리 생성
        # y shape : (1, 3) - 첫 번째 차원은 샘플, 두 번째는 1h/2h/3h 예측
        result = {
            "1h": round(float(y[0][0]), 2),
            "2h": round(float(y[0][1]), 2),
            "3h": round(float(y[0][2]), 2)
        }

        # 결과 반환
        return jsonify(result), 200

    except Exception as e:
        print(f"모델 예측 서버 오류 : {e}")
        traceback.print_exc()
        return jsonify({"message": "서버 오류 발생"}), 500
    
    finally:
        close_connection(conn, cursor)