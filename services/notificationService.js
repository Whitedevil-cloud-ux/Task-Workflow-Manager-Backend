const Notification = require("../models/notification");

exports.pushNotification = async (userId, message, taskId = null) => {
    try {
        const created = await Notification.create({
            userId, 
            message,
            taskId
        });
    
    // Emit real-time notification
    if (global.io) {
      global.io.to(userId.toString()).emit("notification", created);
    }

    return created;
    } catch (error) {
        console.error("Error pushing notification: ", error);
        throw error;
    }
};