const userAttrs = [
  "user_id",
  "username",
  "first_name",
  "last_name",
  "avatar_url",
];

function formatEvent(event, requestUserId) {
  const plain = event.toJSON();
  const parts = plain.Participations ?? [];

  const coords = plain.coordinates?.coordinates;
  plain.coordinates = coords
    ? { lat: coords[1], lng: coords[0] }
    : { lat: 0, lng: 0 };

  plain.participants_count = parts.length;
  plain.participants = parts.map((p) => p.User ?? { user_id: p.user_id });

  if (requestUserId) {
    const myPart = parts.find((p) => p.user_id === requestUserId);
    plain.is_joined = !!myPart;
    plain.is_checked_in = myPart?.status === "checked_in";
  } else {
    plain.is_joined = false;
    plain.is_checked_in = false;
  }

  delete plain.Participations;
  return plain;
}

module.exports = { userAttrs, formatEvent };
