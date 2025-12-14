# Infrastructure

This directory contains infrastructure-related files and documentation.

## Services

- **Backend API**: FastAPI application on port 8000
- **Background Worker**: RQ worker for processing forecast jobs
- **Frontend**: Next.js application on port 3000
- **PostgreSQL**: Database for job metadata (port 5432)
- **Redis**: Job queue (port 6379)
- **MinIO**: S3-compatible storage (ports 9000, 9001)

## Running Locally

```bash
docker-compose up --build
```

This will start all services defined in `docker-compose.yml`.

## Environment Variables

See `.env.example` for required environment variables.

