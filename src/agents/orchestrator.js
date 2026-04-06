const {
  technicalAgent,
  hrAgent,
  evaluationAgent,
  recommendationAgent,
  criticAgent
} = require("./agents");

const { memory } = require("../memory/memory");
const { insightAgent } = require("./insightAgent");

function retrieveRelevantContext(session) {
  const skills = session?.insights?.skills || [];
  const weaknesses = session?.insights?.weaknesses || [];
  const confidence = session?.insights?.confidence || "medium";
  const conversation = session?.conversation || [];

  return `
KEY INSIGHTS:
Skills: ${skills.join(", ") || "None"}
Weaknesses: ${weaknesses.join(", ") || "None"}
Confidence: ${confidence}

RECENT INTERACTIONS:
${conversation
    .slice(-3)
    .map(
      (c, i) => `Q${i + 1}: ${c.question}\nA${i + 1}: ${c.answer || "No answer"}`
    )
    .join("\n\n") || "None"}
`;
}

function getDifficulty(session) {
  const confidence = session?.insights?.confidence || "medium";
  const weak = (session?.insights?.weaknesses || []).length;

  if (confidence === "low" || weak > 3) return "easy";
  if (confidence === "medium") return "medium";
  return "hard";
}

function safeJSONParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { error: "Invalid JSON", raw: text };
  }
}

class Orchestrator {
  async startInterview(sessionId, candidate) {
    await memory.createSession(sessionId, candidate);

    const session = await memory.getSession(sessionId);
    const smartContext = retrieveRelevantContext(session);

    const context = `
CANDIDATE PROFILE:
${JSON.stringify(candidate)}

SMART CONTEXT:
${smartContext}

TASK:
Start a technical interview with an appropriate question.
`;

    const question = await technicalAgent([
      { role: "user", content: context }
    ]);

    await memory.addMessage(sessionId, {
      question,
      answer: null,
      agent: "technical"
    });

    return { question };
  }

  async nextQuestion(sessionId, answer) {
    await memory.updateLastAnswer(sessionId, answer);

    try {
      const insightRaw = await insightAgent([
        { role: "user", content: answer }
      ]);

      const insight = safeJSONParse(insightRaw);

      if (
        insight &&
        Array.isArray(insight.skills) &&
        Array.isArray(insight.weaknesses)
      ) {
        await memory.addInsight(sessionId, {
          skills: insight.skills || [],
          weaknesses: insight.weaknesses || [],
          topics: insight.topics || [],
          confidence: insight.confidence || "medium"
        });
      } else {
        console.warn("Invalid insight format:", insightRaw);
      }
    } catch (err) {
      console.error("Insight extraction failed:", err);
    }

    const session = await memory.getSession(sessionId);
    const smartContext = retrieveRelevantContext(session);
    const difficulty = getDifficulty(session);

    const context = `
CANDIDATE PROFILE:
${JSON.stringify(session.candidate)}

SMART CONTEXT:
${smartContext}

DIFFICULTY: ${difficulty}

TASK:
Ask the next best technical question based on weaknesses and previous answers.
`;

    const question = await technicalAgent([
      { role: "user", content: context }
    ]);

    await memory.addMessage(sessionId, {
      question,
      answer: null,
      agent: "technical"
    });

    return { question };
  }

  async hrRound(sessionId) {
    const session = await memory.getSession(sessionId);
    const smartContext = retrieveRelevantContext(session);

    const context = `
CANDIDATE PROFILE:
${JSON.stringify(session.candidate)}

SMART CONTEXT:
${smartContext}

TASK:
Ask a behavioral question based on candidate personality and responses.
`;

    const question = await hrAgent([
      { role: "user", content: context }
    ]);

    await memory.addMessage(sessionId, {
      question,
      answer: null,
      agent: "hr"
    });

    return { question };
  }

  async endInterview(sessionId) {
    const session = await memory.getSession(sessionId);

    const context = `
FULL INTERVIEW TRANSCRIPT:
${JSON.stringify(session.conversation)}

TASK:
Evaluate the candidate thoroughly.
`;

    const evaluationRaw = await evaluationAgent([
      { role: "user", content: context }
    ]);

    const evaluation = safeJSONParse(evaluationRaw);

    const critique = await criticAgent([
      {
        role: "user",
        content: `Analyze this evaluation:\n${evaluationRaw}`
      }
    ]);

    return {
      evaluation,
      critique
    };
  }

  async getRecommendations(sessionId) {
    const session = await memory.getSession(sessionId);

    const smartContext = retrieveRelevantContext(session);

    const context = `
INTERVIEW SUMMARY:
${JSON.stringify(session.conversation)}

SMART CONTEXT:
${smartContext}

TASK:
Identify skill gaps and generate a learning roadmap.
`;

    const recommendationRaw = await recommendationAgent([
      { role: "user", content: context }
    ]);

    return safeJSONParse(recommendationRaw);
  }

  async getSession(sessionId) {
    return await memory.getSession(sessionId);
  }
}

module.exports = { orchestrator: new Orchestrator() };