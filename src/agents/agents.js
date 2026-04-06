const { callLLM } = require("./llm.js");
const { runAgentWithTools } = require("../mcp/toolExecutor.js");

const TECHNICAL_SYSTEM_PROMPT = `
You are a Senior Technical Interviewer.

ROLE:
- Conduct a technical interview
- Ask adaptive and deep technical questions
- Analyze answers critically

RULES:
- Ask ONLY one question at a time
- Do NOT explain answers
- Adjust difficulty dynamically
- Stay strictly in interviewer role

TOOLS AVAILABLE:
- skill_gap(input)
- resource_fetch(input)

If a tool is needed, respond EXACTLY:
TOOL_CALL: tool_name | input
`;

const HR_SYSTEM_PROMPT = `
You are an HR Interviewer.

ROLE:
- Evaluate communication, clarity, and personality
- Ask behavioral and situational questions

RULES:
- Ask one question at a time
- Stay in interviewer role
- Do not provide answers or guidance
`;

const EVALUATION_SYSTEM_PROMPT = `
You are a Hiring Evaluation AI.

Analyze the full interview and return the following schema format:

{
  "technical_score": number,
  "communication_score": number,
  "strengths": [],
  "weaknesses": [],
  "verdict": "Hire" | "No Hire",
  "confidence": number
}

Be objective, critical, and unbiased.
`;

const RECOMMENDATION_SYSTEM_PROMPT = `
You are a Career Coach AI.

Use tools if needed.

Return the following schema format:

{
  "skill_gaps": [],
  "roadmap": [],
  "resources": [],
  "projects": []
}
`;

const CRITIC_SYSTEM_PROMPT = `
You are a strict AI Critic.

ROLE:
- Analyze evaluation decisions
- Identify weak reasoning or bias
- Challenge conclusions if needed

OUTPUT:
- Issues in evaluation
- Suggested improvements
- Reliability of decision
`;

// 🔹 Technical Interview Agent (with tool usage)
async function technicalAgent(context) {
  return await runAgentWithTools([
    {
      role: "system",
      content: TECHNICAL_SYSTEM_PROMPT
    },
    ...context
  ]);
}

// 🔹 HR Interview Agent
async function hrAgent(context) {
  return await callLLM([
    {
      role: "system",
      content: HR_SYSTEM_PROMPT
    },
    ...context
  ]);
}

// 🔹 Evaluation Agent (EXPECTS STRICT JSON)
async function evaluationAgent(context) {
  const result = await callLLM([
    {
      role: "system",
      content: EVALUATION_SYSTEM_PROMPT
    },
    ...context
  ], true); // true = expect JSON
  return result.replace(/```json/g, "").replace(/```/g, "").trim();
}

// 🔹 Recommendation Agent (with tools and EXPECTS JSON)
async function recommendationAgent(context) {
  // Recommendation uses tools FIRST, but returns JSON at the end.
  // runAgentWithTools currently calls LLM without the expectJson flag.
  // So we pass the prompt, and if we just want JSON out, runAgentWithTools 
  // might need adjustments. Let's just run it standard, then instruct it to output JSON.
  // Since we want native JSON from runAgentWithTools we'd need to modify it or just stick to string parsing.
  // Actually, runAgentWithTools handles tool looping. At the final step, it returns the string.
  // Let's use strict JSON prompt instructions here for reliability, we can't easily turn on native JSON 
  // mid-loop if a tool is called.
  return await runAgentWithTools([
    {
      role: "system",
      content: RECOMMENDATION_SYSTEM_PROMPT
    },
    ...context
  ]);
}

// 🔹 Critic Agent (meta reasoning)
async function criticAgent(context) {
  return await callLLM([
    {
      role: "system",
      content: CRITIC_SYSTEM_PROMPT
    },
    ...context
  ]);
}

module.exports = {
  TECHNICAL_SYSTEM_PROMPT,
  HR_SYSTEM_PROMPT,
  EVALUATION_SYSTEM_PROMPT,
  RECOMMENDATION_SYSTEM_PROMPT,
  CRITIC_SYSTEM_PROMPT,
  technicalAgent,
  hrAgent,
  evaluationAgent,
  recommendationAgent,
  criticAgent
};