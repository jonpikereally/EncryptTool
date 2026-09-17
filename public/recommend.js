/*
 * Questions and the scoring that turns answers into a ranked list.
 *
 * Every point a method gains or loses carries a sentence explaining itself, so
 * the output is an argument you can disagree with rather than an oracle.
 */

window.QUESTIONS = [
  {
    id: "secret",
    prompt: "What are you protecting?",
    help: "The answer changes everything downstream: a seed phrase and a shopping-site password deserve very different machinery.",
    options: [
      { value: "master", label: "A password manager master password", detail: "One secret that unlocks all the others." },
      { value: "seed", label: "A crypto seed phrase or recovery key", detail: "Irreplaceable, bearer-controlled, and worth money to a thief." },
      { value: "codes", label: "Two-factor backup and recovery codes", detail: "The codes that get you back in when the phone is gone." },
      { value: "few", label: "A handful of important passwords", detail: "Bank, email, and the two or three accounts that matter." },
      { value: "estate", label: "An 'if something happens to me' bundle", detail: "Meant to be usable by someone else, later, without you." },
    ],
  },
  {
    id: "threat",
    prompt: "Who might realistically find it?",
    help: "Be honest rather than flattering. Most people's real adversary is a burglar or a houseguest, not a government.",
    options: [
      { value: "none", label: "Nobody - I am protecting against fire and forgetting", detail: "Disaster recovery, not secrecy." },
      { value: "casual", label: "Household, guests, cleaners, colleagues", detail: "People with access to the room, not a motive to break ciphers." },
      { value: "burglar", label: "A thief who takes the whole drawer", detail: "Opportunistic, takes everything, sells what works." },
      { value: "targeted", label: "Someone targeting me, with skill and time", detail: "Knows what they are looking for and will analyse what they find." },
    ],
  },
  {
    id: "retrieval",
    prompt: "How often will you need to read it back?",
    help: "Schemes that are too slow for the frequency get abandoned, and an abandoned scheme protects nothing.",
    options: [
      { value: "often", label: "Weekly or more", detail: "It is part of daily life." },
      { value: "sometimes", label: "A few times a year", detail: "Occasional, planned use." },
      { value: "rarely", label: "Maybe once, in an emergency", detail: "A vault, not a tool." },
    ],
  },
  {
    id: "effort",
    prompt: "How much work will you accept each time you retrieve it?",
    help: "This is the single best predictor of whether you will still be doing this in two years.",
    options: [
      { value: "seconds", label: "Seconds - it has to be nearly instant", detail: "Read and type." },
      { value: "minutes", label: "A few minutes of pen work", detail: "Some arithmetic or a lookup table." },
      { value: "hour", label: "An hour is fine - this is a vault", detail: "Rare, deliberate, worth the ceremony." },
    ],
  },
  {
    id: "separate",
    prompt: "Can you keep a second sheet somewhere genuinely separate?",
    help: "Another building, not another drawer. This one question decides whether the unbreakable methods are available to you.",
    options: [
      { value: "yes", label: "Yes - another building, a relative, a bank box", detail: "One fire or one burglary cannot reach both." },
      { value: "sameplace", label: "Only somewhere else in the same home", detail: "Helps against a casual search, not against fire or theft." },
      { value: "no", label: "No - one place only", detail: "Everything will live under one roof." },
    ],
  },
  {
    id: "memory",
    prompt: "What can you reliably keep in your head, for years?",
    help: "Memorised keys are the cheapest strong protection there is, and the most common way people lock themselves out.",
    options: [
      { value: "strong", label: "A long passphrase or a multi-step rule", detail: "You will rehearse it and you trust yourself with it." },
      { value: "short", label: "A short word or number", detail: "Something small, used often enough to stick." },
      { value: "none", label: "Nothing - assume I will remember none of it", detail: "Age, illness, or simple realism." },
    ],
  },
  {
    id: "heirs",
    prompt: "Does anyone else need to recover this without you?",
    help: "If yes, every memory-based method becomes a liability, and written instructions become most of the work.",
    options: [
      { value: "no", label: "No - only I ever need it", detail: "It can die with me." },
      { value: "yes", label: "Yes - family, a partner, or an executor", detail: "Someone must be able to follow it cold." },
    ],
  },
  {
    id: "materials",
    prompt: "What do you have, or would happily buy?",
    help: "Choose everything that applies. Dice are about three pounds and unlock the strongest methods here.",
    multi: true,
    options: [
      { value: "dice", label: "Dice", detail: "Two to five ordinary six-sided dice." },
      { value: "cards", label: "A deck of cards", detail: "Fifty-two cards, ideally with jokers." },
      { value: "printer", label: "A printer", detail: "For the blank worksheets and lookup tables." },
      { value: "book", label: "A book I will own for decades", detail: "A specific edition, staying on a specific shelf." },
      { value: "steel", label: "Metal plates or tags", detail: "Stamped backups that survive a fire." },
      { value: "none", label: "None of these - paper and a pen only", detail: "We will work with that." },
    ],
  },
];

