# TSFaaS - Time Series Forecasting as a Service
Forecastly — Time Series Forecasting as a Service (TSFaaS)

Forecastly is a full-stack SaaS platform that allows any user to upload a time-series CSV file and instantly obtain high-quality forecasts using modern statistical and machine-learning models.

The objective is to build a simple, beautiful, scalable forecasting service with:
	•	CSV upload
	•	Intelligent preprocessing
	•	Multiple forecasting models
	•	Background job processing
	•	Interactive charts
	•	API access
	•	Exportable results
	•	Professional UI/UX
	•	Authentication + billing (later phase)

This README serves as the complete specification for Cursor to understand the product vision, system architecture, implementation details, coding rules, and development workflow.

⸻

Core Product Vision

Let anyone—without coding or ML knowledge—upload a CSV and instantly get reliable forecasts, charts, insights, and downloadable reports.

No Python.
No notebooks.
No statistics knowledge needed.

Users should experience a polished SaaS tool that feels modern and intuitive.

⸻

High-Level Features (MVP)

✔ Upload any time-series CSV

Detect time column, target column, optional exogenous features.

✔ Automatic preprocessing

Parse dates, validate structure, handle missing values, resample if needed.

✔ Forecasting models (MVP versions)
	•	ARIMA / AutoARIMA
	•	ETS (Exponential Smoothing)
	•	XGBoost with lag features
	•	Model comparison (MAE, RMSE)

✔ Background jobs

Long-running tasks handled by Redis + RQ workers.

✔ Beautiful UI

Modern Next.js + Tailwind interface including file upload, column selection, results dashboard, and chart visualizations.

✔ Export and download
	•	Download forecast CSV
	•	Download chart
	•	Optional PDF report (later)

✔ REST API

Upload → run job → get result JSON.

✔ Clean architecture

Modular, documented, production-ready code.
┌────────────────────┐       ┌────────────────────┐
│      FRONTEND       │       │        BACKEND      │
│  Next.js + Tailwind │ <---->│  FastAPI (Uvicorn)  │
└────────────────────┘       └────────────────────┘
           │                           │
           ▼                           ▼
 ┌────────────────────┐     ┌────────────────────┐
 │   File Storage      │     │  Background Worker │
 │ (S3 / MinIO local)  │     │   Redis + RQ        │
 └────────────────────┘     └────────────────────┘
           │                           │
           ▼                           ▼
 ┌────────────────────┐     ┌────────────────────┐
 │     Postgres        │     │  ML Models & Logic │
 │ (Job state, users)  │     │ ARIMA, ETS, XGB etc │
 └────────────────────┘     └────────────────────┘
 Tech Stack

Frontend
	•	Next.js (App Router)
	•	TypeScript
	•	Tailwind CSS
	•	React Query (optional)
	•	Recharts (interactive charts)
	•	Axios (API communication)

Backend
	•	Python 3.11
	•	FastAPI
	•	Uvicorn
	•	Pandas, NumPy
	•	Statsmodels (ARIMA/ETS)
	•	Pmdarima (AutoARIMA)
	•	XGBoost
	•	Redis + RQ for background jobs
	•	boto3 or google-cloud-storage depending on provider
	•	SQLAlchemy + Postgres (later)

Infrastructure
	•	Docker & docker-compose
	•	Postgres for job metadata
	•	Redis for background task queue
	•	MinIO for local S3-compatible storage
	•	GitHub Actions CI
	•	Deployment: Render / Railway / Fly.io
Backend API Specification (MVP)

POST /api/upload

Upload CSV file
→ Save file in S3/MinIO
→ Return:
{
  "job_id": "uuid",
  "columns": ["date", "sales", "visitors"],
  "detected_time_column": "date",
  "preview": [ ... first 10 rows ... ]
}
POST /api/forecast

Body:
{
  "job_id": "...",
  "time_column": "date",
  "target_column": "sales",
  "exogenous": ["visitors"],
  "horizon": 14,
  "model": "auto"
}
Frontend Requirements

Upload Page (/upload)
	•	Drag & drop or file picker
	•	Display column preview
	•	Show detected time column
	•	“Continue” button

Column Selection Page
	•	Choose target column
	•	(Optional) choose exogenous columns
	•	Choose horizon
	•	Submit forecast job

Results Page
	•	Large interactive time-series chart
	•	Model comparison (tabs)
	•	Export CSV
	•	Export chart
	•	Summary metrics
	•	Plain-English explanation of trends

⸻

🔐 Future Phases (not for MVP)
	•	User authentication
	•	Stripe billing
	•	API keys
	•	Saved projects
	•	Scheduled forecasts
	•	Email reports
	•	Multi-tenant support

⸻

📦 Development Workflow (Cursor Rules)

General Rules
	•	Use type hints everywhere
	•	Use modular functions, avoid god-classes
	•	Use async FastAPI endpoints where appropriate
	•	Keep preprocessing and model logic in ml/ folder
	•	No heavy managed ML platforms for MVP
	•	Use environment variables for secrets (.env)
	•	Keep container images small
	•	Make everything reproducible

Branching
	•	main = stable
	•	feature/* = work branches
	•	Cursor should always create PRs from feature branches

PR Quality Requirements
	•	Must include at least 1–2 basic tests
	•	Must update README if behavior changes
	•	Must run CI successfully
	•	Code must follow PEP8 / Prettier

⸻

🚀 Local Development (Required)

After scaffold is created, these commands must work:
docker-compose up --build
When Cursor reads this README, it should:

Phase 1 — Scaffold
	•	Generate backend skeleton
	•	Generate frontend skeleton
	•	Create docker-compose
	•	Create initial tests
	•	Create CI workflow

Phase 2 — Implement
	•	Preprocessing logic
	•	Model manager stub
	•	Background workers
	•	API routes
	•	Upload page
	•	Results page with placeholder chart

Phase 3 — Polish
	•	Beautiful UI
	•	Chart integration
	•	Export logic
	•	Documentation updates

⸻

🎯 Final Statement

Forecastly is a modern, polished time-series forecasting SaaS that prioritizes simplicity, fast insights, and an exceptional user interface. The system should be designed for ease of use, maintainability, and future monetization.

The instructions above describe every architectural component, required UX behavior, backend API, and development workflow needed for Cursor to confidently generate and evolve the entire application.


