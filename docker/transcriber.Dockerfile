# Scriptune transcriber image (OpenAI Whisper on CPU). Build from the repository root:
#   docker build -f docker/transcriber.Dockerfile -t scriptune-transcriber .
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 WHISPER_MODEL=small WHISPER_DEVICE=cpu
WORKDIR /app
COPY transcriber/requirements.txt ./
RUN pip install -r requirements.txt
COPY transcriber/app.py ./
# Bake the model into the image so the container starts without a download.
RUN python -c "import whisper, os; whisper.load_model(os.environ['WHISPER_MODEL'])"
EXPOSE 5005
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:5005/health').status==200 else 1)"
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5005"]
