# ---필요한 모듈 임포트 ---
from flask import jsonify, request
from app import app, socketio # __init__.py에서 생성한 전역 app과 socketio 객체를 임포트
from app.db import get_connection, close_connection # DB 연결/종료 함수 임포트
from datetime import datetime
import traceback # 에러 로그 추적을 위해

# === [GET] /api/sun-data/latest ===
# 기능: DB에 저장된 가장 최신의 태양광 데이터를 조회
@app.route('/api/data/latest', methods=['GET'])
def get_latest_status():
    conn, cursor = None, None # conn, cursor 변수 초기화
    try:
        # 1. DB 연결 (app/db.py 사용)
        conn, cursor = get_connection()
        if conn is None:
            return jsonify({'message': 'DB 연결 실패'}), 500

        # 2. SQL 쿼리 실행 (sun_data 테이블에서 시간순(desc)으로 정렬 후 1개만 가져오기)
        sql = "SELECT * FROM sun_data ORDER BY timestamp DESC LIMIT 1"
        cursor.execute(sql)
        data = cursor.fetchone() # 1개의 데이터만 조회

        # 3. 결과 반환
        if data:
            # DB에서 가져온 데이터를 JSON으로 반환
            return jsonify(data)
        return jsonify({'message': 'No data found'}), 404

    except Exception as e:
        # 4. 에러 처리
        print(f"Error in get_latest_status: {e}")
        traceback.print_exc() # 터미널에 상세한 에러 로그 출력
        return jsonify({'message': 'Internal Server Error'}), 500
    
    finally:
        # 5. DB 연결 종료 (성공하든 실패하든 항상 실행)
        close_connection(conn, cursor)

# --- [POST] /api/data ---
# 기능: 아두이노(WiFi 모듈)로부터 센서 데이터를 받아 DB에 저장 (주소 수정)
@app.route('/api/data', methods=['POST'])
def receive_sun_data():
    """
    아두이노로부터 JSON 데이터를 받아 'sun_data' 테이블에 저장합니다.
    성공 시, 웹소켓을 통해 웹 프론트엔드에 실시간 데이터를 전송합니다.
    """
    # 클라이언트(아두이노)가 보낸 JSON 데이터를 딕셔너리로 받음
    data = request.get_json() 
    conn, cursor = None, None

    try:
        # JSON에서 각 데이터 추출
        soc = data.get('soc') # 현재 배터리 잔량
        solar_w = data.get('solar_w') # 페널 전력 생산량
        lux = data.get('lux') # 조도값
        
        # (선택) 데이터 유효성 검사
        if soc is None or solar_w is None or lux is None:
            return jsonify({'message': '필수 데이터가 누락되었습니다.'}), 400

        # 서버 현재 시간을 timestamp로 사용
        now = datetime.now()

        # DB 연결
        conn, cursor = get_connection()
        if conn is None:
            return jsonify({'message': 'DB 연결 실패'}), 500

        # SQL 쿼리: sun_data 테이블에 데이터 삽입(INSERT) (테이블명 수정)
        sql = """
            INSERT INTO sun_data (soc,solar_w, lux, timestamp)
            VALUES (%s, %s, %s, %s)
        """
        
        cursor.execute(sql, (soc, solar_w, lux, now))
        
        # [중요] INSERT, UPDATE, DELETE 쿼리는 반드시 commit()을 해야
        # 실제 DB에 반영됩니다.
        conn.commit() 
    
        # [SocketIO] 데이터 저장이 성공하면, 
        # 'sun_data' 이벤트를 웹 프론트엔드(웹소켓으로 연결된)로 쏴줌 (이벤트명 수정)
        socketio.emit('new_sun_data', {
            'timestamp': now.isoformat(), # 날짜/시간 객체는 ISO 문자열로 변환
            'soc': soc,
            'solar_w': solar_w,
            'lux': lux       }, namespace='/') # '/' 네임스페이스(기본 채널)로 브로드캐스트
    
        # 성공 응답 반환
        return jsonify({'message': 'Data received'}), 201 # 201: Created

    except Exception as e:
        print(f"receive_sensor_data 에러: {e}")
        # DB 저장 중 에러가 나면 롤백 (선택 사항이지만 권장)
        if conn:
            conn.rollback() 
        return jsonify({'message': '서버 오류 발생'}), 500
    
    finally:
        # DB 연결 종료
        close_connection(conn, cursor)

