import mysql.connector
from dotenv import load_dotenv
import os

# .env 파일 로드
load_dotenv()

# env 변수 가져오기
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DATABASE = os.getenv("DB_DATABASE")

def get_connection():
    try:
        conn = mysql.connector.connect(
            host= DB_HOST,
            user = DB_USER,
            password = DB_PASSWORD,
            database = DB_DATABASE
        )
        cursor = conn.cursor(dictionary=True) 
        
        # 연결(conn)과 커서(cursor) 객체를 함께 반환
        return conn, cursor
    except Exception as e:
        print(f"DB 연결 실패: {e}")
        return None, None # 실패 시 None 반환

def close_connection(conn, cursor):
    try:
        if cursor:
            cursor.close() # 커서 먼저 닫기
        if conn:
            # (중요) 이제 이 코드는 풀에 반납하는 것이 아니라,
            # DB 연결을 완전히 끊는 동작을 합니다.
            conn.close() 
    except Exception as e:
        print(f"DB 종료 실패: {e}")

