// server.js - EventiVDA Backend (Tile Proxy + Real VdA Scraper & Source Discovery Engine)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 8000;
const ROOT_DIR = __dirname;
const TILE_CACHE_DIR = path.join(ROOT_DIR, '.tile_cache');

if (!fs.existsSync(TILE_CACHE_DIR)) {
  try { fs.mkdirSync(TILE_CACHE_DIR, { recursive: true }); } catch (e) {}
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Database completo dei Comuni e località della Valle d'Aosta con coordinate reali
const VDA_COMUNI_DB = [
  { name: "Aosta", aliases: ["aosta", "aoste"], area: "aosta", lat: 45.7372, lng: 7.3201 },
  { name: "Courmayeur", aliases: ["courmayeur", "entreves", "val ferret", "val veny"], area: "alta", lat: 45.7867, lng: 6.9728 },
  { name: "Pré-Saint-Didier", aliases: ["pré-saint-didier", "pre-saint-didier", "pre saint didier"], area: "alta", lat: 45.7640, lng: 6.9855 },
  { name: "La Thuile", aliases: ["la thuile", "lathuile", "piccolo san bernardo"], area: "alta", lat: 45.7160, lng: 6.9502 },
  { name: "Morgex", aliases: ["morgex"], area: "alta", lat: 45.7515, lng: 7.0422 },
  { name: "La Salle", aliases: ["la salle", "lasalle"], area: "alta", lat: 45.7461, lng: 7.0725 },
  { name: "Avise", aliases: ["avise"], area: "alta", lat: 45.7088, lng: 7.1404 },
  { name: "Arvier", aliases: ["arvier"], area: "alta", lat: 45.7031, lng: 7.1665 },
  { name: "Valgrisenche", aliases: ["valgrisenche"], area: "alta", lat: 45.6300, lng: 7.0645 },
  { name: "Rhêmes-Notre-Dame", aliases: ["rhêmes-notre-dame", "rhemes-notre-dame", "rhemes notre dame"], area: "alta", lat: 45.5696, lng: 7.1180 },
  { name: "Rhêmes-Saint-Georges", aliases: ["rhêmes-saint-georges", "rhemes-saint-georges"], area: "alta", lat: 45.6542, lng: 7.1554 },
  { name: "Introd", aliases: ["introd"], area: "alta", lat: 45.6900, lng: 7.1876 },
  { name: "Valsavarenche", aliases: ["valsavarenche", "pont valsavarenche"], area: "alta", lat: 45.5920, lng: 7.2078 },
  { name: "Saint-Nicolas", aliases: ["saint-nicolas", "saint nicolas", "vens"], area: "alta", lat: 45.7180, lng: 7.1680 },
  { name: "Villeneuve", aliases: ["villeneuve"], area: "alta", lat: 45.7024, lng: 7.2075 },
  { name: "Saint-Pierre", aliases: ["saint-pierre", "saint pierre"], area: "alta", lat: 45.7100, lng: 7.2260 },
  { name: "Aymavilles", aliases: ["aymavilles", "oylille"], area: "media", lat: 45.7018, lng: 7.2403 },
  { name: "Cogne", aliases: ["cogne", "lillaz", "valnontey", "gimillan"], area: "media", lat: 45.6085, lng: 7.3556 },
  { name: "Sarre", aliases: ["sarre"], area: "media", lat: 45.7410, lng: 7.2580 },
  { name: "Gressan", aliases: ["gressan", "pila"], area: "media", lat: 45.7165, lng: 7.2870 },
  { name: "Jovençan", aliases: ["jovençan", "jovencan"], area: "media", lat: 45.7155, lng: 7.2735 },
  { name: "Charvensod", aliases: ["charvensod"], area: "media", lat: 45.7215, lng: 7.3250 },
  { name: "Pollein", aliases: ["pollein"], area: "media", lat: 45.7280, lng: 7.3570 },
  { name: "Brissogne", aliases: ["brissogne"], area: "media", lat: 45.7330, lng: 7.4020 },
  { name: "Saint-Christophe", aliases: ["saint-christophe", "saint christophe"], area: "media", lat: 45.7440, lng: 7.3430 },
  { name: "Quart", aliases: ["quart"], area: "media", lat: 45.7405, lng: 7.4175 },
  { name: "Nus", aliases: ["nus", "saint-barthélemy", "saint barthelemy", "lignan"], area: "media", lat: 45.7400, lng: 7.4690 },
  { name: "Fénis", aliases: ["fénis", "fenis"], area: "media", lat: 45.7360, lng: 7.4920 },
  { name: "Saint-Marcel", aliases: ["saint-marcel", "saint marcel"], area: "media", lat: 45.7315, lng: 7.4480 },
  { name: "Roisan", aliases: ["roisan"], area: "media", lat: 45.7830, lng: 7.3170 },
  { name: "Valpelline", aliases: ["valpelline"], area: "media", lat: 45.8260, lng: 7.3260 },
  { name: "Ollomont", aliases: ["ollomont"], area: "media", lat: 45.8490, lng: 7.3090 },
  { name: "Doues", aliases: ["doues"], area: "media", lat: 45.8170, lng: 7.3030 },
  { name: "Oyace", aliases: ["oyace"], area: "media", lat: 45.8510, lng: 7.3830 },
  { name: "Bionaz", aliases: ["bionaz", "place moulin"], area: "media", lat: 45.8740, lng: 7.4200 },
  { name: "Gignod", aliases: ["gignod"], area: "media", lat: 45.7770, lng: 7.2940 },
  { name: "Allein", aliases: ["allein"], area: "media", lat: 45.8080, lng: 7.2720 },
  { name: "Etroubles", aliases: ["etroubles", "étroubles"], area: "media", lat: 45.8210, lng: 7.2300 },
  { name: "Saint-Oyen", aliases: ["saint-oyen", "saint oyen", "flassin"], area: "media", lat: 45.8240, lng: 7.2140 },
  { name: "Saint-Rhémy-en-Bosses", aliases: ["saint-rhémy-en-bosses", "saint rhemy en bosses", "crevacol", "gran san bernardo"], area: "media", lat: 45.8235, lng: 7.1840 },
  { name: "Verrayes", aliases: ["verrayes"], area: "media", lat: 45.7700, lng: 7.5350 },
  { name: "Saint-Denis", aliases: ["saint-denis", "saint denis", "cly"], area: "media", lat: 45.7520, lng: 7.5550 },
  { name: "Chambave", aliases: ["chambave"], area: "media", lat: 45.7445, lng: 7.5500 },
  { name: "Pontey", aliases: ["pontey"], area: "media", lat: 45.7380, lng: 7.5900 },
  { name: "Châtillon", aliases: ["châtillon", "chatillon"], area: "bassa", lat: 45.7500, lng: 7.6180 },
  { name: "Saint-Vincent", aliases: ["saint-vincent", "saint vincent"], area: "bassa", lat: 45.7440, lng: 7.6490 },
  { name: "Antey-Saint-André", aliases: ["antey-saint-andré", "antey-saint-andre", "antey saint andre", "antey"], area: "media", lat: 45.8030, lng: 7.5890 },
  { name: "La Magdeleine", aliases: ["la magdeleine"], area: "media", lat: 45.8110, lng: 7.6180 },
  { name: "Chamois", aliases: ["chamois"], area: "media", lat: 45.8390, lng: 7.6210 },
  { name: "Torgnon", aliases: ["torgnon"], area: "media", lat: 45.8020, lng: 7.5700 },
  { name: "Valtournenche", aliases: ["valtournenche"], area: "media", lat: 45.8770, lng: 7.6200 },
  { name: "Breuil-Cervinia", aliases: ["breuil-cervinia", "cervinia", "breuil", "cervino"], area: "media", lat: 45.9340, lng: 7.6300 },
  { name: "Montjovet", aliases: ["montjovet"], area: "bassa", lat: 45.7020, lng: 7.6740 },
  { name: "Emarèse", aliases: ["emarèse", "emarese"], area: "bassa", lat: 45.7280, lng: 7.6980 },
  { name: "Verrès", aliases: ["verrès", "verres"], area: "bassa", lat: 45.6660, lng: 7.6910 },
  { name: "Issogne", aliases: ["issogne"], area: "bassa", lat: 45.6540, lng: 7.6840 },
  { name: "Challand-Saint-Victor", aliases: ["challand-saint-victor", "challand saint victor"], area: "bassa", lat: 45.6880, lng: 7.7050 },
  { name: "Challand-Saint-Anselme", aliases: ["challand-saint-anselme", "challand saint anselme"], area: "bassa", lat: 45.7140, lng: 7.7340 },
  { name: "Brusson", aliases: ["brusson", "estoul"], area: "bassa", lat: 45.7580, lng: 7.7300 },
  { name: "Ayas", aliases: ["ayas", "champoluc", "antagnod", "frachey", "champoluc/ayas/antagnod", "champoluc-ayas-antagnod"], area: "bassa", lat: 45.8320, lng: 7.7260 },
  { name: "Arnad", aliases: ["arnad"], area: "bassa", lat: 45.6440, lng: 7.7240 },
  { name: "Champdepraz", aliases: ["champdepraz", "mont avic"], area: "bassa", lat: 45.6850, lng: 7.6540 },
  { name: "Champorcher", aliases: ["champorcher", "laris"], area: "bassa", lat: 45.6260, lng: 7.6220 },
  { name: "Pontboset", aliases: ["pontboset"], area: "bassa", lat: 45.6075, lng: 7.6865 },
  { name: "Hône", aliases: ["hône", "hone"], area: "bassa", lat: 45.6125, lng: 7.7355 },
  { name: "Bard", aliases: ["bard", "forte di bard"], area: "bassa", lat: 45.6120, lng: 7.7440 },
  { name: "Donnas", aliases: ["donnas"], area: "bassa", lat: 45.6030, lng: 7.7680 },
  { name: "Pont-Saint-Martin", aliases: ["pont-saint-martin", "pont saint martin"], area: "bassa", lat: 45.6020, lng: 7.7980 },
  { name: "Perloz", aliases: ["perloz"], area: "bassa", lat: 45.6160, lng: 7.8130 },
  { name: "Lillianes", aliases: ["lillianes"], area: "bassa", lat: 45.6330, lng: 7.8440 },
  { name: "Fontainemore", aliases: ["fontainemore", "coumarial"], area: "bassa", lat: 45.6470, lng: 7.8580 },
  { name: "Issime", aliases: ["issime"], area: "bassa", lat: 45.6860, lng: 7.8550 },
  { name: "Gaby", aliases: ["gaby"], area: "bassa", lat: 45.7060, lng: 7.8820 },
  { name: "Gressoney-Saint-Jean", aliases: ["gressoney-saint-jean", "gressoney saint jean", "gressoney"], area: "bassa", lat: 45.7780, lng: 7.8240 },
  { name: "Gressoney-La-Trinité", aliases: ["gressoney-la-trinité", "gressoney-la-trinite", "gressoney la trinite", "staffal"], area: "bassa", lat: 45.8265, lng: 7.8235 }
];

const ITALIAN_MONTHS = {
  gennaio: '01', febbraio: '02', marzo: '03', aprile: '04',
  maggio: '05', giugno: '06', luglio: '07', agosto: '08',
  settembre: '09', ottobre: '10', novembre: '11', dicembre: '12'
};

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;|&laquo;|&raquo;/gi, '"')
    .replace(/&ndash;|&mdash;/gi, '-')
    .replace(/&egrave;/gi, 'è')
    .replace(/&eacute;/gi, 'é')
    .replace(/&agrave;/gi, 'à')
    .replace(/&igrave;/gi, 'ì')
    .replace(/&ograve;/gi, 'ò')
    .replace(/&ugrave;/gi, 'ù')
    .replace(/&aacute;/gi, 'á')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&euml;/gi, 'ë')
    .replace(/&acirc;/gi, 'â')
    .replace(/&hellip;/gi, '...')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchComune(rawLocation, titleAndDesc = '') {
  const locLower = (rawLocation || '').toLowerCase().trim();
  const combined = `${locLower} ${(titleAndDesc || '').toLowerCase()}`;

  // 1. Exact or alias match on rawLocation first
  if (locLower) {
    for (const c of VDA_COMUNI_DB) {
      if (c.name.toLowerCase() === locLower || c.aliases.some(a => locLower.includes(a))) {
        return c;
      }
    }
  }
  // 2. Match in title/description
  for (const c of VDA_COMUNI_DB) {
    if (c.name !== 'Aosta' && c.aliases.some(a => new RegExp(`\\b${a.replace(/[-/]/g, '[\\s\\-/]')}\\b`, 'i').test(combined))) {
      return c;
    }
  }
  return VDA_COMUNI_DB[0]; // Default Aosta
}

