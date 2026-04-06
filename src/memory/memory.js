const { Session } = require("../models/session.model.js");

function mergeUnique(arr1 = [], arr2 = []) {
  return [...new Set([...(arr1 || []), ...(arr2 || [])])];
}

class Memory {
  async createSession(sessionId, candidate) {
    return await Session.create({
      sessionId,
      candidate,
      conversation: [],
      insights: {
        skills: [],
        weaknesses: [],
        strengths: []
      }
    });
  }

  async getSession(sessionId) {
    return await Session.findOne({ sessionId });
  }

  async addMessage(sessionId, message) {
    return await Session.updateOne(
      { sessionId },
      {
        $push: { conversation: message }
      }
    );
  }

  async updateLastAnswer(sessionId, answer) {
    const session = await this.getSession(sessionId);

    if (!session || session.conversation.length === 0) return;

    const lastIndex = session.conversation.length - 1;
    session.conversation[lastIndex].answer = answer;

    await session.save();
  }

  async addInsight(sessionId, insight) {
    const session = await this.getSession(sessionId);

    if (!session) return;

    session.insights.skills = mergeUnique(
      session.insights.skills,
      insight.skills
    );

    session.insights.weaknesses = mergeUnique(
      session.insights.weaknesses,
      insight.weaknesses
    );

    session.insights.topics = mergeUnique(
      session.insights.topics,
      insight.topics
    );

    session.insights.confidence = insight.confidence || session.insights.confidence;

    await session.save();
  }

  async clearSession(sessionId) {
    return await Session.deleteOne({ sessionId });
  }
}

module.exports = { memory: new Memory() };