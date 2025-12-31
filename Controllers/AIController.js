const { enhanceTask, suggestSubtasks } = require("../services/AIService");

exports.enhanceTaskController = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const enhanced = await enhanceTask({ title, description });

    res.json({
      success: true,
      ai: enhanced,
    });

  } catch (error) {
    console.error("AI Enhance Task Error:", error);
    res.status(500).json({
      success: false,
      message: "AI enhancement failed",
    });
  }
};

exports.suggestSubtasksController = async (req, res) => {
  try{
    const {title, description} = req.body;

    if(!title) {
      return res.status(400).json({message: "Title is required"});
    }

    const result = await suggestSubtasks({ title, description });

    res.json({
      success: true,
      subtasks: result.subtasks,
    });
  }catch (error) {
    console.error("AI Subtask Error: ", error);
    res.status(500).json({
      success: false,
      message: "AI subtask generation failed",
    });
  }
};
