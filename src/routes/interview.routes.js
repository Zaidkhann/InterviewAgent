const express = require("express");
const router = express.Router();

const { orchestrator } = require("../agents/orchestrator");

router.get("/", (req, res) => {
  res.json({ message: "Interview API running 🚀" });
});

router.post("/start", async (req, res) => {
  try {
    const { sessionId, candidate } = req.body;

    if (!sessionId || !candidate) {
      return res.status(400).json({
        error: "sessionId and candidate are required"
      });
    }

    const result = await orchestrator.startInterview(
      sessionId,
      candidate
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start interview" });
  }
});

router.post("/answer", async (req, res) => {
  try {
    const { sessionId, answer } = req.body;

    if (!sessionId || typeof answer !== "string") {
      return res.status(400).json({
        error: "Invalid sessionId or answer"
      });
    }

    const result = await orchestrator.nextQuestion(
      sessionId,
      answer
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process answer" });
  }
});

router.post("/hr", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId required"
      });
    }

    const result = await orchestrator.hrRound(sessionId);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed HR round" });
  }
});

router.post("/end", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId required"
      });
    }

    const result = await orchestrator.endInterview(sessionId);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to end interview" });
  }
});

router.post("/recommendations", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId required"
      });
    }

    const result = await orchestrator.getRecommendations(
      sessionId
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const { Session } = require("../models/session.model");
    const totalInterviews = await Session.countDocuments();
    const completedInterviews = await Session.countDocuments({
      "conversation.agent": "evaluation"
    }); // rough metric

    res.json({
      totalInterviews,
      completedInterviews,
      status: "Operational"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

module.exports = router;