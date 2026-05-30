FROM python:3.11-slim

WORKDIR /app

COPY requirements_github_integration.txt .

RUN pip install --no-cache-dir -r requirements_github_integration.txt

COPY supabase_github_integration.py .

EXPOSE 8000

CMD ["uvicorn", "supabase_github_integration:app", "--host", "0.0.0.0", "--port", "8000"]