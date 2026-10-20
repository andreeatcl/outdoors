const cron = require("node-cron");
const { Op } = require("sequelize");
const { Event, Participation, Notification } = require("../models");
const {
  createAndEmitNotification,
} = require("../services/notificationService");

const STARTING_SOON_MINUTES = 30;
const CHECKIN_OPEN_MINUTES_BEFORE = 120;

// cron job that runs every minute to check for "notable events" (like an ...
// ... event starting soon or the check-in window being opened)
async function notifyParticipantsOnce({ event, type, content }) {
  const participants = await Participation.findAll({
    where: { event_id: event.event_id },
  });
  for (const p of participants) {
    const already = await Notification.findOne({
      where: { user_id: p.user_id, type, ref_id: event.event_id },
    });
    if (already) continue;
    await createAndEmitNotification({
      userId: p.user_id,
      type,
      content,
      refId: event.event_id,
      refType: "event",
    });
  }
}

async function notifyEventStarted(event) {
  await notifyParticipantsOnce({
    event,
    type: "event_started",
    content: `Evenimentul "${event.title}" a început!`,
  });
}

async function notifyStartingSoon(now) {
  const windowEnd = new Date(now.getTime() + STARTING_SOON_MINUTES * 60 * 1000);
  const events = await Event.findAll({
    where: {
      status: "upcoming",
      start_date: { [Op.gt]: now, [Op.lte]: windowEnd },
    },
  });
  for (const event of events) {
    await notifyParticipantsOnce({
      event,
      type: "event_starting_soon",
      content: `Evenimentul "${event.title}" începe în curând.`,
    });
  }
}

async function notifyCheckinOpen(now) {
  const windowEnd = new Date(
    now.getTime() + CHECKIN_OPEN_MINUTES_BEFORE * 60 * 1000,
  );
  const events = await Event.findAll({
    where: {
      status: "upcoming",
      start_date: { [Op.gt]: now, [Op.lte]: windowEnd },
    },
  });
  for (const event of events) {
    await notifyParticipantsOnce({
      event,
      type: "checkin_open",
      content: `Check-in-ul pentru "${event.title}" este acum deschis.`,
    });
  }
}

// update event status through their lifecycle (upcoming -> ongoing -> finished)
async function runEventStatusUpdate() {
  const now = new Date();

  const startingEvents = await Event.findAll({
    where: { status: "upcoming", start_date: { [Op.lte]: now } },
  });
  for (const event of startingEvents) {
    await event.update({ status: "ongoing" });
    await notifyEventStarted(event);
  }

  const ongoingEvents = await Event.findAll({ where: { status: "ongoing" } });
  for (const event of ongoingEvents) {
    const end = new Date(
      new Date(event.start_date).getTime() + event.duration * 60 * 1000,
    );
    if (now >= end) {
      await event.update({ status: "finished" });
    }
  }

  await notifyStartingSoon(now);
  await notifyCheckinOpen(now);
}

function startEventStatusCron() {
  cron.schedule("* * * * *", async () => {
    try {
      await runEventStatusUpdate();
    } catch (err) {
      console.error("Event status cron error:", err.message);
    }
  });

  console.log("✅ Event status cron started.");
}

module.exports = { startEventStatusCron, runEventStatusUpdate };