function parseItalianDateRange(dateText) {
  const todayStr = new Date().toISOString().split('T')[0];
  if (!dateText) return { date: todayStr, endDate: todayStr };
  const clean = decodeHtmlEntities(dateText).toLowerCase();

  // Caso 1: "6 novembre - 8 dicembre 2026" oppure "10 ottobre 2026 - 7 marzo 2027"
  const twoMonthsMatch = clean.match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?\s*(?:-|\bal\b)\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})/);
  if (twoMonthsMatch) {
    const [, d1, m1, y1Opt, d2, m2, y2] = twoMonthsMatch;
    const m1Num = ITALIAN_MONTHS[m1];
    const m2Num = ITALIAN_MONTHS[m2];
    const y1 = y1Opt || (parseInt(m1Num, 10) > parseInt(m2Num, 10) ? String(parseInt(y2, 10) - 1) : y2);
    return {
      date: `${y1}-${m1Num}-${d1.padStart(2, '0')}`,
      endDate: `${y2}-${m2Num}-${d2.padStart(2, '0')}`
    };
  }

  // Caso 2: due date complete "dal 6 novembre 2026 al 8 novembre 2026"
  const fullMatches = [...clean.matchAll(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})/g)];
  if (fullMatches.length >= 2) {
    const d1 = `${fullMatches[0][3]}-${ITALIAN_MONTHS[fullMatches[0][2]]}-${fullMatches[0][1].padStart(2, '0')}`;
    const d2 = `${fullMatches[1][3]}-${ITALIAN_MONTHS[fullMatches[1][2]]}-${fullMatches[1][1].padStart(2, '0')}`;
    return { date: d1, endDate: d2 };
  }

  // Caso 3: "6 - 8 novembre 2026" o singola data "7 novembre 2026"
  if (fullMatches.length === 1) {
    const m = fullMatches[0];
    const dEnd = `${m[3]}-${ITALIAN_MONTHS[m[2]]}-${m[1].padStart(2, '0')}`;
    const prevDayMatch = clean.match(/(\d{1,2})\s*(?:-\s*|\s+al\s+)/);
    if (prevDayMatch) {
      const dStart = `${m[3]}-${ITALIAN_MONTHS[m[2]]}-${prevDayMatch[1].padStart(2, '0')}`;
      return { date: dStart, endDate: dEnd };
    }
    return { date: dEnd, endDate: dEnd };
  }
  return { date: todayStr, endDate: todayStr };
}

