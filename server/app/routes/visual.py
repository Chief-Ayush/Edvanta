"""Visual Content Generation API endpoints.

Adds endpoints for generating short videos from text, PDF URL, and audio URL.
Implementation follows the approach outlined in demo.py, but uses utils to
keep routes lean. Each route:
  1) Generates key moments (script + image prompts) via Vertex AI
  2) Produces AI images, speech, captions, and merges into a video
  3) Uploads the final video to Cloudinary and returns the URL

Note: Audio transcription is not implemented in the utils yet; provide
`transcript` directly when using the audio route or extend utils accordingly.
"""
from flask import Blueprint, request, jsonify
import uuid, threading, time
from datetime import datetime
from email.utils import formatdate
from .email import _build_email  # reuse email builder for HTML alternative
import os, smtplib, ssl

from ..utils.visual_utils import (
  generate_video_from_transcript_text,
  extract_text_from_pdf_url,
  extract_text_from_audio_url,
)


visual_bp = Blueprint("visual", __name__)

# In-memory job store (simple; replace with persistent store / queue in prod)
_VIDEO_JOBS = {}
_LOCK = threading.Lock()

def _notify_user(email: str, goal: str, video_url: str):  # best-effort
  sender = os.getenv("SENDER_EMAIL", "").strip()
  password = os.getenv("SENDER_PASSWORD", "").strip()
  if not sender or not password or not email:
    return
  subject = f"Your Video is Ready: {goal[:50]}" if goal else "Your Video is Ready"
  plain = f"Your generated video is ready.\n\nURL:\n{video_url}\n\nYou can open it now inside the app as well.\n\n— Edvanta"
  html = f"""<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#f6f8fb;padding:24px'>
  <table width='100%' style='max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px' cellpadding='0' cellspacing='0'>
    <tr><td style='padding:20px 24px;background:linear-gradient(135deg,#6366f1,#3b82f6);color:#fff;'>
      <h2 style='margin:0;font-size:20px;font-weight:600'>Your Video is Ready</h2>
      <p style='margin:6px 0 0 0;font-size:13px;opacity:.9'>{goal or 'Generated video'}</p>
    </td></tr>
    <tr><td style='padding:24px'>
      <p style='font-size:14px;color:#111827;margin:0 0 16px'>Your generated video has finished processing.</p>
      <p style='font-size:13px;margin:0 0 12px;color:#374151'><strong>Video URL:</strong><br><a href='{video_url}' style='color:#2563eb'>{video_url}</a></p>
      <p style='font-size:12px;color:#6b7280;margin:24px 0 0'>You can also find this in your in-app history.</p>
    </td></tr>
    <tr><td style='background:#f1f5f9;padding:14px;text-align:center'>
      <p style='margin:0;font-size:11px;color:#64748b'>&copy; {datetime.utcnow().year} Edvanta</p>
    </td></tr>
  </table></body></html>"""
  try:
    msg = _build_email(sender, email, subject, plain, html)
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context, timeout=30) as server:
      server.login(sender, password)
      server.send_message(msg)
  except Exception:
    pass

def _run_video_job(job_id: str):
  with _LOCK:
    job = _VIDEO_JOBS.get(job_id)
  if not job:
    return
  try:
    with _LOCK:
      job['status'] = 'running'
      job['started_at'] = time.time()
    # Determine mode
    mode = job['payload'].get('mode')
    email = job['payload'].get('user_email')
    goal = job['payload'].get('label') or ''
    if mode == 'text':
      url = generate_video_from_transcript_text(job['payload']['text'])
    elif mode == 'pdf':
      text = extract_text_from_pdf_url(job['payload']['pdf_url'])
      url = generate_video_from_transcript_text(text)
    elif mode == 'audio':
      transcript = job['payload'].get('transcript')
      if not transcript:
        transcript = extract_text_from_audio_url(job['payload']['audio_url'])
      url = generate_video_from_transcript_text(transcript)
    else:
      raise ValueError('Unknown job mode')
    with _LOCK:
      job['status'] = 'completed'
      job['url'] = url
      job['completed_at'] = time.time()
    if email:
      _notify_user(email, goal, url)
  except Exception as e:
    with _LOCK:
      job['status'] = 'failed'
      job['error'] = str(e)
      job['completed_at'] = time.time()

@visual_bp.route('/api/visual/job/text', methods=['POST'])
def enqueue_text_video():
  data = request.get_json(silent=True) or {}
  text = data.get('text')
  user_email = data.get('user_email')
  label = data.get('label') or (text[:40] if text else '')
  if not text:
    return jsonify({'error': "'text' is required"}), 400
  job_id = uuid.uuid4().hex
  job = {'id': job_id, 'status': 'queued', 'payload': {'mode':'text','text':text,'user_email':user_email,'label':label}, 'created_at': time.time()}
  with _LOCK:
    _VIDEO_JOBS[job_id] = job
  threading.Thread(target=_run_video_job, args=(job_id,), daemon=True).start()
  return jsonify({'job_id': job_id, 'status': 'queued'})

