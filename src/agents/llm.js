const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest" 
});

const jsonModel = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  generationConfig: { responseMimeType: "application/json" }
});

async function callLLM(messages, expectJson = false) {
  // Convert OpenAI-style messages -> Gemini format
  const prompt = messages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const targetModel = expectJson ? jsonModel : model;
  const result = await targetModel.generateContent(prompt);

  return result.response.text();
}

module.exports = { callLLM, model, jsonModel };