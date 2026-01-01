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

async function explainTaskRisk(riskPayload) {
  const prompt = `
You are a senior project management assistant.

You must explain task risk based ONLY on the provided data.
Do NOT invent facts.
Be concise and actionable.

Return STRICT JSON ONLY.
NO markdown.
NO backticks.
NO explanations outside JSON.

Format:
{
  "summary": "string",
  "reasons": ["string", "string"],
  "suggestedAction": "string"
}

Risk Level: ${riskPayload.level}
Risk Score: ${riskPayload.score}

Task Signals:
- Priority: ${riskPayload.signals.priority}
- Status: ${riskPayload.signals.status}
- Days to Due Date: ${riskPayload.signals.daysToDue ?? "N/A"}
- Days Since Last Activity: ${riskPayload.signals.daysSinceActivity}
- Subtasks Completed: ${riskPayload.signals.completedSubtasks}
- Total Subtasks: ${riskPayload.signals.totalSubtasks}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 250,
  });

  const raw = response.choices[0].message.content;

  try {
    return safeJsonParse(raw);
  } catch (err) {
    console.error("AI RISK EXPLANATION RAW:", raw);
    throw new Error("Invalid AI risk explanation format");
  }
}

async function parseTaskFromText({ text, users }) {
  const userList = users.map(u => `${u.name} (${u._id})`).join(", ");

  const prompt = `
You are an AI task parser.

Extract task details from user text.

Return STRICT JSON ONLY.
NO markdown.
NO explanations.

Format:
{
  "title": "string",
  "description": "string",
  "priority": "Low | Medium | High | Critical",
  "assigneeName": "string or null",
  "dueDate": "ISO date string or null"
}

Available users:
${userList}

User input:
"${text}"
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 300,
  });

  return safeJsonParse(response.choices[0].message.content);
}


function safeJsonParse(text) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

module.exports = { enhanceTask, suggestSubtasks, explainTaskRisk, parseTaskFromText };
