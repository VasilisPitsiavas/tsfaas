'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    // TODO: Implement file upload to backend
    // - Create FormData
    // - POST to /api/upload
    // - Handle response
    // - Navigate to column selection page
    
    setTimeout(() => {
      setIsUploading(false);
      // Placeholder: navigate to column selection
      // router.push(`/columns?job_id=${uploadResult.job_id}`);
    }, 1000);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload CSV File</h1>
        
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary-500 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {file ? (
            <div>
              <p className="text-lg mb-4">Selected: {file.name}</p>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Continue'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xl mb-4">Drag & drop your CSV file here</p>
              <p className="text-gray-600 mb-4">or</p>
              <label className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer inline-block">
                Browse Files
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* TODO: Display column preview when uploadResult is available */}
      </div>
    </div>
  );
}