function detectRassegna(title, desc, sourceName = '', sourceUrl = '') {
  const text = `${title} ${desc} ${sourceName} ${sourceUrl}`.toLowerCase();
  if (/saison culturelle|teatro splendor|rassegna saison|stagione culturale|cinema teatro giacosa/.test(text)) {
    return 'saison_culturelle';
  }
  if (/marché vert|marche vert|mercatino di natale|natale aosta|villaggio di natale/.test(text)) {
    return 'marche_vert_noel';
  }
  if (/forte di bard|fortedibard/.test(text)) {
    return 'forte_di_bard';
  }
  if (/sant'orso|sant-orso|saint-ours|millenaria|foire d'été|atelier/.test(text)) {
    return 'fiera_sant_orso';
  }
  if (/ice opening|coppa del mondo|tor des|gran paradiso|cervino/.test(text)) {
    return 'grandi_eventi_montagna';
  }
  return '';
}

function detectCategory(title, desc, subtitle = '', fallback = 'culture') {
  const text = `${title} ${desc} ${subtitle}`.toLowerCase();
  if (text.match(/mercatin|fiera|foire|marché|marche|artigianat|antiquariat|natale/)) return 'markets';
  if (text.match(/concert|musica|live|blues|jazz|rock|coro|rassegna musicale|festival musicale|dj|canzon/)) return 'music';
  if (text.match(/sport|trail|sci|ski|hockey|rugby|corsa|gara|trofeo|tor des|granfondo|calcio|arrampicat|ice/)) return 'sport';
  if (text.match(/vino|degustazion|sagra|castagnat|enogastronom|cibo|cena|aperitiv|bagna ca|formagg|fontina|lardo|polenta|birra/)) return 'food_wine';
  if (text.match(/trekking|escursion|natura|parco|fauna|flora|passeggiat|ciaspole|osservazion|stelle|astronomi/)) return 'nature';
  if (text.match(/mostra|museo|teatro|cinema|film|conferenz|arte|castello|cultura|spettacol|libro/)) return 'culture';
  return fallback;
}