/** True when the weight clause applies to the answers given. */
function clauseMatches(when, answers) {
  const keys = Object.keys(when || {});
  if (keys.length === 0) return true;
  return keys.every((key) => {
    const given = answers[key];
    if (given === undefined || given === null) return false;
    const wanted = when[key];
    if (Array.isArray(given)) return given.some((value) => wanted.includes(value));
    return wanted.includes(given);
  });
}

/*
 * Raw points are summed, then squashed onto 0-100 with a logistic curve. A hard
 * clamp made everything strong look identical at 100; the curve keeps the
 * ordering visible while still saying "this one is clearly right for you".
 */
const CURVE = 45;

function toFitScore(rawPoints) {
  return Math.round(100 / (1 + Math.exp(-rawPoints / CURVE)));
}

function scoreMethod(method, answers) {
  let raw = 0;
  const pros = [];
  const cons = [];

  for (const weight of method.weights || []) {
    if (!clauseMatches(weight.when, answers)) continue;
    raw += weight.points;
    if (weight.points > 0) pros.push(weight.because);
    else if (weight.points < 0) cons.push(weight.because);
  }

  return { method, score: toFitScore(raw), raw, pros, cons };
}

/** Sentences shown above the plan when an answer deserves a direct warning. */
function warningsFor(answers) {
  const warnings = [];

  if (answers.separate === "no") {
    warnings.push(
      "You have one location only, so the provably unbreakable methods are off the table - they all depend on keeping a key in a different building. Everything suggested below rests on a memorised secret instead. If that changes, a relative's house or a bank box upgrades your whole scheme for free.",
    );
  }
  if (answers.memory === "none" && answers.separate === "no") {
    warnings.push(
      "Nothing memorised and nowhere separate means there is no key material anywhere except on the paper itself. Be clear-eyed: this is concealment, not encryption. Prioritise hiding the sheet well and making it tamper-evident, and revisit the moment you can use a second location.",
    );
  }
  if (answers.secret === "seed") {
    warnings.push(
      "For a crypto seed phrase: never type it into any device to 'check' it, never photograph it, and never split it by simply cutting the word list in half - partial seeds are actively attacked. Use a real split, and consider metal for the copy that has to survive a fire.",
    );
  }
  if (answers.heirs === "yes" && answers.memory !== "none") {
    warnings.push(
      "Anything you keep only in your head is unreachable by your heirs. Whatever you memorise, write it once, seal it, and lodge it with a solicitor or executor - separately from the shares it unlocks.",
    );
  }
  if (Array.isArray(answers.materials) && answers.materials.includes("none")) {
    warnings.push(
      "Without dice or cards there is no good source of randomness in the room, and a password you invent is far weaker than it feels. A set of dice costs a few pounds and is the highest-value purchase on this page.",
    );
  }
  if (answers.threat === "targeted") {
    warnings.push(
      "Against a skilled, motivated adversary, only the proven methods count. Classical ciphers - Vigenere, Playfair, transposition - are shown below for completeness but they will not hold, and stacking two of them does not fix that.",
    );
  }

  return warnings;
}

/**
 * Returns the ranked list, the staged plan, and any warnings.
 * answers: { [questionId]: string | string[] }
 */
window.recommend = function recommend(answers) {
  const scored = window.METHODS.map((method) => scoreMethod(method, answers));
  scored.sort((a, b) => b.score - a.score || a.method.name.localeCompare(b.method.name));

  const plan = [];
  for (const stage of window.STAGES) {
    const inStage = scored.filter((entry) => entry.method.stage === stage.id);
    if (inStage.length === 0) continue;

    if (stage.id === "generate" && (answers.secret === "seed" || answers.secret === "codes")) {
      plan.push({
        stage,
        note:
          answers.secret === "seed"
            ? "Skip this stage. Your wallet generated the seed phrase from a hardware random source, and it is already far better than anything you can roll. Never replace it with words of your own - write down exactly what the wallet gave you."
            : "Skip this stage. The service issued these codes; your job is to carry them out of the browser onto paper without them passing through a notes app on the way.",
      });
      continue;
    }

    const best = inStage[0];
    if (stage.id === "split" && (best.score < 60 || answers.separate === "no")) {
      plan.push({
        stage,
        note:
          answers.separate === "no"
            ? "Skipped, because you have only one location. Splitting a secret across two places in the same home does not survive the fire or the burglary that takes the house."
            : "Optional for you. Nothing in your answers makes splitting worth its cost - revisit it if the value of what you are protecting goes up.",
      });
      continue;
    }

    plan.push({ stage, entry: best, runnersUp: inStage.slice(1, 3) });
  }

  return {
    ranked: scored,
    plan,
    warnings: warningsFor(answers),
    avoid: scored.filter((entry) => entry.score <= 30),
  };
};
