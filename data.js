// data.js - EventiVDA v9.0 (All 74 VdA Comuni, Saison Culturelle & Real VdA Events from Today Onwards)

function _relDateIso(daysOffset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

const INITIAL_EVENTS = [
  // OGGI (+0gg)
  {
    id: "evt-saison-01",
    title: "Saison Culturelle — Concerto Inaugurale al Teatro Splendor",
    description: "Apertura della celebre rassegna regionale Saison Culturelle 2026/2027 al Teatro Splendor di Aosta. Grande serata di musica sinfonica, chanson e teatro contemporaneo.",
    date: _relDateIso(0), endDate: _relDateIso(0),
    location: "Aosta", area: "aosta",
    suitableForChildren: false,
    lat: 45.7385, lng: 7.3182,
    category: "music", rassegna: "saison_culturelle",
    timeSlot: "evening", costType: "paid", bookingType: "required",
    price: "€ 20 — Biglietteria Teatro Splendor",
    eventTime: "Serale (Ore 20:30)",
    image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80",
    source: { name: "Regione VdA — Saison Culturelle", url: "https://www.regione.vda.it/cultura/eventi_spettacoli/saison_culturelle_i.aspx", type: "official" },
    isSponsored: true, sponsorTier: "gold",
    status: "approved",
    importanceScore: 10,
    tags: ["saison culturelle", "teatro splendor", "aosta", "musica", "rassegna"]
  },
  {
    id: "evt-today-02",
    title: "Degustazione Vini Eroici DOC & Fontina d'Alpeggio a Courmayeur",
    description: "Percorso enogastronomico guidato dai sommelier valdostani ai piedi del Monte Bianco con assaggi di Blanc de Morgex et de La Salle e Fontina DOP.",
    date: _relDateIso(0), endDate: _relDateIso(0),
    location: "Courmayeur", area: "alta",
    suitableForChildren: false,
    lat: 45.7969, lng: 6.9690,
    category: "food_wine", rassegna: "",
    timeSlot: "evening", costType: "paid", bookingType: "required",
    price: "€ 25 — Su prenotazione",
    eventTime: "Serale (Ore 19:00)",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80",
    source: { name: "LoveVDA — Enogastronomia, Sagre & Degustazioni", url: "https://www.lovevda.it/it/enogastronomia/eventi", type: "official" },
    isSponsored: false, sponsorTier: "standard",
    status: "approved",
    importanceScore: 9,
    tags: ["courmayeur", "vino", "fontina", "enogastronomia"]
  },
  {
    id: "evt-today-03",
    title: "Aosta Romana ArcheoTour — Teatro Romano & Criptoportico Forense",
    description: "Visita guidata pomeridiana tra i monumenti di Augusta Praetoria con archeologo regionale e apertura speciale del Criptoportico.",
    date: _relDateIso(0), endDate: _relDateIso(0),
    location: "Aosta", area: "aosta",
    suitableForChildren: true,
    lat: 45.7390, lng: 7.3240,
    category: "culture", rassegna: "",
    timeSlot: "day", costType: "paid", bookingType: "none",
    price: "€ 7 — Gratuito under 18",
    eventTime: "Diurno (15:00 - 18:00)",
    image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=600&q=80",
    source: { name: "LoveVDA — Mostre, Castelli & Musei", url: "https://www.lovevda.it/it/eventi/mostre", type: "official" },
    isSponsored: false, sponsorTier: "standard",
    status: "approved",
    importanceScore: 8,
    tags: ["aosta", "archeologia", "cultura", "famiglie"]
  },
  // DOMANI (+1gg)
  {
    id: "evt-tom-01",
    title: "Trekking Guidato in Val Ferret & Pranzo in Baita Alpina",
    description: "Escursione panoramica diurna con guida escursionistica naturalistica lungo il balcone del Monte Bianco in Val Ferret.",
    date: _relDateIso(1), endDate: _relDateIso(1),
    location: "Courmayeur", area: "alta",
    suitableForChildren: true,
    lat: 45.8120, lng: 6.9850,
    category: "nature", rassegna: "grandi_eventi_montagna",
    timeSlot: "day", costType: "paid", bookingType: "required",
    price: "€ 15 — Con Guida Alpina",
    eventTime: "Diurno (09:30 - 15:30)",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    source: { name: "LoveVDA — Escursioni & Visite Guidate", url: "https://www.lovevda.it/it/eventi/escursioni-visite-turistiche-guidate", type: "official" },
    isSponsored: true, sponsorTier: "gold",
    status: "approved",
    importanceScore: 9,
    tags: ["trekking", "courmayeur", "natura", "famiglie"]
  },
  {
    id: "evt-tom-02",
    title: "Forte di Bard — Apertura Serale Straordinaria & Mostra Fotografica",
    description: "Percorso guidato serale tra le prigioni storiche dell'Opera Ferdinando e le sale espositive del Forte di Bard.",
    date: _relDateIso(1), endDate: _relDateIso(1),
    location: "Bard", area: "bassa",
    suitableForChildren: true,
    lat: 45.6085, lng: 7.7455,
    category: "culture", rassegna: "forte_di_bard",
    timeSlot: "evening", costType: "paid", bookingType: "required",
    price: "€ 12 — Biglietteria Forte di Bard",
    eventTime: "Serale (Ore 20:00)",
    image: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?auto=format&fit=crop&w=600&q=80",
    source: { name: "Forte di Bard — Polo Culturale & Mostre", url: "https://www.fortedibard.it/eventi/", type: "official" },
    isSponsored: false, sponsorTier: "standard",
    status: "approved",
    importanceScore: 10,
    tags: ["forte di bard", "bard", "cultura", "mostra"]
  },
  {
    id: "evt-07",
    title: "Foire des Alpes & Sapori d'Autunno a Donnas",
    description: "Rassegna enogastronomica e mercato tradizionale con degustazione di vini DOC valdostani, Fontina DOP d'alpeggio, castagnate e sapori di montagna.",
    date: _relDateIso(1), endDate: _relDateIso(2),
    location: "Donnas", area: "bassa",
    suitableForChildren: true,
    lat: 45.6030, lng: 7.7680,
    category: "food_wine", rassegna: "",
    timeSlot: "day", costType: "free", bookingType: "none",
    price: "Gratuito — Accesso libero",
    eventTime: "Diurno (09:30 - 19:00)",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    source: { name: "LoveVDA — Enogastronomia, Sagre & Degustazioni", url: "https://www.lovevda.it/it/enogastronomia/eventi", type: "official" },
    isSponsored: false, status: "approved",
    importanceScore: 8,
    tags: ["enogastronomia", "vino", "sagra", "donnas", "bassa valle"]
  },
  // PROSSIMI GIORNI (+3gg .. +28gg)
  {
    id: "evt-04",
    title: "Nino Migliori. La dialettica del reale — Retrospettiva Fotografica",
    description: "Nell'anno in cui Nino Migliori, tra i protagonisti assoluti della fotografia italiana del Novecento, festeggia il centesimo compleanno, una grande retrospettiva ad Aosta celebra la sua ricerca.",
    date: _relDateIso(3), endDate: _relDateIso(30),
    location: "Aosta", area: "aosta",
    suitableForChildren: false,
    lat: 45.7340, lng: 7.3260,
    category: "culture", rassegna: "",
    timeSlot: "day", costType: "paid", bookingType: "none",
    price: "€ 8 — Biglietto in loco",
    eventTime: "Diurno (10:00 - 19:00)",
    image: "https://www.lovevda.it/defaultimagethumb/sch_eventi/9044252?width=600&height=337",
    source: { name: "LoveVDA — Mostre, Castelli & Musei", url: "https://www.lovevda.it/it/banca-dati/2/mostre/aosta/nino-migliori-la-dialettica-del-reale/9044252", type: "official" },
    isSponsored: false, status: "approved",
    importanceScore: 8,
    tags: ["mostra", "fotografia", "cultura", "aosta"]
  },
  {
    id: "evt-saison-02",
    title: "Saison Culturelle — Prosa: \"Il Berretto a Sonagli\" al Teatro Splendor",
    description: "Appuntamento di punta con il grande teatro di prosa per il cartellone della Saison Culturelle VdA sul palco del Teatro Splendor di Aosta.",
    date: _relDateIso(7), endDate: _relDateIso(8),
    location: "Aosta", area: "aosta",
    suitableForChildren: false,
    lat: 45.7388, lng: 7.3195,
    category: "culture", rassegna: "saison_culturelle",
    timeSlot: "evening", costType: "paid", bookingType: "required",
    price: "€ 18 — Su prenotazione",
    eventTime: "Serale (Ore 20:30)",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=600&q=80",
    source: { name: "Regione VdA — Saison Culturelle", url: "https://www.regione.vda.it/cultura/eventi_spettacoli/saison_culturelle_i.aspx", type: "official" },
    isSponsored: false, sponsorTier: "standard",
    status: "approved",
    importanceScore: 9,
    tags: ["saison culturelle", "prosa", "teatro", "aosta"]
  },
  {
    id: "evt-saison-03",
    title: "Saison Culturelle — Chanson Française & Jazz Night",
    description: "Serata internazionale della rassegna Saison Culturelle dedicata alla grande chanson francofona e alle contaminazioni jazz.",
    date: _relDateIso(14), endDate: _relDateIso(14),
    location: "Aosta", area: "aosta",
    suitableForChildren: false,
    lat: 45.7364, lng: 7.3168,
    category: "music", rassegna: "saison_culturelle",
    timeSlot: "evening", costType: "paid", bookingType: "required",
    price: "€ 15 — Biglietteria Splendor",
    eventTime: "Serale (Ore 21:00)",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80",
    source: { name: "Regione VdA — Saison Culturelle", url: "https://www.regione.vda.it/cultura/eventi_spettacoli/saison_culturelle_i.aspx", type: "official" },
    isSponsored: false, sponsorTier: "standard",
    status: "approved",
    importanceScore: 9,
    tags: ["saison culturelle", "chanson", "jazz", "aosta"]
  },
  {
    id: "evt-01",
    title: "Mercatino di Natale \"Marché Vert Noël\"",
    description: "Il celebre villaggio alpino natalizio nel cuore di Aosta. Chalet in legno, produzioni artigianali valdostane, specialità DOP, vin brulé e musica tradizionale tra i monumenti romani.",
    date: _relDateIso(14), endDate: _relDateIso(55),
    location: "Aosta", area: "aosta",
    suitableForChildren: true,
    lat: 45.7372, lng: 7.3201,
    category: "markets", rassegna: "marche_vert_noel",
    timeSlot: "all_day", costType: "free", bookingType: "none",
    price: "Gratuito — Accesso libero",
    eventTime: "10:00 - 20:00",
    image: "https://www.lovevda.it/defaultimagethumb/sch_eventi/22493?width=600&height=337",
    source: { name: "LoveVDA — Mercatini di Natale & Fiere", url: "https://www.lovevda.it/it/banca-dati/2/artigianato-fiere-mercatini/aosta/mercatino-di-natale-marche-vert-noel/22493", type: "official" },
    isSponsored: true, sponsorTier: "gold",
    status: "approved",
    importanceScore: 10,
    tags: ["natale", "mercatini", "artigianato", "aosta", "marche vert noel"]
  },
  // OLTRE 30 GIORNI (+28gg .. +84gg)
  {
    id: "evt-03",
    title: "Alice in ChristmasLand — Luci di Natale al Forte di Bard",
    description: "Spettacolare show immersivo serale di luci, videomapping a 360 gradi e installazioni sonore nella Piazza d'Armi della fortezza di Bard.",
    date: _relDateIso(28), endDate: _relDateIso(60),
    location: "Bard", area: "bassa",
    suitableForChildren: true,
    lat: 45.6120, lng: 7.7440,
    category: "culture", rassegna: "forte_di_bard",
    timeSlot: "evening", costType: "paid", bookingType: "required",
    price: "€ 10 (Prenotazione consigliata)",
    eventTime: "Serale (17:30 - 22:00)",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80",
    source: { name: "Forte di Bard — Polo Culturale & Mostre", url: "https://www.fortedibard.it/eventi/", type: "official" },
    isSponsored: true, sponsorTier: "silver",
    status: "approved",
    importanceScore: 9,
    tags: ["luci", "natale", "castello", "bard", "famiglie", "forte di bard"]
  },
  {
    id: "evt-06",
    title: "Welcome Winter Courmayeur & Concerto Serale",
    description: "Grande evento serale di inaugurazione della stagione invernale ai piedi del Monte Bianco in Piazza Abbé Henry con musica dal vivo, show luminoso e accensione del grande albero.",
    date: _relDateIso(28), endDate: _relDateIso(31),
    location: "Courmayeur", area: "alta",
    suitableForChildren: true,
    lat: 45.7867, lng: 6.9728,
    category: "music", rassegna: "grandi_eventi_montagna",
    timeSlot: "evening", costType: "free", bookingType: "none",
    price: "Gratuito — Accesso libero",
    eventTime: "Serale (dalle 18:30)",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    source: { name: "Regione VdA — LoveVDA Eventi Generali", url: "https://www.lovevda.it/it/eventi", type: "official" },
    isSponsored: false, status: "approved",
    importanceScore: 9,
    tags: ["courmayeur", "inverno", "musica", "monte bianco"]
  },
  {
    id: "evt-05",
    title: "Cogne Ice Opening — Festival dell'Arrampicata su Ghiaccio",
    description: "Raduno internazionale degli appassionati di ice climbing sulle celebri cascate di ghiaccio di Lillaz e della Valnontey nel Parco Nazionale del Gran Paradiso.",
    date: _relDateIso(34), endDate: _relDateIso(36),
    location: "Cogne", area: "media",
    suitableForChildren: false,
    lat: 45.6085, lng: 7.3556,
    category: "sport", rassegna: "grandi_eventi_montagna",
    timeSlot: "day", costType: "paid", bookingType: "required",
    price: "Iscrizione clinic (su prenotazione)",
    eventTime: "Diurno (08:30 - 17:00)",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=80",
    source: { name: "LoveVDA — Sport, Sci, Trail & Competizioni", url: "https://www.lovevda.it/it/sport/eventi-sportivi", type: "official" },
    isSponsored: false, status: "approved",
    importanceScore: 8,
    tags: ["ghiaccio", "sport", "cogne", "granparadiso", "montagna"]
  },
  {
    id: "evt-02",
    title: "1027ª Fiera di Sant'Orso — La Millenaria",
    description: "La storica fiera millenaria dell'artigianato tipico valdostano. Oltre mille scultori, intagliatori e artigiani del legno, della pietra ollare e del ferro battuto nel centro storico di Aosta.",
    date: _relDateIso(84), endDate: _relDateIso(85),
    location: "Aosta", area: "aosta",
    suitableForChildren: true,
    lat: 45.7415, lng: 7.3145,
    category: "markets", rassegna: "fiera_sant_orso",
    timeSlot: "all_day", costType: "free", bookingType: "none",
    price: "Gratuito — Accesso libero",
    eventTime: "Tutto il giorno",
    image: "https://images.unsplash.com/photo-1543872084-c7bd3822856f?auto=format&fit=crop&w=600&q=80",
    source: { name: "Regione VdA — LoveVDA Eventi Generali", url: "https://www.lovevda.it/it/banca-dati/3/artigianato-di-tradizione/aosta/fiera-di-sant-orso/802", type: "official" },
    isSponsored: true, sponsorTier: "gold",
    status: "approved",
    importanceScore: 10,
    tags: ["artigianato", "legno", "tradizione", "fiera", "sant'orso"]
  }
];

const INITIAL_SOURCES = [
  { id: "src-lovevda-main", name: "Regione VdA — LoveVDA Eventi Generali", url: "https://www.lovevda.it/it/eventi/ricerca-generale", type: "official", status: "active", lastCheck: "2026-11-07T09:00:00Z" },
  { id: "src-saison-culturelle", name: "Regione VdA — Saison Culturelle 2026/2027 (Teatro Splendor Aosta)", url: "https://www.lovevda.it/it/eventi/cinema-e-teatro", type: "official", status: "active", lastCheck: "2026-11-07T09:00:00Z" },
  { id: "src-lovevda-mostre", name: "LoveVDA — Mostre, Castelli & Musei", url: "https://www.lovevda.it/it/eventi/mostre", type: "official", status: "active", lastCheck: "2026-11-07T09:00:00Z" },
  { id: "src-lovevda-natale", name: "LoveVDA — Mercatini di Natale & Fiere", url: "https://www.lovevda.it/it/eventi/mercatini-di-natale", type: "official", status: "active", lastCheck: "2026-11-07T09:00:00Z" },
  { id: "src-lovevda-food", name: "LoveVDA — Enogastronomia, Sagre & Degustazioni", url: "https://www.lovevda.it/it/enogastronomia/eventi", type: "official", status: "active", lastCheck: "2026-11-07T09:00:00Z" },
  { id: "src-lovevda-sport", name: "LoveVDA — Sport, Sci, Trail & Competizioni", url: "https://www.lovevda.it/it/sport/eventi-sportivi", type: "official", status: "active", lastCheck: "2026-11-07T09:00:00Z" },
  { id: "src-lovevda-natura", name: "LoveVDA — Escursioni & Visite Guidate", url: "https://www.lovevda.it/it/eventi/escursioni-visite-turistiche-guidate", type: "official", status: "active", lastCheck: "2026-11-07T09:00:00Z" },
  { id: "src-lovevda-bambini", name: "LoveVDA — Eventi per Bambini e Famiglie", url: "https://www.lovevda.it/it/vacanze-bambini/ricerca-eventi", type: "official", status: "active", lastCheck: "2026-11-07T09:00:00Z" },
  { id: "src-fortedibard", name: "Forte di Bard — Polo Culturale & Mostre", url: "https://www.fortedibard.it/eventi/", type: "official", status: "active", lastCheck: "2026-11-07T09:00:00Z" },
  { id: "src-gnews-vda", name: "Google News RSS — Eventi & Spettacoli Valle d'Aosta", url: "https://news.google.com/rss/search?q=eventi+OR+mostra+OR+concerto+OR+fiera+OR+spettacolo+%22Valle+d%27Aosta%22+OR+Aosta+OR+Courmayeur+OR+Bard&hl=it&gl=IT&ceid=IT:it", type: "other", status: "active", lastCheck: "2026-11-07T09:00:00Z" },
  { id: "src-aostasera", name: "AostaSera.it — Feed Notizie & Eventi VdA", url: "https://aostasera.it/feed/", type: "other", status: "active", lastCheck: "2026-11-07T09:00:00Z" }
];

const INITIAL_SERVICES = [
  { id: "srv-01", name: "Baita delle Feste Gressoney", type: "venue", location: "Gressoney-Saint-Jean", area: "bassa", description: "Una splendida baita in legno ristrutturata, ideale per compleanni e piccoli ricevimenti privati. Dotata di impianto audio e cucina attrezzata.", priceRange: "A partire da € 200 / giorno", contacts: "info@baitafestegressoney.it | +39 345 6789012", image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80", isSponsored: true },
  { id: "srv-02", name: "Animazione Alpina - Feste & Truccabimbi", type: "entertainment", location: "Aosta", area: "aosta", description: "Servizio di animazione professionale per feste di compleanno per bambini. Gonfiabili, giochi della tradizione alpina e truccabimbi.", priceRange: "Da € 120 / festa", contacts: "info@animazionealpina.it | +39 333 1234567", image: "https://images.unsplash.com/photo-1481162854517-d9e353af153d?auto=format&fit=crop&w=600&q=80", isSponsored: true },
  { id: "srv-03", name: "Saletta Meeting 'Gran Becca'", type: "venue", location: "Breuil-Cervinia", area: "media", description: "Saletta in stile alpino con caminetto e vista Cervino. Fino a 40 persone, per cene aziendali o compleanni riservati.", priceRange: "Su preventivo", contacts: "prenotazioni@granbecca.vda | +39 0166 123456", image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80", isSponsored: false },
  { id: "srv-04", name: "Le Petit Chef - Catering", type: "catering", location: "Saint-Vincent", area: "bassa", description: "Servizio catering con taglieri valdostani, polenta concia e fondute mobili per compleanni o eventi aziendali.", priceRange: "A partire da € 18 / persona", contacts: "chef@lepetitcatering.it | +39 328 9876543", image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80", isSponsored: false }
];

const INITIAL_USERS = [
  { id: "u-01", username: "admin1", password: "Adm1n€vent!", role: "admin", email: "davidgra81@gmail.com", createdAt: "2026-01-01T00:00:00Z" },
  { id: "u-02", username: "proloco_cogne", password: "cogne2026", role: "editor", email: "proloco@cogne.it", createdAt: "2026-03-15T00:00:00Z" },
  { id: "u-03", username: "terme_pre", password: "terme2026", role: "partner", email: "info@termedipre.it", createdAt: "2026-04-01T00:00:00Z" }
];

// Tutti i 74 Comuni della Valle d'Aosta (+ Breuil-Cervinia) con coordinate reali
const DEFAULT_COMUNI = [
  { name: "Aosta", area: "aosta", lat: 45.7372, lng: 7.3201 },
  { name: "Courmayeur", area: "alta", lat: 45.7867, lng: 6.9728 },
  { name: "Pré-Saint-Didier", area: "alta", lat: 45.7640, lng: 6.9855 },
  { name: "La Thuile", area: "alta", lat: 45.7160, lng: 6.9502 },
  { name: "Morgex", area: "alta", lat: 45.7515, lng: 7.0422 },
  { name: "La Salle", area: "alta", lat: 45.7461, lng: 7.0725 },
  { name: "Avise", area: "alta", lat: 45.7088, lng: 7.1404 },
  { name: "Arvier", area: "alta", lat: 45.7031, lng: 7.1665 },
  { name: "Saint-Nicolas", area: "alta", lat: 45.7180, lng: 7.1680 },
  { name: "Valgrisenche", area: "alta", lat: 45.6300, lng: 7.0645 },
  { name: "Rhêmes-Notre-Dame", area: "alta", lat: 45.5696, lng: 7.1180 },
  { name: "Rhêmes-Saint-Georges", area: "alta", lat: 45.6542, lng: 7.1554 },
  { name: "Introd", area: "alta", lat: 45.6900, lng: 7.1876 },
  { name: "Valsavarenche", area: "alta", lat: 45.5920, lng: 7.2078 },
  { name: "Villeneuve", area: "alta", lat: 45.7024, lng: 7.2075 },
  { name: "Saint-Pierre", area: "alta", lat: 45.7100, lng: 7.2260 },
  { name: "Aymavilles", area: "media", lat: 45.7018, lng: 7.2403 },
  { name: "Cogne", area: "media", lat: 45.6085, lng: 7.3556 },
  { name: "Sarre", area: "media", lat: 45.7410, lng: 7.2580 },
  { name: "Gressan", area: "media", lat: 45.7165, lng: 7.2870 },
  { name: "Jovençan", area: "media", lat: 45.7155, lng: 7.2735 },
  { name: "Charvensod", area: "media", lat: 45.7215, lng: 7.3250 },
  { name: "Pollein", area: "media", lat: 45.7280, lng: 7.3570 },
  { name: "Brissogne", area: "media", lat: 45.7330, lng: 7.4020 },
  { name: "Saint-Christophe", area: "media", lat: 45.7440, lng: 7.3430 },
  { name: "Quart", area: "media", lat: 45.7405, lng: 7.4175 },
  { name: "Nus", area: "media", lat: 45.7400, lng: 7.4690 },
  { name: "Fénis", area: "media", lat: 45.7360, lng: 7.4920 },
  { name: "Saint-Marcel", area: "media", lat: 45.7315, lng: 7.4480 },
  { name: "Roisan", area: "media", lat: 45.7830, lng: 7.3170 },
  { name: "Valpelline", area: "media", lat: 45.8260, lng: 7.3260 },
  { name: "Ollomont", area: "media", lat: 45.8490, lng: 7.3090 },
  { name: "Doues", area: "media", lat: 45.8170, lng: 7.3030 },
  { name: "Oyace", area: "media", lat: 45.8510, lng: 7.3830 },
  { name: "Bionaz", area: "media", lat: 45.8740, lng: 7.4200 },
  { name: "Gignod", area: "media", lat: 45.7770, lng: 7.2940 },
  { name: "Allein", area: "media", lat: 45.8080, lng: 7.2720 },
  { name: "Etroubles", area: "media", lat: 45.8210, lng: 7.2300 },
  { name: "Saint-Oyen", area: "media", lat: 45.8240, lng: 7.2140 },
  { name: "Saint-Rhémy-en-Bosses", area: "media", lat: 45.8235, lng: 7.1840 },
  { name: "Verrayes", area: "media", lat: 45.7700, lng: 7.5350 },
  { name: "Saint-Denis", area: "media", lat: 45.7520, lng: 7.5550 },
  { name: "Chambave", area: "media", lat: 45.7445, lng: 7.5500 },
  { name: "Pontey", area: "media", lat: 45.7380, lng: 7.5900 },
  { name: "Antey-Saint-André", area: "media", lat: 45.8030, lng: 7.5890 },
  { name: "La Magdeleine", area: "media", lat: 45.8110, lng: 7.6180 },
  { name: "Chamois", area: "media", lat: 45.8390, lng: 7.6210 },
  { name: "Torgnon", area: "media", lat: 45.8020, lng: 7.5700 },
  { name: "Valtournenche", area: "media", lat: 45.8770, lng: 7.6200 },
  { name: "Breuil-Cervinia", area: "media", lat: 45.9340, lng: 7.6300 },
  { name: "Châtillon", area: "bassa", lat: 45.7500, lng: 7.6180 },
  { name: "Saint-Vincent", area: "bassa", lat: 45.7440, lng: 7.6490 },
  { name: "Montjovet", area: "bassa", lat: 45.7020, lng: 7.6740 },
  { name: "Emarèse", area: "bassa", lat: 45.7280, lng: 7.6980 },
  { name: "Verrès", area: "bassa", lat: 45.6660, lng: 7.6910 },
  { name: "Issogne", area: "bassa", lat: 45.6540, lng: 7.6840 },
  { name: "Challand-Saint-Victor", area: "bassa", lat: 45.6880, lng: 7.7050 },
  { name: "Challand-Saint-Anselme", area: "bassa", lat: 45.7140, lng: 7.7340 },
  { name: "Brusson", area: "bassa", lat: 45.7580, lng: 7.7300 },
  { name: "Ayas", area: "bassa", lat: 45.8320, lng: 7.7260 },
  { name: "Arnad", area: "bassa", lat: 45.6440, lng: 7.7240 },
  { name: "Champdepraz", area: "bassa", lat: 45.6850, lng: 7.6540 },
  { name: "Champorcher", area: "bassa", lat: 45.6260, lng: 7.6220 },
  { name: "Pontboset", area: "bassa", lat: 45.6075, lng: 7.6865 },
  { name: "Hône", area: "bassa", lat: 45.6125, lng: 7.7355 },
  { name: "Bard", area: "bassa", lat: 45.6120, lng: 7.7440 },
  { name: "Donnas", area: "bassa", lat: 45.6030, lng: 7.7680 },
  { name: "Pont-Saint-Martin", area: "bassa", lat: 45.6020, lng: 7.7980 },
  { name: "Perloz", area: "bassa", lat: 45.6160, lng: 7.8130 },
  { name: "Lillianes", area: "bassa", lat: 45.6330, lng: 7.8440 },
  { name: "Fontainemore", area: "bassa", lat: 45.6470, lng: 7.8580 },
  { name: "Issime", area: "bassa", lat: 45.6860, lng: 7.8550 },
  { name: "Gaby", area: "bassa", lat: 45.7060, lng: 7.8820 },
  { name: "Gressoney-Saint-Jean", area: "bassa", lat: 45.7780, lng: 7.8240 },
  { name: "Gressoney-La-Trinité", area: "bassa", lat: 45.8265, lng: 7.8235 }
];

function initializeStorage() {
  const CURRENT_SCHEMA = "v11.0";
  if (localStorage.getItem("vda_schema_version") !== CURRENT_SCHEMA) {
    localStorage.setItem("vda_events", JSON.stringify(INITIAL_EVENTS));
    localStorage.setItem("vda_sources", JSON.stringify(INITIAL_SOURCES));
    localStorage.setItem("vda_comuni", JSON.stringify(DEFAULT_COMUNI));
    localStorage.setItem("vda_users", JSON.stringify(INITIAL_USERS));
    localStorage.setItem("vda_payments", JSON.stringify([]));
    localStorage.setItem("vda_schema_version", CURRENT_SCHEMA);
  }

  if (!localStorage.getItem("vda_events")) {
    localStorage.setItem("vda_events", JSON.stringify(INITIAL_EVENTS));
  }
  if (!localStorage.getItem("vda_sources")) {
    localStorage.setItem("vda_sources", JSON.stringify(INITIAL_SOURCES));
  }
  if (!localStorage.getItem("vda_services")) {
    localStorage.setItem("vda_services", JSON.stringify(INITIAL_SERVICES));
  }
  if (!localStorage.getItem("vda_users")) {
    localStorage.setItem("vda_users", JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem("vda_comuni")) {
    localStorage.setItem("vda_comuni", JSON.stringify(DEFAULT_COMUNI));
  }
  if (!localStorage.getItem("vda_payments")) {
    localStorage.setItem("vda_payments", JSON.stringify([]));
  }
  if (!localStorage.getItem("vda_analytics")) {
    localStorage.setItem("vda_analytics", JSON.stringify({
      totalViews: 0,
      uniqueVisitors: {},
      dailyViews: {},
      eventStats: {}
    }));
  }
  if (!localStorage.getItem("vda_ads")) {
    const defaultAds = [
      { id: "ad-01", title: "Spa & Relax Pré-Saint-Didier", subtitle: "Scappa dallo stress", description: "Terme di lusso ai piedi del Monte Bianco. Pacchetti speciali per gruppi e compleanni.", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80", link: "https://www.qcterme.com/it/pre-saint-didier", type: "sidebar", status: "active" },
      { id: "ad-02", title: "Guide Alpine Courmayeur", subtitle: "La tua sicurezza in quota", description: "Escursioni e trekking con le guide più famose delle Alpi.", image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80", link: "https://www.guidecourmayeur.com", type: "sidebar", status: "active" }
    ];
    localStorage.setItem("vda_ads", JSON.stringify(defaultAds));
  }
}

initializeStorage();
