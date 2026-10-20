require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB } = require("./config/db");
const {
  syncModels,
  sequelize,
  User,
  Event,
  Participation,
  Friendship,
  Message,
} = require("./models");

const h = (n) => new Date(Date.now() + n * 60 * 60 * 1000);
const ago = (n) => new Date(Date.now() - n * 60 * 60 * 1000);

async function seed() {
  await connectDB();
  await syncModels({ force: true });

  const hash = await bcrypt.hash("123456", 12);

  const users = await User.bulkCreate([
    {
      username: "alex_tudose",
      email: "alex@outdoors.dev",
      first_name: "Alex",
      last_name: "Tudose",
      bio: "Mereu în căutare de trasee noi ⛰️",
      password_hash: hash,
    },
    {
      username: "mihai_d",
      email: "mihai@outdoors.dev",
      first_name: "Mihai",
      last_name: "Dobre",
      bio: "Fotbal & hiking fanatic",
      password_hash: hash,
    },
    {
      username: "elena_stn",
      email: "elena@outdoors.dev",
      first_name: "Elena",
      last_name: "Stanciu",
      bio: "Cycling everywhere",
      password_hash: hash,
    },
    {
      username: "alex_c",
      email: "alexc@outdoors.dev",
      first_name: "Alexandru",
      last_name: "Cazacu",
      bio: "Tenis & baschet",
      password_hash: hash,
    },
    {
      username: "vlad_g",
      email: "vlad@outdoors.dev",
      first_name: "Vlad",
      last_name: "Ghiță",
      bio: "Full-time hiking enthusiast",
      password_hash: hash,
    },
    {
      username: "ioana_r",
      email: "ioana@outdoors.dev",
      first_name: "Ioana",
      last_name: "Rusu",
      bio: "Yoga & picnic",
      password_hash: hash,
    },
  ]);

  console.log(`Created ${users.length} users (password: 123456 for all)`);

  await User.create({
    username: "admin",
    email: "admin@outdoors.dev",
    first_name: "Admin",
    last_name: "Outdoors",
    role: "admin",
    password_hash: await bcrypt.hash("admin123", 12),
  });
  console.log("Created admin (admin@outdoors.dev / admin123)");

  const point = (lat, lng) => ({
    coordinates: sequelize.literal(
      `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
    ),
  });

  const eventData = [
    {
      organizer_id: users[1].user_id,
      title: "Fotbal 5v5 Regie",
      event_type: "fotbal",
      description: "Turneu 5v5",
      start_date: ago(0.5),
      duration: 90,
      max_participants: 20,
      status: "ongoing",
      ...point(44.44988, 26.05078),
      address: "Strada Alexandru Ivasiuc, București",
    },
    {
      organizer_id: users[2].user_id,
      title: "Jogging Tineretului",
      event_type: "jogging",
      description: "Alergare ușoară 5km. Tempo relaxat.",
      start_date: h(1),
      duration: 60,
      max_participants: 15,
      status: "upcoming",
      ...point(44.4195, 26.1016),
      address: "Parcul Tineretului, București",
    },
    {
      organizer_id: users[3].user_id,
      title: "Badminton dublu — Cișmigiu",
      event_type: "tenis",
      description: "Căutăm al 4-lea jucător. Nivel mediu.",
      start_date: h(3),
      duration: 120,
      max_participants: 4,
      status: "upcoming",
      ...point(44.4364, 26.092465),
      address: "Cișmigiu, București",
    },
    {
      organizer_id: users[4].user_id,
      title: "Baschet 3x3 Colentina",
      event_type: "baschet",
      description: "Turneu 3x3 informal.",
      start_date: h(5),
      duration: 90,
      max_participants: 12,
      status: "upcoming",
      ...point(44.446101, 26.132344),
      address: "Colentina, București",
    },
    {
      organizer_id: users[5].user_id,
      title: "Jogging Lacul Morii",
      event_type: "jogging",
      description: "Tur lacul + picnic la final. 8km.",
      start_date: h(24),
      duration: 150,
      max_participants: 20,
      status: "upcoming",
      ...point(44.4482, 26.039014),
      address: "Lacul Morii, București",
    },
    {
      organizer_id: users[1].user_id,
      title: "Ciclism Pădurea Băneasa",
      event_type: "ciclism",
      description: "Traseu 25km prin Băneasa.",
      start_date: h(18),
      duration: 120,
      max_participants: 10,
      status: "upcoming",
      ...point(44.52638, 26.09236),
      address: "Aleea Padina, București",
    },
    {
      organizer_id: users[5].user_id,
      title: "Picnic & Board Games IOR",
      event_type: "picnic",
      description: "Jocuri de masă, mâncare și bună dispoziție!",
      start_date: h(30),
      duration: 240,
      max_participants: 30,
      status: "upcoming",
      ...point(44.42, 26.16),
      address: "Parcul IOR, București",
    },
    {
      organizer_id: users[2].user_id,
      title: "Volei in Floreasca",
      event_type: "volei",
      description: "Volei pentru oricine!",
      start_date: h(14),
      duration: 90,
      max_participants: 16,
      status: "upcoming",
      ...point(44.464561, 26.097593),
      address: "Parcul Floreasca, București",
    },
  ];

  const events = [];
  for (const data of eventData) {
    events.push(await Event.create(data));
  }

  console.log(`Created ${events.length} events`);

  const parts = [];
  for (const ev of events) {
    parts.push({
      user_id: ev.organizer_id,
      event_id: ev.event_id,
      status: "registered",
    });
  }
  parts.push({
    user_id: users[0].user_id,
    event_id: events[0].event_id,
    status: "registered",
  });
  parts.push({
    user_id: users[0].user_id,
    event_id: events[4].event_id,
    status: "registered",
  });
  parts.push({
    user_id: users[2].user_id,
    event_id: events[0].event_id,
    status: "registered",
  });
  parts.push({
    user_id: users[4].user_id,
    event_id: events[0].event_id,
    status: "registered",
  });
  parts.push({
    user_id: users[1].user_id,
    event_id: events[3].event_id,
    status: "registered",
  });

  await Participation.bulkCreate(parts);
  console.log(`Created ${parts.length} participations`);

  await Friendship.bulkCreate([
    {
      requester_id: users[0].user_id,
      addressee_id: users[1].user_id,
      status: "accepted",
    },
    {
      requester_id: users[0].user_id,
      addressee_id: users[2].user_id,
      status: "accepted",
    },
    {
      requester_id: users[0].user_id,
      addressee_id: users[4].user_id,
      status: "accepted",
    },
    {
      requester_id: users[0].user_id,
      addressee_id: users[5].user_id,
      status: "accepted",
    },
    {
      requester_id: users[1].user_id,
      addressee_id: users[3].user_id,
      status: "accepted",
    },
    {
      requester_id: users[3].user_id,
      addressee_id: users[0].user_id,
      status: "pending",
    },
  ]);
  console.log("Created friendships");

  await Message.bulkCreate([
    {
      sender_id: users[1].user_id,
      receiver_id: users[0].user_id,
      content: "Salut! Vii la fotbal azi?",
      created_at: ago(2),
    },
    {
      sender_id: users[0].user_id,
      receiver_id: users[1].user_id,
      content: "Da, vin! La ce ora?",
      created_at: ago(1.8),
    },
    {
      sender_id: users[1].user_id,
      receiver_id: users[0].user_id,
      content: "Ne adunăm la 18:30 la intrarea în parc.",
      created_at: ago(1),
    },
    {
      sender_id: users[0].user_id,
      receiver_id: users[1].user_id,
      content: "Super! Vin și eu cu o minge.",
      created_at: ago(0.8),
    },
    {
      sender_id: users[1].user_id,
      receiver_id: users[0].user_id,
      content: "Ne vedem!",
      created_at: ago(0.3),
    },
    {
      sender_id: users[1].user_id,
      event_id: events[0].event_id,
      content: "Hello tuturor! Avem turneu azi ⚽",
      created_at: ago(1),
    },
    {
      sender_id: users[2].user_id,
      event_id: events[0].event_id,
      content: "Abia aștept!",
      created_at: ago(0.8),
    },
    {
      sender_id: users[0].user_id,
      event_id: events[0].event_id,
      content: "Unde ne întâlnim mai exact?",
      created_at: ago(0.5),
    },
    {
      sender_id: users[1].user_id,
      event_id: events[0].event_id,
      content: "La intrarea principală!",
      created_at: ago(0.1),
    },
  ]);
  console.log("Created messages");

  console.log(
    "\nSeed complete! Login with any email above and password: 123456",
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
