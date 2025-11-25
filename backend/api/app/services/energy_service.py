from app.db import get_connection, close_connection
import traceback, pickle
import pandas as pd
from pathlib import Path

# 모델 불러오기
MODEL_PATH = Path(__file__).parent.parent.parent.parent / "models" / "rf_best_model.pkl"

# 모델 확인
if MODEL_PATH.exists():
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    print("모델 로드 성공")
else:
    model = None
    print("모델 파일 없음")

# lux -> 일사량 변환
def lux_to_insolation(lux):
    wm2 = lux * 0.0079
    mj = wm2 * 0.0036
    return mj

# 모델 예측용 데이터 조회
def get_latest_sensor_data_for_model():
    """
    DB에서 모델 예측용 최신 태양광 데이터 조회
    """
    # DB에서 데이터 조회
    conn, cursor = None, None
    try:
        # DB 연결
        conn, cursor = get_connection()
        if conn is None:
            print("모델 예측 : DB 연결 실패")
            return None, "모델 예측 : DB 연결 실패", 503

        # 현재 데이터(year, month, day, time, generation, lux)
        sql_current = """
            SELECT
                YEAR(timestamp) as year,
                MONTH(timestamp) as month,
                DAY(timestamp) as day,
                HOUR(timestamp) as time,
                solar_w as generation,
                lux
            FROM sun_data_realtime
            ORDER BY timestamp DESC
            LIMIT 1
        """
        cursor.execute(sql_current)
        current_data = cursor.fetchone()

        # 1시간 전 데이터(prev_generation)
        sql_prev = """
            SELECT solar_w
            FROM sun_data_realtime
            WHERE timestamp <= NOW() - INTERVAL 1 HOUR
            ORDER BY timestamp DESC
            LIMIT 1
        """
        cursor.execute(sql_prev)
        prev_data = cursor.fetchone()

        # 14시간 전 데이터(yesterday_generation)
        sql_yesterday = """
            SELECT avg_solar_w
            FROM sun_data_hourly
            WHERE date = CURDATE() - INTERVAL 1 DAY
            AND hour = HOUR(NOW())
            LIMIT 1
        """
        cursor.execute(sql_yesterday)
        yesterday_data = cursor.fetchone()

        # 데이터 확인
        if not current_data or not prev_data or not yesterday_data:
            print("모델 예측 : 데이터가 존재하지 않습니다.")
            return None, "모델 예측 : 데이터가 존재하지 않습니다.", 404
        
        # 데이터 결합
        current_data["prev_generation"] = prev_data["solar_w"]
        current_data["yesterday_generation"] = yesterday_data["avg_solar_w"]

        return current_data, None, 200

    except Exception as e:
        print(f"모델 예측 서버 오류 : {e}")
        traceback.print_exc()
        return None, "모델 예측 : 서버 오류 발생", 500
    
    finally:
        close_connection(conn, cursor)

# 예측 모델 실행
def predict_solar_generation(data):
    """
    발전량 예측 모델 실행
    """
    try:
        # 일사량 데이터로 변환
        data["insolation"] = lux_to_insolation(data["lux"])
        del data["lux"]

        # DataFrame으로 변환
        X = pd.DataFrame([data])

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
        print(f"모델 예측 : 성공 - {result}")
        return result, None, 200
    
    except Exception as e:
        print(f"모델 예측 : 오류 - {e}")
        traceback.print_exc()
        return None, "모델 예측 : 실패", 500