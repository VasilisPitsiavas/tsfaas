# 🚀 Quick Start Guide

## Prerequisites

- Docker Desktop installed and running
- Git (optional)

## Running the Application

### Start All Services

```bash
# From project root
docker-compose up -d
```

This starts all 6 services:
- ✅ Backend API (http://localhost:8000)
- ✅ Frontend (http://localhost:3000)
- ✅ Worker (background jobs)
- ✅ Redis (job queue)
- ✅ PostgreSQL (database)
- ✅ MinIO (file storage)

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

### Stop Services

```bash
docker-compose down
```

## Testing the Application

1. Open http://localhost:3000/upload
2. Upload a CSV file (use `sample_data/ecommerce_sales.csv`)
3. Configure forecast parameters
4. View results with charts and metrics

## Monitoring Logs

```bash
# Watch all logs
docker-compose logs -f

# Watch specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f worker
```

## Troubleshooting

### Backend not responding
```bash
docker-compose restart backend
docker-compose logs backend
```

### Frontend not loading
```bash
docker-compose restart frontend
docker-compose logs frontend
```

### Check service status
```bash
docker-compose ps
```

## Manual Setup (Alternative)

See `README.md` for manual setup instructions without Docker.
