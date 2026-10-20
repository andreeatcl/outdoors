require("dotenv").config();
const { Op } = require("sequelize");
const { connectDB } = require("./config/db");
const { sequelize, User, Event, Participation } = require("./models");

const h = (n) => new Date(Date.now() + n * 60 * 60 * 1000);
const ago = (n) => new Date(Date.now() - n * 60 * 60 * 1000);

const point = (lat, lng) => ({
  coordinates: sequelize.literal(
    `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
  ),
});

const EVENTS = [
  {
    title: "Fotbal 5v5 Parcul Herăstrău",
    event_type: "fotbal",
    description:
      "Meci 5v5 pe terenul din Herăstrău, mai lipsesc câțiva oameni.",
    start_date: h(2),
    duration: 90,
    max_participants: 20,
    status: "upcoming",
    address: "Parcul Herăstrău, București",
    ...point(44.469917, 26.085997),
  },
  {
    title: "Jogging matinal Tineretului",
    event_type: "jogging",
    description: "Alergare ușoară, 6km, ritm normal. Ne adunăm la fântână.",
    start_date: h(5),
    duration: 60,
    max_participants: 15,
    status: "upcoming",
    address: "Parcul Tineretului, București",
    ...point(44.408106, 26.105301),
  },
  {
    title: "Ciclism Lacul Morii",
    event_type: "ciclism",
    description: "Tur 20km în jurul lacului, nivel mediu.",
    start_date: h(12),
    duration: 120,
    max_participants: 10,
    status: "upcoming",
    address: "Lacul Morii, București",
    ...point(44.4482, 26.039014),
  },
  {
    title: "Volei",
    event_type: "volei",
    description: "2v2 sau 3v3, în funcție câți venim. Aduc eu mingea!!",
    start_date: h(24),
    duration: 90,
    max_participants: 12,
    status: "upcoming",
    address: "Parcul Floreasca, București",
    ...point(44.4646, 26.0976),
  },
  {
    title: "Picnic Cișmigiu",
    event_type: "picnic",
    description: "Picnic pe iarbă lângă lac, fiecare aduce ceva.",
    start_date: h(36),
    duration: 180,
    max_participants: 30,
    status: "upcoming",
    address: "Cișmigiu, București",
    ...point(44.4364, 26.0925),
  },
  {
    title: "Baschet CNMV",
    event_type: "baschet",
    description: "Turneu pe terenul din curtea CNMV",
    start_date: h(4),
    duration: 75,
    max_participants: 12,
    status: "upcoming",
    address: "Colegiul National Mihai Viteazul, București",
    ...point(44.43905, 26.124405),
  },
  {
    title: "Tenis dublu mixt",
    event_type: "tenis",
    description: "Ne lipsește o pereche pentru dublu mixt, nivel mediu.",
    start_date: h(8),
    duration: 90,
    max_participants: 4,
    status: "upcoming",
    address: "Sud Arena, București",
    ...point(44.395227, 26.14418),
  },
  {
    title: "Traseu Parcul Văcărești",
    event_type: "hiking",
    description: "Tură pe potecile din parc, teren accidentat pe alocuri.",
    start_date: h(30),
    duration: 240,
    max_participants: 8,
    status: "upcoming",
    address: "Parcul Natural Văcărești, București",
    ...point(44.406518, 26.126026),
  },
  {
    title: "Skateboarding IOR",
    event_type: "skateboarding",
    description: "Sesiune liberă la skatepark, orice nivel.",
    start_date: h(6),
    duration: 120,
    max_participants: 15,
    status: "upcoming",
    address: "Parcul IOR, București",
    ...point(44.422199, 26.153709),
  },
  {
    title: "Seară de board games Universitate",
    event_type: "board_games",
    description: "Catan și altele...",
    start_date: h(20),
    duration: 150,
    max_participants: 10,
    status: "upcoming",
    address: "Centrul Vechi, București",
    ...point(44.43402, 26.101457),
  },
  {
    title: "Socializare și cafea",
    event_type: "socializare",
    description: "Sunt nou în București, caut prieteni! Ne vedem la Artichoke!",
    start_date: h(15),
    duration: 120,
    max_participants: 25,
    status: "upcoming",
    address: "Strada Walter Mărăcineanu, București",
    ...point(44.437908, 26.096472),
  },
  {
    title: "Jogging de seară Parcul Carol",
    event_type: "jogging",
    description: "Tur 5km, ritm pentru începători",
    start_date: h(1),
    duration: 45,
    max_participants: 15,
    status: "upcoming",
    address: "Parcul Carol I, București",
    ...point(44.411219, 26.096859),
  },
  {
    title: "Fotbal 7v7 Ghencea",
    event_type: "fotbal",
    description:
      "Meciul e deja în desfășurare, poți intra dacă lipsește cineva.",
    start_date: ago(1),
    duration: 90,
    max_participants: 22,
    status: "ongoing",
    address: "Complexul Ghencea, București",
    ...point(44.413691, 26.041898),
  },
];

async function seedEvents() {
  await connectDB();

  const users = await User.findAll({
    where: { role: { [Op.ne]: "admin" } },
    limit: 10,
  });
  if (users.length === 0) {
    console.error("No non-admin users found. Run the main seed first.");
    process.exit(1);
  }

  const pick = (i) => users[i % users.length].user_id;

  const created = [];
  for (let i = 0; i < EVENTS.length; i++) {
    const ev = await Event.create({ ...EVENTS[i], organizer_id: pick(i) });
    await Participation.create({
      user_id: pick(i),
      event_id: ev.event_id,
      status: "registered",
    });
    created.push(ev);
    console.log(`  - ${ev.title} (starts ${ev.start_date.toISOString()})`);
  }

  console.log(
    `\nSeeded ${created.length} events. They all start within the next 48h.`,
  );
  process.exit(0);
}

seedEvents().catch((err) => {
  console.error("seedEvents error:", err);
  process.exit(1);
});
