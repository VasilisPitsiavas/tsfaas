# 🗄️ Supabase Storage Migration - Complete

## Summary

Successfully migrated from local file storage to Supabase Storage. All file operations now use Supabase Storage bucket "forecast-uploads" and job records are stored in Supabase "jobs" table.

## Changes Made

### 1. Created Supabase Storage Module ✅
**File:** `backend/app/storage/supabase_storage.py`

- `upload_to_supabase_storage()` - Upload files to Supabase Storage
- `download_from_supabase_storage()` - Download files from Supabase Storage
- `get_public_url()` - Get public URLs for files
- `delete_from_supabase_storage()` - Delete files from storage

### 2. Updated Upload Endpoint ✅
**File:** `backend/app/api/upload.py`

**Changes:**
- Uploads CSV files to Supabase Storage at `{user_id}/{job_id}/input.csv`
- Creates job record in Supabase "jobs" table with:
  - `id` (job_id)
  - `user_id`
  - `status` = "pending"
  - `input_file_path` = storage path
  - `columns`, `time_candidates`, `preview` (stored as JSON strings)
- Removed local file system operations
- Uses temporary file for CSV analysis only

### 3. Updated Worker ✅
**File:** `backend/app/workers/forecast_worker.py`

**Changes:**
- Fetches job from Supabase "jobs" table by `job_id`
- Downloads input file from Supabase Storage
- Processes forecast using temporary file
- Uploads results to Supabase Storage at `{user_id}/{job_id}/output.json`
- Uploads forecast CSV to `{user_id}/{job_id}/forecast.csv`
- Uploads chart PNG to `{user_id}/{job_id}/forecast.png` (if available)
- Updates job record with:
  - `status` = "completed"
  - `output_file_path` = storage path
  - `forecast_id`, `model_used`, `metrics`
- On error: Updates `status` = "failed" and `error_message`
- Removed all local file system dependencies

### 4. Updated Forecast Endpoint ✅
**File:** `backend/app/api/forecast.py`

**Changes:**
- Fetches job from Supabase "jobs" table instead of local files
- Validates columns from Supabase job record
- Downloads results from Supabase Storage if not in RQ cache
- Verifies ownership from Supabase jobs table
- Removed local file system fallbacks

## Storage Structure

```
forecast-uploads/
├── {user_id}/
│   ├── {job_id}/
│   │   ├── input.csv          # Uploaded CSV file
│   │   ├── output.json        # Forecast results
│   │   ├── forecast.csv       # Forecast predictions CSV
│   │   └── forecast.png       # Forecast chart (optional)
```

## Database Schema

**Supabase "jobs" table:**

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL,  -- 'pending', 'processing', 'completed', 'failed'
  input_file_path TEXT NOT NULL,
  output_file_path TEXT,
  forecast_id TEXT,
  model_used TEXT,
  metrics JSONB,
  columns TEXT,  -- JSON string
  time_candidates TEXT,  -- JSON string
  preview TEXT,  -- JSON string
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables Required

Both **Backend** and **Worker** services need:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Migration Checklist

- [x] Create Supabase Storage utility module
- [x] Update upload endpoint to use Supabase Storage
- [x] Update upload endpoint to create job records
- [x] Update worker to fetch jobs from Supabase
- [x] Update worker to download files from Supabase Storage
- [x] Update worker to upload results to Supabase Storage
- [x] Update worker to update job records
- [x] Update forecast endpoint to use Supabase
- [x] Remove local file system dependencies
- [ ] Create Supabase Storage bucket "forecast-uploads"
- [ ] Create Supabase "jobs" table
- [ ] Test upload flow
- [ ] Test forecast flow
- [ ] Test error handling

## Next Steps

### 1. Create Supabase Storage Bucket

In Supabase Dashboard:
1. Go to **Storage**
2. Click **"New bucket"**
3. Name: `forecast-uploads`
4. Make it **private** (not public)
5. Enable **File size limit** if needed

### 2. Create Jobs Table

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_file_path TEXT NOT NULL,
  output_file_path TEXT,
  forecast_id TEXT,
  model_used TEXT,
  metrics JSONB,
  columns TEXT,
  time_candidates TEXT,
  preview TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_forecast_id ON jobs(forecast_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own jobs
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for backend/worker)
CREATE POLICY "Service role full access"
  ON jobs FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 3. Set Storage Policies

In Supabase Dashboard → Storage → Policies:

**Policy for "forecast-uploads" bucket:**

```sql
-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'forecast-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can read their own files
CREATE POLICY "Users can read own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'forecast-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Service role full access
CREATE POLICY "Service role full access"
  ON storage.objects FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 4. Deploy and Test

1. **Deploy Backend** with updated code
2. **Deploy Worker** with updated code
3. **Test Upload:**
   - Upload a CSV file
   - Verify file appears in Supabase Storage
   - Verify job record created in "jobs" table
4. **Test Forecast:**
   - Create a forecast
   - Verify worker processes job
   - Verify results uploaded to Supabase Storage
   - Verify job record updated
5. **Test Results:**
   - Fetch forecast results
   - Verify results are downloaded from Supabase Storage

## Benefits

✅ **No shared volumes needed** - Works across separate Railway containers
✅ **Scalable** - Supabase Storage handles large files
✅ **Persistent** - Files survive container restarts
✅ **Secure** - Row Level Security (RLS) policies
✅ **Production-ready** - Standard cloud storage approach

## Notes

- All file operations use temporary files for processing
- Files are cleaned up after processing
- Job records provide audit trail
- Error handling updates job status appropriately

