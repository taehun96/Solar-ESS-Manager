import mysql.connector
# from mysql.connector import pooling # 커넥션 풀링을 사용하지 않으므로 삭제

def get_connection():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user = 'root',
            password = '1234',
            database = 'realtime_db'
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
        print(f"DB 연결 닫기 실패: {e}")