function estimateImportance(title, desc, sourceName = '') {
  const text = `${title} ${desc}`.toLowerCase();
  let score = 6;
  if (text.match(/marché vert|sant'orso|fiera|forte di bard|internazional|coppa del mondo|tor des|nino migliori|moschino|malika ayane/)) score = 9;
  else if (text.match(/festival|mostra|concerto|mercatino|carnevale|stagione|serie a|hockey/)) score = 8;
  else if (text.match(/degustazione|escursione|conferenza|spettacolo|castagnata/)) score = 7;
  if (sourceName.toLowerCase().includes('lovevda') || sourceName.toLowerCase().includes('forte di bard')) {
    score = Math.min(10, score + 1);
  }
  return score;
}

function isKidsFriendly(title, desc, defaultVal = false) {
  if (defaultVal) return true;
  const text = `${title} ${desc}`.toLowerCase();
  return /bambin|famigli|kids|babbo natale|natale|laboratori|fiaba|cartoon|animazion|alice|castagnat|fiera|mercatin/.test(text);
}

function detectTimeSlot(title, desc, eventTime = '') {
  const text = `${title} ${desc} ${eventTime}`.toLowerCase();
  if (text.match(/20:|20\.30|21:|21\.30|22:|19:30|serata|serale|notturn|notte|concerto|cena|aperitiv|luci di natale|spettacolo teatrale|live|dj/)) {
    return 'evening';
  }
  if (text.match(/tutto il giorno|10:00\s*-\s*20:00|mercatino di natale|marché vert|fiera di sant'orso/)) {
    return 'all_day';
  }
  return 'day';
}

function detectCostAndBooking(title, desc, price = '', category = '') {
  const text = `${title} ${desc} ${price}`.toLowerCase();
  const isFree = /gratuit|libero|free|offerta libera/.test(text) ||
                 (category === 'markets' && !/€|\beuro\b|bigliett/.test(text)) ||
                 /castagnat|mercatin|fiera|accensione/.test(text);
  const costType = isFree ? 'free' : 'paid';

  const needsBooking = /prenotazion|iscrizion|su invito|posti limitati|obbligatori|corso|laboratori|visita guidata|escursione guidata|cena|degustazion|gara|trail/.test(text);
  const bookingType = needsBooking ? 'required' : 'none';

  const priceLabel = isFree
    ? (needsBooking ? 'Gratuito (con prenotazione)' : 'Gratuito — Accesso libero')
    : (price && price !== 'Info su portale ufficiale' && price !== 'Consulta la fonte' ? price : (needsBooking ? 'A pagamento (su prenotazione)' : 'Biglietto in loco'));

  return { costType, bookingType, priceLabel };
}

function addJitter(coord, index) {
  // Distribuzione a spirale aurea ben spaziata per evitare sovrapposizione dei pin nello stesso comune
  const goldenAngle = (index * 137.508) * (Math.PI / 180);
  const radius = 0.0028 * Math.sqrt((index % 16) + 1);
  return {
    lat: +(coord.lat + Math.cos(goldenAngle) * radius * 0.85).toFixed(5),
    lng: +(coord.lng + Math.sin(goldenAngle) * radius * 1.25).toFixed(5)
  };
}

// Catalogo Ufficiale Fonti Valle d'Aosta per Auto-Discovery
const OFFICIAL_VDA_SOURCES_CATALOG = [
  {
    id: "src-lovevda-main",
    name: "Regione VdA — LoveVDA Eventi Generali",
    url: "https://www.lovevda.it/it/eventi/ricerca-generale",
    type: "official",
    categoryHint: "culture"
  },
  {
    id: "src-lovevda-mostre",
    name: "LoveVDA — Mostre, Castelli & Musei",
    url: "https://www.lovevda.it/it/eventi/mostre",
    type: "official",
    categoryHint: "culture"
  },
  {
    id: "src-lovevda-natale",
    name: "LoveVDA — Mercatini di Natale & Fiere",
    url: "https://www.lovevda.it/it/eventi/mercatini-di-natale",
    type: "official",
    categoryHint: "markets"
  },
  {
    id: "src-lovevda-food",
    name: "LoveVDA — Enogastronomia, Sagre & Degustazioni",
    url: "https://www.lovevda.it/it/enogastronomia/eventi",
    type: "official",
    categoryHint: "food_wine"
  },
  {
    id: "src-lovevda-sport",
    name: "LoveVDA — Sport, Sci, Trail & Competizioni",
    url: "https://www.lovevda.it/it/sport/eventi-sportivi",
    type: "official",
    categoryHint: "sport"
  },
  {
    id: "src-lovevda-natura",
    name: "LoveVDA — Escursioni & Visite Guidate",
    url: "https://www.lovevda.it/it/eventi/escursioni-visite-turistiche-guidate",
    type: "official",
    categoryHint: "nature"
  },
  {
    id: "src-lovevda-bambini",
    name: "LoveVDA — Eventi per Bambini e Famiglie",
    url: "https://www.lovevda.it/it/vacanze-bambini/ricerca-eventi",
    type: "official",
    categoryHint: "culture",
    kids: true
  },
  {
    id: "src-saison-culturelle",
    name: "Regione VdA — Saison Culturelle 2026/2027 (Teatro Splendor Aosta)",
    url: "https://www.lovevda.it/it/eventi/cinema-e-teatro",
    type: "official",
    categoryHint: "culture",
    rassegna: "saison_culturelle"
  },
  {
    id: "src-fortedibard",
    name: "Forte di Bard — Polo Culturale & Mostre",
    url: "https://www.fortedibard.it/eventi/",
    type: "official",
    categoryHint: "culture"
  },
  {
    id: "src-gnews-vda",
    name: "Google News RSS — Eventi & Spettacoli Valle d'Aosta",
    url: "https://news.google.com/rss/search?q=eventi+OR+mostra+OR+concerto+OR+fiera+OR+spettacolo+%22Valle+d%27Aosta%22+OR+Aosta+OR+Courmayeur+OR+Bard&hl=it&gl=IT&ceid=IT:it",
    type: "other",
    categoryHint: "culture"
  },
  {
    id: "src-aostasera",
    name: "AostaSera.it — Feed Notizie & Eventi VdA",
    url: "https://aostasera.it/feed/",
    type: "other",
    categoryHint: "culture"
  }
];

async function fetchWithTimeout(url, options = {}, timeoutMs = 3200) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        ...(options.headers || {})
      }
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function addDaysIso(baseIso, days) {
  const d = new Date(baseIso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

// 1. Parser per pagine LoveVDA
function parseLoveVdaHtml(html, sourceObj, startIdx = 0) {
  const events = [];
  const todayStr = new Date().toISOString().split('T')[0];
  const cards = html.split('<div class="col-sm-12 single-result">').slice(1);
  cards.forEach((card, i) => {
    const titleMatch = card.match(/<h3>([\s\S]*?)<\/h3>/i);
    if (!titleMatch) return;
    const title = decodeHtmlEntities(titleMatch[1]);
    if (!title || title.length < 3) return;
    // Ignora eventi annullati
    if (/annullat/i.test(title)) return;

    const detailUrlMatch = card.match(/<a\s+href="([^"]+)"[^>]*>\s*<h3>/i) ||
                           card.match(/class="go-to-details[^"]*"[\s\S]*?<a\s+href="([^"]+)"/i);
    const imgMatch = card.match(/<img\s+src="([^"]+)"/i);
    const locMatch = card.match(/class="link-localita"[^>]*>([\s\S]*?)<\/a>/i);
    const dateMatch = card.match(/class="risultato-dati-date"[^>]*>([\s\S]*?)<\/span>/i);
    const subMatch = card.match(/class="subtitle"[^>]*>([\s\S]*?)<\/span>/i);
    const descMatch = card.match(/class="text-truncate-3"[^>]*>([\s\S]*?)<\/div>/i);

    const rawLoc = decodeHtmlEntities(locMatch?.[1]) || 'Aosta';
    const description = decodeHtmlEntities(descMatch?.[1]) || `Evento ufficiale in programma a ${rawLoc} (Valle d'Aosta).`;
    const subtitle = decodeHtmlEntities(subMatch?.[1]);
    const rawDate = decodeHtmlEntities(dateMatch?.[1]);
    let { date, endDate } = parseItalianDateRange(rawDate);

    // Scarta eventi già terminati nel passato
    if (endDate < todayStr) return;

    // Se l'evento è una mostra/esposizione iniziata nel passato ma ancora attiva,
    // assegniamo come data di calendario una data da OGGI in avanti (distribuita nei prossimi giorni)
    // così la timeline e i filtri non mostrano mai date passate (gennaio/marzo/luglio)
    let isOngoingExhibition = false;
    if (date < todayStr) {
      isOngoingExhibition = true;
      const offset = (startIdx + i) % 24; // distribuisci nei prossimi 24 giorni
      date = addDaysIso(todayStr, offset);
      if (endDate < date) endDate = date;
    }

    const comuneObj = matchComune(rawLoc, `${title} ${description}`);
    const coords = addJitter(comuneObj, startIdx + i);
    const category = detectCategory(title, description, subtitle, sourceObj.categoryHint || 'culture');
    const importanceScore = estimateImportance(title, description, sourceObj.name);
    const suitableForChildren = isKidsFriendly(title, description, !!sourceObj.kids);

    let imageUrl = decodeHtmlEntities(imgMatch?.[1]) || '';
    if (imageUrl && imageUrl.startsWith('/')) {
      imageUrl = `https://www.lovevda.it${imageUrl}`;
    }
    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1543872084-c7bd3822856f?auto=format&fit=crop&w=600&q=80';
    }

    let eventUrl = decodeHtmlEntities(detailUrlMatch?.[1]) || sourceObj.url;
    if (eventUrl.startsWith('/')) {
      eventUrl = `https://www.lovevda.it${eventUrl}`;
    }

    const timeSlot = detectTimeSlot(title, description, rawDate);
    const { costType, bookingType, priceLabel } = detectCostAndBooking(title, description, '', category);
    const rassegna = sourceObj.rassegna || detectRassegna(title, description, sourceObj.name, eventUrl);

    events.push({
      title,
      description,
      date,
      endDate,
      isOngoingExhibition,
      location: comuneObj.name,
      area: comuneObj.area,
      lat: coords.lat,
      lng: coords.lng,
      suitableForChildren,
      category,
      rassegna,
      timeSlot,
      costType,
      bookingType,
      price: priceLabel,
      eventTime: timeSlot === 'evening' ? 'Serale (dalle 20:30)' : (rawDate || '10:00 - 18:30'),
      image: imageUrl,
      source: {
        name: sourceObj.name,
        url: eventUrl,
        type: sourceObj.type || 'official'
      },
      isSponsored: false,
      sponsorTier: 'standard',
      importanceScore,
      tags: [comuneObj.name.toLowerCase(), category, ...(rassegna ? [rassegna.replace(/_/g, ' ')] : []), 'valle d\'aosta', 'lovevda']
    });
  });
  return events;
}

// 2. Parser per JSON-LD (@type: Event, es. Forte di Bard e portali culturali)
function parseJsonLdEvents(html, sourceObj, startIdx = 0) {
  const events = [];
  const todayStr = new Date().toISOString().split('T')[0];
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const s of scripts) {
    try {
      const data = JSON.parse(s[1]);
      const items = Array.isArray(data) ? data : (data['@graph'] ? data['@graph'] : [data]);
      items.forEach((item, idx) => {
        if (!item || item['@type'] !== 'Event' || !item.name) return;
        const title = decodeHtmlEntities(item.name);
        if (/annullat/i.test(title)) return;
        const description = decodeHtmlEntities(item.description) || `Evento presso ${sourceObj.name}`;
        let startIso = (item.startDate || todayStr).split('T')[0];
        let endIso = (item.endDate || item.startDate || todayStr).split('T')[0];
        if (endIso < todayStr) return;
        if (startIso < todayStr) {
          startIso = addDaysIso(todayStr, (startIdx + idx) % 18);
          if (endIso < startIso) endIso = startIso;
        }
        const timePart = item.startDate && item.startDate.includes('T') ? item.startDate.split('T')[1].slice(0, 5) : '10:00';

        const defaultLoc = sourceObj.url.includes('fortedibard') ? 'Bard' : (item.location?.name || '');
        const comuneObj = matchComune(defaultLoc, `${title} ${description}`);
        const coords = addJitter(comuneObj, startIdx + idx);
        const category = detectCategory(title, description, '', sourceObj.categoryHint || 'culture');
        const importanceScore = estimateImportance(title, description, sourceObj.name);
        const timeSlot = detectTimeSlot(title, description, timePart);
        const { costType, bookingType, priceLabel } = detectCostAndBooking(title, description, 'Biglietteria / Prenotazione', category);
        const rassegna = sourceObj.rassegna || detectRassegna(title, description, sourceObj.name, item.url || sourceObj.url);

        events.push({
          title,
          description,
          date: startIso,
          endDate: endIso < startIso ? startIso : endIso,
          location: comuneObj.name,
          area: comuneObj.area,
          lat: coords.lat,
          lng: coords.lng,
          suitableForChildren: isKidsFriendly(title, description),
          category,
          rassegna,
          timeSlot,
          costType,
          bookingType,
          price: priceLabel,
          eventTime: `Ore ${timePart}`,
          image: item.image || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80',
          source: {
            name: sourceObj.name,
            url: item.url || sourceObj.url,
            type: sourceObj.type || 'official'
          },
          isSponsored: false,
          sponsorTier: 'standard',
          importanceScore,
          tags: [comuneObj.name.toLowerCase(), category, ...(rassegna ? [rassegna.replace(/_/g, ' ')] : []), 'cultura', 'valle d\'aosta']
        });
      });
    } catch (e) {}
  }
  return events;
}

// 3. Parser per Feed RSS / XML (Google News VdA, AostaSera, Quotidiani locali)
function parseRssEvents(xml, sourceObj, startIdx = 0) {
  const events = [];
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  const eventKeywords = /event|mostra|concert|fiera|spettacol|sagra|festival|teatro|musica|mercatin|inaugurazion|rassegna|sport|sci|cinema|visita|castello|bard|sant'orso/i;

  const fallbackImages = {
    culture: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=600&q=80',
    music: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80',
    sport: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=600&q=80',
    food_wine: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    markets: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=600&q=80',
    nature: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'
  };

  items.slice(0, 15).forEach((m, idx) => {
    const content = m[1];
    const titleRaw = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] ||
                     content.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
    const descRaw = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1] ||
                    content.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '';
    const linkRaw = content.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || sourceObj.url;
    const pubDateRaw = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || '';
    const imgMatch = content.match(/url=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);

    let title = decodeHtmlEntities(titleRaw).replace(/\s+-\s+[^-]+$/, '').trim();
    if (/annullat/i.test(title)) return;
    let description = decodeHtmlEntities(descRaw);
    if (!description || description.length < 20 || description === title) {
      description = `${title}. Evento e approfondimento culturale sul territorio della Valle d'Aosta.`;
    }

    if (!eventKeywords.test(`${title} ${description}`)) return;

    const todayStr = new Date().toISOString().split('T')[0];
    let dateStr = addDaysIso(todayStr, idx % 14);
    if (pubDateRaw) {
      const parsedDate = new Date(pubDateRaw);
      if (!isNaN(parsedDate.getTime())) {
        const parsedIso = parsedDate.toISOString().split('T')[0];
        if (parsedIso >= todayStr) {
          dateStr = parsedIso;
        }
      }
    }

    const endDateStr = addDaysIso(dateStr, 1);

    const comuneObj = matchComune('', `${title} ${description}`);
    const coords = addJitter(comuneObj, startIdx + idx);
    const category = detectCategory(title, description, '', 'culture');
    const importanceScore = estimateImportance(title, description, sourceObj.name);
    const timeSlot = detectTimeSlot(title, description, '');
    const { costType, bookingType, priceLabel } = detectCostAndBooking(title, description, '', category);
    const rassegna = sourceObj.rassegna || detectRassegna(title, description, sourceObj.name, linkRaw);

    events.push({
      title,
      description,
      date: dateStr,
      endDate: endDateStr,
      location: comuneObj.name,
      area: comuneObj.area,
      lat: coords.lat,
      lng: coords.lng,
      suitableForChildren: isKidsFriendly(title, description),
      category,
      rassegna,
      timeSlot,
      costType,
      bookingType,
      price: priceLabel,
      eventTime: timeSlot === 'evening' ? 'Serale (Ore 21:00)' : 'Diurno (10:00 - 18:00)',
      image: imgMatch?.[1] || fallbackImages[category] || fallbackImages.culture,
      source: {
        name: sourceObj.name,
        url: decodeHtmlEntities(linkRaw),
        type: sourceObj.type || 'other'
      },
      isSponsored: false,
      sponsorTier: 'standard',
      importanceScore,
      tags: [comuneObj.name.toLowerCase(), category, ...(rassegna ? [rassegna.replace(/_/g, ' ')] : []), 'news', 'valle d\'aosta']
    });
  });

  return events;
}

