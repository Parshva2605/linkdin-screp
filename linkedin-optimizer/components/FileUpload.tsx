'use client';

import { useCallback, useState } from 'react';
import { Upload, FileJson } from 'lucide-react';

interface FileUploadProps {
  onUpload: (data: any) => void;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFile = (file: File) => {
    if (file.type !== 'application/json') {
      alert('Please upload a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setFileName(file.name);
        onUpload(data);
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`relative border-4 border-dashed rounded-2xl p-12 text-center transition-all ${
          dragActive
            ? 'border-white bg-white/20'
            : 'border-gray-600 bg-white/5 hover:bg-white/10 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          accept=".json"
          onChange={handleChange}
          className="hidden"
        />

        <div className="space-y-6">
          <FileJson className="w-16 h-16 mx-auto text-gray-400" />
          
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Upload Your LinkedIn Profile Data
            </h3>
            <p className="text-gray-400">
              Drag & drop your JSON file here
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="h-px bg-gray-700 flex-1"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="h-px bg-gray-700 flex-1"></div>
          </div>

          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Browse Files
          </label>

          <div className="text-sm text-gray-400">
            <p>Download JSON from the Chrome extension first</p>
            <p className="mt-2">
              Extension → Deep Analysis → Export Data
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
        <h4 className="font-semibold mb-3 text-white">📝 How it works:</h4>
        <ol className="space-y-2 text-sm text-gray-400">
          <li>1. Install the LinkedIn Profile Analyzer Chrome extension</li>
          <li>2. Go to any LinkedIn profile and click "Deep Analysis"</li>
          <li>3. Export the JSON data</li>
          <li>4. Upload it here for AI-powered optimization insights</li>
        </ol>
      </div>
    </div>
  );
}
