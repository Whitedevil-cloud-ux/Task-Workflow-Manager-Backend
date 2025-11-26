const router = require("express").Router();
const auth = require("../Middlewares/AuthMiddleware");
const {
    getComments,
    addComment,
    updateComment, 
    deleteComment,
} = require("../Controllers/CommentController");

router.get("/:taskId", auth, getComments);
router.post("/:taskId", auth, addComment);
router.put("/edit/:id", auth, updateComment);
router.delete("/delete/:id", auth, deleteComment);

module.exports = router;