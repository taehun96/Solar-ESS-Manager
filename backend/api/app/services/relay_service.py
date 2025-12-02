from app.services.common_service import db_transaction, handle_errors, get_buyer_id_from_channel, CHANNEL_CONFIG
import requests

# DB에 릴레이 상태 저장 함수
@handle_errors("DB Relay")
def update_relay_status_in_db(data):
    """
    릴레이 상태를 DB에 업데이트
    """
    with db_transaction() as (_, cursor):
        # 상태 저장할 빈 리스트 생성
        relays_to_update = []
        for relay_ch, ch_status in data.items():
            # True -> "on", False -> "off"
            status_string = "on" if ch_status else "off"
            relays_to_update.append((status_string, relay_ch))
        print(f"\n릴레이 상태 저장 : 업데이트할 데이터 - {relays_to_update}")

        # DB UPDATE
        sql = "UPDATE relay_status SET status = %s WHERE relay_name = %s"
        cursor.executemany(sql, relays_to_update)
        print("\n릴레이 상태 저장 : 저장 완료")
        return True, None, 201

# DB에 거래 내역 저장
@handle_errors("DB Trade")
def insert_trade_history(buyer_id, amount):
    """
    거래 내역을 DB에 저장
    """
    with db_transaction() as (_, cursor):
        # DB INSERT
        sql = "INSERT INTO trade_history (buyer_id, amount) VALUES (%s, %s)"
        cursor.execute(sql, (buyer_id, amount))
        print("\n거래 내역 저장 : 커밋 완료")
        return True, None, 201

# 거래 내역 조회
@handle_errors("DB Trade")
def get_trade_history(user_id=None, start_date=None, end_date=None, date=None):
    """
    거래 내역 조회 (필터 옵션)
    """
    with db_transaction() as (_, cursor):
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

# 현재 릴레이 상태 조회
@handle_errors("DB Relay")
def get_current_relay_status():
    """
    현재 릴레이 상태 조회
    """
    with db_transaction() as (_, cursor):
        sql = "SELECT relay_name, status FROM relay_status WHERE relay_name IN ('A','B','C','D')"
        cursor.execute(sql)
        current_status = {row['relay_name']: row['status'] for row in cursor.fetchall()}

        print("\n릴레이 상태 조회 : 조회 성공")
        return current_status, None, 200

# 아두이노에 릴레이 제어 전송
def send_to_arduino(data, arduino_url):
    """
    아두이노에 릴레이 제어 전송
    """
    try:
        if not arduino_url:
            print("\n아두이노 제어 : URL 미설정")
            return False, "Arduino : Arduino URL not configured", 503

        response = requests.post(arduino_url, json=data, timeout=5)

        if response.status_code != 200:
            print(f"\n아두이노 제어 : 응답 오류 (status: {response.status_code})")
            return False, "Arduino : Arduino response error", 502

    except requests.exceptions.Timeout:
        print("\n아두이노 제어 : 응답 시간 초과")
        return False, "Arduino : Arduino timeout", 504

    except requests.exceptions.ConnectionError:
        print("\n아두이노 제어 : 연결 실패")
        return False, "Arduino : Arduino connection failed", 503

    except Exception as e:
        print(f"\n아두이노 제어 : 통신 오류 - {e}")
        return False, "Arduino : Failed to process request", 500

    print("\n아두이노 제어 : 성공")
    return True, None, 200

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

    print(f"\n현재 사용중인 채널 : {active_list}")
    return active_list, None, 200

# 서버 실행 시 자동으로 릴레이 off
def reset_relay():
    print("\n릴레이 제어 : 릴레이 초기화 시작")
    data = {
        "A": False,
        "B": False,
        "C": False,
        "D": False
    }
    # DB 저장 함수 호출
    success, message, status_code = update_relay_status_in_db(data)
    if success:
        print("\n릴레이 제어 : 릴레이 초기화 완료\n")
    return success, message, status_code

# 거래 내역 DB에 저장
def save_relay_state_changes(data, current_status):
    """
    릴레이 변경 사항(OFF -> ON)을 DB에 저장
    """
    for channel, new_state in data.items():
        old_state = current_status.get(channel, "off")
        if old_state == "off" and new_state == True:
            # 채널명을 buyer_id로 변환
            buyer_id = get_buyer_id_from_channel(channel)
            # 채널별 소비전력 조회
            amount = CHANNEL_CONFIG.get(channel)
            if buyer_id in [1,2,3,4] and amount >= 0:
                # DB에 거래 내역 저장
                success, message, status_code = insert_trade_history(buyer_id, amount)
                if not success:
                    print(f"저장 실패 : ({channel}) / {message}")
                    return success, message, status_code
                else:
                    print(f"성공 내역 : ({channel}) / {amount}W")
            else:
                print("\n릴레이 제어 : 필수 데이터 입력값 오류")
                return False, "Invalid input values", 400
    print("\n릴레이 제어 : 저장 완료")
    return True, "Relay state updated successfully", 201
