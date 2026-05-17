// Liturgical season detection (Western / Latin calendar).
//
// Returns the current season for any given date, along with an accent color
// scheme that subtly tints season-aware UI elements (Morning Card, Sunday
// Recap), and an AI hint that can be appended to the interpretation prompt.
//
// Seasons covered (Western liturgical year):
//   - Advent       : 4 Sundays before Christmas, ends Christmas Eve
//   - Christmas    : Dec 25 to the day before Epiphany
//   - Epiphany     : Jan 6 (single day in this simple model)
//   - Lent         : Ash Wednesday to Holy Saturday (46 days before Easter)
//   - Easter       : Easter Sunday to Pentecost
//   - Ordinary     : Everything else (the bulk of the year)

// ── Easter via Meeus/Jones/Butcher algorithm ─────────────────────────────────
// Returns a Date for Easter Sunday in the given year.
export function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function between(date, start, end) {
  const d = dateOnly(date).getTime();
  return d >= dateOnly(start).getTime() && d <= dateOnly(end).getTime();
}

// First Sunday of Advent: the Sunday nearest to (but not after) Nov 30.
// In practice it falls between Nov 27 and Dec 3.
function getAdventStart(year) {
  // Nov 30 of `year`. Walk backward to that week's Sunday.
  const nov30 = new Date(year, 10, 30);
  const dow = nov30.getDay(); // 0 = Sun
  // If Nov 30 is itself Sunday, it's the start.
  return addDays(nov30, -dow);
}

// ── Season detection ─────────────────────────────────────────────────────────
const SEASONS = {
  advent: {
    key: "advent",
    name: "Advent",
    blurb: "Preparation",
    color: "#9d6acc",            // soft violet (advent purple)
    softColor: "rgba(157,106,204,0.18)",
    borderColor: "rgba(157,106,204,0.35)",
    aiHint: "Advent: a season of waiting and preparation before Christmas.",
  },
  christmas: {
    key: "christmas",
    name: "Christmas",
    blurb: "The Light has come",
    color: "#f5d068",            // bright gold
    softColor: "rgba(245,208,104,0.18)",
    borderColor: "rgba(245,208,104,0.4)",
    aiHint: "Christmas: a season of arrival, joy, and incarnated light.",
  },
  epiphany: {
    key: "epiphany",
    name: "Epiphany",
    blurb: "Light revealed",
    color: "#f5d068",
    softColor: "rgba(245,208,104,0.15)",
    borderColor: "rgba(245,208,104,0.35)",
    aiHint: "Epiphany: the manifesting of Christ to the nations.",
  },
  lent: {
    key: "lent",
    name: "Lent",
    blurb: "Quiet preparation",
    color: "#7e5fb0",            // deeper violet
    softColor: "rgba(126,95,176,0.18)",
    borderColor: "rgba(126,95,176,0.32)",
    aiHint: "Lent: a 40-day reflective season of fasting and returning, leading to Easter.",
  },
  easter: {
    key: "easter",
    name: "Easter",
    blurb: "Resurrection light",
    color: "#f5d068",
    softColor: "rgba(245,208,104,0.18)",
    borderColor: "rgba(245,208,104,0.4)",
    aiHint: "Easter: a 50-day season of resurrection joy, ending at Pentecost.",
  },
  ordinary: {
    key: "ordinary",
    name: "Ordinary Time",
    blurb: "Walking the road",
    color: "#7aab68",            // soft liturgical green
    softColor: "rgba(122,171,104,0.15)",
    borderColor: "rgba(122,171,104,0.30)",
    aiHint: "Ordinary Time: the long stretch of growing faithfulness between feasts.",
  },
};

/**
 * Return the liturgical season info for the given date.
 * If no date is passed, uses today.
 */
export function getCurrentSeason(date = new Date()) {
  const d = dateOnly(date);
  const year = d.getFullYear();

  // Compute the key anchors for this calendar year.
  const easter = getEasterDate(year);                       // varies
  const ashWed = addDays(easter, -46);                      // Lent starts
  const holySat = addDays(easter, -1);                      // Lent ends
  const pentecost = addDays(easter, 49);                    // Easter ends

  const advent1 = getAdventStart(year);                     // this year's Advent 1
  const christmasEve = new Date(year, 11, 24);
  const christmas = new Date(year, 11, 25);
  const yearEnd = new Date(year, 11, 31);
  const epiphany = new Date(year, 0, 6);                    // Jan 6 of this year

  // Advent of the PREVIOUS year extends into the start of this year? No, it
  // always ends on Dec 24 of the same year. So if we're in January, we need
  // to think about whether we're still in the Christmas window from last year.
  const lastDecChristmas = new Date(year - 1, 11, 25);
  const lastDecEpiphany = new Date(year, 0, 6);
  const inChristmasFromPrevYear = between(d, lastDecChristmas, addDays(lastDecEpiphany, -1));

  // Order checks from most specific anchors outward.

  // 1. Lent (Ash Wednesday → Holy Saturday)
  if (between(d, ashWed, holySat)) return SEASONS.lent;

  // 2. Easter (Easter Sunday → Pentecost Sunday inclusive, the full 50 days)
  if (between(d, easter, pentecost)) return SEASONS.easter;

  // 3. Advent (Advent 1 of this year → Dec 24)
  if (between(d, advent1, christmasEve)) return SEASONS.advent;

  // 4. Christmas (Dec 25 of this year → Jan 5 of NEXT year, but only checking
  //    "year" so we look at this year's window).
  if (between(d, christmas, yearEnd)) return SEASONS.christmas;
  if (inChristmasFromPrevYear) return SEASONS.christmas;

  // 5. Epiphany (Jan 6 itself)
  if (d.getTime() === epiphany.getTime()) return SEASONS.epiphany;

  // 6. Default: Ordinary Time
  return SEASONS.ordinary;
}

/**
 * Short, season-aware hint for the AI interpretation prompt. Designed to
 * gently inform tone without forcing the connection.
 */
export function getSeasonAiHint(date = new Date()) {
  const season = getCurrentSeason(date);
  if (season.key === "ordinary") return ""; // most of the year, omit the hint
  return ` The dreamer is currently in the liturgical season of ${season.name}. ${season.aiHint} Let this gently inform your tone where natural, but do not force the connection. Most dreams have nothing to do with the season; only acknowledge it if the dream genuinely echoes its themes.`;
}
