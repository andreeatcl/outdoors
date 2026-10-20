const { sequelize } = require("../config/db");
const User = require("./User");
const Event = require("./Event");
const Participation = require("./Participation");
const Friendship = require("./Friendship");
const Message = require("./Message");
const Notification = require("./Notification");

User.hasMany(Event, { foreignKey: "organizer_id", as: "organizedEvents" });
Event.belongsTo(User, { foreignKey: "organizer_id", as: "organizer" });

User.belongsToMany(Event, {
  through: Participation,
  foreignKey: "user_id",
  otherKey: "event_id",
  as: "joinedEvents",
});
Event.belongsToMany(User, {
  through: Participation,
  foreignKey: "event_id",
  otherKey: "user_id",
  as: "participants",
});

User.hasMany(Participation, { foreignKey: "user_id" });
Participation.belongsTo(User, { foreignKey: "user_id" });
Event.hasMany(Participation, { foreignKey: "event_id" });
Participation.belongsTo(Event, { foreignKey: "event_id" });

User.hasMany(Friendship, { foreignKey: "requester_id", as: "sentRequests" });
User.hasMany(Friendship, {
  foreignKey: "addressee_id",
  as: "receivedRequests",
});
Friendship.belongsTo(User, { foreignKey: "requester_id", as: "requester" });
Friendship.belongsTo(User, { foreignKey: "addressee_id", as: "addressee" });

User.hasMany(Message, { foreignKey: "sender_id", as: "sentMessages" });
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });
Message.belongsTo(User, { foreignKey: "receiver_id", as: "receiver" });
Message.belongsTo(Event, { foreignKey: "event_id" });

User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

async function syncModels({ force = false } = {}) {
  await sequelize.sync({ force, alter: !force });

  // due to a later addition of system messages where there is no actual sender,
  // i had to change the sender_id column to nullable
  await sequelize
    .query(
      `DO $$ BEGIN
         IF EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'messages'
             AND column_name = 'sender_id'
             AND is_nullable = 'NO'
         ) THEN
           ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;
         END IF;
       END $$`,
    )
    .catch(() => {});

  console.log("✅ Models synced.");
}

module.exports = {
  sequelize,
  User,
  Event,
  Participation,
  Friendship,
  Message,
  Notification,
  syncModels,
};
