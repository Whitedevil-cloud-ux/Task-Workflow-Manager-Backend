const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const authRoute = require("./Routes/AuthRoute");
const taskRoutes = require("./Routes/TaskRoute");
const userRoutes = require("./Routes/UserRoute");
const workflowStageRoutes = require("./Routes/WorkflowStageRoute");
const commentRoutes = require("./Routes/CommentRoute");
const activityRoutes = require("./Routes/ActivityRoute");
const notificationRoutes = require("./Routes/NotificationRoute");

// Models
const User = require("./models/user");
const Task = require("./models/task");
const WorkflowStage = require("./models/workflowstage");
const Notification = require("./models/notification");
const Attachment = require("./models/attachment");
const Comment = require("./models/comment");
const Activity = require("./models/activity");


const { MONGO_URL, PORT } = process.env;

mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB is  connected successfully"))
  .catch((err) => console.error(err));

// --- SOCKET.IO SERVER SETUP ---
const http = require("http");
const server = http.createServer(app);

// Initialize sockets
const initSockets = require("./sockets/socket");
initSockets(server);

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT} (with WebSockets)`);
});


app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Backend is working!");
});


app.use(cookieParser());
app.use(express.json());

app.use("/notifications", notificationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/users", userRoutes);
app.use("/workflow-stages", workflowStageRoutes);
app.use("/activity", activityRoutes);

app.use("/", authRoute);