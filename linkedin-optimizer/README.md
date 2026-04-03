# LinkedIn Profile Optimizer

AI-powered LinkedIn profile optimization website built with Next.js.

## Features

- 📊 Upload LinkedIn profile JSON data
- 🤖 AI analysis using Ollama (local LLM)
- 📝 Post optimization insights
- 💡 Specific, actionable recommendations
- 📥 Export detailed reports

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Ollama

Make sure Ollama is running with CORS enabled:

```powershell
$env:OLLAMA_ORIGINS = "http://localhost:3000"
ollama serve
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Get Profile Data**:
   - Install the LinkedIn Profile Analyzer Chrome extension
   - Go to any LinkedIn profile
   - Click "Deep Analysis"
   - Export the JSON file

2. **Upload & Analyze**:
   - Open this website
   - Upload the JSON file
   - Wait 10-30 seconds for AI analysis
   - View detailed insights

3. **Get Insights**:
   - Profile quality score (0-100)
   - Data quality issues
   - Optimization suggestions
   - Post analysis
   - Priority actions

## What Gets Analyzed

### Profile:
- Name, headline, about section
- Experience (metrics, action verbs)
- Skills and endorsements
- Education
- Network size
- Data quality (junk data detection)

### Posts:
- Content quality and storytelling
- Structure and formatting
- Hashtag usage
- Call-to-action
- Engagement potential
- Specific improvements

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **AI**: Ollama (Qwen 3 8B)
- **Language**: TypeScript

## Project Structure

```
linkedin-optimizer/
├── app/
│   ├── page.tsx          # Main page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── FileUpload.tsx    # File upload component
│   └── AnalysisResults.tsx # Results display
├── lib/
│   └── analyzer.ts       # Ollama integration
└── public/               # Static assets
```

## Configuration

### Ollama Settings

Edit `lib/analyzer.ts` to change:
- Model: `qwen3:8b` (default)
- Temperature: `0.3` (focused analysis)
- Max tokens: `3000` (detailed insights)

### CORS Setup

Ollama needs CORS enabled for browser access:

```powershell
# Set environment variable
[System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', 'http://localhost:3000', 'User')

# Restart Ollama
ollama serve
```

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
vercel deploy
```

Note: Ollama must be accessible from your deployment (use ngrok or similar for remote access).

## Troubleshooting

### "Error analyzing profile"
- Check if Ollama is running: `ollama list`
- Verify CORS: `$env:OLLAMA_ORIGINS` should include your URL
- Check browser console for errors

### Slow Analysis
- First run is slower (model loading)
- Use smaller model: `ollama pull llama3.2`
- Reduce `num_predict` in `lib/analyzer.ts`

### No Insights Showing
- Check JSON file format
- Ensure profile data is complete
- Look at browser console for errors

## Future Enhancements

- [ ] GitHub post generator
- [ ] Before/after comparison
- [ ] Industry benchmarks
- [ ] Automated suggestions
- [ ] Multi-profile analysis
- [ ] Progress tracking

## License

MIT
