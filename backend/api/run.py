from app import create_app
from app.services.relay_service import reset_relay
import os

app = create_app()

if __name__=="__main__":
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        reset_relay()

    PORT = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0",
            port=PORT,
            debug=False)