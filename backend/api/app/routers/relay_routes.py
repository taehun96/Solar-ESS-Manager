from flask import Blueprint, jsonify, request
from app.services.relay_service import (
    update_relay_status_in_db,
    get_current_relay_status,
    save_relay_state_changes
)

# Blueprint 생성
relay_bp = Blueprint('relay', __name__)

# 웹에서 릴레이 채널 제어 정보를 받아 DB에 업데이트 및 거래 내역 저장
@relay_bp.route("/api/relay/update", methods=["POST"])
def update_relay():
    data = request.get_json() # 웹에서 보낸 JSON 수신 (예: {"A": true, "B": false, ...})

    # 데이터 유효성 검사
    if not data or "A" not in data or "B" not in data or "C" not in data or "D" not in data:
        print("\n릴레이 유효성 검사 : 필수 데이터 누락")
        return jsonify({"message": "Relay : Missing required fields"}), 400

    # 현재 릴레이 상태 조회
    current_status, message, status_code = get_current_relay_status()
    if current_status is None:
        return jsonify({"message": message}), status_code

    # DB 저장 함수 호출
    success, message, status_code = update_relay_status_in_db(data)
    if not success:
        return jsonify({"message": message}), status_code
    
    # 거래 내역 DB에 저장
    success, message, status_code = save_relay_state_changes(data, current_status)
    return jsonify({"message": message}), status_code


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

    return jsonify(status_map), status_code

# 아두이노 요청 엔드포인트 DB에 저장된 릴레이 채널 정보를 JSON 형식으로 반환
@relay_bp.route("/api/relay/control", methods=["POST"])
def control_relay():
    # DB 최신 상태 조회
    current_status, message, status_code = get_current_relay_status()
    if current_status is None:
        return jsonify({"message": message}), status_code

    # 결과 가공 (JSON 형식 변경)
    status_map = {key: (value == "on") for key, value in current_status.items()}

    print("\n릴레이 제어 : DB 상태 응답 전송")
    return jsonify(status_map), status_code