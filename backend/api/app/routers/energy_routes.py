# 모델 예측 API
from flask import Blueprint, jsonify
from app.services.energy_service import get_latest_sensor_data_for_model, predict_solar_generation

# Blueprint 생성
energy_bp = Blueprint("energy", __name__)

# 모델 예측 API
@energy_bp.route("/api/energy/predict", methods=["POST"])
def predict_generation():
    """
    1h, 2h, 3h 뒤 발전량 예측
    """
    # 최신 데이터 조회
    data, message, status_code = get_latest_sensor_data_for_model()
    if data is None:
        return jsonify({"message": message}), status_code
    
    # 모델 예측
    result, message, status_code = predict_solar_generation(data)
    if result is None:
        return jsonify({"message": message}), status_code

    return jsonify(result), 200