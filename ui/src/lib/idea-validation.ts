/**
 * Client-side mirror of backend idea classification for upload UX and stored reports.
 * Backend remains authoritative; this provides early feedback before evaluation runs.
 */

export type IdeaCategory =
  | "startup"
  | "question"
  | "instruction"
  | "chat"
  | "gibberish"
  | "code_only"
  | "homework"
  | "empty_meaning"
  | "founder_docs"
  | "insufficient"
  | "irrelevant";

export interface IdeaClassification {
  isEvaluable: boolean;
  category: IdeaCategory;
  reason: string;
}

const PROBLEM =
  /\b(problem|pain\s*point|struggle|frustrat|unmet\s+need|need\s+for|lack\s+of|challenge|bottleneck|inefficien|waste[s]?|difficult\s+to|hard\s+to|without\s+a\s+way\s+to|currently\s+have\s+to)\b/i;
const SOLUTION =
  /\b(we\s+(are\s+)?(building|making|creating|developing|launching)|our\s+(product|platform|app|service|tool|software|solution)|build(s|ing)?\s+a|platform\s+(that|helping)|app\s+(that|for)|mobile\s+app|web\s+app|tool\s+that|software\s+that|fintech\s+app|automate[s|d|ing]?|enable[s|d|ing]?|help(s|ing)?\s+\w+\s+(to|with|find)|mvp\b|prototype|saas|marketplace|uber\s+for|airbnb\s+for|on-?demand)\b/i;
const CUSTOMER =
  /\b(customers?|users?|buyers?|clients?|subscribers?|students|developers|devs|businesses|teams|professionals|owners|walkers|drivers|freelancers|consumers?|patients?|target\s+(market|audience|customer|user)|icp\b|persona|b2b|b2c|indie\s+game|mid-?market|neighborhood)\b/i;
const MARKET =
  /\b(market|industry|sector|vertical|tam|sam|som|revenue|monetiz|pricing|subscription|go-?to-?market|gtm)\b/i;
const STARTUP =
  /\b(startup|venture|pitch|business\s+model|product-?market|freemium|on-?demand|fintech|healthtech|edtech|proptech|uber\s+for|airbnb\s+for)\b/i;
const PRODUCT_DESCRIPTION =
  /\b(what\s+.*\s+company\s+going\s+to\s+make|product\s+description|describe\s+what\s+your\s+company|one\s+sentence\s+(explanation|description)|we\s+(are\s+)?(building|making|creating)|our\s+(product|platform|app))\b/i;
const CAP_TABLE =
  /\b(equity\s+(allocation|split|structure|distribution)|cap\s*table|ownership\s+(split|percentage|structure)|founder\s+equity|vesting\s+schedule|percentage\s+of\s+equity|equity\s+stake|split\s+equity)\b/i;