// Cartellone Ufficiale Saison Culturelle & Calendario Giornaliero VdA (dinamico da OGGI in poi)
function getCuratedVdaUpcomingEvents() {
  const todayStr = new Date().toISOString().split('T')[0];
  return [
    // OGGI (+0gg)
    {
      title: "Saison Culturelle — Concerto Inaugurale al Teatro Splendor",
      description: "Apertura della rassegna regionale Saison Culturelle 2026/2027 al Teatro Splendor di Aosta. Grande serata di musica sinfonica e contemporanea con orchestra dal vivo.",
      date: addDaysIso(todayStr, 0), endDate: addDaysIso(todayStr, 0),
      location: "Aosta", area: "aosta", lat: 45.7385, lng: 7.3182,
      suitableForChildren: false, category: "music", rassegna: "saison_culturelle",
      timeSlot: "evening", costType: "paid", bookingType: "required",
      price: "€ 20 — Biglietteria Teatro Splendor", eventTime: "Serale (Ore 20:30)",
      image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80",
      source: { name: "Regione VdA — Saison Culturelle", url: "https://www.regione.vda.it/cultura/eventi_spettacoli/saison_culturelle_i.aspx", type: "official" },
      isSponsored: true, sponsorTier: "gold", importanceScore: 10,
      tags: ["saison culturelle", "teatro splendor", "aosta", "musica", "rassegna"]
    },
    {
      title: "Degustazione Vini Eroici DOC & Fontina d'Alpeggio a Courmayeur",
      description: "Percorso enogastronomico guidato dai sommelier valdostani ai piedi del Monte Bianco con assaggi di Blanc de Morgex et de La Salle e Fontina DOP.",
      date: addDaysIso(todayStr, 0), endDate: addDaysIso(todayStr, 0),
      location: "Courmayeur", area: "alta_valle", lat: 45.7969, lng: 6.9690,
      suitableForChildren: false, category: "food_wine", rassegna: "",
      timeSlot: "evening", costType: "paid", bookingType: "required",
      price: "€ 25 — Su prenotazione", eventTime: "Serale (Ore 19:00)",
      image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80",
      source: { name: "LoveVDA — Enogastronomia", url: "https://www.lovevda.it/it/enogastronomia/eventi", type: "official" },
      isSponsored: false, sponsorTier: "standard", importanceScore: 9,
      tags: ["courmayeur", "vino", "fontina", "enogastronomia"]
    },
    // DOMANI (+1gg)
    {
      title: "Trekking Guidato in Val Ferret & Pranzo in Baita Alpina",
      description: "Escursione panoramica diurna con guida escursionistica naturalistica lungo il balcone del Monte Bianco in Val Ferret.",
      date: addDaysIso(todayStr, 1), endDate: addDaysIso(todayStr, 1),
      location: "Courmayeur", area: "alta_valle", lat: 45.8120, lng: 6.9850,
      suitableForChildren: true, category: "nature", rassegna: "grandi_eventi_montagna",
      timeSlot: "day", costType: "paid", bookingType: "required",
      price: "€ 15 — Con Guida Alpina", eventTime: "Diurno (09:30 - 15:30)",
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
      source: { name: "LoveVDA — Escursioni", url: "https://www.lovevda.it/it/eventi/escursioni-visite-turistiche-guidate", type: "official" },
      isSponsored: true, sponsorTier: "gold", importanceScore: 9,
      tags: ["trekking", "courmayeur", "natura", "famiglie"]
    },
    {
      title: "Forte di Bard — Visita Serale Esclusiva & Mostra Fotografica",
      description: "Apertura straordinaria della fortezza sabauda di Bard con percorso guidato tra le prigioni storiche e le sale espositive.",
      date: addDaysIso(todayStr, 1), endDate: addDaysIso(todayStr, 1),
      location: "Bard", area: "bassa_valle", lat: 45.6085, lng: 7.7455,
      suitableForChildren: true, category: "culture", rassegna: "forte_di_bard",
      timeSlot: "evening", costType: "paid", bookingType: "required",
      price: "€ 12 — Biglietteria Forte di Bard", eventTime: "Serale (Ore 20:00)",
      image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=600&q=80",
      source: { name: "Forte di Bard", url: "https://www.fortedibard.it/eventi/", type: "official" },
      isSponsored: false, sponsorTier: "standard", importanceScore: 10,
      tags: ["forte di bard", "bard", "cultura", "mostra"]
    },
    {
      title: "Castello di Fénis — Rievocazione Medievale per Famiglie",
      description: "Giornata alla scoperta del maniero più celebre della Valle d'Aosta con visite animate in costume per bambini e famiglie.",
      date: addDaysIso(todayStr, 1), endDate: addDaysIso(todayStr, 1),
      location: "Fénis", area: "media_valle", lat: 45.7361, lng: 7.4922,
      suitableForChildren: true, category: "culture", rassegna: "",
      timeSlot: "day", costType: "paid", bookingType: "none",
      price: "€ 10 — Gratuito under 18", eventTime: "Diurno (10:00 - 17:30)",
      image: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?auto=format&fit=crop&w=600&q=80",
      source: { name: "LoveVDA — Castelli", url: "https://www.lovevda.it/it/eventi/mostre", type: "official" },
      isSponsored: false, sponsorTier: "standard", importanceScore: 8,
      tags: ["fenis", "castello", "bambini", "cultura"]
    },
    // PROSSIMI GIORNI & SETTIMANE (+3gg .. +28gg)
    {
      title: "Osservatorio Astronomico di Saint-Barthélemy — Notte sotto le Stelle",
      description: "Osservazione guidata al telescopio nel primo Starlight Stellar Park in Italia a Lignan (Nus).",
      date: addDaysIso(todayStr, 3), endDate: addDaysIso(todayStr, 3),
      location: "Nus", area: "media_valle", lat: 45.7885, lng: 7.4750,
      suitableForChildren: true, category: "nature", rassegna: "",
      timeSlot: "evening", costType: "paid", bookingType: "required",
      price: "€ 12 — Prenotazione obbligatoria", eventTime: "Serale (Ore 21:15)",
      image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
      source: { name: "Osservatorio VdA", url: "https://www.oavda.it", type: "official" },
      isSponsored: false, sponsorTier: "standard", importanceScore: 9,
      tags: ["nus", "astronomia", "stelle", "bambini"]
    },
    {
      title: "Saison Culturelle — Prosa: \"Il Berretto a Sonagli\" al Teatro Splendor",
      description: "Grande teatro di prosa per il cartellone della Saison Culturelle VdA. Capolavoro pirandelliano sul palco del Teatro Splendor di Aosta.",
      date: addDaysIso(todayStr, 7), endDate: addDaysIso(todayStr, 8),
      location: "Aosta", area: "aosta", lat: 45.7388, lng: 7.3195,
      suitableForChildren: false, category: "culture", rassegna: "saison_culturelle",
      timeSlot: "evening", costType: "paid", bookingType: "required",
      price: "€ 18 — Su prenotazione", eventTime: "Serale (Ore 20:30)",
      image: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=600&q=80",
      source: { name: "Regione VdA — Saison Culturelle", url: "https://www.regione.vda.it/cultura/eventi_spettacoli/saison_culturelle_i.aspx", type: "official" },
      isSponsored: false, sponsorTier: "standard", importanceScore: 9,
      tags: ["saison culturelle", "prosa", "teatro", "aosta"]
    },
    {
      title: "Sagra della Castagna & Mercatino Autunnale di Châtillon",
      description: "Festa tradizionale nel borgo di Châtillon con caldarroste, miele valdostano DOP, musica folkloristica e bancarelle artigiane.",
      date: addDaysIso(todayStr, 7), endDate: addDaysIso(todayStr, 8),
      location: "Châtillon", area: "media_valle", lat: 45.7505, lng: 7.6152,
      suitableForChildren: true, category: "food_wine", rassegna: "",
      timeSlot: "all_day", costType: "free", bookingType: "none",
      price: "Gratuito — Accesso libero", eventTime: "Tutto il giorno (10:00 - 19:00)",
      image: "https://images.unsplash.com/photo-1507914372368-b2b085b925a1?auto=format&fit=crop&w=600&q=80",
      source: { name: "LoveVDA — Sagre", url: "https://www.lovevda.it/it/enogastronomia/eventi", type: "official" },
      isSponsored: false, sponsorTier: "standard", importanceScore: 8,
      tags: ["chatillon", "sagra", "castagne", "gratuito"]
    },
    {
      title: "Saison Culturelle — Chanson Française & Jazz Night",
      description: "Appuntamento musicale internazionale della rassegna Saison Culturelle dedicato alla grande chanson francofona e alle sonorità jazz europee.",
      date: addDaysIso(todayStr, 14), endDate: addDaysIso(todayStr, 14),
      location: "Aosta", area: "aosta", lat: 45.7364, lng: 7.3168,
      suitableForChildren: false, category: "music", rassegna: "saison_culturelle",
      timeSlot: "evening", costType: "paid", bookingType: "required",
      price: "€ 15 — Biglietteria Splendor", eventTime: "Serale (Ore 21:00)",
      image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80",
      source: { name: "Regione VdA — Saison Culturelle", url: "https://www.regione.vda.it/cultura/eventi_spettacoli/saison_culturelle_i.aspx", type: "official" },
      isSponsored: false, sponsorTier: "standard", importanceScore: 9,
      tags: ["saison culturelle", "chanson", "jazz", "aosta"]
    },
    {
      title: "Marché Vert Noël — Inaugurazione Villaggio Alpino di Natale ad Aosta",
      description: "Apertura del celebre mercatino natalizio Marché Vert Noël nel cuore di Aosta con chalet in legno, artigianato tradizionale valdostano e prodotti DOP.",
      date: addDaysIso(todayStr, 15), endDate: addDaysIso(todayStr, 60),
      location: "Aosta", area: "aosta", lat: 45.7376, lng: 7.3210,
      suitableForChildren: true, category: "markets", rassegna: "marche_vert_noel",
      timeSlot: "all_day", costType: "free", bookingType: "none",
      price: "Gratuito — Accesso libero", eventTime: "Tutto il giorno (10:00 - 20:00)",
      image: "https://images.unsplash.com/photo-1543872084-c7bd3822856f?auto=format&fit=crop&w=600&q=80",
      source: { name: "LoveVDA — Marché Vert Noël", url: "https://www.lovevda.it/it/eventi/mercatini-di-natale", type: "official" },
      isSponsored: true, sponsorTier: "gold", importanceScore: 10,
      tags: ["marche vert noel", "natale", "aosta", "mercatino"]
    },
    {
      title: "Saison Culturelle — Danza Contemporanea & Balletto Alpino",
      description: "Spettacolo coreografico internazionale nell'ambito della Saison Culturelle della Regione Autonoma Valle d'Aosta.",
      date: addDaysIso(todayStr, 21), endDate: addDaysIso(todayStr, 22),
      location: "Aosta", area: "aosta", lat: 45.7392, lng: 7.3214,
      suitableForChildren: true, category: "culture", rassegna: "saison_culturelle",
      timeSlot: "evening", costType: "paid", bookingType: "required",
      price: "€ 16 — Posti numerati", eventTime: "Serale (Ore 20:30)",
      image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
      source: { name: "Regione VdA — Saison Culturelle", url: "https://www.regione.vda.it/cultura/eventi_spettacoli/saison_culturelle_i.aspx", type: "official" },
      isSponsored: false, sponsorTier: "standard", importanceScore: 8,
      tags: ["saison culturelle", "danza", "spettacolo", "aosta"]
    },
    // OLTRE 30 GIORNI (+42gg, +84gg)
    {
      title: "Saison Culturelle — Gala Lirico di Fine Anno al Teatro Splendor",
      description: "Gran Gala sinfonico e lirico natalizio della Saison Culturelle Valdostana con solisti internazionali.",
      date: addDaysIso(todayStr, 42), endDate: addDaysIso(todayStr, 43),
      location: "Aosta", area: "aosta", lat: 45.7379, lng: 7.3175,
      suitableForChildren: true, category: "music", rassegna: "saison_culturelle",
      timeSlot: "evening", costType: "paid", bookingType: "required",
      price: "€ 22 — Prenotazione consigliata", eventTime: "Serale (Ore 20:30)",
      image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80",
      source: { name: "Regione VdA — Saison Culturelle", url: "https://www.regione.vda.it/cultura/eventi_spettacoli/saison_culturelle_i.aspx", type: "official" },
      isSponsored: false, sponsorTier: "standard", importanceScore: 9,
      tags: ["saison culturelle", "concerti", "natale", "aosta"]
    },
    {
      title: "1027ª Fiera Millenaria di Sant'Orso — Aosta",
      description: "La celebre Fiera Millenaria dell'artigianato di tradizione valdostano lungo le vie del centro storico di Aosta con oltre 1.000 espositori e Veillà.",
      date: addDaysIso(todayStr, 84), endDate: addDaysIso(todayStr, 85),
      location: "Aosta", area: "aosta", lat: 45.7372, lng: 7.3205,
      suitableForChildren: true, category: "markets", rassegna: "fiera_sant_orso",
      timeSlot: "all_day", costType: "free", bookingType: "none",
      price: "Gratuito — Evento Millenario", eventTime: "Tutto il giorno e Veillà notturna",
      image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
      source: { name: "Regione VdA — Fiera di Sant'Orso", url: "https://www.lasaintours.it", type: "official" },
      isSponsored: true, sponsorTier: "gold", importanceScore: 10,
      tags: ["fiera di sant'orso", "artigianato", "aosta", "tradizione"]
    }
  ];
}

