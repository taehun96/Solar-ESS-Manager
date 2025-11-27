# 최적조합 추천 및 선택가능 채널 확인 로직 API
from flask import Blueprint, jsonify
from app.services.sensor_service import get_latest_sensor_data
from app.services.relay_service import get_active_relay_list
from app.services.channels_service import get_optimal_combination, get_available_channels

# Blueprint 생성
channels_bp = Blueprint("channels", __name__)

# 실시간 선택 가능 채널 확인
@channels_bp.route("/api/channels/available", methods=["POST"])
def available_channels():
    """
    실시간 선택 가능 채널 확인 및 배터리 보호
    """
    # 최신 센서 데이터 조회
    sensor_data, message, status_code = get_latest_sensor_data()
    if message:
        return jsonify({"message": message}), status_code

    # 현재 사용중인 채널 확인
    selected_channels, message, status_code = get_active_relay_list()
    if message:
        return jsonify({"message": message}), status_code

    # 가능한 채널 조회
    result, message, status_code = get_available_channels(
        battery=sensor_data["soc"],
        power=sensor_data["solar_w"],
        selected_channels=selected_channels
    )
    if message:
        return jsonify({"message": message}), status_code
    else:
        return jsonify(result), 200

# 최적 판매 조합 추천
@channels_bp.route("/api/channels/optimal", methods=["POST"])
def optimal_combination():
    """
    최적 판매 조합 추천
    """
    # 최신 센서 데이터 조회
    sensor_data, message, status_code = get_latest_sensor_data()
    if message:
        return jsonify({"message": message}), status_code

    # 최적 조합 계산
    result, message, status_code = get_optimal_combination(
        battery=sensor_data["soc"],
        power=sensor_data["solar_w"]
    )
    if message:
        return jsonify({"message": message}), status_code
    else:
        return jsonify({'channels': result}), 200