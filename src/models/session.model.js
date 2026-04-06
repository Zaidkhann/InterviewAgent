const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  question: String,
  answer: String,
  agent: String
});

const InsightSchema = new mongoose.Schema({
  skills: [String],
  weaknesses: [String],
  strengths: [String],
  topics: [String],
  confidence: { type: String, default: "medium" }
});

const SessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    candidate: Object,
    conversation: [MessageSchema],
    insights: {
      type: InsightSchema,
      default: {
        skills: [],
        weaknesses: [],
        strengths: [],
        topics: [],
        confidence: "medium"
      }
    }
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", SessionSchema);
module.exports = { Session };