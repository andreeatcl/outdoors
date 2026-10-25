const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { Event, User, Participation, Message, sequelize } = require("../models");
const { getIO } = require("../config/socket");
const {
  createAndEmitNotification,
  upsertGroupedNotification,
} = require("../services/notificationService");
const {
  PARTICIPATION_MILESTONES,
  checkAndNotifyMilestones,
} = require("../services/achievements");
const { userAttrs } = require("../services/eventFormatter");

router.post("/:id/join", auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Participation }],
    });
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (event.status === "finished")
      return res.status(400).json({ error: "Event has ended." });

    const already = await Participation.findOne({
      where: { user_id: req.userId, event_id: event.event_id },
    });
    if (already) return res.status(400).json({ error: "Already registered." });

    const count = event.Participations?.length ?? 0;
    if (count >= event.max_participants)
      return res.status(400).json({ error: "Event is full." });

    const participation = await Participation.create({
      user_id: req.userId,
      event_id: event.event_id,
      status: "registered",
    });

    const joiner = await User.findByPk(req.userId, { attributes: userAttrs });
    const allParticipants = await Participation.findAll({
      where: { event_id: event.event_id },
    });
    for (const p of allParticipants) {
      if (p.user_id === req.userId) continue;
      await upsertGroupedNotification({
        recipientId: p.user_id,
        actorId: req.userId,
        actorName: `${joiner.first_name} ${joiner.last_name}`,
        type: "event_join",
        refId: event.event_id,
        refType: "event",
        verbSingular: "s-a alăturat la",
        verbPlural: "s-au alăturat la",
        subjectLabel: `"${event.title}"`,
      });
    }

    const newCount = count + 1;
    if (newCount >= event.max_participants) {
      const parts = await Participation.findAll({
        where: { event_id: event.event_id },
      });
      for (const p of parts) {
        if (p.user_id === req.userId) continue;
        await createAndEmitNotification({
          userId: p.user_id,
          type: "event_full",
          content: `Evenimentul "${event.title}" a ajuns la numărul maxim de participanți!`,
          refId: event.event_id,
          refType: "event",
        });
      }
    }

    const joinMsg = await Message.create({
      sender_id: null,
      receiver_id: req.userId,
      event_id: event.event_id,
      is_system: true,
      content: "Ai intrat în eveniment.",
    });
    const io = getIO();
    if (io)
      io.to(`user_${req.userId}`).emit("receive_message", {
        roomId: `event_${event.event_id}`,
        message: { ...joinMsg.toJSON(), sender: null },
        statusUpdate: { isFormerParticipant: false },
      });

    res.status(201).json({ participation });
  } catch (err) {
    console.error("POST /events/:id/join error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.delete("/:id/leave", auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (event.organizer_id === req.userId) {
      return res
        .status(400)
        .json({ error: "The organizer cannot leave their own event." });
    }

    const deleted = await Participation.destroy({
      where: { user_id: req.userId, event_id: event.event_id },
    });
    if (!deleted)
      return res
        .status(400)
        .json({ error: "You are not registered for this event." });

    const leaveMsg = await Message.create({
      sender_id: null,
      receiver_id: req.userId,
      event_id: event.event_id,
      is_system: true,
      content: "Ai ieșit din eveniment.",
    });
    const io = getIO();
    if (io) {
      io.to(`user_${req.userId}`).emit("receive_message", {
        roomId: `event_${event.event_id}`,
        message: { ...leaveMsg.toJSON(), sender: null },
        statusUpdate: { isFormerParticipant: true },
      });
      io.in(`user_${req.userId}`).socketsLeave(`event_${event.event_id}`);
    }

    res.json({ message: "Left the event." });
  } catch (err) {
    console.error("DELETE /events/:id/leave error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.delete("/:id/participants/:userId", auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (event.organizer_id !== req.userId)
      return res.status(403).json({ error: "Permission denied." });

    const targetUserId = Number(req.params.userId);
    if (targetUserId === event.organizer_id) {
      return res
        .status(400)
        .json({ error: "The organizer cannot remove themselves." });
    }

    const deleted = await Participation.destroy({
      where: { user_id: targetUserId, event_id: event.event_id },
    });
    if (!deleted)
      return res.status(400).json({ error: "This user is not a participant." });

    await createAndEmitNotification({
      userId: targetUserId,
      type: "event_removed",
      content: `Ai fost eliminat din evenimentul "${event.title}".`,
      refId: event.event_id,
      refType: "event",
    });

    const kickMsg = await Message.create({
      sender_id: null,
      receiver_id: targetUserId,
      event_id: event.event_id,
      is_system: true,
      content: "Ai fost eliminat din eveniment.",
    });
    const io = getIO();
    if (io) {
      io.to(`user_${targetUserId}`).emit("receive_message", {
        roomId: `event_${event.event_id}`,
        message: { ...kickMsg.toJSON(), sender: null },
        statusUpdate: { isFormerParticipant: true },
      });
      io.in(`user_${targetUserId}`).socketsLeave(`event_${event.event_id}`);
    }

    res.json({ message: "Participant removed." });
  } catch (err) {
    console.error(
      "DELETE /events/:id/participants/:userId error:",
      err.message,
    );
    res.status(500).json({ error: "Server error." });
  }
});

