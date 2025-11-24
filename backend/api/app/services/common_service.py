import json
from pathlib import Path

# 채널명을 buyer_id로 변환
def get_buyer_id_from_channel(channel):
    """
    채널명을 buyer_id로 변환
    """
    channel_to_id = {
        "A": 1,
        "B": 2,
        "C": 3,
        "D": 4
    }
    return channel_to_id.get(channel)

# config.json에서 채널별 소비전력 조회
def get_channel_power(channel):
    """
    config.json에서 채널별 소비전력 조회
    """
    try:
        config_path = Path(__file__).parent / "config.json"
        with open(config_path, "r") as f:
            config = json.load(f)

        return config.get("channel_config", {}).get(channel)

    except Exception as e:
        print(f"채널 전력 조회 : config.json 읽기 오류 - {e}")
        return None