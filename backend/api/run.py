from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.get("/data")
def getData():
    print("getData",dict(request.args))
    return jsonify(ok=True)
if __name__=="__main__":
    app.run(host="0.0.0.0",
            port=5000,
            debug=True,
            use_reloader=False,
            threaded = False)

# from app import create_app # app/__init__.py 에서 정의한 팩토리 함수와 (비어있는) socketio 객체를 임포트
# from flask import request, jsonify

# # 1. create_app() 함수를 호출하여 Flask 앱(app)을 생성
# # (이 시점에 app/__init__.py 안의 모든 초기화 코드가 실행됨)
# PORT = 5000
# app = create_app()


# @app.get("/")
# def getData():
#     print("getData",dict(request.args))
#     return jsonify(ok=True)

# # 3. 이 파일(run.py)이 터미널에서 'python run.py'로 직접 실행되었을 때만
# #    아래 코드를 실행하라는 의미
# if __name__ == '__main__':
    
#     print(f"Starting Flask server on http://0.0.0.0:{PORT}")
    
#     # 3-1. [중요] Flask-SocketIO를 사용할 때는 'app.run()' 대신
#     # 'socketio.run(app)'을 사용해야 웹소켓 서버가 정상적으로 작동합니다.
#     app.run(debug=True, host='0.0.0.0', port=PORT)
