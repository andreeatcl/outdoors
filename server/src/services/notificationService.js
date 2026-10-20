const { Notification } = require("../models");

async function createAndEmitNotification({
  userId,
  type,
  content,
  refId,
  refType,
}) {
  const notif = await Notification.create({
    user_id: userId,
    type,
    content,
    ref_id: refId ?? null,
    ref_type: refType ?? null,
  });

  const { getIO } = require("../config/socket");
  const io = getIO();
  if (io) {
    io.to(`user_${userId}`).emit("new_notification", {
      type,
      notification: notif.toJSON(),
    });
  }

  return notif;
}

async function hasUnreadNotification({ userId, type, refId, refType }) {
  const existing = await Notification.findOne({
    where: {
      user_id: userId,
      type,
      ref_id: refId,
      ref_type: refType,
      is_read: false,
    },
  });
  return !!existing;
}

function formatGroupedText(names, verbSingular, verbPlural, subjectLabel) {
  if (names.length === 1) return `${names[0]} ${verbSingular} ${subjectLabel}`;
  if (names.length === 2)
    return `${names[0]} și ${names[1]} ${verbPlural} ${subjectLabel}`;
  const extra = names.length - 2;
  return `${names[0]}, ${names[1]} și încă ${extra} ${extra === 1 ? "altul" : "alții"} ${verbPlural} ${subjectLabel}`;
}

async function upsertGroupedNotification({
  recipientId,
  actorId,
  actorName,
  type,
  refId,
  refType,
  verbSingular,
  verbPlural,
  subjectLabel,
}) {
  const existing = await Notification.findOne({
    where: {
      user_id: recipientId,
      type,
      ref_id: refId,
      ref_type: refType,
      is_read: false,
    },
  });

  if (!existing) {
    const content = `${actorId}::${formatGroupedText([actorName], verbSingular, verbPlural, subjectLabel)}`;
    return createAndEmitNotification({
      userId: recipientId,
      type,
      content,
      refId,
      refType,
    });
  }

  const [idsPart] = existing.content.split("::");
  const ids = idsPart
    .split(",")
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  if (!ids.includes(actorId)) ids.push(actorId);

  const { User } = require("../models");
  const actors = await User.findAll({
    where: { user_id: ids },
    attributes: ["user_id", "first_name", "last_name"],
  });
  const nameById = new Map(
    actors.map((u) => [u.user_id, `${u.first_name} ${u.last_name}`]),
  );
  const names = ids.map((id) => nameById.get(id)).filter(Boolean);

  const content = `${ids.join(",")}::${formatGroupedText(names, verbSingular, verbPlural, subjectLabel)}`;
  await existing.update({ content, created_at: new Date() });

  const { getIO } = require("../config/socket");
  const io = getIO();
  if (io) {
    io.to(`user_${recipientId}`).emit("new_notification", {
      type,
      notification: existing.toJSON(),
    });
  }

  return existing;
}

function formatNotificationContent(content) {
  const idx = content.indexOf("::");
  return idx === -1 ? content : content.slice(idx + 2);
}

module.exports = {
  createAndEmitNotification,
  hasUnreadNotification,
  upsertGroupedNotification,
  formatNotificationContent,
};
