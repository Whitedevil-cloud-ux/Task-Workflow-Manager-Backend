const router = require("express").Router();
const auth = require("../Middlewares/AuthMiddleware");
const { getActivities } = require("../Controllers/ActivityController");

router.get("/", auth, getActivities);

module.exports = router;
