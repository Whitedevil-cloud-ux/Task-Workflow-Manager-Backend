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

function safeJsonParse(text) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

module.exports = { enhanceTask };