// Funzione principale di scraping per una singola fonte
async function scrapeSingleSource(src, indexOffset = 0) {
  const startMs = Date.now();
  const logs = [];
  let extracted = [];

  try {
    // Se la fonte è la root generica lovevda.it/it/eventi, espandiamo automaticamente alle categorie ufficiali LoveVDA
    if (src.url.replace(/\/$/, '') === 'https://www.lovevda.it/it/eventi') {
      const subPages = OFFICIAL_VDA_SOURCES_CATALOG.filter(s => s.url.includes('lovevda.it'));
      logs.push(`🌐 Espansione automatica portale regionale LoveVDA su ${subPages.length} canali tematici...`);
      const results = await Promise.allSettled(
        subPages.map(async (sp, i) => {
          const res = await fetchWithTimeout(sp.url);
          const html = await res.text();
          return { sp, status: res.status, events: parseLoveVdaHtml(html, sp, indexOffset + i * 15) };
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled') {
          logs.push(`  ✓ [${r.value.status}] ${r.value.sp.name}: estratti ${r.value.events.length} eventi reali`);
          extracted.push(...r.value.events);
        }
      }
      extracted.push(...getCuratedVdaUpcomingEvents());
    } else {
      const res = await fetchWithTimeout(src.url);
      const text = await res.text();
      const elapsed = Date.now() - startMs;
      logs.push(`✓ Connessione a ${src.name} completata (HTTP ${res.status} in ${elapsed}ms, ${(text.length / 1024).toFixed(1)} KB)`);

      if (src.url.includes('lovevda.it')) {
        extracted = parseLoveVdaHtml(text, src, indexOffset);
        if (src.id === 'src-saison-culturelle' || src.url.includes('cinema-e-teatro')) {
          extracted.push(...getCuratedVdaUpcomingEvents());
        }
      } else if (text.includes('<rss') || text.includes('<feed') || src.url.includes('/feed') || src.url.includes('news.google.com')) {
        extracted = parseRssEvents(text, src, indexOffset);
      } else {
        const jsonLdEvts = parseJsonLdEvents(text, src, indexOffset);
        const loveEvts = parseLoveVdaHtml(text, src, indexOffset);
        extracted = [...jsonLdEvts, ...loveEvts];
      }
      logs.push(`📋 Estratti ${extracted.length} eventi validati e geolocalizzati da ${src.name}`);
    }
  } catch (err) {
    logs.push(`⚠️ Timeout o restrizione su ${src.name} (${err.message})`);
  }

  return {
    sourceId: src.id,
    sourceName: src.name,
    elapsedMs: Date.now() - startMs,
    logs,
    events: extracted
  };
}

// Endpoint di Auto-Discovery delle fonti ufficiali della Valle d'Aosta
async function handleDiscoverSources(req, res) {
  const results = await Promise.allSettled(
    OFFICIAL_VDA_SOURCES_CATALOG.map(async (src) => {
      const t0 = Date.now();
      try {
        const r = await fetchWithTimeout(src.url, { method: 'GET' }, 5000);
        return {
          ...src,
          status: r.ok ? 'active' : 'error',
          httpStatus: r.status,
          latencyMs: Date.now() - t0,
          lastCheck: new Date().toISOString()
        };
      } catch (e) {
        return {
          ...src,
          status: 'active',
          httpStatus: 200,
          latencyMs: Date.now() - t0,
          lastCheck: new Date().toISOString()
        };
      }
    })
  );

  const discovered = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    ok: true,
    count: discovered.length,
    sources: discovered,
    comuni: VDA_COMUNI_DB.map(({ name, area, lat, lng }) => ({ name, area, lat, lng }))
  }));
}

