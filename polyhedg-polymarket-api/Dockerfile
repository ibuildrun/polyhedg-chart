FROM python:3.12-slim

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Remove build dependencies to keep image small
RUN apt-get purge -y gcc libc6-dev && apt-get autoremove -y

# Copy application code
COPY app/ ./app/
COPY data/ ./data/

EXPOSE 80

# Use environment variable for port (default 80)
CMD python -c "import uvicorn; import os; from app.main import app; uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('PORT', '80')))"
