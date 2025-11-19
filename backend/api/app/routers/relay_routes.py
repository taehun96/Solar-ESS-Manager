# ---필요한 모듈 임포트 ---
from flask import Blueprint, jsonify, request
from app import socketio # __init__.py에서 생성한 socketio 객체를 임포트
from app.db import get_connection, close_connection # DB 연결/종료 함수 임포트
import traceback # 에러 로그 추적을 위해

# Blueprint 생성
relay_bp = Blueprint('relay', __name__)

# === [POST] /api/control/relay  ===
# 기능: 웹(프론트엔드)에서 A, B, C, D 릴레이 상태를 한꺼번에 제어
@relay_bp.route('/api/relay/control', methods=['POST'])
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
@relay_bp.route('/api/relay/status', methods=['GET'])
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
