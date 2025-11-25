from flask import Flask
from flask_cors import CORS

# --- [2] 전역 객체 생성 ---
# Flask 'app' 객체와 'socketio' 객체를 전역(global)으로 생성합니다.
# (아직 socketio는 app과 연결되지 않은, 비어있는 상태)
app = Flask(__name__)

# --- [3] create_app (앱 팩토리 함수) 정의 ---
def create_app():
    """
    Flask 애플리케이션을 생성하고 초기화(설정)하는 '공장' 함수입니다.
    run.py 파일이 이 함수를 호출하여 서버를 실행시킵니다.
    """
    
    # --- [3-1] 앱 설정 (Config) ---
    app.config['ASYNC_MODE'] = 'threading' 
    app.config['CORS_ORIGINS'] = "*" # 개발용: 모든 도메인 허용
    
    # --- [3-2] 확장(라이브러리) 초기화 ---
    # CORS 설정을 앱에 적용합니다.
    # "/api/"로 시작하는 모든 주소에 대해 CORS_ORIGINS에서 오는 요청을 허용합니다.
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})

    # --- [3-3] 라우트(API 주소) 및 이벤트 임포트 ---
    # [중요] 순환 참조(Circular Import) 오류를 방지하기 위해
    # app 객체가 완전히 생성된 *이후*에 라우트 파일을 임포트합니다.

    # Blueprint 임포트 및 등록
    from app.routers.data_routes import data_bp
    from app.routers.relay_routes import relay_bp
    from app.routers.channels_routes import channels_bp
    from app.routers.energy_routes import energy_bp

    app.register_blueprint(data_bp)
    app.register_blueprint(relay_bp)
    app.register_blueprint(channels_bp) 
    app.register_blueprint(energy_bp) 

    # 생성 및 설정이 완료된 app 객체를 반환합니다.
    return app
