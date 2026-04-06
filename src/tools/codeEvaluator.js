export async function evaluateCode(code) {
  // Simple version (upgrade later)
  let score = 0;

  if (code.includes("function")) score += 2;
  if (code.includes("return")) score += 2;
  if (code.length > 50) score += 2;

  return {
    score,
    feedback: "Basic code quality analysis complete"
  };
}