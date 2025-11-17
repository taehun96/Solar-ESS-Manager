from app import create_app, socketio # app/__init__.py 에서 정의한 팩토리 함수와 (비어있는) socketio 객체를 임포트

# 1. create_app() 함수를 호출하여 Flask 앱(app)을 생성
# (이 시점에 app/__init__.py 안의 모든 초기화 코드가 실행됨)
app = create_app()

# 2. [중요] SocketIO 객체를 app과 연결(초기화)
# 이 작업을 create_app() 밖(run.py)으로 분리하여,
# Flask의 'debug=True' 리로더(reloader)가 일으키는 순환 참조 문제를 해결합니다.
# app.config에 저장해둔 설정값들을 여기서 읽어서 사용합니다.
socketio.init_app(app, async_mode=app.config['ASYNC_MODE'],
                    cors_allowed_origins=app.config['CORS_ORIGINS'])


# 3. 이 파일(run.py)이 터미널에서 'python run.py'로 직접 실행되었을 때만
#    아래 코드를 실행하라는 의미
if __name__ == '__main__':
    
    print(f"Starting SocketIO server on http://0.0.0.0:5000")
    
    # 3-1. [중요] Flask-SocketIO를 사용할 때는 'app.run()' 대신
    # 'socketio.run(app)'을 사용해야 웹소켓 서버가 정상적으로 작동합니다.
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, 
                allow_unsafe_werkzeug=True) # Werkzeug 3.0+ 호환성 문제 해결