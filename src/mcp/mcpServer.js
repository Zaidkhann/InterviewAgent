#!/usr/bin/env node
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

const server = new Server(
  {
    name: "interview-tools-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "skill_gap",
        description: "Detects skill gaps from candidate input using keywords",
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "string" }
          },
          required: ["input"]
        }
      },
      {
        name: "resource_fetch",
        description: "Fetches training resources URL for a given topic",
        inputSchema: {
          type: "object",
          properties: {
            topic: { type: "string" }
          },
          required: ["topic"]
        }
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "skill_gap") {
    const input = request.params.arguments?.input || "";
    const lowerInput = String(input).toLowerCase();
    let gaps = [];
    if (lowerInput.includes('recursion')) gaps.push('Base case identification', 'Call stack overflow awareness');
    if (lowerInput.includes('system design')) gaps.push('Load balancing strategies', 'Database sharding');
    if (lowerInput.includes('react')) gaps.push('useEffect dependency array management', 'prop drilling avoidance');
    if (lowerInput.includes('node')) gaps.push('Event loop phases', 'Stream handling');
    
    if (gaps.length === 0) {
      gaps = ['Advanced architecture patterns', 'Edge case error handling'];
    }
    
    return {
      content: [{ type: "text", text: `Detected gaps in: ${gaps.join(", ")}` }]
    };
  }

  if (request.params.name === "resource_fetch") {
    const topic = request.params.arguments?.topic || "";
    const encodedTopic = encodeURIComponent(topic || "software engineering");
    const jsonStr = JSON.stringify([
      `LeetCode Search: https://leetcode.com/problemset/all/?search=${encodedTopic}`,
      `YouTube Tutorial: https://www.youtube.com/results?search_query=${encodedTopic}+interview+questions`,
      `GeeksForGeeks: https://www.geeksforgeeks.org/search/?q=${encodedTopic}`,
      `Coursera Courses: https://www.coursera.org/search?query=${encodedTopic}`
    ]);
    return {
      content: [{ type: "text", text: jsonStr }]
    };
  }

  throw new Error("Tool not found");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
