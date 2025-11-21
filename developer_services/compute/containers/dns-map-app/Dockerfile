FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY container_src/requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY container_src/ .

# Expose port for Gunicorn
EXPOSE 5000

# Start using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
