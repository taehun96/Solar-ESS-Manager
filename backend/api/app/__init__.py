from flask import Flask
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.sensor_service import aggregate_old_data
import os

# --- 전역 객체 생성 ---
# Flask 'app' 객체를 전역(global)으로 생성합니다.
app = Flask(__name__)

# --- create_app (앱 팩토리 함수) 정의 ---
def create_app():
    """
    Flask 애플리케이션을 생성하고 초기화(설정)하는 '공장' 함수입니다.
    run.py 파일이 이 함수를 호출하여 서버를 실행시킵니다.
    """
    # --- 앱 설정 (Config) ---
    app.config['CORS_ORIGINS'] = "*" # 개발용: 모든 도메인 허용
    
    # --- 확장(라이브러리) 초기화 ---
    # CORS 설정을 앱에 적용합니다.
    # "/api/"로 시작하는 모든 주소에 대해 CORS_ORIGINS에서 오는 요청을 허용합니다.
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})

    # --- 라우트(API 주소) 임포트 ---
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

    # 스케줄러 설정 (리로더 프로세스에서만 실행)
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            func=aggregate_old_data,
            trigger="cron",
            hour="*",
            minute=0
        )
        scheduler.start()

    # 생성 및 설정이 완료된 app 객체를 반환합니다.
    return app
