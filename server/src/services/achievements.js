const { Notification } = require("../models");
const { createAndEmitNotification } = require("./notificationService");

const PARTICIPATION_MILESTONES = [5, 10, 25, 50, 100];
const CREATED_MILESTONES = [5, 10, 25, 50];

async function checkAndNotifyMilestones({
  userId,
  count,
  milestones,
  refType,
  contentFor,
}) {
  for (const threshold of milestones) {
    if (count < threshold) continue;
    const already = await Notification.findOne({
      where: {
        user_id: userId,
        type: "achievement_milestone",
        ref_type: refType,
        ref_id: threshold,
      },
    });
    if (already) continue;

    await createAndEmitNotification({
      userId,
      type: "achievement_milestone",
      content: contentFor(threshold),
      refId: threshold,
      refType,
    });
  }
}

module.exports = {
  PARTICIPATION_MILESTONES,
  CREATED_MILESTONES,
  checkAndNotifyMilestones,
};
