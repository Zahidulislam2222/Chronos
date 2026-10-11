"""Private HTTP intake; request bodies and authorization headers are never logged."""

import hmac
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from .config import Settings
from .engine import Engine, TargetError


def server(settings: Settings, engine: Engine) -> ThreadingHTTPServer:
    class Handler(BaseHTTPRequestHandler):
        def setup(self) -> None:
            super().setup()
            self.connection.settimeout(settings.request_timeout)

        def log_message(self, format: str, *args: Any) -> None:
            pass

        def send(self, status: int, data: Any) -> None:
            body = json.dumps(data, allow_nan=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(body)

        def authorized(self) -> bool:
            actual = self.headers.get("Authorization", "").encode()
            expected = ("Bearer " + settings.token.get_secret_value()).encode()
            if not hmac.compare_digest(actual, expected):
                self.send(401, {"error": "Authentication required"})
                return False
            return True

        def do_GET(self) -> None:
            if self.path == "/healthz":
                self.send(200, {"status": "ok", "woocommerce_access": "read_only"})
                return
            if not self.authorized():
                return
            try:
                if self.path == "/queue":
                    self.send(200, engine.queue())
                elif self.path.startswith("/batches/"):
                    self.send(200, engine.summary(self.path.removeprefix("/batches/")))
                else:
                    self.send(404, {"error": "Route not found"})
            except ValueError:
                self.send(404, {"error": "Batch not found"})

        def do_POST(self) -> None:
            if not self.authorized():
                return
            try:
                if self.headers.get_content_type() != "application/json":
                    self.send(415, {"error": "JSON required"})
                    return
                if self.headers.get("Transfer-Encoding"):
                    self.send(400, {"error": "Transfer encoding unsupported"})
                    return
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= settings.body_limit:
                    self.send(413, {"error": "Body outside configured limits"})
                    return
                data = json.loads(
                    self.rfile.read(length),
                    parse_constant=lambda _: (_ for _ in ()).throw(ValueError()),
                )
                if self.path == "/source" and data == {}:
                    self.send(200, engine.source())
                elif self.path == "/batches":
                    self.send(200, engine.accept(data))
                elif self.path == "/items" and isinstance(data, dict):
                    self.send(200, engine.process(data))
                else:
                    self.send(404, {"error": "Route not found"})
            except (ValueError, TypeError, UnicodeError):
                self.send(400, {"error": "Invalid request; check schema and item order"})
            except TargetError:
                self.send(502, {"error": "WooCommerce source could not be read completely"})

    return ThreadingHTTPServer((settings.bind_host, settings.port), Handler)


def main() -> None:
    try:
        settings = Settings.load()
    except (ValueError, TypeError, OSError):
        raise SystemExit("Inventory configuration invalid; check private settings") from None
    engine = Engine(settings)
    instance = server(settings, engine)
    try:
        instance.serve_forever()
    finally:
        instance.server_close()
        engine.close()


if __name__ == "__main__":
    main()
