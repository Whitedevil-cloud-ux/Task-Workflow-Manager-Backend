const router = require("express").Router();
const { getAllUsers } = require("../Controllers/UserController");
const auth = require("../Middlewares/AuthMiddleware");

const {
  getMe,
  updateProfile,
  getUserStats,
} = require("../Controllers/UserController");

// Protected route: only logged-in users can fetch user list
router.get("/", auth, getAllUsers);

// PROFILE ROUTES
router.get("/me", auth, getMe);                
router.put("/update-profile", auth, updateProfile);  
router.get("/me/stats", auth, getUserStats);

module.exports = router;