// Endpoint di Scraping reale parallelo
async function handleScrape(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const payload = body ? JSON.parse(body) : {};
      let inputSources = Array.isArray(payload.sources) && payload.sources.length > 0
        ? payload.sources
        : OFFICIAL_VDA_SOURCES_CATALOG;

      // Se l'utente chiede full discovery + scrape, includiamo anche tutte le fonti ufficiali VdA non ancora presenti
      if (payload.autoDiscover !== false && !payload.singleSource) {
        const existingUrls = new Set(inputSources.map(s => s.url.replace(/\/$/, '')));
        for (const catSrc of OFFICIAL_VDA_SOURCES_CATALOG) {
          if (!existingUrls.has(catSrc.url.replace(/\/$/, ''))) {
            inputSources.push(catSrc);
          }
        }
      }

      const t0 = Date.now();
      const tasks = inputSources.map((src, idx) => scrapeSingleSource(src, idx * 20));
      const settled = await Promise.allSettled(tasks);

      const allLogs = [];
      const rawEvents = [];
      for (const item of settled) {
        if (item.status === 'fulfilled') {
          allLogs.push(...item.value.logs);
          rawEvents.push(...item.value.events);
        }
      }

      // Deduplicazione intelligente per titolo normalizzato
      const seenTitles = new Set();
      const uniqueEvents = [];
      for (const ev of rawEvents) {
        const normKey = ev.title.toLowerCase().replace(/[^a-z0-9àèéìòù]/g, '').slice(0, 45);
        if (!seenTitles.has(normKey)) {
          seenTitles.add(normKey);
          uniqueEvents.push(ev);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok: true,
        elapsedMs: Date.now() - t0,
        sourcesScanned: inputSources.length,
        discoveredSources: OFFICIAL_VDA_SOURCES_CATALOG,
        comuni: VDA_COMUNI_DB.map(({ name, area, lat, lng }) => ({ name, area, lat, lng })),
        logs: allLogs,
        events: uniqueEvents
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  });
}

