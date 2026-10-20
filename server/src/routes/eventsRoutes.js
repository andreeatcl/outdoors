const router = require("express").Router();
const { Op } = require("sequelize");
const auth = require("../middleware/authMiddleware");
const authOptional = require("../middleware/authOptional");
const { Event, User, Participation, sequelize } = require("../models");
const {
  createAndEmitNotification,
} = require("../services/notificationService");
const {
  CREATED_MILESTONES,
  checkAndNotifyMilestones,
} = require("../services/achievements");
const { userAttrs, formatEvent } = require("../services/eventFormatter");

router.get("/", authOptional, async (req, res) => {
  try {
    const where = { status: { [Op.ne]: "finished" } };

    // bounding box filter
    const { minLat, maxLat, minLng, maxLng } = req.query;
    if (minLat && maxLat && minLng && maxLng) {
      where[Op.and] = sequelize.literal(
        `ST_Within(coordinates::geometry, ST_MakeEnvelope(${Number(minLng)}, ${Number(minLat)}, ${Number(maxLng)}, ${Number(maxLat)}, 4326))`,
      );
    }

    const events = await Event.findAll({
      where,
      include: [
        { model: User, as: "organizer", attributes: userAttrs },
        {
          model: Participation,
          attributes: ["participation_id", "user_id", "status"],
          include: [{ model: User, attributes: userAttrs }],
        },
      ],
      order: [["start_date", "ASC"]],
    });

    res.json({ events: events.map((e) => formatEvent(e, req.userId)) });
  } catch (err) {
    console.error("GET /events error:", err.message);
    res.status(500).json({ error: "Failed to load events." });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const organized = await Event.findAll({
      where: { organizer_id: req.userId },
      include: [
        { model: User, as: "organizer", attributes: userAttrs },
        {
          model: Participation,
          attributes: ["participation_id", "user_id", "status"],
          include: [{ model: User, attributes: userAttrs }],
        },
      ],
      order: [["start_date", "DESC"]],
    });

    const participations = await Participation.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: Event,
          include: [
            { model: User, as: "organizer", attributes: userAttrs },
            {
              model: Participation,
              attributes: ["participation_id", "user_id", "status"],
              include: [{ model: User, attributes: userAttrs }],
            },
          ],
        },
      ],
    });
    const joined = participations
      .map((p) => p.Event)
      .filter((e) => e && e.organizer_id !== req.userId);

    res.json({
      organized: organized.map((e) => formatEvent(e, req.userId)),
      joined: joined.map((e) => formatEvent(e, req.userId)),
    });
  } catch (err) {
    console.error("GET /events/my error:", err.message);
    res.status(500).json({ error: "Failed to load events." });
  }
});

router.post("/", auth, async (req, res) => {
  const {
    title,
    event_type,
    description,
    start_date,
    duration,
    max_participants,
    lat,
    lng,
    address,
  } = req.body;

  if (
    !title?.trim() ||
    !event_type ||
    !start_date ||
    !duration ||
    !max_participants ||
    lat == null ||
    lng == null
  ) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  if (isNaN(Number(lat)) || isNaN(Number(lng))) {
    return res.status(400).json({ error: "Invalid coordinates." });
  }
  if (new Date(start_date) < new Date()) {
    return res
      .status(400)
      .json({ error: "Event cannot take place in the past." });
  }
  if (new Date(start_date).getTime() > Date.now() + 48 * 60 * 60 * 1000) {
    return res.status(400).json({
      error: "Event must take place within the next 48 hours.",
    });
  }

  try {
    const eventData = {
      organizer_id: req.userId,
      title: title.trim(),
      event_type,
      description: description?.trim() ?? null,
      start_date: new Date(start_date),
      duration: Number(duration),
      max_participants: Number(max_participants),
      status: "upcoming",
      address: address?.trim() ?? null,
    };

    eventData.coordinates = sequelize.literal(
      `ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326)`,
    );

    const event = await Event.create(eventData);

    await Participation.create({
      user_id: req.userId,
      event_id: event.event_id,
      status: "registered",
    });

    const createdCount = await Event.count({
      where: { organizer_id: req.userId },
    });
    await checkAndNotifyMilestones({
      userId: req.userId,
      count: createdCount,
      milestones: CREATED_MILESTONES,
      refType: "created",
      contentFor: (n) => `Ai creat ${n} evenimente! 🎉`,
    });

    const full = await Event.findByPk(event.event_id, {
      include: [
        { model: User, as: "organizer", attributes: userAttrs },
        {
          model: Participation,
          attributes: ["participation_id", "user_id", "status"],
          include: [{ model: User, attributes: userAttrs }],
        },
      ],
    });

    res.status(201).json({ event: formatEvent(full, req.userId) });
  } catch (err) {
    console.error("POST /events error:", err.message);
    res.status(500).json({ error: "Failed to create event." });
  }
});