const IRRELEVANT =
  /\b(resume|curriculum\s+vitae|\bcv\b|cover\s+letter|dear\s+(sir|madam|hiring\s+manager)|job\s+description|terms\s+and\s+conditions|privacy\s+policy|legal\s+notice|invoice\s+#|receipt\s+for|purchase\s+order|meeting\s+minutes|agenda:|attendees:|chapter\s+\d+|abstract:|bibliography|ingredients:|preheat\s+oven|tablespoon|prescription|diagnosis|patient\s+history|unsubscribe\s+from|click\s+here\s+to\s+view\s+in\s+browser)\b/i;
const FORM_ONLY =
  /\b(founder\s+name|email\s+address|phone\s+number|linkedin\s+url|date\s+of\s+birth|citizenship|work\s+authorization|how\s+did\s+you\s+hear\s+about|referr(ed|al)\s+by)\b/gi;
const QUESTION =
  /^\s*(what|how|why|when|where|who|which|can\s+you|could\s+you|would\s+you|please\s+(tell|explain|help|write|generate|create|summarize|translate)|tell\s+me|explain|describe|define)\b/i;
const INSTRUCTION =
  /\b(ignore\s+(all\s+)?(previous|prior|above)\s+(rules|instructions|prompts)|forget\s+(your|all)\s+(rules|instructions)|pretend\s+you\s+are|disregard\s+(the\s+)?(system|previous)|output\s+(only\s+)?(markdown|html|xml|python|code)|jailbreak|dan\s+mode|developer\s+mode)\b/i;
const CHAT =
  /^\s*(hi|hello|hey|good\s+(morning|afternoon|evening)|how\s+are\s+you|what'?s\s+up|thanks|thank\s+you)\b/i;
const HOMEWORK =
  /\b(essay|homework|assignment|exam|thesis|dissertation|for\s+my\s+(class|course|school|college|university))\b/i;
const CODE_SIGNAL =
  /```|def\s+\w+\s*\(|function\s+\w+\s*\(|(?:^|\n)\s*import\s+\w+|(?:^|\n)\s*class\s+\w+\s*:|#include\s*<|public\s+static\s+void|console\.log\(/gim;

function countCodeSignals(text: string): number {
  return [...text.matchAll(CODE_SIGNAL)].length;
}
const LOREM = /\b(lorem\s+ipsum|qwerty|asdfgh|zxcvbn|qazwsx|keyboard|mash)\b/i;
const WORD = /[a-zA-Z]{2,}/g;

function wordCount(text: string): number {
  return text.match(WORD)?.length ?? 0;
}

function substanceScore(text: string): number {
  let s = 0;
  if (PROBLEM.test(text)) s++;
  if (SOLUTION.test(text)) s++;
  if (CUSTOMER.test(text)) s++;
  if (MARKET.test(text) || PRODUCT_DESCRIPTION.test(text)) s++;
  return s;
}

function hasProduct(text: string): boolean {
  return SOLUTION.test(text) || PRODUCT_DESCRIPTION.test(text);
}

function gibberishScore(text: string): number {
  const words = text.toLowerCase().match(WORD) ?? [];
  if (!words.length) return 1;

  if (LOREM.test(text)) return 0.95;

  const consonantHeavy =
    words.filter((w) => w.length >= 5 && !/[aeiou]/.test(w)).length / words.length;
  if (consonantHeavy >= 0.6 && words.length >= 4) return 0.8;

  const uniqueRatio = new Set(words).size / words.length;
  const avgLen = words.reduce((n, w) => n + w.length, 0) / words.length;

  if (words.length <= 3 && uniqueRatio < 0.5) return 0.85;
  if (uniqueRatio < 0.35 && avgLen < 5 && words.length >= 4) return 0.8;

  const vowelPoor = words.filter((w) => !/[aeiou]/.test(w)).length / words.length;
  if (vowelPoor > 0.6 && words.length >= 5) return 0.75;

  return 0;
}

function reject(category: IdeaCategory, reason: string): IdeaClassification {
  return { isEvaluable: false, category, reason };
}

export function classifyIdeaInput(text: string): IdeaClassification {
  const cleaned = text.trim();
  if (!cleaned) return reject("empty_meaning", "Input is empty.");

  const words = wordCount(cleaned);
  const substance = substanceScore(cleaned);
  const product = hasProduct(cleaned);

  if (INSTRUCTION.test(cleaned) && substance < 2 && !product) {
    return reject("instruction", "This is a meta-instruction or prompt injection, not a startup idea.");
  }

  if (CHAT.test(cleaned) && cleaned.length < 120) {
    return reject("chat", "This looks like casual conversation, not a startup pitch.");
  }

  if (HOMEWORK.test(cleaned) && substance < 2) {
    return reject("homework", "This looks like academic content, not a venture pitch.");
  }

  const codeMatches = countCodeSignals(cleaned);
  if ((codeMatches >= 2 || (codeMatches >= 1 && words < 15)) && substance < 2) {
    return reject("code_only", "This looks like code without a product or business concept.");
  }

  if ((cleaned.endsWith("?") || QUESTION.test(cleaned)) && substance < 2) {
    return reject("question", "This is a question, not a startup idea description.");
  }

  if (gibberishScore(cleaned) >= 0.7) {
    return reject("gibberish", "This appears to be gibberish or placeholder text.");
  }

  if (IRRELEVANT.test(cleaned) && substance < 2) {
    return reject("irrelevant", "This document does not appear to be a startup pitch.");
  }

  if (CAP_TABLE.test(cleaned) && substance < 2) {
    return reject(
      "founder_docs",
      "Equity or cap table content without a clear product, customer, or problem description.",
    );
  }

  const formHits = cleaned.match(FORM_ONLY)?.length ?? 0;
  if (formHits >= 3 && substance < 2) {
    return reject("insufficient", "Application form fields without a product or customer description.");
  }

  if (words >= 150 && substance < 2) {
    return reject("insufficient", "Long document but missing product, customer, and problem details.");
  }

  if (words >= 60 && substance < 1) {
    return reject("insufficient", "No clear product, customer, or market described.");
  }

  if (words < 12 && substance === 0 && !STARTUP.test(cleaned)) {
    return reject("insufficient", "Too vague — describe what you build, for whom, and what problem you solve.");
  }

  if (substance >= 2) {
    return {
      isEvaluable: true,
      category: "startup",
      reason: "Describes product, customer, and/or problem with enough detail to evaluate.",
    };
  }

  if (substance >= 1 && words >= 15) {
    return {
      isEvaluable: true,
      category: "startup",
      reason: "Thin pitch with some venture signals; specialist evaluators will assess further.",
    };
  }

  if (substance >= 1 && words >= 12 && (STARTUP.test(cleaned) || product)) {
    return {
      isEvaluable: true,
      category: "startup",
      reason: "Contains a describable product or venture concept.",
    };
  }

  return reject(
    "insufficient",
    "Describe what you are building, who the customer is, and what problem you solve.",
  );
}

export function inputValidationLabel(category: IdeaCategory): string {
  switch (category) {
    case "founder_docs":
      return "Founder / equity document";
    case "code_only":
      return "Code snippet";
    case "empty_meaning":
      return "Empty input";
    default:
      return category.replace(/_/g, " ");
  }
}
