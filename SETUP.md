# Setup Guide

## Prerequisites

- Python 3.8+
- Chrome/Edge browser
- pip (Python package manager)

## Step-by-Step Installation

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the server:
```bash
python app.py
```

You should see: `Uvicorn running on http://0.0.0.0:8000`

### Extension Setup

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Toggle "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension` folder from this project
6. Extension icon should appear in toolbar

### Add Icons (Optional)

Create 3 PNG files in `extension/icons/`:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)  
- icon128.png (128x128 pixels)

Use any icon generator or design tool.

## Testing

1. Make sure backend is running (`python app.py`)
2. Open LinkedIn and navigate to any profile
3. Click the extension icon
4. Click "Analyze Profile"
5. View results!

## Troubleshooting

- **Extension not loading**: Check manifest.json for errors
- **Backend not starting**: Ensure port 8000 is free
- **CORS errors**: Backend has CORS enabled, check console logs
- **No data extracted**: LinkedIn may have changed their HTML structure

## Next Steps

- Add AI integration (OpenAI, Anthropic)
- Store analysis history
- Export to PDF reports
- Add more profile insights
