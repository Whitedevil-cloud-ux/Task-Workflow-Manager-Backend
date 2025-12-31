const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function enhanceTask({ title, description }) {
  const prompt = `
You are an AI productivity assistant for a task management system.

Return STRICT JSON ONLY.
NO markdown.
NO backticks.

Keys:
- improvedDescription (string)
- acceptanceCriteria (array of strings)
- suggestedPriority (Low | Medium | High | Critical)
- urgency (Low | Medium | High)

Title: ${title}
Description: ${description || "N/A"}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 400,
  });

  const raw = response.choices[0].message.content;

  try {
    return safeJsonParse(raw);
  } catch (err) {
    console.error("AI RAW RESPONSE:", raw);
    throw new Error("Invalid AI response format");
  }
}

async function suggestSubtasks({ title, description }) {
  const prompt = `
You are an expert software project manager.

Generate 4 to 8 clear, actionable sub-tasks.

Return STRICT JSON ONLY.
NO markdown.
NO explanations.

Format:
{
  "subtasks": ["string", "string"]
}

Task Title: ${title}
Task Description: ${description || "N/A"}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 300,
  });

  const raw = response.choices[0].message.content;
  return safeJsonParse(raw);
}


function safeJsonParse(text) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

module.exports = { enhanceTask, suggestSubtasks };
