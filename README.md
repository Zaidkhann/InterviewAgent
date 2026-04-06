# AI Interviewer Multi-Agent API

This project is a Model Context Protocol (MCP) powered Multi-Agent Interview system built for hackathons. It uses Gemini native JSON parsing and autonomous tool execution to dynamically assess, interview, and evaluate candidates.

## 🚀 Features
- **Multi-Agent Orchestration**: Technical Agent, HR Agent, Evaluator, and Critic work together.
- **MCP Tool Integration**: Detects skill gaps and dynamically fetches resources during the interview.
- **Robust Schema**: Uses Gemini `responseMimeType: "application/json"` for reliable formatting.
- **Cloud Run Ready**: Dockerized and secured with `helmet` and `cors`.

## 🛠 Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Gemini API Key

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure `.env`**:
   Create a `.env` file in the root directory:
   ```env
   PORT=8080
   MONGODB_URI=mongodb://localhost:27017/interview_agent
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the server**:
   ```bash
   node src/server.js
   ```

## 🌐 API Endpoints

- `GET /api/interview/` - Health check.
- `GET /api/interview/stats` - Database stats dashboard.
- `POST /api/interview/start` - `{"sessionId": "123", "candidate": { "role": "Frontend" }}`
- `POST /api/interview/answer` - `{"sessionId": "123", "answer": "I would use React."}`
- `POST /api/interview/hr` - Start behavioral round
- `POST /api/interview/end` - Evaluate candidate
- `POST /api/interview/recommendations` - Get roadmap and skill gaps

## ☁️ Google Cloud Run Deployment

This API is Docker-ready and can be deployed directly to Google Cloud using the gcloud CLI.

```bash
# 1. Authenticate with Google Cloud
gcloud auth login

# 2. Deploy to Cloud Run
gcloud run deploy interview-agent-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="MONGODB_URI=your_mongo_url,GEMINI_API_KEY=your_gemini_key"
```
