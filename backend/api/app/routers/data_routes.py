# ---필요한 모듈 임포트 ---
from flask import Blueprint, jsonify, request
from app import socketio # __init__.py에서 생성한 socketio 객체를 임포트
from app.db import get_connection, close_connection # DB 연결/종료 함수 임포트
from datetime import datetime
import traceback # 에러 로그 추적을 위해

# Blueprint 생성
data_bp = Blueprint('data', __name__)

# === [GET] /api/sun-data/latest ===
# 기능: DB에 저장된 가장 최신의 태양광 데이터를 조회
@data_bp.route('/api/data/latest', methods=['GET'])
def get_latest_status():
    conn, cursor = None, None # conn, cursor 변수 초기화
    try:
        # 1. DB 연결 (app/db.py 사용)
        conn, cursor = get_connection()
        if conn is None:
            return jsonify({'message': 'DB 연결 실패'}), 503

        # 2. SQL 쿼리 실행 (sun_data 테이블에서 시간순(desc)으로 정렬 후 1개만 가져오기)
        sql = "SELECT * FROM sun_data ORDER BY timestamp DESC LIMIT 1"
        cursor.execute(sql)
        data = cursor.fetchone() # 1개의 데이터만 조회

        # 3. 결과 반환
        if data:
            # DB에서 가져온 데이터를 JSON으로 반환
            return jsonify(data)
        return jsonify({'message': '데이터가 존재하지 않습니다.'}), 404

    except Exception as e:
        # 4. 에러 처리
        print(f"Error in get_latest_status: {e}")
        traceback.print_exc() # 터미널에 상세한 에러 로그 출력
        return jsonify({'message': '서버 오류 발생'}), 500

    finally:
        # 5. DB 연결 종료 (성공하든 실패하든 항상 실행)
        close_connection(conn, cursor)

# --- [POST] /api/data ---
# 기능: 아두이노(WiFi 모듈)로부터 센서 데이터를 받아 DB에 저장 (주소 수정)
@data_bp.route('/api/data/solar', methods=['POST'])
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
            INSERT INTO sun_data (name, soc, solar_w, lux, timestamp)
            VALUES (%s, %s, %s, %s, %s)
        """

        cursor.execute(sql, ('user1', soc, solar_w, lux, now))

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

# 판매 내역 조회
#TODO DB에서 status, seller_id 지우기
@data_bp.route("/api/data/history", methods=["GET"])
def get_trade_history():
    """
    구매채널 및 전력량, 구매 시간 등을 반환
    """
    # DB에서 데이터 조회
    conn, cursor = None, None
    try:
        # DB 연결
        conn, cursor = get_connection()
        if conn is None:
            return jsonify({"message": "DB 연결 실패"}), 503
        
        # 쿼리 파라미터 받아오기
        user_id = request.args.get("user_id")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        date = request.args.get("date")
        
        # 기본 SQL
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

        return jsonify(result), 200

    except Exception as e:
        print(f"Error in check_available_channels: {e}")
        traceback.print_exc()
        return jsonify({"message": "서버 오류 발생"}), 500
    
    finally:
        close_connection(conn, cursor)