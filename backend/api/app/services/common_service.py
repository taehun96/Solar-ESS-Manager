import json
from pathlib import Path
from app.db import get_connection, close_connection
from contextlib import contextmanager
import traceback

# Config channel_config 데이터 접근
try:
    CONFIG_PATH = Path(__file__).parent.parent / "config" / "config_arduino.json"
    with open(CONFIG_PATH, "r") as f:
        CHANNEL_CONFIG = json.load(f)["channel_config"]
except Exception as e:
    print(f"config 읽기 오류 - {e}")
    CHANNEL_CONFIG = {}

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

# 에러 처리 클래스 생성
class DBException(Exception):
    def __init__(self, message, status_code):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

# 에러 처리 데코레이터 생성
def handle_errors(context): # 데코레이터 생성
    def decorator(func): # 원본 함수를 wrapper에 전달
        def wrapper(*args, **kwargs): # 실제 실행되는 함수
            try:
                return func(*args, **kwargs)
            except DBException as e:
                return False, e.message, e.status_code
            except Exception as e:
                print(f"{context} : 오류 - {e}")
                traceback.print_exc()
                return False, f"{context} : 서버 오류 발생", 500
        return wrapper
    return decorator

# DB 연결 함수
@contextmanager
def db_transaction():
    """
    DB 연결 및 종료 처리
    """
    # DB에서 데이터 조회
    conn, cursor = None, None
    try:
        conn, cursor = get_connection()
        if conn is None:
            print("DB 연결 실패")
            raise DBException("DB 연결 실패", 503)
        # 함수 일시 정지(with as로 변수 전달)
        yield conn, cursor 
        # 항상 커밋 실행
        conn.commit()
    # 에러 발생 시 내용 catch
    except DBException:
        raise
    except Exception as e:
        print(f"DB 오류 : {e}")
        if conn:
            conn.rollback() # 에러 발생 시 롤백
        raise DBException(f"DB 오류 : {e}", 500)

    finally:
        close_connection(conn, cursor)