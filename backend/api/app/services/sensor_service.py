from app.services.common_service import db_transaction, handle_errors
from datetime import datetime

# 최신 센서 데이터 조회
@handle_errors("Sensor Data")
def get_latest_sensor_data():
    """
    최신 센서 데이터 조회
    """
    with db_transaction() as (_, cursor):
        # 데이터 조회
        sql = "SELECT * FROM sun_data_realtime ORDER BY timestamp DESC LIMIT 1"
        cursor.execute(sql)
        sensor_data = cursor.fetchone()

        if not sensor_data:
            print("\n최신 센서 데이터 조회 : 데이터가 존재하지 않습니다.")
            return None, "Sensor Data : Data not found", 404

        print("\n최신 센서 데이터 조회 : 조회 성공")
        return sensor_data, None, 200
        
# 센서 데이터 DB에 저장
@handle_errors("Sensor Data")
def save_sensor_data(soc, solar_w, lux):
    """
    센서 데이터 DB에 저장
    """
    with db_transaction() as (_, cursor):
        # 서버 현재 시간을 timestamp로 사용
        now = datetime.now()

        # 데이터 저장
        sql = "INSERT INTO sun_data_realtime (soc, solar_w, lux, timestamp) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, (soc, solar_w, lux, now))

        print("\n아두이노 데이터 수신 : 저장 성공")
        return True, None, 201

# 일정 시간 이후 데이터를 1시간 평균으로 저장
@handle_errors("Sensor Data")
def aggregate_old_data():
    """
    일정 시간 이후 데이터를 1시간 평균으로 집계하여 저장
    """
    with db_transaction() as (_, cursor):
        # 시간 지정
        hours = 24

        # 데이터 저장
        sql_select = """
            INSERT INTO sun_data_hourly (date, hour, avg_soc, avg_solar_w, avg_lux)
            SELECT
                DATE(timestamp) as date,
                HOUR(timestamp) as hour,
                AVG(soc) as avg_soc,
                AVG(solar_w) as avg_solar_w,
                AVG(lux) as avg_lux
            FROM sun_data_realtime
            WHERE timestamp <= DATE_FORMAT(NOW() - INTERVAL %s HOUR, '%Y-%m-%d %H:00:00')
            GROUP BY DATE(timestamp), HOUR(timestamp)
            ON DUPLICATE KEY UPDATE
                avg_soc = VALUES(avg_soc),
                avg_solar_w = VALUES(avg_solar_w),
                avg_lux = VALUES(avg_lux)
        """

        # 저장한 원본 데이터 제거
        sql_delete = """
            DELETE FROM sun_data_realtime
            WHERE timestamp <= DATE_FORMAT(NOW() - INTERVAL %s HOUR, '%Y-%m-%d %H:00:00')
        """
        cursor.execute(sql_select, (hours-1,))
        cursor.execute(sql_delete, (hours-1,))

        print("\n데이터 집계 : 성공")
        return True, None, 201