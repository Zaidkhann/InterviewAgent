const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const { callLLM } = require("../agents/llm.js");
const path = require("path");

let mcpClient = null;

async function getMcpClient() {
  if (mcpClient) return mcpClient;

  console.log("[MCP Client] Spawning Tool Server...");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(__dirname, "mcpServer.js")]
  });

  mcpClient = new Client(
    { name: "interview-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  await mcpClient.connect(transport);
  console.log("[MCP] Connected via SDK to server!");
  return mcpClient;
}

async function runAgentWithTools(messages) {
  const llmResponse = await callLLM(messages);

  // Check if LLM wants to call a tool via prompt format
  const toolCallMatch = llmResponse.match(/TOOL_CALL:\s*([^\s|]+)\s*\|\s*(.*)/);
  if (toolCallMatch) {
    const toolName = toolCallMatch[1].trim();
    let toolInputRaw = toolCallMatch[2].trim();
    
    // Form SDK parameters based on tool signature
    let toolArgs = {};
    if (toolName === "skill_gap") toolArgs = { input: toolInputRaw };
    else if (toolName === "resource_fetch") toolArgs = { topic: toolInputRaw };

    console.log(`[MCP Client] Invoking Server Tool: ${toolName}(${JSON.stringify(toolArgs)})`);
    
    try {
      const client = await getMcpClient();
      
      // Execute standard MCP protocol JSON-RPC request over STDIO
      const response = await client.request(
        { method: "tools/call", params: { name: toolName, arguments: toolArgs } }, 
        require("@modelcontextprotocol/sdk/types.js").CallToolResultSchema
      );
      
      // Extract standard MCP formatting block
      const toolResult = response.content[0].text;
      
      // Append result and call LLM again
      messages.push({ role: "assistant", content: llmResponse });
      messages.push({ role: "system", content: `Tool ${toolName} output: ${toolResult}` });

      return await callLLM(messages);
    } catch (err) {
      console.error("[MCP Protocol Error]", err);
      return llmResponse; // Fallback gracefully if Tool Server fails
    }
  }

  // No tool run, just return response
  return llmResponse;
}

module.exports = { runAgentWithTools };
