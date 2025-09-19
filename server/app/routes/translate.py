"""Translation API endpoint.

Provides a unified POST /api/translate endpoint that accepts a JSON body:
  {
    "text": "Hello world"            # or list of strings
    "from": "en",                   # optional source language code
    "to": "es"                      # required target language code
  }

Behavior:
  - Supports single string or list of strings in "text".
  - If source language (from) is omitted or empty, API will auto-detect.
  - Validates inputs and returns errors with meaningful messages.
  - Returns a consistent response schema including detected source language(s).

Response example (single text):
  {
    "translations": [
       {"input": "Hello world", "translated": "Hola Mundo", "detected_source": "en"}
    ],
    "target_language": "es"
  }

Environment Requirements:
  - GOOGLE_PROJECT_ID and GOOGLE_LOCATION already present for Vertex; for the
    Translation API we rely on GOOGLE_PROJECT_ID + credentials.
  - GOOGLE_CREDENTIALS_JSON_BASE64 should contain a service account JSON with
    the Cloud Translation API permission (roles/cloudtranslate.user or editor).

Robustness:
  - Graceful degradation if google-cloud-translate is not installed or creds
    are missing.
  - Basic in-memory LRU style cache to avoid re-translating identical requests
    within short time window (lightweight; can be replaced by Redis later).
  - Batches large lists into chunks the API can handle (100 items per batch).
"""

from __future__ import annotations

from flask import Blueprint, request, jsonify
import os, base64, json, time, threading
from typing import List, Dict, Any

translate_bp = Blueprint("translate", __name__)

_CACHE_LOCK = threading.Lock()
_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_SECONDS = 300  # 5 minutes

def _purge_cache() -> None:
    now = time.time()
    with _CACHE_LOCK:
        expired = [k for k, v in _CACHE.items() if now - v.get("ts", 0) > _CACHE_TTL_SECONDS]
        for k in expired:
            _CACHE.pop(k, None)

def _cache_key(texts: List[str], source: str | None, target: str) -> str:
    joined = "\u241E".join(texts)  # use record separator symbol to avoid collisions
    return f"{source or 'auto'}::{target}::{joined}"

def _load_credentials_tempfile() -> str | None:
    b64 = os.getenv("GOOGLE_CREDENTIALS_JSON_BASE64")
    if not b64:
        return None
    try:
        raw = base64.b64decode(b64)
        data = json.loads(raw)
        path = f"/tmp/gcp_translate_{data.get('project_id','default')}.json"
        # Write idempotently
        if not os.path.exists(path):
            with open(path, "w") as f:
                json.dump(data, f)
        return path
    except Exception:
        return None

def _get_client():
    try:
        from google.cloud import translate_v2 as translate  # v2 client (stable)
    except Exception as e:  # library missing or import error
        raise RuntimeError("google-cloud-translate library not installed: add it to requirements.txt") from e

    creds_path = _load_credentials_tempfile()
    if creds_path:
        os.environ.setdefault("GOOGLE_APPLICATION_CREDENTIALS", creds_path)
    try:
        client = translate.Client()
        return client
    except Exception as e:
        raise RuntimeError(f"Failed to initialize Translation client: {e}") from e


def _translate_texts(client, texts: List[str], target: str, source: str | None) -> List[Dict[str, Any]]:
    # google-cloud-translate v2 allows auto detection if source not provided.
    results: List[Dict[str, Any]] = []
    CHUNK_SIZE = 100  # safety; API generally allows large batches but keep modest
    for i in range(0, len(texts), CHUNK_SIZE):
        chunk = texts[i:i+CHUNK_SIZE]
        response = client.translate(chunk, target_language=target, source_language=source if source else None, format_='text')
        # response is a dict for single or list for multiple
        if isinstance(response, dict):
            response = [response]
        for original, item in zip(chunk, response):
            results.append({
                "input": original,
                "translated": item.get("translatedText"),
                "detected_source": item.get("detectedSourceLanguage") or source
            })
    return results


@translate_bp.route("/api/translate", methods=["POST"])
def translate_endpoint():
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    target = data.get("to") or data.get("target")
    source = data.get("from") or data.get("source") or None

    if target is None or not isinstance(target, str) or not target.strip():
        return jsonify({"error": "'to' (target language) is required"}), 400
    if text is None:
        return jsonify({"error": "'text' is required (string or list)"}), 400

    # Normalize input texts into list
    if isinstance(text, str):
        texts = [text]
    elif isinstance(text, list) and all(isinstance(t, str) for t in text):
        texts = text
    else:
        return jsonify({"error": "'text' must be a string or list of strings"}), 400

    # Basic guard
    if len(texts) == 0:
        return jsonify({"error": "'text' list is empty"}), 400

    # Simple cache lookup
    _purge_cache()
    key = _cache_key(texts, source, target)
    with _CACHE_LOCK:
        cached = _CACHE.get(key)
    if cached:
        return jsonify({
            "translations": cached["data"],
            "target_language": target,
            "cached": True
        })

    try:
        client = _get_client()
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500

    try:
        results = _translate_texts(client, texts, target, source)
    except Exception as e:
        return jsonify({"error": f"Translation failed: {e}"}), 500

    with _CACHE_LOCK:
        _CACHE[key] = {"data": results, "ts": time.time()}

    return jsonify({
        "translations": results,
        "target_language": target,
        "cached": False
    })
