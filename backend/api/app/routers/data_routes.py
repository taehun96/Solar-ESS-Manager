from flask import Blueprint, jsonify, request
from app.services.sensor_service import get_latest_sensor_data, save_sensor_data
from app.services.relay_service import get_trade_history

# Blueprint 생성
data_bp = Blueprint('data', __name__)

# === [GET] /api/sun-data/latest ===
# 기능: DB에 저장된 가장 최신의 태양광 데이터를 조회
@data_bp.route('/api/data/latest', methods=['GET'])
def get_latest_status():
        # 최신 센서 데이터 조회
        sensor_data, message, status_code = get_latest_sensor_data()
        if sensor_data is None:
            return jsonify({"message": message}), status_code

        return jsonify(sensor_data), status_code

# 아두이노 데이터 받아서 DB에 저장
@data_bp.route('/api/data/solar', methods=['POST'])
def receive_sun_data():
    """
    아두이노로부터 JSON 데이터를 받아 DB 'sun_data' 테이블에 저장
    """
    # 클라이언트(아두이노)가 보낸 JSON 데이터를 딕셔너리로 받음
    data = request.get_json()

    # JSON에서 각 데이터 추출
    soc = data.get("soc") # 현재 배터리 잔량
    solar_w = data.get("solar_w") # 페널 전력 생산량
    lux = data.get("lux") # 조도값

    # 데이터 유효성 검사
    if soc is None or solar_w is None or lux is None:
        print("아두이노 데이터 수신 : 필수 데이터 누락")
        return jsonify({"message": "Missing required fields"}), 400
    if not (0 <= soc <= 100) or solar_w < 0 or lux < 0:
        print("아두이노 데이터 수신 : 필수 데이터 입력값 오류")
        return jsonify({"message": "Invalid input values"}), 400
    
    print(f"\nSOC: {soc}%, 전력: {solar_w}W, 조도: {lux}lux")

    _, message, status_code = save_sensor_data(soc, solar_w, lux)

    # 성공 응답 반환
    if message:
        return jsonify({"message": message}), status_code
    else:
        return jsonify({"success": True}), status_code

# 거래 내역 조회
@data_bp.route("/api/data/history", methods=["GET"])
def get_trade_history_route():
    """
    구매채널 및 전력량, 구매 시간 등을 반환
    """
    # 쿼리 파라미터 받아오기
    user_id = request.args.get("user_id")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    date = request.args.get("date")
    
    result, message, status_code = get_trade_history(user_id, start_date, end_date, date)

    if result is None:
        return jsonify({"message": message}), status_code

    print("\n거래 내역 조회 : 조회 성공")
    return jsonify(result), status_code