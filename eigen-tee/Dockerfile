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

COPY main.py .

EXPOSE 80

CMD ["python", "main.py"]