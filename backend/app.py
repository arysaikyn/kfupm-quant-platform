"""Narrow proxy between the web app and a local Vibe-Trading server.

The browser never sees the upstream API key. Only the endpoints the UI uses
are exposed; everything else is a 404, so this cannot become an open proxy.
"""

from __future__ import annotations

import os
import re
from collections.abc import AsyncIterator
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles

UPSTREAM = os.getenv("VIBE_API_URL", "http://127.0.0.1:8899").rstrip("/")
UPSTREAM_KEY = os.getenv("VIBE_API_KEY", "")
REQUEST_TIMEOUT = float(os.getenv("VIBE_REQUEST_TIMEOUT", "120"))
SESSION_RE = re.compile(r"^[A-Za-z0-9_-]{1,80}$")

app = FastAPI(title="KFUPM Quant backend", version="0.1.0")

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5177,http://127.0.0.1:5177,"
    "http://localhost:4177,http://127.0.0.1:4177",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins if origin.strip()],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Last-Event-ID"],
)

client = httpx.AsyncClient(timeout=httpx.Timeout(REQUEST_TIMEOUT, connect=10))
sse_client = httpx.AsyncClient(timeout=httpx.Timeout(None, connect=10))


def upstream_headers(request: Request | None = None) -> dict[str, str]:
    headers: dict[str, str] = {"Accept": "application/json"}
    if UPSTREAM_KEY:
        headers["Authorization"] = f"Bearer {UPSTREAM_KEY}"
    if request is not None:
        content_type = request.headers.get("content-type")
        if content_type:
            headers["Content-Type"] = content_type
        last_event_id = request.headers.get("last-event-id")
        if last_event_id:
            headers["Last-Event-ID"] = last_event_id
    return headers


def valid_id(value: str) -> str:
    if not SESSION_RE.fullmatch(value):
        raise HTTPException(status_code=400, detail="Invalid id")
    return value


def upstream_path(path: str) -> str:
    """Allowlist only the paths the UI needs. No wildcard proxy."""
    parts = [part for part in path.split("/") if part]
    if parts == ["sessions"]:
        return "/sessions"
    if len(parts) == 2 and parts[0] == "sessions":
        return f"/sessions/{valid_id(parts[1])}"
    if len(parts) == 3 and parts[0] == "sessions":
        if parts[2] in {"messages", "events", "cancel"}:
            return f"/sessions/{valid_id(parts[1])}/{parts[2]}"
    if len(parts) == 4 and parts[0] == "sessions" and parts[2:] == ["title", "auto"]:
        return f"/sessions/{valid_id(parts[1])}/title/auto"
    if len(parts) == 3 and parts[0] == "runs" and parts[2] == "preview":
        return f"/runs/{valid_id(parts[1])}/preview"
    raise HTTPException(status_code=404, detail="Not found")


async def upstream_request(method: str, path: str, request: Request) -> Response:
    target = f"{UPSTREAM}{upstream_path(path)}"
    body = await request.body()
    try:
        response = await client.request(
            method,
            target,
            content=body or None,
            headers=upstream_headers(request),
            params=request.query_params,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail=f"AI backend unreachable: {exc.__class__.__name__}") from exc

    headers: dict[str, str] = {}
    for name in ("content-type", "cache-control"):
        value = response.headers.get(name)
        if value:
            headers[name] = value
    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=headers,
        media_type=response.headers.get("content-type"),
    )


@app.get("/api/ai/health")
async def health() -> JSONResponse:
    try:
        response = await client.get(
            f"{UPSTREAM}/sessions", headers=upstream_headers(), params={"limit": 1}
        )
    except httpx.HTTPError as exc:
        return JSONResponse(
            status_code=503,
            content={"ok": False, "upstream": UPSTREAM, "error": exc.__class__.__name__},
        )
    return JSONResponse(
        status_code=200 if response.status_code < 400 else 502,
        content={"ok": response.status_code < 400, "upstream": UPSTREAM},
    )


@app.get("/api/ai/sessions/{session_id}/events")
async def events(session_id: str, request: Request) -> StreamingResponse:
    valid_id(session_id)
    target = f"{UPSTREAM}/sessions/{session_id}/events"
    request_headers = upstream_headers(request)
    request_headers["Accept"] = "text/event-stream"
    upstream_request_obj = sse_client.build_request(
        "GET", target, headers=request_headers, params=request.query_params
    )
    try:
        upstream_response = await sse_client.send(upstream_request_obj, stream=True)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail=f"AI backend unreachable: {exc.__class__.__name__}") from exc

    if upstream_response.status_code != 200:
        body = await upstream_response.aread()
        status = upstream_response.status_code
        await upstream_response.aclose()
        return Response(content=body, status_code=status)

    async def relay() -> AsyncIterator[bytes]:
        try:
            async for chunk in upstream_response.aiter_raw():
                if await request.is_disconnected():
                    break
                yield chunk
        finally:
            await upstream_response.aclose()

    return StreamingResponse(
        relay(),
        status_code=200,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.api_route(
    "/api/ai/{path:path}",
    methods=["GET", "POST", "PATCH", "DELETE"],
)
async def proxy(path: str, request: Request) -> Response:
    return await upstream_request(request.method, path, request)


WEB_DIST = Path(os.getenv("WEB_DIST", Path(__file__).resolve().parent.parent / "web" / "dist"))

if (WEB_DIST / "index.html").is_file():
    assets = WEB_DIST / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{path:path}")
    async def spa(path: str) -> FileResponse:
        if path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = (WEB_DIST / path).resolve()
        if WEB_DIST.resolve() in candidate.parents and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(WEB_DIST / "index.html")


@app.on_event("shutdown")
async def shutdown() -> None:
    await client.aclose()
    await sse_client.aclose()
