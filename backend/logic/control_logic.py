from itertools import combinations
import json

# config.json 불러오기
with open("config.json") as f:
    config = json.load(f)

# 공통 로직 함수
def _init_power(battery, power, channel_config=None, duration_minutes=None):
    # 공통 로직 처리

    # 에러 처리
    if not 0 <= battery <= 100:
        raise ValueError("battery 값이 잘못되었습니다.")
    if power < 0:
        raise ValueError("power 값이 잘못되었습니다.")
    
    # 채널별 소비 전력값 설정 (W)
    if channel_config is None:
        channel_config = config["channel_config"]
    # 유지 시간 설정 (minute)
    if duration_minutes is None:
        duration_minutes = config["duration_minutes"]
    # 배터리 용량 설정
    battery_capacity_wh = config["battery_capacity_wh"]

    # 배터리 W 계산
    battery_wh = battery_capacity_wh * (battery / 100)
    battery_w = battery_wh / (duration_minutes / 60)

    # 총 가용 전력
    available_power = battery_w + power
    print(f"배터리 잔량 : {battery} % \n실시간 생산량 : {power} W \n총 가용 전력({duration_minutes}분 기준) : {available_power} W\n")

    return available_power, channel_config, duration_minutes

# 최적 판매 조합 추천 함수
#TODO 반환 형식 처리 / 경우에 따라 리스트 -> 딕셔너리
#TODO config 파일 업데이트 (현재는 테스트용 값 적용)
def get_optimal_combination(battery, power, channel_config=None, duration_minutes=None):
    """
    매개변수
    battery : 배터리 저장 전력 %
    power : 실시간 생산 전력
    channel_config : 각 채널별 소비 전력
    duration_minutes : 유지 시간
    """

    print("====[최적 판매 조합 계산 실행]====\n")

    # 공통 로직 함수 불러오기
    available_power, channel_config, _ = _init_power(battery, power, channel_config, duration_minutes)

    # 모든 조합 생성
    channels = ["A", "B", "C", "D"]
    all_combinations = []

    # 1개 ~ 4개 조합 생성
    for i in range(1, len(channels) + 1):
        for combi in combinations(channels, i):
            all_combinations.append(list(combi))
    
    # 유효 조합
    valid_combinations = []

    for combi in all_combinations:
        # 조합의 총 소비 전력 계산
        total_power = sum(channel_config[ch] for ch in combi)

        # 현재 가용 전력으로 사용 가능한지 확인
        if total_power <= available_power:
            valid_combinations.append({
                "channels": combi,
                "power": total_power
            })
    print(f"유효 조합 수 : {len(valid_combinations)} 개\n")

    # 최적 조합 선택 (가장 많은 채널 활성화 -> 더 큰 전력 소비 기준)
    if not valid_combinations:
        print("판매 가능한 채널이 없습니다.")
        return []
    
    best = max(valid_combinations, key=lambda x: (len(x["channels"]), x["power"]))
    print(f"최적 판매 조합 : {best["channels"]}")

    return best["channels"]

# 실시간 선택 가능 채널 확인 및 배터리 보호 함수
def get_available_channels(battery, power, selected_channels=[], channel_config=None, duration_minutes=None, battery_protection_threshold=None):
    """
    매개변수
    battery : 배터리 저장 전력 %
    power : 실시간 생산 전력
    selected_channels : 이미 선택된 채널 리스트
    channel_config : 각 채널별 소비 전력
    duration_minutes : 유지 시간
    battery_protection_threshold : 배터리 보호 임계값 %
    """

    print("====[실시간 판매 가능 채널 조회]====\n")

    # 공통 로직 함수 불러오기
    available_power, channel_config, duration_minutes = _init_power(battery, power, channel_config, duration_minutes)

    # 배터리 보호 로직
    if battery_protection_threshold is None:
        battery_protection_threshold = config["battery_protection_threshold"]

    if battery < battery_protection_threshold:
        print(f"배터리 잔량이 {battery_protection_threshold} % 미만이므로 판매가 불가합니다.")
        return {
            "A": False,
            "B": False,
            "C": False,
            "D": False
        }
    
    # 이미 선택된 채널 전력 계산
    selected_power = sum(channel_config[ch] for ch in selected_channels)
    if selected_channels:
        print(f"현재 판매중인 채널 : {selected_channels}\n소비중인 전력 : {selected_power} W\n")

    # 남은 전력
    remaining_power = available_power - selected_power
    print(f"현재 가용 전력({duration_minutes}분 기준) : {remaining_power} W\n")

    # 결과 딕셔너리 반환
    result = {}

    for key, value in channel_config.items():
        if key in selected_channels:
            result[key] = False
        else:
            result[key] = value <= remaining_power
    print(f"판매 가능 채널 : {[ch for ch, val in result.items() if val]}")

    return result

# 테스트 실행
if __name__ == "__main__":
    result = get_available_channels(battery=10, power=100, selected_channels=['A'])
    print(result)