from app import create_app
from app.services.relay_service import reset_relay
import os
from werkzeug.serving import WSGIRequestHandler

app = create_app()

if __name__=="__main__":
    reset_relay()

    # Server 헤더 최소화
    WSGIRequestHandler.server_version = "S"
    WSGIRequestHandler.sys_version = ""

    PORT = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0",
            port=PORT,
            debug=False)