const router = require("express").Router();
const { getStages, createStage, updateStage, deleteStage, reorderStages } = require("../Controllers/WorkFlowStageController");
const auth = require("../Middlewares/AuthMiddleware");
const { route } = require("./UserRoute");

router.get("/", auth, getStages);
router.post("/", auth, createStage);
router.put("/:id", auth, updateStage);
router.delete("/:id", auth, deleteStage);
router.patch("/reorder", auth, reorderStages);

module.exports = router;
