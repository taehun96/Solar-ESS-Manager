from app.db import get_connection, close_connection
import traceback
from datetime import datetime

# 최신 센서 데이터 조회
def get_latest_sensor_data():
    """
    최신 센서 데이터 조회
    """
    # DB에서 데이터 조회
    conn, cursor = None, None
    try:
        # DB 연결
        conn, cursor = get_connection()
        if conn is None:
            print("최신 센서 데이터 조회 : DB 연결 실패")
            return None, "최신 센서 데이터 조회 : DB 연결 실패", 503
        
        # 데이터 조회
        sql = "SELECT * FROM sun_data ORDER BY timestamp DESC LIMIT 1"
        cursor.execute(sql)
        sensor_data = cursor.fetchone()

        if not sensor_data:
            print("최신 센서 데이터 조회 : 데이터가 존재하지 않습니다.")
            return None, "최신 센서 데이터 조회 : 데이터가 존재하지 않습니다.", 404

        return sensor_data, None, 200

    except Exception as e:
        print(f"최신 센서 데이터 조회 : 오류 - {e}")
        traceback.print_exc()
        return None, "최신 센서 데이터 조회 : 서버 오류 발생", 500

    finally:
        close_connection(conn, cursor)

# 센서 데이터 DB에 저장
def save_sensor_data(soc, solar_w, lux):
    """
    센서 데이터 DB에 저장
    """
    conn, cursor = None, None
    try:
        conn, cursor = get_connection()
        if conn is None:
            print("센서 데이터 저장 : DB 연결 실패")
            return False, "센서 데이터 저장 : DB 연결 실패", 503

        # 서버 현재 시간을 timestamp로 사용
        now = datetime.now()

        # 데이터 저장
        sql = "INSERT INTO sun_data (soc, solar_w, lux, timestamp) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, (soc, solar_w, lux, now))
        conn.commit()

        print("센서 데이터 저장 : 성공")
        return True, "센서 데이터 저장 : DB 저장 성공", 201
    
    except Exception as e:
        print(f"센서 데이터 저장 : 오류 - {e}")
        traceback.print_exc()
        if conn:
            conn.rollback()
        return False, "센서 데이터 저장 : 서버 오류 발생", 500

    finally:
        close_connection(conn, cursor)