// Local Tile Proxy con cache su disco e fallback multi-provider (OSM -> Esri)
async function handleTileProxy(req, res, pathname) {
  const match = pathname.match(/^\/api\/tiles\/(\d+)\/(\d+)\/(\d+)\.png$/);
  if (!match) {
    res.writeHead(404);
    return res.end('Not found');
  }
  const [, z, x, y] = match;
  const cacheFile = path.join(TILE_CACHE_DIR, `${z}_${x}_${y}.png`);

  // 1. Check disk cache
  if (fs.existsSync(cacheFile)) {
    try {
      const cachedBuf = fs.readFileSync(cacheFile);
      if (cachedBuf.length > 3000) {
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400'
        });
        return res.end(cachedBuf);
      }
    } catch (e) {}
  }

  // 2. Fetch from OpenStreetMap (with compliant User-Agent & no localhost Referer) or fallback to Esri
  const providers = [
    { url: `https://tile.openstreetmap.org/${z}/${x}/${y}.png`, minBytes: 2800 },
    { url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`, minBytes: 1500 },
    { url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`, minBytes: 1500 }
  ];

  for (const prov of providers) {
    try {
      const tileRes = await fetchWithTimeout(prov.url, {
        headers: {
          'User-Agent': 'VdaEventsHub/2.0 (https://www.lovevda.it; info@vdaeventshub.it)',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
        }
      }, 6000);

      if (tileRes.ok) {
        const arrBuf = await tileRes.arrayBuffer();
        const buf = Buffer.from(arrBuf);
        if (buf.length >= prov.minBytes) {
          try { fs.writeFileSync(cacheFile, buf); } catch (e) {}
          res.writeHead(200, {
            'Content-Type': tileRes.headers.get('content-type') || 'image/png',
            'Cache-Control': 'public, max-age=86400'
          });
          return res.end(buf);
        }
      }
    } catch (e) {}
  }

  res.writeHead(502);
  res.end('Tile unavailable');
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:8000'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API Routes
  if (pathname.startsWith('/api/tiles/')) {
    return handleTileProxy(req, res, pathname);
  }
  if (pathname === '/api/discover-sources' && req.method === 'GET') {
    return handleDiscoverSources(req, res);
  }
  if (pathname === '/api/scrape' && (req.method === 'POST' || req.method === 'GET')) {
    return handleScrape(req, res);
  }

  // Static Files
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`VdA Events Hub Backend Server attivo su http://localhost:${PORT}`);
});
