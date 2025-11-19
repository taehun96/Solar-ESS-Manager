from app import socketio # __init__.py의 전역 socketio 객체 임포트

# @socketio.on('이벤트이름'): 클라이언트(웹)에서 보낸 이벤트를 수신
# (참고: @api_bp.route()는 HTTP 요청을 수신)

# 'connect' 이벤트 핸들러
# 클라이언트(웹)가 웹소켓에 성공적으로 연결되었을 때 자동 호출됨
@socketio.on('connect')
def handle_connect():
    print('Client connected (web frontend)')
    # (필요시) 연결된 특정 클라이언트에게만
    # 현재 릴레이 상태 등을 보내주는 로직을 추가할 수 있음

# 'disconnect' 이벤트 핸들러
# 클라이언트(웹)가 브라우저를 닫거나 새로고침해서 연결이 끊어졌을 때
@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')