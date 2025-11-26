const router = require("express").Router();
const auth = require("../Middlewares/AuthMiddleware");
const Notification = require("../models/notification");

// GET notifications
router.get("/", auth, async (req, res) => {
  try {
    const list = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("taskId", "title");

    res.json({ success: true, notifications: list });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// MARK AS READ
router.patch("/:id/read", auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// MARK ALL AS READ
router.patch("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;