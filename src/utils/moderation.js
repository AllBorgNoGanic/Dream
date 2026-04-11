// Profanity and slur filter for community content moderation
// Covers common profanity, slurs, and variations with letter substitutions

const BLOCKED_WORDS = [
  // Common profanity
  "fuck", "shit", "ass", "bitch", "damn", "dick", "cock", "pussy",
  "cunt", "bastard", "whore", "slut", "piss", "crap", "bollocks",
  "twat", "wanker", "prick", "douche", "jackass", "motherfucker",
  "bullshit", "horseshit", "dipshit", "dumbass", "badass", "asshole",
  "arsehole", "fuckface", "shithead", "dickhead",

  // Racial slurs
  "nigger", "nigga", "negro", "chink", "gook", "spic", "wetback",
  "kike", "beaner", "cracker", "honky", "gringo", "redskin",
  "raghead", "towelhead", "camel jockey", "sandnigger",
  "zipperhead", "slope", "jap", "chinaman",

  // Homophobic/transphobic slurs
  "faggot", "fag", "dyke", "tranny", "shemale", "homo",
  "queer", "lesbo",

  // Ableist slurs
  "retard", "retarded", "spaz", "spastic",

  // Other hateful terms
  "nazi", "white power", "heil hitler", "kill yourself", "kys",
];

// Common letter substitutions people use to bypass filters
const SUBSTITUTIONS = {
  "a": "[a@4]",
  "e": "[e3]",
  "i": "[i1!|]",
  "o": "[o0]",
  "s": "[s$5]",
  "t": "[t7+]",
  "l": "[l1|]",
  "g": "[g9]",
};

function buildPattern(word) {
  const escaped = word.split("").map((char) => {
    if (SUBSTITUTIONS[char]) return SUBSTITUTIONS[char];
    return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("+[\\s._-]*");
  return escaped;
}

// Build regex patterns once
const PATTERNS = BLOCKED_WORDS.map((word) => {
  const pattern = buildPattern(word);
  return new RegExp(`(?:^|\\b|\\s)${pattern}(?:\\b|\\s|$)`, "i");
});

/**
 * Check if text contains profanity or slurs.
 * Returns { clean: boolean, matched: string | null }
 */
export function checkContent(text) {
  if (!text || typeof text !== "string") return { clean: true, matched: null };

  const normalized = text
    .toLowerCase()
    .replace(/[_\-.*]/g, "")
    .trim();

  for (let i = 0; i < PATTERNS.length; i++) {
    if (PATTERNS[i].test(text) || PATTERNS[i].test(normalized)) {
      return { clean: false, matched: BLOCKED_WORDS[i] };
    }
  }

  return { clean: true, matched: null };
}

/**
 * Check multiple fields at once.
 * Returns { clean: boolean, field: string | null }
 */
export function checkFields(fields) {
  for (const [fieldName, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const result = checkContent(item);
        if (!result.clean) return { clean: false, field: fieldName };
      }
    } else {
      const result = checkContent(value);
      if (!result.clean) return { clean: false, field: fieldName };
    }
  }
  return { clean: true, field: null };
}
