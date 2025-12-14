# Integration Guide: intfrontend with Backend API

This guide explains how the `intfrontend` directory integrates with your FastAPI backend.

## Overview

The `intfrontend` directory contains React/Next.js components that have been converted from a React Router setup to Next.js and integrated with your actual backend API endpoints.

## File Structure

```
intfrontend/
├── Layout.tsx                    # Main layout component with navigation
├── components/
│   └── forecast/
│       ├── FileUploader.tsx     # CSV file upload component
│       ├── DataPreview.tsx       # Data preview table
│       ├── ColumnSelector.tsx   # Forecast configuration form
│       ├── ForecastChart.tsx    # Results visualization
│       ├── MetrixCard.tsx       # Metrics display
│       ├── InsightsPanel.tsx    # AI insights display
│       └── ExportButtons.tsx    # Export functionality
├── pages/
│   ├── Home.tsx                 # Landing page
│   ├── Upload.tsx              # File upload page
│   ├── Configure.tsx           # Forecast configuration page
│   ├── Dashboard.tsx           # Jobs dashboard
│   └── Results.tsx             # Forecast results page
└── entities/
    └── ForecastJob             # JSON schema (reference only)
```

## API Integration

All API calls use the `api` client from `/lib/api.ts` which connects to your FastAPI backend.

### API Endpoints Used

1. **Upload Endpoint** (`POST /api/upload`)
   - Used in: `pages/Upload.tsx`
   - Uploads CSV file and receives job_id, columns, preview data

2. **Get Upload Info** (`GET /api/upload/{job_id}`)
   - Used in: `pages/Configure.tsx`
   - Retrieves upload metadata for configuration

3. **Create Forecast** (`POST /api/forecast`)
   - Used in: `pages/Configure.tsx`
   - Creates forecast job with configuration

4. **Get Forecast Status** (`GET /api/forecast/{forecast_id}/status`)
   - Used in: `pages/Results.tsx`
   - Polls for forecast job status

5. **Get Forecast Results** (`GET /api/forecast/{forecast_id}`)
   - Used in: `pages/Results.tsx`
   - Retrieves completed forecast results

## How to Integrate into Your Next.js App

### Step 1: Create Next.js Pages

Create the following pages in your `app/` directory:

```typescript
// app/home/page.tsx
import Layout from '@/intfrontend/Layout';
import Home from '@/intfrontend/pages/Home';

export default function HomePage() {
  return (
    <Layout>
      <Home />
    </Layout>
  );
}

// app/upload/page.tsx
import Layout from '@/intfrontend/Layout';
import Upload from '@/intfrontend/pages/Upload';

export default function UploadPage() {
  return (
    <Layout>
      <Upload />
    </Layout>
  );
}

// app/configure/page.tsx
import Layout from '@/intfrontend/Layout';
import Configure from '@/intfrontend/pages/Configure';

export default function ConfigurePage() {
  return (
    <Layout>
      <Configure />
    </Layout>
  );
}

// app/dashboard/page.tsx
import Layout from '@/intfrontend/Layout';
import Dashboard from '@/intfrontend/pages/Dashboard';

export default function DashboardPage() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

// app/results/page.tsx
import Layout from '@/intfrontend/Layout';
import Results from '@/intfrontend/pages/Results';

export default function ResultsPage() {
  return (
    <Layout>
      <Results />
    </Layout>
  );
}
```

### Step 2: Update Root Layout (Optional)

If you want to use the Layout component globally, update `app/layout.tsx`:

```typescript
import Layout from '@/intfrontend/Layout';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}
```

### Step 3: Configure API Base URL

Set the `NEXT_PUBLIC_API_URL` environment variable in your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Step 4: Install Required Dependencies

Ensure these packages are installed:

```bash
npm install axios recharts papaparse sonner lucide-react date-fns
npm install -D @types/papaparse
```

## Data Flow

### 1. Upload Flow
```
User uploads CSV
  ↓
FileUploader component
  ↓
POST /api/upload
  ↓
Receive job_id, columns, preview
  ↓
Store in localStorage
  ↓
Navigate to Configure page
```

### 2. Configuration Flow
```
Load upload data from API/localStorage
  ↓
User selects columns and parameters
  ↓
POST /api/forecast
  ↓
Receive forecast_id
  ↓
Navigate to Results page
```

### 3. Results Flow
```
Poll GET /api/forecast/{forecast_id}/status
  ↓
When status === 'completed'
  ↓
GET /api/forecast/{forecast_id}
  ↓
Display results, metrics, chart
```

## Key Features

### State Management
- Uses React hooks (`useState`, `useEffect`)
- Stores temporary data in `localStorage` for navigation between pages
- In production, consider using a state management library or API-based storage

### Error Handling
- Uses `sonner` for toast notifications
- Try-catch blocks around all API calls
- User-friendly error messages

### Polling
- Results page polls for forecast completion every 2 seconds
- Automatically stops after 5 minutes
- Shows loading state during polling

## Customization

### Styling
- All components use Tailwind CSS
- UI components in `/components/ui/` can be customized
- Color scheme uses blue/purple gradients

### Adding Features
- Export functionality is partially implemented
- AI insights panel is ready but needs backend integration
- Dashboard currently uses localStorage (should be replaced with API)

## Backend Requirements

Your backend must:
1. Accept CSV uploads at `/api/upload`
2. Return job_id, columns, preview data
3. Accept forecast requests at `/api/forecast`
4. Return forecast_id and status
5. Provide status polling endpoint
6. Return forecast results when completed

## Testing

1. Start your backend: `cd backend && uvicorn app.main:app --reload`
2. Start Next.js: `cd frontend && npm run dev`
3. Navigate to `http://localhost:3000/home`
4. Upload a CSV file and follow the flow

## Troubleshooting

### CORS Issues
If you see CORS errors, ensure your FastAPI backend has CORS middleware configured:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API Connection Issues
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running
- Check browser console for errors

### Type Errors
- Ensure TypeScript is properly configured
- Check that all imports use correct paths
- Verify UI components exist in `/components/ui/`

## Next Steps

1. Replace localStorage with proper API endpoints for job management
2. Implement proper authentication if needed
3. Add error boundaries for better error handling
4. Implement export functionality (CSV, charts, PDF)
5. Add unit tests for components
6. Optimize polling mechanism (consider WebSockets for real-time updates)
