FROM python:3.11-slim

# Korean fonts (NanumGothic) — reporter.py가 참조하는 경로에 정확히 설치됨
# /usr/share/fonts/truetype/nanum/NanumGothic.ttf
RUN apt-get update && \
    apt-get install -y --no-install-recommends fonts-nanum && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PORT=8080
EXPOSE 8080

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
