const { callLLM } = require("./llm.js");

async function insightAgent(messages) {
  const systemPrompt = `
You are an AI skill analyzer.

Format:
{
  "skills": [],
  "weaknesses": [],
  "topics": [],
  "confidence": "low | medium | high"
}

Rules:
- Skills = strong demonstrated abilities
- Weaknesses = mistakes, gaps, confusion
- Topics = technical areas
- Confidence = how confident candidate seems
`;

  // Provide 'true' to signal native JSON mode
  const response = await callLLM([
    { role: "system", content: systemPrompt },
    ...messages
  ], true);

  // Still clean if somehow Gemini wraps it in standard markdown blocks despite MimeType
  const cleaned = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return cleaned;
}

module.exports = { insightAgent };