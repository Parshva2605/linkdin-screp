# LinkedIn Profile Analyzer

A Chrome extension + Python backend that extracts and analyzes LinkedIn profiles with AI-powered insights.

## Features

- 🚀 Fast profile extraction from LinkedIn
- 📊 Real-time profile scoring
- 💡 AI-powered insights and recommendations
- 📦 Reusable API for other projects (resume analyzer, job matcher, etc.)
- 🎨 Beautiful, modern UI

## Project Structure

```
linkedin-profile-extractor/
├── extension/              # Chrome Extension
│   ├── manifest.json
│   ├── popup.html/css/js
│   ├── content.js
│   └── background.js
│
└── backend/               # Python FastAPI
    ├── app.py
    ├── analyzer.py
    └── requirements.txt
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on `http://localhost:8000`

### 2. Extension Setup

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder

### 3. Usage

1. Navigate to any LinkedIn profile
2. Click the extension icon
3. Click "Analyze Profile"
4. Get instant insights!

## API Endpoints

- `POST /analyze` - Analyze profile data
- `GET /health` - Health check

## Reusable for Other Projects

The backend API is designed to be modular. Use it for:
- Resume analyzers
- Job matching systems
- Career coaching tools
- Recruitment platforms

Just send profile data to `/analyze` endpoint!
