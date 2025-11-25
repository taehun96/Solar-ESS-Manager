# ---필요한 모듈 임포트 ---
from flask import Blueprint, jsonify, request
from app.services.relay_service import (
    update_relay_status_in_db,
    insert_trade_history,
    get_current_relay_status,
    send_to_arduino
)
from app.services.common_service import get_buyer_id_from_channel, get_channel_power
from dotenv import load_dotenv
import os

# .env 파일 로드
load_dotenv()

# env 변수 가져오기
arduino_url = os.getenv("ARDUINO_URL")

# Blueprint 생성
relay_bp = Blueprint('relay', __name__)

# === [POST] /api/relay/control  ===
# 기능: 웹(프론트엔드)에서 A, B, C, D 릴레이 상태를 한꺼번에 제어
@relay_bp.route("/api/relay/control", methods=["POST"])
def control_relay():
    data = request.get_json() # 웹에서 보낸 JSON 수신 (예: {"A": true, "B": false, ...})

    # 데이터 유효성 검사
    if not data or "A" not in data or "B" not in data or "C" not in data or "D" not in data:
        print("릴레이 유효성 검사 : 필수 데이터 누락")
        return jsonify({"message": "필수 데이터가 누락되었습니다."}), 400

    # 현재 릴레이 상태 조회
    current_status, message, status_code = get_current_relay_status()
    if current_status is None:
        return jsonify({"message": message}), status_code

    # DB 저장 함수 호출
    success, message, status_code = update_relay_status_in_db(data)
    if not success:
        return jsonify({"message": message}), status_code
    
    # OFF -> ON 채널만 거래 내역 저장
    for channel, new_state in data.items():
        old_state = current_status.get(channel, "off")
        if old_state == "off" and new_state == True:
            # 채널명을 buyer_id로 변환
            buyer_id = get_buyer_id_from_channel(channel)
            # 채널별 소비전력 조회
            amount = get_channel_power(channel)
            if buyer_id in [1,2,3,4] and amount >= 0:
                # DB에 거래 내역 저장
                success, msg, _ = insert_trade_history(buyer_id, amount)
                if not success:
                    print(f"거래 내역 저장 실패 ({channel}) : {msg}")
                else:
                    print(f"거래 내역 저장 성공 ({channel}) : {amount}W")
            else:
                print("릴레이 제어 : 필수 데이터 입력값 오류")
                return jsonify({"message": "필수 데이터 입력값 오류"}), 400

    # 아두이노에 릴레이 제어 전송
    success, message, status_code = send_to_arduino(data, arduino_url)
    if not success:
        return jsonify({"message": message}), status_code

    return jsonify({"message": "success"}), 200

# === [GET] /api/relay/status ===
# 기능: 웹(프론트엔드)이 페이지에 처음 접속할 때,
#       DB에 저장된 릴레이의 '현재' 상태를 조회
@relay_bp.route("/api/relay/status", methods=["GET"])
def get_all_relay_status():
    # 현재 릴레이 상태 조회
    current_status, message, status_code = get_current_relay_status()

    if current_status is None:
        return jsonify({"message": message}), status_code
    
    # 결과 가공 (JSON 형식 변경)
    status_map = {key: (value == "on") for key, value in current_status.items()}

    return jsonify(status_map), 200