@visual_bp.route('/api/visual/job/pdf', methods=['POST'])
def enqueue_pdf_video():
  data = request.get_json(silent=True) or {}
  pdf_url = data.get('pdf_url')
  user_email = data.get('user_email')
  label = data.get('label') or (pdf_url[:40] if pdf_url else '')
  if not pdf_url:
    return jsonify({'error': "'pdf_url' is required"}), 400
  job_id = uuid.uuid4().hex
  job = {'id': job_id, 'status': 'queued', 'payload': {'mode':'pdf','pdf_url':pdf_url,'user_email':user_email,'label':label}, 'created_at': time.time()}
  with _LOCK:
    _VIDEO_JOBS[job_id] = job
  threading.Thread(target=_run_video_job, args=(job_id,), daemon=True).start()
  return jsonify({'job_id': job_id, 'status': 'queued'})

@visual_bp.route('/api/visual/job/audio', methods=['POST'])
def enqueue_audio_video():
  data = request.get_json(silent=True) or {}
  audio_url = data.get('audio_url')
  transcript = data.get('transcript')
  user_email = data.get('user_email')
  label = data.get('label') or 'Audio Generation'
  if not audio_url and not transcript:
    return jsonify({'error': "Provide 'audio_url' or 'transcript'"}), 400
  job_id = uuid.uuid4().hex
  job = {'id': job_id, 'status': 'queued', 'payload': {'mode':'audio','audio_url':audio_url,'transcript':transcript,'user_email':user_email,'label':label}, 'created_at': time.time()}
  with _LOCK:
    _VIDEO_JOBS[job_id] = job
  threading.Thread(target=_run_video_job, args=(job_id,), daemon=True).start()
  return jsonify({'job_id': job_id, 'status': 'queued'})

@visual_bp.route('/api/visual/job/<job_id>', methods=['GET'])
def get_video_job(job_id: str):
  with _LOCK:
    job = _VIDEO_JOBS.get(job_id)
  if not job:
    return jsonify({'error': 'job not found'}), 404
  # Copy safe subset
  public = {k: v for k, v in job.items() if k not in {'payload'}}
  if 'payload' in job:
    public['label'] = job['payload'].get('label')
  return jsonify(public)


@visual_bp.route("/api/visual/text-to-video", methods=["POST"])
def text_to_video():
  """Create a video from raw text.

  Expected JSON: {"text": "..."}
  Steps:
    - Use Vertex AI to extract key moments and image prompts
    - Generate AI images, synthesize TTS, render captions, merge clips
    - Upload final video to Cloudinary and return the secure URL
  """
  data = request.get_json(silent=True) or {}
  text = data.get("text")
  if not text:
    return jsonify({"error": "'text' is required"}), 400
  try:
    # util already uploads and returns Cloudinary URL (if configured)
    url_or_path = generate_video_from_transcript_text(text)
    return jsonify({"url": url_or_path})
  except NotImplementedError as nie:
    return jsonify({"error": str(nie)}), 501
  except Exception as e:
    return jsonify({"error": str(e)}), 500


@visual_bp.route("/api/visual/pdf-url-to-video", methods=["POST"])
def pdf_url_to_video():
  """Create a video from a PDF URL.

  Expected JSON: {"pdf_url": "https://..."}
  Steps:
    - Download PDF and extract text
    - Reuse the text-to-video pipeline
    - Upload final video to Cloudinary and return the secure URL
  """
  data = request.get_json(silent=True) or {}
  pdf_url = data.get("pdf_url")
  if not pdf_url:
    return jsonify({"error": "'pdf_url' is required"}), 400
  try:
    text = extract_text_from_pdf_url(pdf_url)
    url_or_path = generate_video_from_transcript_text(text)
    return jsonify({"url": url_or_path})
  except Exception as e:
    return jsonify({"error": str(e)}), 500


@visual_bp.route("/api/visual/audio-url-to-video", methods=["POST"])
def audio_url_to_video():
  """Create a video from an audio URL.

  Expected JSON: {"audio_url": "https://..."} OR {"transcript": "..."}
  Steps:
    - If transcript provided, use it directly
    - Else (future) transcribe the audio URL to text
    - Reuse the text-to-video pipeline
    - Upload final video to Cloudinary and return the secure URL
  """
  data = request.get_json(silent=True) or {}
  transcript = data.get("transcript")
  audio_url = data.get("audio_url")
  if not transcript and not audio_url:
    return jsonify({"error": "Provide either 'transcript' or 'audio_url'"}), 400
  try:
    if not transcript:
      transcript = extract_text_from_audio_url(audio_url)
      if not transcript:
        return jsonify({"error": "Transcription produced empty text"}), 422
    url_or_path = generate_video_from_transcript_text(transcript)
    return jsonify({"url": url_or_path})
  except Exception as e:
    return jsonify({"error": str(e)}), 500