router.delete("/:id/leave-chat", auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });

    const participation = await Participation.findOne({
      where: { user_id: req.userId, event_id: event.event_id },
    });
    if (!participation)
      return res
        .status(400)
        .json({ error: "You are not a participant in this event." });
    if (participation.chat_left_at)
      return res
        .status(400)
        .json({ error: "You have already left this conversation." });

    participation.chat_left_at = new Date();
    await participation.save();

    const leaveMsg = await Message.create({
      sender_id: null,
      receiver_id: req.userId,
      event_id: event.event_id,
      is_system: true,
      content: "Ai părăsit conversația.",
    });
    const io = getIO();
    if (io)
      io.to(`user_${req.userId}`).emit("receive_message", {
        roomId: `event_${event.event_id}`,
        message: { ...leaveMsg.toJSON(), sender: null },
        statusUpdate: { isChatLeft: true },
      });

    res.json({ message: "Left the conversation." });
  } catch (err) {
    console.error("DELETE /events/:id/leave-chat error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.post("/:id/checkin", auth, async (req, res) => {
  const { lat, lng } = req.body;

  if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
    return res.status(400).json({ error: "Missing user coordinates." });
  }

  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });

    // checkin has two conditions:
    // - time (from 2h before start up to the event finish time)
    // - place (user must be within 250m of th eevent location)
    const now = new Date();
    const start = new Date(event.start_date);
    const end = new Date(start.getTime() + event.duration * 60 * 1000);
    const windowOpen = new Date(start.getTime() - 2 * 60 * 60 * 1000);

    if (now < windowOpen) {
      const minutesLeft = Math.ceil((windowOpen - now) / 60000);
      return res.status(400).json({
        error: `Check-in opens 2 hours before the event (in ${minutesLeft} minutes).`,
      });
    }
    if (now > end) {
      return res.status(400).json({ error: "Event has ended." });
    }

    const [rows] = await sequelize.query(
      `SELECT ST_DWithin(
         ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
         coordinates::geography,
         250
       ) AS within FROM events WHERE event_id = :eventId`,
      {
        replacements: {
          lat: Number(lat),
          lng: Number(lng),
          eventId: event.event_id,
        },
      },
    );
    if (!rows[0]?.within) {
      return res.status(400).json({
        error: "You are too far from the event location (max radius: 250m).",
      });
    }

    const participation = await Participation.findOne({
      where: { user_id: req.userId, event_id: event.event_id },
    });
    if (!participation)
      return res
        .status(403)
        .json({ error: "You are not registered for this event." });
    if (participation.status === "checked_in")
      return res.status(400).json({ error: "Already checked in." });

    await participation.update({ status: "checked_in" });

    const checkedInUser = await User.findByPk(req.userId, {
      attributes: userAttrs,
    });
    const allParticipants = await Participation.findAll({
      where: { event_id: event.event_id },
    });
    for (const p of allParticipants) {
      if (p.user_id === req.userId) continue;
      await upsertGroupedNotification({
        recipientId: p.user_id,
        actorId: req.userId,
        actorName: `${checkedInUser.first_name} ${checkedInUser.last_name}`,
        type: "event_checkin",
        refId: event.event_id,
        refType: "event",
        verbSingular: "a făcut check-in la",
        verbPlural: "au făcut check-in la",
        subjectLabel: `"${event.title}"`,
      });
    }

    const participatedCount = await Participation.count({
      where: { user_id: req.userId, status: "checked_in" },
    });
    await checkAndNotifyMilestones({
      userId: req.userId,
      count: participatedCount,
      milestones: PARTICIPATION_MILESTONES,
      refType: "participated",
      contentFor: (n) => `Ai participat la ${n} evenimente! 🎉`,
    });

    res.json({ message: "Check-in successful." });
  } catch (err) {
    console.error("POST /events/:id/checkin error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
