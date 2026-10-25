import unittest

from fastapi import HTTPException

import app


class PathAllowlistTest(unittest.TestCase):
    def test_accepts_ui_paths(self):
        self.assertEqual(app.upstream_path("sessions"), "/sessions")
        self.assertEqual(app.upstream_path("sessions/abc123/messages"), "/sessions/abc123/messages")
        self.assertEqual(app.upstream_path("sessions/abc123/events"), "/sessions/abc123/events")
        self.assertEqual(app.upstream_path("sessions/abc123/cancel"), "/sessions/abc123/cancel")
        self.assertEqual(app.upstream_path("sessions/abc123/title/auto"), "/sessions/abc123/title/auto")
        self.assertEqual(app.upstream_path("runs/run_1/preview"), "/runs/run_1/preview")
        self.assertEqual(app.upstream_path("settings/llm"), "/settings/llm")
        self.assertEqual(app.upstream_path("upload"), "/upload")
        self.assertEqual(app.upstream_path("runs"), "/runs")
        self.assertEqual(app.upstream_path("runs/run_1"), "/runs/run_1")
        self.assertEqual(app.upstream_path("api/paper-accounts"), "/api/paper-accounts")
        self.assertEqual(app.upstream_path("api/portfolio"), "/api/portfolio")
        self.assertEqual(app.upstream_path("alpha/list"), "/alpha/list")
        self.assertEqual(app.upstream_path("scheduled-runs"), "/scheduled-runs")

    def test_rejects_everything_else(self):
        for path in ("portfolio", "sessions/../etc", "sessions/a/b/c", "runs/run_1/code", "live/status"):
            with self.assertRaises(HTTPException):
                app.upstream_path(path)

    def test_valid_id_rejects_path_tricks(self):
        for value in ("abc/def", "../x", "", "a" * 81):
            with self.assertRaises(HTTPException):
                app.valid_id(value)

    def test_proxy_accepts_put_for_provider_settings(self):
        routes = [
            route
            for route in app.app.routes
            if getattr(route, "path", None) == "/api/ai/{path:path}"
        ]
        self.assertEqual(len(routes), 1)
        self.assertIn("PUT", routes[0].methods)

    def test_auth_header_is_server_side(self):
        original = app.UPSTREAM_KEY
        try:
            app.UPSTREAM_KEY = "secret"
            self.assertEqual(app.upstream_headers()["Authorization"], "Bearer secret")
            app.UPSTREAM_KEY = ""
            self.assertNotIn("Authorization", app.upstream_headers())
        finally:
            app.UPSTREAM_KEY = original


if __name__ == "__main__":
    unittest.main()
