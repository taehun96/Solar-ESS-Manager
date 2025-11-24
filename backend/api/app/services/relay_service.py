from app.db import get_connection, close_connection
import traceback
import requests

# DB에 릴레이 상태 저장 함수
def update_relay_status_in_db(data):
    """
    릴레이 상태를 DB에 업데이트
    """
    # DB에서 데이터 조회
    conn, cursor = None, None

    try:
        # DB 연결
        conn, cursor = get_connection()
        if conn is None:
            print("릴레이 상태 저장 : DB 연결 실패")
            return False, "DB 연결 실패", 503

        # 상태 저장할 빈 리스트 생성
        relays_to_update = []
        for relay_ch, ch_status in data.items():
            # True -> "on", False -> "off"
            status_string = "on" if ch_status else "off"
            relays_to_update.append((status_string, relay_ch))
        print(f"릴레이 상태 저장 : 업데이트할 데이터 - {relays_to_update}")

        # DB UPDATE
        sql = "UPDATE relay_status SET status = %s WHERE relay_name = %s"
        cursor.executemany(sql, relays_to_update)
        conn.commit()
        print("릴레이 상태 저장 : 커밋 완료")
        return True, "DB 저장 성공", 201

    except Exception as e:
        print(f"릴레이 상태 저장 : 오류 - {e}")
        traceback.print_exc()
        if conn:
            conn.rollback() # 실패하면 롤백
        return False, "서버 오류 발생", 500
    
    finally:
        close_connection(conn, cursor)

# DB에 거래 내역 저장
def insert_trade_history(buyer_id, amount):
    """
    거래 내역을 DB에 저장
    """
    # DB에서 데이터 조회
    conn, cursor = None, None

    try:
        # DB 연결
        conn, cursor = get_connection()
        if conn is None:
            print("거래 내역 저장 : DB 연결 실패")
            return False, "DB 연결 실패", 503

        # DB INSERT
        sql = "INSERT INTO trade_history (buyer_id, amount) VALUES (%s, %s)"
        cursor.execute(sql, (buyer_id, amount))
        conn.commit()
        print("거래 내역 저장 : 커밋 완료")
        return True, "DB 저장 성공", 201

    except Exception as e:
        print(f"거래 내역 저장 : 오류 - {e}")
        traceback.print_exc()
        if conn:
            conn.rollback() # 실패하면 롤백
        return False, "서버 오류 발생", 500

    finally:
        close_connection(conn, cursor)

# 거래 내역 조회
def get_trade_history(user_id=None, start_date=None, end_date=None, date=None):
    """
    거래 내역 조회 (필터 옵션)
    """
    conn, cursor = None, None
    try:
        conn, cursor = get_connection()
        if conn is None:
            print("거래 내역 조회 : DB 연결 실패")
            return None, "거래 내역 조회 : DB 연결 실패", 503
        
        sql = "SELECT * FROM trade_history WHERE 1=1"
        params = []

        # 쿼리 파라미터 조건 추가
        if user_id:
            sql += " AND buyer_id = %s"
            params.append(user_id)
        if start_date:
            sql += " AND timestamp >= %s"
            params.append(start_date)
        if end_date:
            sql += " AND DATE(timestamp) <= %s"
            params.append(end_date)
        if date:
            sql += " AND DATE(timestamp) = %s"
            params.append(date)

        sql += " ORDER BY timestamp DESC"

        cursor.execute(sql, params)
        result = cursor.fetchall()

        return result, None, 200

    except Exception as e:
        print(f"거래 내역 조회 : 오류 - {e}")
        traceback.print_exc()
        return None, "거래 내역 조회 : 서버 오류 발생", 500
    
    finally:
        close_connection(conn, cursor)
    
# 현재 릴레이 상태 조회
def get_current_relay_status():
    """
    현재 릴레이 상태 조회
    """
    conn, cursor = None, None
    try:
        conn, cursor = get_connection()
        if conn is None:
            print("현재 상태 조회 : DB 연결 실패")
            return None, "DB 연결 실패", 503

        sql = "SELECT relay_name, status FROM relay_status WHERE relay_name IN ('A','B','C','D')"
        cursor.execute(sql)
        current_status = {row['relay_name']: row['status'] for row in cursor.fetchall()}

        return current_status, None, 200

    except Exception as e:
        print(f"현재 상태 조회 : 오류 - {e}")
        traceback.print_exc()
        return None, "서버 오류 발생", 500

    finally:
        close_connection(conn, cursor)

# 아두이노에 릴레이 제어 전송
def send_to_arduino(data, arduino_url):
    """
    아두이노에 릴레이 제어 전송
    """
    try:
        if not arduino_url:
            print("아두이노 제어 : URL 미설정")
            return False, "아두이노 URL 미설정", 503

        response = requests.post(arduino_url, json=data, timeout=5)

        if response.status_code != 200:
            print(f"아두이노 제어 : 응답 오류 (status: {response.status_code})")
            return False, "아두이노 응답 오류", 502

    except requests.exceptions.Timeout:
        print("아두이노 제어 : 응답 시간 초과")
        return False, "아두이노 응답 시간 초과", 504

    except requests.exceptions.ConnectionError:
        print("아두이노 제어 : 연결 실패")
        return False, "아두이노 연결 실패", 503

    except Exception as e:
        print(f"아두이노 제어 : 통신 오류 - {e}")
        return False, "아두이노 통신 오류", 500

    print("아두이노 제어 : 성공")
    return True, "success", 200

# 현재 사용중인 채널 확인
def get_active_relay_list():
    """
    활성화된 릴레이 채널 반환
    """
    current_status, message, status_code = get_current_relay_status()

    if current_status is None:
        return None, message, status_code
    
    # 활성화 채널만 필터링
    active_list = [name for name, status in current_status.items() if status == "on"]

    print(f"현재 사용중인 채널 : {active_list}")
    return active_list, None, 200