# === [POST] /api/control/relay  ===
# 기능: 웹(프론트엔드)에서 A, B, C, D 릴레이 상태를 한꺼번에 제어
@app.route('/api/control/relay', methods=['POST'])
def control_relay():
    conn, cursor = None, None
    data = request.get_json() # 웹에서 보낸 JSON 수신 (예: {"A": true, "B": false, ...})

    # 1. 데이터 유효성 검사
    if not data or 'A' not in data or 'B' not in data or 'C' not in data or 'D' not in data:
        return jsonify({'message': 'Bad Request: Missing relay status for A, B, C, or D'}), 400

    try:
        # 2. DB 연결
        conn, cursor = get_connection()
        if conn is None:
            return jsonify({'message': 'DB 연결 실패'}), 500
            
        # [중요] 트랜잭션 시작: 4개의 릴레이 상태를 '전부' 성공하거나 '전부' 실패시킴
        conn.start_transaction()
        
        # 3. SQL 쿼리 실행 (A, B, C, D 상태를 각각 UPDATE)
        relays_to_update = []
        for relay_name, state_boolean in data.items():
            # True -> 'on', False -> 'off'
            status_string = 'on' if state_boolean else 'off'
            relays_to_update.append((status_string, relay_name)) # (값, 조건) 튜플
        
        # 4개의 UPDATE를 한 번에 실행 (executemany)
        sql = "UPDATE relay_status SET status = %s WHERE relay_name = %s"
        cursor.executemany(sql, relays_to_update)
        
        conn.commit() # [중요] 4개 UPDATE를 트랜잭션으로 최종 반영

        # 4. [SocketIO] 실시간 상태 전송
        # DB 업데이트 성공 시, 웹(프론트엔드)에 'relay_status_update' 이벤트로
        # 방금 변경된 상태(JSON)를 실시간 전송
        socketio.emit('relay_status_update', data, namespace='/')
        
        # 5. [TODO] 아두이노에게 제어 명령 전송
        # (이 부분은 아두이노가 HTTP GET으로 폴링하거나, MQTT 등을 사용해야 함)
        # 예: send_command_to_arduino(data)

        # 6. 웹에게 성공 응답 반환
        return jsonify({'message': 'success'})

    except Exception as e:
        # 7. 에러 처리
        print(f"Error in control_relay: {e}")
        traceback.print_exc()
        if conn:
            conn.rollback() # [중요] 4개 UPDATE 중 하나라도 실패하면 모두 되돌림
        return jsonify({'message': 'Internal Server Error'}), 500
    
    finally:
        # 8. DB 연결 종료
        close_connection(conn, cursor)

# === [GET] /api/relay/status ===
# 기능: 웹(프론트엔드)이 페이지에 처음 접속할 때,
#       DB에 저장된 릴레이의 '현재' 상태를 조회
@app.route('/api/relay/status', methods=['GET'])
def get_all_relay_status():
    conn, cursor = None, None
    try:
        # 1. DB 연결
        conn, cursor = get_connection()
        if conn is None:
            return jsonify({'message': 'DB 연결 실패'}), 500

        # 2. SQL 쿼리 실행 (A, B, C, D 모든 릴레이 정보 조회)
        sql = "SELECT relay_name, status FROM relay_status WHERE relay_name IN ('A', 'B', 'C', 'D')"
        cursor.execute(sql)
        relays = cursor.fetchall() # (결과 예: [{'relay_name': 'A', 'status': 'on'}, ...])

        # 3. 결과 가공 (JSON 형식 변경)
        # 님의 요청사항: {'A': True, 'B': False, 'C': True, 'D': False}
        status_map = {}
        for r in relays:
            # 'on'이면 True, 'off'면 False
            status_map[r['relay_name']] = (r['status'] == 'on')

        # 4. JSON으로 반환
        return jsonify(status_map)

    except Exception as e:
        # 5. 에러 처리
        print(f"Error in get_all_relay_status: {e}")
        traceback.print_exc()
        return jsonify({'message': 'Internal Server Error'}), 500
    
    finally:
        # 6. DB 연결 종료
        close_connection(conn, cursor)