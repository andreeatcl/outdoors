const { Op } = require("sequelize");
const { User, Event, Participation, Friendship } = require("../models");
const { userAttrs, formatEvent } = require("./eventFormatter");

const publicFields = [
  "user_id",
  "username",
  "email",
  "first_name",
  "last_name",
  "bio",
  "avatar_url",
  "creation_date",
];

async function getStats(user) {
  const eventsCreated = await Event.count({
    where: { organizer_id: user.user_id },
  });
  const participations = await Participation.findAll({
    where: { user_id: user.user_id },
    include: [{ model: Event, attributes: ["organizer_id"] }],
  });
  const totalParticipations = participations.length;
  const checkinEligible = participations.filter(
    (p) => p.Event?.organizer_id !== user.user_id,
  );
  const checkins = checkinEligible.filter(
    (p) => p.status === "checked_in",
  ).length;
  const checkinRate =
    checkinEligible.length > 0
      ? Math.round((checkins / checkinEligible.length) * 100)
      : 0;

  const friendCount = await Friendship.count({
    where: {
      status: "accepted",
      [Op.or]: [{ requester_id: user.user_id }, { addressee_id: user.user_id }],
    },
  });

  return {
    events_created: eventsCreated,
    participations: totalParticipations,
    checkin_rate: checkinRate,
    friends_count: friendCount,
  };
}

async function getFriendshipInfo(user, requestUserId) {
  let friendshipStatus = null;
  let friendshipId = null;
  if (requestUserId && requestUserId !== user.user_id) {
    const friendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requester_id: requestUserId, addressee_id: user.user_id },
          { requester_id: user.user_id, addressee_id: requestUserId },
        ],
      },
    });
    if (friendship) {
      friendshipStatus =
        friendship.status === "pending" &&
        friendship.addressee_id === requestUserId
          ? "pending_incoming"
          : friendship.status;
      friendshipId = friendship.friendship_id;
    }
  }
  return { friendshipStatus, friendshipId };
}

async function getFriends(user) {
  const friendships = await Friendship.findAll({
    where: {
      status: "accepted",
      [Op.or]: [{ requester_id: user.user_id }, { addressee_id: user.user_id }],
    },
    include: [
      { model: User, as: "requester", attributes: publicFields },
      { model: User, as: "addressee", attributes: publicFields },
    ],
  });
  return friendships.map((f) =>
    f.requester_id === user.user_id
      ? f.addressee.toJSON()
      : f.requester.toJSON(),
  );
}

async function getActivityDistribution(user) {
  const joinedEvents = await Participation.findAll({
    where: { user_id: user.user_id },
    include: [{ model: Event, attributes: ["event_type"] }],
  });
  const typeCounts = {};
  for (const p of joinedEvents) {
    if (p.Event) {
      typeCounts[p.Event.event_type] =
        (typeCounts[p.Event.event_type] || 0) + 1;
    }
  }
  return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
}

async function getActivityTimeline(user) {
  // data for the weekly activity chart - split the last 28 days in 4 buckets
  const since = new Date();
  since.setDate(since.getDate() - 27);
  since.setHours(0, 0, 0, 0);

  const createdEvents = await Event.findAll({
    where: { organizer_id: user.user_id, start_date: { [Op.gte]: since } },
    attributes: ["event_id", "start_date"],
  });

  const joinedParticipations = await Participation.findAll({
    where: { user_id: user.user_id },
    include: [
      {
        model: Event,
        attributes: ["event_id", "start_date"],
        where: {
          start_date: { [Op.gte]: since },
          organizer_id: { [Op.ne]: user.user_id },
        },
      },
    ],
  });

  const WEEKS = 4;
  const weekBuckets = Array.from({ length: WEEKS }, (_, i) => {
    const weekStart = new Date(since);
    weekStart.setDate(weekStart.getDate() + i * 7);
    return { weekStart, created: 0, participations: 0 };
  });
  const weekIndexFor = (startDate) => {
    const daysFromStart = Math.floor(
      (new Date(startDate) - since) / (1000 * 60 * 60 * 24),
    );
    return Math.min(WEEKS - 1, Math.floor(daysFromStart / 7));
  };
  for (const e of createdEvents) {
    const weekIdx = weekIndexFor(e.start_date);
    if (weekIdx < 0) continue;
    weekBuckets[weekIdx].created += 1;
  }
  for (const p of joinedParticipations) {
    const weekIdx = weekIndexFor(p.Event.start_date);
    if (weekIdx < 0) continue;
    weekBuckets[weekIdx].participations += 1;
  }
  return weekBuckets.map((b) => {
    const weekEnd = new Date(b.weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      weekStart: b.weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      total: b.created + b.participations,
      created: b.created,
      participations: b.participations,
    };
  });
}

async function getProfileEvents(user, requestUserId) {
  const pastEventIds = (
    await Event.findAll({
      where: { status: "finished" },
      include: [
        {
          model: Participation,
          where: { user_id: user.user_id },
          attributes: [],
        },
      ],
      order: [["start_date", "DESC"]],
    })
  ).map((e) => e.event_id);

  const pastEventRows = await Event.findAll({
    where: { event_id: pastEventIds },
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
  const pastEvents = pastEventRows.map((e) => formatEvent(e, requestUserId));

  const createdEventRows = await Event.findAll({
    where: { organizer_id: user.user_id },
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
  const createdEventLocations = createdEventRows.map((e) =>
    formatEvent(e, requestUserId),
  );

  return { pastEvents, createdEventLocations };
}

async function buildUserProfile(user, requestUserId) {
  const stats = await getStats(user);
  const { friendshipStatus, friendshipId } = await getFriendshipInfo(
    user,
    requestUserId,
  );
  const friends = await getFriends(user);
  const activityDistribution = await getActivityDistribution(user);
  const activityTimeline = await getActivityTimeline(user);
  const { pastEvents, createdEventLocations } = await getProfileEvents(
    user,
    requestUserId,
  );

  return {
    user: user.toJSON(),
    stats,
    activityDistribution,
    activityTimeline,
    friends,
    pastEvents,
    createdEventLocations,
    friendshipStatus,
    friendshipId,
  };
}

module.exports = { publicFields, buildUserProfile };
