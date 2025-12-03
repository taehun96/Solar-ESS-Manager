from app import create_app
from app.services.relay_service import reset_relay

app = create_app()

if __name__=="__main__":
    reset_relay()
    app.run(host="0.0.0.0",
            port=5000,
            debug=True,
            use_reloader=False,
            threaded = False)