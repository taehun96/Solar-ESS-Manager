# 최적조합 추천 및 선택가능 채널 확인 로직 API
from logic.control_logic import get_available_channels, get_optimal_combination
from app.db import get_connection, close_connection
from flask import Blueprint, jsonify
import traceback

# Blueprint 생성
channels_bp = Blueprint("channels", __name__)

# 실시간 선택 가능 채널 확인
@channels_bp.route("/api/channels/available", method=["POST"])
def available_channels():
    """
    실시간 선택 가능 채널 확인 및 배터리 보호
    """
    # DB에서 데이터 조회
    conn, cursor = None, None
    try:
        # DB 연결
        conn, cursor = get_connection()
        if conn is None:
            return jsonify({"message": "DB 연결 실패"}), 500
        
        # 최신 데이터 조회
        sql = "SELECT soc, solar_w FROM sun_data ORDER BY timestamp DESC LIMIT 1"
        cursor.execute(sql)
        sensor_data = cursor.fetchone()

        # 현재 사용중인 채널 확인
        sql = "SELECT relay_name FROM relay_status WHERE status = 'on'"
        cursor.execute(sql)
        active_relays = cursor.fetchall()

        # 채널만 리스트로 추출
        selected_channels = [relay["relay_name"] for relay in active_relays]

        result = get_available_channels(battery=sensor_data["soc"], power=sensor_data["solar_w"], selected_channels=selected_channels)

        return jsonify(result), 200

    except Exception as e:
        print(f"Error in check_available_channels: {e}")
        traceback.print_exc()
        return jsonify({"message": "Internal Server Error"}), 500
    
    finally:
        close_connection(conn, cursor)

# 최적 판매 조합 추천
@channels_bp.route("/api/channels/optimal", methods=["POST"])
def optimal_combination():
    """
    최적 판매 조합 추천
    """
    # DB에서 데이터 조회
    conn, cursor = None, None
    try:
        # DB 연결
        conn, cursor = get_connection()
        if conn is None:
            return jsonify({"message": "DB 연결 실패"}), 500
        
        # 최신 데이터 조회
        sql = "SELECT soc, solar_w FROM sun_data ORDER BY timestamp DESC LIMIT 1"
        cursor.execute(sql)
        sensor_data = cursor.fetchone()

        result = get_optimal_combination(battery=sensor_data["soc"], power=sensor_data["solar_w"])

        return jsonify({'channels': result}), 200

    except Exception as e:
        print(f"Error in check_available_channels: {e}")
        traceback.print_exc()
        return jsonify({"message": "Internal Server Error"}), 500
    
    finally:
        close_connection(conn, cursor)