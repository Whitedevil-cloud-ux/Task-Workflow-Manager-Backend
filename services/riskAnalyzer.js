function daysBetween(date1, date2) {
    const diff = date1.getTime() - date2.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function analyzeTaskRisk(task, activities = []){
    let score = 0;
    const now = new Date();

    // Deadline Risk (0-40)
    let daysToDue = null;

    if(task.dueDate) {
        daysToDue = daysBetween(new Date(task.dueDate), now);

        if(daysToDue < 0) score += 40;
        else if (daysToDue <= 1) score += 35;
        else if (daysToDue <= 3) score += 25;
        else if (daysToDue <= 7) score += 15;
    }

    // Priority Risk (0-20)
    const priorityMap = {
        Low: 2,
        Medium: 6, 
        High: 12,
        Critical: 20,
    };
    score += priorityMap[task.priority] || 0;

    // Stagnation Risk (0-20)
    let lastActivityAt = task.updatedAt;
    if(activities.length > 0) {
        lastActivityAt = activities[0].createdAt;
    }

    const daysSinceActivity = daysBetween(now, new Date(lastActivityAt));

    if (daysSinceActivity >= 7) score += 20;
    else if (daysSinceActivity >= 3) score += 12;

    // Execution Risk (0-20)
    const totalSubtasks = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter((s) => s.isDone).length || 0;

    if(totalSubtasks > 0 && completedSubtasks === 0) {
        score += 10;
    }
    if(
        task.status === "todo" &&
        daysToDue !== null && 
        daysToDue <= 2
    ){
        score += 10;
    }

    // Normalize
    if(score > 100) score = 100;

    let level = "Low";
    if(score >= 66) level = "High";
    else if (score >= 31) level = "Medium";

    return {
        score,
        level,
        signals: {
            daysToDue,
            priority: task.priority,
            status: task.status,
            daysSinceActivity,
            totalSubtasks,
            completedSubtasks,
        },
    };
}

module.exports = { analyzeTaskRisk };