router.get("/:id", authOptional, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: User, as: "organizer", attributes: userAttrs },
        {
          model: Participation,
          attributes: ["participation_id", "user_id", "status", "signup_date"],
          include: [{ model: User, attributes: userAttrs }],
        },
      ],
    });
    if (!event) return res.status(404).json({ error: "Event not found." });
    res.json({ event: formatEvent(event, req.userId) });
  } catch (err) {
    console.error("GET /events/:id error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (event.organizer_id !== req.userId)
      return res.status(403).json({ error: "Permission denied." });
    if (event.status !== "upcoming")
      return res.status(400).json({ error: "Event can no longer be edited." });

    if (
      req.body.event_type !== undefined &&
      req.body.event_type !== event.event_type
    ) {
      return res.status(400).json({ error: "Event type cannot be changed." });
    }

    const allowed = [
      "title",
      "description",
      "start_date",
      "duration",
      "max_participants",
      "address",
      "lat",
      "lng",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.start_date !== undefined) {
      if (new Date(updates.start_date).getTime() <= Date.now()) {
        return res
          .status(400)
          .json({ error: "Event date cannot be in the past." });
      }
      if (
        new Date(updates.start_date).getTime() >
        Date.now() + 48 * 60 * 60 * 1000
      ) {
        return res.status(400).json({
          error: "Event must take place within the next 48 hours.",
        });
      }
    }

    if (updates.max_participants !== undefined) {
      const currentCount = await Participation.count({
        where: { event_id: event.event_id },
      });
      if (Number(updates.max_participants) < currentCount) {
        return res.status(400).json({
          error: `Max participants cannot be lower than the current number of participants (${currentCount}).`,
        });
      }
    }

    const locationChanged =
      updates.lat !== undefined || updates.lng !== undefined;
    if (locationChanged) {
      const lat = Number(updates.lat);
      const lng = Number(updates.lng);
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: "Invalid coordinates." });
      }
      updates.coordinates = sequelize.literal(
        `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
      );
      delete updates.lat;
      delete updates.lng;
    }

    // participants are only notified about things that actually changed
    // two types of changes: to the schedule (time/place) and to the details
    const scheduleFields = ["start_date", "address"];
    const detailFields = [
      "title",
      "description",
      "duration",
      "max_participants",
    ];
    const before = {};
    for (const key of [...scheduleFields, ...detailFields]) {
      before[key] = event[key];
    }

    await event.update(updates);

    const changedSchedule = scheduleFields.filter((key) => {
      if (updates[key] === undefined) return false;
      if (key === "start_date") {
        return (
          new Date(before[key]).getTime() !== new Date(event[key]).getTime()
        );
      }
      return before[key] !== event[key];
    });
    if (locationChanged) changedSchedule.push("location");
    const changedDetails = detailFields.filter(
      (key) => updates[key] !== undefined && before[key] !== event[key],
    );

    if (changedSchedule.length || changedDetails.length) {
      const participants = await Participation.findAll({
        where: { event_id: event.event_id },
      });
      const type = changedSchedule.length
        ? "event_schedule_changed"
        : "event_details_changed";
      const content = changedSchedule.length
        ? `Ora sau locația evenimentului "${event.title}" s-a schimbat.`
        : `Detaliile evenimentului "${event.title}" au fost actualizate.`;

      for (const p of participants) {
        if (p.user_id === event.organizer_id) continue;
        await createAndEmitNotification({
          userId: p.user_id,
          type,
          content,
          refId: event.event_id,
          refType: "event",
        });
      }
    }

    const updated = await Event.findByPk(event.event_id, {
      include: [
        { model: User, as: "organizer", attributes: userAttrs },
        {
          model: Participation,
          attributes: ["participation_id", "user_id", "status"],
          include: [{ model: User, attributes: userAttrs }],
        },
      ],
    });

    res.json({ event: formatEvent(updated, req.userId) });
  } catch (err) {
    console.error("PUT /events/:id error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (event.organizer_id !== req.userId)
      return res.status(403).json({ error: "Permission denied." });

    const participants = await Participation.findAll({
      where: { event_id: event.event_id },
    });
    const title = event.title;

    await Participation.destroy({ where: { event_id: event.event_id } });
    await event.destroy();

    for (const p of participants) {
      if (p.user_id === req.userId) continue;
      await createAndEmitNotification({
        userId: p.user_id,
        type: "event_cancelled",
        content: `Evenimentul "${title}" a fost anulat.`,
        refId: event.event_id,
        refType: "event",
      });
    }

    res.json({ message: "Event deleted." });
  } catch (err) {
    console.error("DELETE /events/:id error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
