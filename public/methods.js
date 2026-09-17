/*
 * The method catalogue.
 *
 * Every entry is something you can do with paper, a pen, and household objects.
 * Nothing here needs a computer, and nothing here asks you to type a secret
 * into one.
 *
 * security:
 *   "proven"       information-theoretically secure when the rules are followed
 *   "strong"       no practical attack for this use case, but it rests on a
 *                  secret you keep in your head or in another building
 *   "obfuscation"  defeats a person who finds the paper, not a cryptanalyst
 *   "operational"  not encryption at all - the physical and process layer
 *
 * ratings are 1-5: effort (1 easy), speed (5 instant), errorRisk (5 risky),
 * memoryLoad (1 nothing to remember).
 */

window.SECURITY_CLASSES = {
  proven: {
    label: "Mathematically unbreakable",
    short: "Proven",
    blurb:
      "With the key kept separate and never reused, no amount of computing power recovers the secret. The maths is not in doubt; your handling of the key is the only weak point.",
  },
  strong: {
    label: "Strong in practice",
    short: "Strong",
    blurb:
      "No realistic attack on the paper alone. Security rests on something you never write down - a memorised rule, or a second sheet in another building.",
  },
  obfuscation: {
    label: "Stops a person, not a cryptanalyst",
    short: "Obfuscation",
    blurb:
      "A burglar, a houseguest or a curious relative is stopped cold. A determined expert with the paper and time is not. Use it for the tier below your crown jewels, or stack it with something stronger.",
  },
  operational: {
    label: "Physical and process layer",
    short: "Handling",
    blurb:
      "Not encryption. This is what keeps the paper alive through fires, floods, house moves and your own memory - which is what actually destroys most offline backups.",
  },
};

window.STAGES = [
  {
    id: "generate",
    name: "Generate",
    verb: "Make the secret",
    blurb: "Get real randomness from a physical object, not from your imagination and not from a website.",
  },
  {
    id: "encode",
    name: "Encode",
    verb: "Make it unreadable",
    blurb: "Turn the secret into marks on paper that mean nothing to whoever finds them.",
  },
  {
    id: "split",
    name: "Split",
    verb: "Divide the risk",
    blurb: "Cut the secret into pieces so that one piece found is one piece worthless.",
  },
  {
    id: "store",
    name: "Store",
    verb: "Keep it alive",
    blurb: "Survive fire, flood, movers, landlords, and the person who tidies your desk.",
  },
  {
    id: "verify",
    name: "Verify",
    verb: "Prove it still works",
    blurb: "The most common way an offline backup fails is a transcription slip nobody noticed for three years.",
  },
];

window.METHODS = [
  /* ---------------------------------------------------------------- GENERATE */
  {
    id: "dice-passphrase",
    stage: "generate",
    name: "Dice-rolled passphrase",
    tagline: "Five dice rolls per word, six words, and you have a secret no machine will guess.",
    security: "proven",
    ratings: { effort: 2, speed: 3, errorRisk: 2, memoryLoad: 3 },
    materials: ["Five or more six-sided dice", "A printed word list (Diceware or the EFF long list)", "Pen and paper"],
    protects: [
      "Guessing attacks of every kind - six words from a 7,776-word list is about 77 bits of entropy",
      "Your own predictability: the dice do not know your dog's name, your birthday or your favourite film",
    ],
    failsAgainst: [
      "Anyone who reads the sheet you wrote it on - generation is not concealment",
      "Word lists you invented yourself, which are far smaller and far more guessable than they feel",
    ],
    steps: {
      encode: [
        "Roll five dice at once, left to right, and read them as a five-digit number, e.g. 4-2-6-1-3 becomes 42613.",
        "Look that number up in the word list. It gives exactly one word.",
        "Repeat until you have six words for an important secret, seven or eight for a crypto seed or an estate key.",
        "Write the words down in the order rolled. Separate them with hyphens or spaces - keep whichever you choose consistent.",
        "If a site demands a digit and a symbol, append a fixed short suffix like -7! rather than mangling the words.",
      ],
      decode: [
        "There is nothing to decode. This stage produces the secret; the next stage hides it.",
      ],
    },
    example: {
      title: "Six rolls, six words",
      lines: [
        "42613 -> 'quarry'",
        "16524 -> 'ladle'",
        "35142 -> 'drifting'",
        "62431 -> 'unmapped'",
        "24165 -> 'copper'",
        "51326 -> 'thistle'",
        "Passphrase: quarry-ladle-drifting-unmapped-copper-thistle  (about 77 bits)",
      ],
    },
    pitfalls: [
      "Do not reroll a word you dislike. Rerolling to taste is you choosing, and you are a bad random number generator.",
      "Do not drop a word because the passphrase feels long. Five words is the floor; four is not enough for anything valuable.",
      "Print the word list once and keep it - it is not secret, but finding the identical list years later matters if you ever want to check your work.",
    ],
    pairsWith: ["memorised-pepper", "otp-digits", "checksum-line"],
    tags: ["dice", "entropy", "beginner"],
    weights: [
      { when: { materials: ["dice"] }, points: 30, because: "You said you have dice, which is all this needs." },
      { when: { secret: ["master", "estate", "few"] }, points: 25, because: "A memorable passphrase suits a secret you may have to type by hand." },
      { when: { memory: ["strong", "short"] }, points: 10, because: "Words are far easier to hold in your head than random characters." },
      { when: { secret: ["seed"] }, points: -25, because: "A crypto seed phrase is already generated for you - do not replace it with your own words." },
      { when: { materials: ["none"] }, points: -20, because: "Without dice you would have to invent the words, which defeats the purpose." },
    ],
  },
  {
    id: "dice-charset",
    stage: "generate",
    name: "Dice grid for random characters",
    tagline: "A 6x6 grid turns two dice into any letter or digit, for sites that refuse passphrases.",
    security: "proven",
    ratings: { effort: 3, speed: 2, errorRisk: 3, memoryLoad: 5 },
    materials: ["Two six-sided dice of different colours", "The printed 6x6 character grid", "Pen and paper"],
    protects: [
      "Guessing: each pair of rolls is 5.17 bits, so 16 characters is about 82 bits",
      "Password rules that ban spaces or cap length, where a passphrase will not fit",
    ],
    failsAgainst: [
      "Your memory - nobody recalls sixteen random characters, so this must be written and then hidden properly",
      "Transcription: 0/O, 1/l/I and 5/S are the classic three-years-later disasters",
    ],
    steps: {
      encode: [
        "Decide which die is the row and which is the column, and never swap them mid-secret.",
        "Roll both. Read the row die, then the column die, and take the character from that cell of the grid.",
        "Repeat for as many characters as you need - 12 for ordinary accounts, 16 or more for anything valuable.",
        "Write in block capitals and slash your zeros. Say each character aloud as you write it.",
        "Add a check letter from the Verify stage before you put the sheet away.",
      ],
      decode: ["Nothing to decode - this stage only makes the secret."],
    },
    example: {
      title: "Reading the grid",
      lines: [
        "Red 3, white 5 -> row 3, column 5 -> 'R'",
        "Red 1, white 1 -> row 1, column 1 -> 'A'",
        "Red 6, white 2 -> row 6, column 2 -> '8'",
        "Ten more pairs give: RA8QK2VNJ7TDWM3X",
      ],
    },
    pitfalls: [
      "Using one die twice in a row from the same throw feels faster and quietly halves your randomness. Throw both, every time.",
      "The grid is not a secret and does not need hiding; the characters you roll are.",
      "If a die rolls off the table, take the result anyway or throw both again - never nudge it.",
    ],
    pairsWith: ["otp-digits", "checksum-line", "tamper-evident"],
    tags: ["dice", "entropy", "printable"],
    printable: "dice-grid",
    weights: [
      { when: { materials: ["dice"] }, points: 25, because: "You have dice, and this needs nothing else." },
      { when: { secret: ["codes", "few"] }, points: 15, because: "Character strings fit systems that reject long passphrases." },
      { when: { memory: ["none"] }, points: 10, because: "You said you will remember nothing, so the secret was always going to live on paper." },
      { when: { retrieval: ["often"] }, points: -15, because: "Typing sixteen random characters weekly will wear you down." },
      { when: { secret: ["seed"] }, points: -20, because: "Seed phrases come from the wallet - never roll your own." },
    ],
  },
  {
    id: "card-shuffle",
    stage: "generate",
    name: "Shuffled deck as an entropy source",
    tagline: "A properly shuffled deck holds about 225 bits of randomness. You only need a slice of it.",
    security: "proven",
    ratings: { effort: 3, speed: 3, errorRisk: 3, memoryLoad: 5 },
    materials: ["A full deck of 52 cards", "Pen and paper"],
    protects: [
      "Guessing - a genuinely shuffled deck has more entropy than any key you will ever need",
      "Households with no dice; almost everyone can find a deck of cards",
    ],
    failsAgainst: [
      "Lazy shuffling. Seven proper riffle shuffles is the accepted minimum; three is visibly non-random",
      "New decks, which come in a known factory order - shuffle a new deck far longer",
    ],
    steps: {
      encode: [
        "Riffle shuffle at least seven times, then cut. Do it standing up, away from anyone watching.",
        "Deal cards face up one at a time.",
        "Map each card to a character with the printed card table: clubs 1-13 give A-M, diamonds give N-Z, hearts give a-m, spades give n-z.",
        "Skip any card that lands on a character the system will not accept, and deal another.",
        "Stop at the length you need, then shuffle the deck thoroughly again so the order is gone.",
      ],
      decode: ["Nothing to decode - this stage only makes the secret."],
    },
    example: {
      title: "First five cards",
      lines: [
        "7 of clubs -> 'G'",
        "Queen of hearts -> 'l'",
        "2 of spades -> 'o'",
        "Ace of diamonds -> 'N'",
        "10 of hearts -> 'j'",
        "Running secret: Glo Nj ...",
      ],
    },
    pitfalls: [
      "Do not photograph the dealt cards to 'copy them later'. The photo is a copy of your key on a computer.",
      "Do not leave the deck in the dealt order on the table while you answer the door.",
      "Card backs can be marked or worn; if the deck is not yours, it is not a trusted source.",
    ],
    pairsWith: ["solitaire", "checksum-line"],
    tags: ["cards", "entropy"],
    printable: "card-table",
    weights: [
      { when: { materials: ["cards"] }, points: 25, because: "You have a deck of cards to hand." },
      { when: { materials: ["dice"] }, points: -12, because: "Dice are simpler and less error-prone than card mapping when you have both." },
      { when: { secret: ["seed"] }, points: -20, because: "Seed phrases come from the wallet - never roll your own." },
    ],
  },

  /* ------------------------------------------------------------------ ENCODE */
  {
    id: "memorised-pepper",
    stage: "encode",
    name: "The memorised pepper",
    tagline: "Write down all of the password except the part that lives only in your head.",
    security: "strong",
    ratings: { effort: 1, speed: 5, errorRisk: 1, memoryLoad: 2 },
    materials: ["Pen and paper", "One rule you will never forget"],
    protects: [
      "Everyone who finds the sheet: a burglar, a nosy guest, a landlord, a hotel cleaner, a hospital admissions clerk",
      "Photographs of your sheet - the photographer still does not have the pepper",
    ],
    failsAgainst: [
      "Your own memory, which is the real risk here. Forget the pepper and every password on the sheet is gone",
      "A short or guessable pepper. 'abc' or your year of birth adds almost nothing",
      "Someone who finds two sheets from two systems and spots the same missing chunk",
    ],
    steps: {
      encode: [
        "Choose one pepper of at least six characters and one fixed position rule. Example: 'insert the pepper after the fourth character'.",
        "Use the same rule for every secret you protect this way. One rule, applied identically, is what makes it survivable.",
        "Write the password on paper with the pepper removed.",
        "Mark nothing on the sheet about the rule - no dots, no gaps, no asterisk. The gap must be invisible.",
        "Say the full password out loud from the sheet twice today, and again in a week. That is what fixes the rule in memory.",
      ],
      decode: [
        "Read the written part.",
        "Re-insert the pepper at the position your rule specifies.",
        "Type the result.",
      ],
    },
    example: {
      title: "A sheet a thief cannot use",
      lines: [
        "Real password:    quar Qz7x! ry-ladle-drifting",
        "Pepper (in head): Qz7x!",
        "Rule (in head):   after the 4th character",
        "Written on paper: quarry-ladle-drifting",
        "A finder types what is written, and is wrong on every attempt.",
      ],
    },
    pitfalls: [
      "Do not use a pepper you also use as a password anywhere. If it leaks in a breach, your whole sheet leaks with it.",
      "Do not vary the rule per site. You will misremember which is which, at the worst moment.",
      "Store a sealed copy of the rule with a lawyer or in a bank box if anyone must inherit these accounts - your heirs cannot read your mind.",
    ],
    pairsWith: ["dice-passphrase", "tamper-evident", "heir-packet"],
    tags: ["memory", "fast", "beginner"],
    weights: [
      { when: { memory: ["strong", "short"] }, points: 35, because: "You can hold a short rule in your head, which is all this needs." },
      { when: { retrieval: ["often"] }, points: 30, because: "You need this often, and this is the only method with no decoding work at all." },
      { when: { effort: ["seconds"] }, points: 25, because: "You want retrieval in seconds - nothing else here is faster." },
      { when: { threat: ["casual", "burglar"] }, points: 20, because: "Against a finder rather than a cryptanalyst, a memorised gap is genuinely enough." },
      { when: { memory: ["none"] }, points: -60, because: "You said to assume you remember nothing, and this method is nothing but memory." },
      { when: { threat: ["targeted"] }, points: -15, because: "A targeted attacker with several of your sheets may spot the pattern." },
      { when: { heirs: ["yes"] }, points: -20, because: "Someone else has to recover this, and they cannot read the rule in your head." },
    ],
  },
  {
    id: "otp-digits",
    stage: "encode",
    name: "One-time pad, digit by digit",
    tagline: "The only cipher proven unbreakable. Add your pad to your password, one digit at a time, no carrying.",
    security: "proven",
    ratings: { effort: 4, speed: 2, errorRisk: 3, memoryLoad: 1 },
    materials: [
      "The printed character code table (every character becomes two digits)",
      "A pad of random digits you rolled yourself",
      "Somewhere separate to keep the pad",
    ],
    protects: [
      "Everything, provided the pad is random, as long as the message, kept apart, and used exactly once",
      "State-level adversaries. This is not hyperbole - there is no attack on a correctly used pad",
    ],
    failsAgainst: [
      "Reuse. Encrypting two secrets with the same pad breaks both, and this is how real one-time pads have failed historically",
      "A pad stored in the same drawer as the ciphertext - then you have simply written the password down",
      "Arithmetic slips, which is why the check digit in the Verify stage is not optional",
    ],
    steps: {
      encode: [
        "Turn each character of your password into two digits using the code table. A 14-character password becomes 28 digits.",
        "Roll that many digits of pad: for each digit roll one die and treat 6 as 0, or use two dice and the printed table.",
        "Write the pad digits under the secret digits, aligned.",
        "Add each column and keep only the last digit. Never carry. 8 + 7 is 5, not 15.",
        "The row of sums is your ciphertext. Write it on the sheet you keep at home.",
        "Take the pad to the other location. Destroy every rough working - burn or shred, do not bin.",
      ],
      decode: [
        "Write the ciphertext and, beneath it, the pad.",
        "Subtract each column, and when the top digit is smaller, add 10 first. 5 - 7 becomes 15 - 7 = 8.",
        "Read the result back in pairs through the code table to recover your characters.",
      ],
    },
    example: {
      title: "Encrypting Tr0ub4!",
      lines: [
        "Password:   T  r  0  u  b  4  !",
        "Codes:      52 82 16 85 66 20 01   -> 52821685662001",
        "Pad:                                  73914082655193",
        "Sum, no carry:                        25735667217194   <- keep this at home",
        "Check digit (all digits added, last digit kept): 5",
        "To decrypt: 2-7 -> 12-7 = 5, 5-3 = 2, 7-9 -> 17-9 = 8 ... back to 52821685662001 -> Tr0ub4!",
      ],
    },
    pitfalls: [
      "Never use a pad twice. Cross each used pad line through the moment you have finished with it, then destroy that line.",
      "Never generate the pad from a website, a phone app, or a spreadsheet. Roll it. That is the whole point.",
      "Keep the pad and the ciphertext in different buildings. Same house, different rooms is not separation - a burglar takes the drawer and the desk.",
    ],
    pairsWith: ["dice-charset", "checksum-line", "geographic-split", "tamper-evident"],
    tags: ["dice", "unbreakable", "printable", "advanced"],
    printable: "code-table",
    weights: [
      { when: { threat: ["targeted"] }, points: 40, because: "You named a skilled, determined adversary, and this is the only class of method that provably beats one." },
      { when: { separate: ["yes"] }, points: 30, because: "You have a genuinely separate location, which is exactly what a pad needs." },
      { when: { secret: ["seed", "estate"] }, points: 25, because: "The value here justifies the extra work at retrieval." },
      { when: { retrieval: ["rarely", "sometimes"] }, points: 15, because: "You rarely need to read this back, so a few minutes of arithmetic costs you little." },
      { when: { effort: ["hour", "minutes"] }, points: 15, because: "You will accept real work at retrieval time." },
      { when: { separate: ["no"] }, points: -45, because: "With nowhere separate for the pad, it ends up beside the ciphertext, and then it protects nothing." },
      { when: { retrieval: ["often"] }, points: -30, because: "Column arithmetic every week will not survive contact with a bad morning." },
      { when: { effort: ["seconds"] }, points: -30, because: "You wanted retrieval in seconds; this takes minutes." },
    ],
  },
  {
    id: "grid-lookup",
    stage: "encode",
    name: "Random grid with a memorised path",
    tagline: "Carry a card of meaningless characters. The password is the route through it, and the route is in your head.",
    security: "strong",
    ratings: { effort: 2, speed: 4, errorRisk: 2, memoryLoad: 3 },
    materials: ["The printed blank grid", "Dice or cards to fill it", "A rule you keep in your head"],
    protects: [
      "A finder, a photographer, a thief: the card is genuinely meaningless without the path rule",
      "The 'one password everywhere' problem - every site gets a different string from the same card",
    ],
    failsAgainst: [
      "Losing the card. Photocopy it before you ever use it and keep the copy elsewhere",
      "A simple path rule. 'Top left, read across' is guessable by anyone who has seen one of these cards",
      "Sites that force password changes, since your route must change with them",
    ],
    steps: {
      encode: [
        "Fill every cell of the printed grid with a random character using dice or cards. This takes about twenty minutes once.",
        "Choose a starting rule based on the site name, e.g. 'row = first letter of the site, column = number of letters in the name'.",
        "Choose a reading rule, e.g. 'read 14 characters left to right, wrapping to the next row'.",
        "Your password for that site is what you read. Nothing about the site is written on the card.",
        "Keep the card in your wallet. If it is found, it looks like noise, because it is.",
      ],
      decode: [
        "Apply your starting rule to the site name to find the first cell.",
        "Read off the characters exactly as your reading rule says.",
      ],
    },
    example: {
      title: "One card, many sites",
      lines: [
        "Rule: row = first letter of the site; column = length of the name; read 14 right, wrapping.",
        "For 'bank': row B, column 4 -> start cell",
        "Read: 7kQ!m2Vd#R9wLx",
        "For 'email': row E, column 5 -> a completely different 14 characters.",
      ],
    },
    pitfalls: [
      "Do not write the site name next to the starting cell 'just to be safe'. That single note undoes the whole scheme.",
      "Do not use the same card for years without a spare copy in a second location.",
      "Choose a path rule with at least two moving parts, so the card alone gives nothing away.",
    ],
    pairsWith: ["dice-charset", "tamper-evident", "two-copies"],
    tags: ["printable", "wallet", "memory", "reusable"],
    printable: "blank-grid",
    weights: [
      { when: { secret: ["few", "codes"] }, points: 30, because: "You are protecting several passwords, and one card covers all of them." },
      { when: { retrieval: ["often"] }, points: 25, because: "Reading a card takes seconds, which suits frequent use." },
      { when: { memory: ["strong"] }, points: 20, because: "You can carry a multi-part rule in your head." },
      { when: { threat: ["casual", "burglar"] }, points: 20, because: "The card is meaningless to anyone who takes it." },
      { when: { memory: ["none"] }, points: -50, because: "The path rule is memory-only, and you said to assume none." },
      { when: { secret: ["seed"] }, points: -20, because: "A seed phrase is fixed words - it cannot be read out of a character grid." },
      { when: { heirs: ["yes"] }, points: -15, because: "Your heirs would need the path rule, which only exists in your head." },
    ],
  },
  {
    id: "vigenere",
    stage: "encode",
    name: "Vigenere with a memorised keyword",
    tagline: "Shift each letter by a letter of a keyword you never write down. Three centuries old, and still enough to stop a burglar.",
    security: "obfuscation",
    ratings: { effort: 3, speed: 3, errorRisk: 3, memoryLoad: 3 },
    materials: ["The printed tabula recta (26x26 letter square)", "A keyword you keep in your head", "Pen and paper"],
    protects: [
      "Anyone who finds the sheet and tries what is written on it",
      "Casual inspection - the result looks like a password, so nobody realises there is a second layer",
    ],
    failsAgainst: [
      "A cryptanalyst with enough of your ciphertext. Vigenere has been broken since the 1860s; with several samples and a short key it falls quickly",
      "Short keywords, dictionary keywords, and keywords used for years across many secrets",
      "Mixed-character passwords - this handles letters only, so digits and symbols need a separate convention",
    ],
    steps: {
      encode: [
        "Choose a keyword of at least 10 letters that you will never write down and never reuse elsewhere.",
        "Write the password. Underneath, repeat the keyword until it is the same length.",
        "For each column, find the plaintext letter down the side of the tabula recta and the key letter across the top. The cell where they meet is your ciphertext letter.",
        "Keep digits and symbols in place unchanged, or move them to a fixed suffix you remember.",
        "Write only the ciphertext on the sheet.",
      ],
      decode: [
        "Write the ciphertext and repeat the keyword beneath it.",
        "For each column, go to the key letter's row of the tabula recta, find the ciphertext letter along it, and read the plaintext letter from the top.",
      ],
    },
    example: {
      title: "HORSE under the key PIANO",
      lines: [
        "Plaintext: H  O  R  S  E",
        "Key:       P  I  A  N  O",
        "H(7)+P(15) = 22 -> W",
        "O(14)+I(8) = 22 -> W",
        "R(17)+A(0) = 17 -> R",
        "S(18)+N(13) = 31 -> 5 -> F",
        "E(4)+O(14) = 18 -> S",
        "Ciphertext: WWRFS",
      ],
    },
    pitfalls: [
      "A keyword shorter than the secret repeats, and repetition is exactly what breaks this cipher. Longer keyword, fewer repeats, more work for an attacker.",
      "Do not use the same keyword for a dozen secrets on one sheet - that is the classic depth attack handed to a finder.",
      "If your threat model includes anyone skilled, use the one-time pad instead. This is the tier below.",
    ],
    pairsWith: ["memorised-pepper", "columnar-transposition", "checksum-line"],
    tags: ["classic", "printable", "memory"],
    printable: "tabula-recta",
    weights: [
      { when: { threat: ["casual", "burglar"] }, points: 25, because: "Against a finder rather than an expert, a classical cipher is a real obstacle." },
      { when: { memory: ["strong"] }, points: 20, because: "You can hold a long keyword in your head." },
      { when: { effort: ["minutes"] }, points: 15, because: "A few minutes with the square is exactly what this costs." },
      { when: { separate: ["no", "sameplace"] }, points: 15, because: "With nowhere separate to keep a pad, a memorised keyword is the practical alternative." },
      { when: { threat: ["targeted"] }, points: -40, because: "You named a skilled adversary, and this cipher has been broken since the 1860s." },
      { when: { memory: ["none"] }, points: -45, because: "The keyword is memory-only, and you said to assume none." },
      { when: { secret: ["seed"] }, points: -5, because: "Seed words are letters only, so it fits, but a seed deserves a proven method." },
    ],
  },
  {
    id: "book-cipher",
    stage: "encode",
    name: "Book cipher",
    tagline: "Write down page, line and word numbers. The words themselves stay on your shelf.",
    security: "obfuscation",
    ratings: { effort: 3, speed: 3, errorRisk: 3, memoryLoad: 2 },
    materials: ["A specific book, in a specific edition", "Pen and paper"],
    protects: [
      "Anyone who finds a sheet of bare numbers with no idea what they index",
      "Remote attackers entirely - the key is a physical object in your home",
    ],
    failsAgainst: [
      "A burglar standing in your study looking at your bookshelf. The key is in plain sight",
      "Reprints. A new edition repaginates, and your numbers point at nothing",
      "Losing, lending or moving house with the book",
    ],
    steps: {
      encode: [
        "Choose a book you will still own in twenty years, and record the exact edition and printing somewhere safe but separate.",
        "For each word of your passphrase, find it in the book and note page, line and word number.",
        "Write the coordinates only, in a consistent format such as 113.7.4.",
        "If a word is not in the book, spell it letter by letter using the first letter of chosen words, and mark that run with a convention you remember.",
        "Keep the sheet anywhere. It is a list of numbers.",
      ],
      decode: [
        "Open the book to the recorded edition.",
        "Read the word at each page.line.word coordinate in order.",
        "Reassemble the passphrase with your usual separator.",
      ],
    },
    example: {
      title: "A passphrase as coordinates",
      lines: [
        "Book: Oryx and Crake, Virago 2004 paperback",
        "113.7.4  -> quarry",
        "58.2.11  -> ladle",
        "204.15.1 -> drifting",
        "Sheet says: 113.7.4 / 58.2.11 / 204.15.1",
      ],
    },
    pitfalls: [
      "Do not pick the only book on your shelf with a cracked spine at page 113. Wear gives it away.",
      "Do not pick a book a guest could borrow, or one you might lend to a child.",
      "Record the ISBN and printing with your estate papers, or your heirs face a bookshelf and a page of numbers.",
    ],
    pairsWith: ["memorised-pepper", "heir-packet"],
    tags: ["classic", "household", "no-maths"],
    weights: [
      { when: { materials: ["book"] }, points: 25, because: "You have a book you are happy to dedicate to this." },
      { when: { secret: ["estate"] }, points: 10, because: "Heirs can be handed an edition reference and follow it without training." },
      { when: { threat: ["casual"] }, points: 20, because: "A page of numbers means nothing to a household finder." },
      { when: { threat: ["targeted"] }, points: -35, because: "A targeted searcher will work through your bookshelf; the key is in the room." },
      { when: { effort: ["seconds"] }, points: -20, because: "Finding words in a book is minutes of work, not seconds." },
    ],
  },
  {
    id: "playfair",
    stage: "encode",
    name: "Playfair square",
    tagline: "Encrypt letters in pairs using a 5x5 square built from a keyword. Harder to break by hand than a plain shift.",
    security: "obfuscation",
    ratings: { effort: 3, speed: 3, errorRisk: 4, memoryLoad: 3 },
    materials: ["Pen and paper", "A keyword you keep in your head"],
    protects: [
      "Letter-frequency guessing, because it encrypts pairs rather than single letters",
      "A finder with no cryptographic background",
    ],
    failsAgainst: [
      "Anyone with roughly a hundred characters of your ciphertext and a reference book - Playfair falls to known methods",
      "Digits and symbols, which it cannot represent at all",
      "Double letters and odd lengths, which need padding rules you must remember exactly",
    ],
    steps: {
      encode: [
        "Write your keyword into a 5x5 grid, dropping repeats, then fill the rest with the unused letters of the alphabet. I and J share a cell.",
        "Split the plaintext into pairs. If a pair is a double letter, insert an X between them. Pad the end with X if needed.",
        "Same row: replace each letter with the one to its right, wrapping around.",
        "Same column: replace each letter with the one below, wrapping around.",
        "Otherwise: each letter is replaced by the one in its own row, in the other letter's column.",
      ],
      decode: [
        "Rebuild the square from the keyword.",
        "Apply the same three rules in reverse: left instead of right, up instead of down, and the rectangle rule unchanged.",
        "Remove the padding X letters, and restore I or J by sense.",
      ],
    },
    example: {
      title: "Square from the keyword MONARCHY",
      lines: [
        "M O N A R",
        "C H Y B D",
        "E F G I/J K",
        "L P Q S T",
        "U V W X Z",
        "'HO' -> same row as ... H is row 2, O is row 1: rectangle rule -> 'CN'",
        "'RS' -> rectangle rule -> 'AT'",
      ],
    },
    pitfalls: [
      "The padding rules are where people go wrong years later. Write the rules - not the keyword - on the sheet.",
      "Not usable for passwords containing digits or symbols without a separate convention you will forget.",
      "Two letters out and the whole pair decrypts wrong, so the check letter matters.",
    ],
    pairsWith: ["checksum-line", "memorised-pepper"],
    tags: ["classic", "letters-only", "no-printable"],
    weights: [
      { when: { threat: ["casual"] }, points: 15, because: "It comfortably beats a household finder." },
      { when: { memory: ["strong"] }, points: 12, because: "You can keep the keyword and padding rules straight." },
      { when: { threat: ["targeted"] }, points: -40, because: "Playfair is solved by standard techniques with a modest amount of ciphertext." },
      { when: { secret: ["codes", "few"] }, points: -12, because: "Most of what you are protecting will contain digits, which Playfair cannot carry." },
      { when: { memory: ["none"] }, points: -45, because: "It needs a keyword held in memory." },
    ],
  },
  {
    id: "solitaire",
    stage: "encode",
    name: "Solitaire with a deck of cards",
    tagline: "Bruce Schneier's card-deck cipher, designed for exactly this: strong crypto with nothing electronic in the room.",
    security: "obfuscation",
    ratings: { effort: 5, speed: 1, errorRisk: 5, memoryLoad: 4 },
    materials: ["A full deck including two distinguishable jokers", "The keying order, kept secret", "Patience"],
    protects: [
      "Far more than any simple classical cipher - the keystream comes from a 54-card state that evolves per character",
      "Anyone searching your home, since the key looks like an ordinary deck of cards",
    ],
    failsAgainst: [
      "Your own accuracy. One misplaced card and every character after it is wrong",
      "Known statistical bias in the keystream, documented since publication - it is strong, not proven",
      "Time. Budget about a minute per character, both to encrypt and to decrypt",
    ],
    steps: {
      encode: [
        "Key the deck into an agreed order and record that order the same way you would record any key - separately, or memorised.",
        "Generate one keystream number, 1 to 26, per plaintext letter by running the Solitaire steps: move joker A down one, joker B down two, perform the triple cut, perform the count cut, then read the output card.",
        "Convert the plaintext to numbers, A=1 through Z=26.",
        "Add the keystream number to each plaintext number, subtracting 26 if the total exceeds 26.",
        "Convert back to letters and write the ciphertext in groups of five.",
      ],
      decode: [
        "Key an identical deck to the same starting order.",
        "Generate the same keystream, one number per ciphertext letter.",
        "Subtract the keystream from the ciphertext, adding 26 where the result would go below 1.",
      ],
    },
    example: {
      title: "The addition step",
      lines: [
        "Plaintext:  D  O  N  O  T",
        "As numbers: 4  15 14 15 20",
        "Keystream:  11 4  23 9  2",
        "Sum:        15 19 37 24 22",
        "Reduce:     15 19 11 24 22",
        "Ciphertext: O  S  K  X  V",
      ],
    },
    pitfalls: [
      "Never shuffle the deck between encrypting and decrypting. The keyed order is the key.",
      "Work through one full practice message before trusting it with anything real - the error rate on a first attempt is high.",
      "If the deck is your only key copy, one spilled drink destroys your secret. Record the keyed order separately.",
    ],
    pairsWith: ["card-shuffle", "checksum-line", "restore-drill"],
    tags: ["cards", "advanced", "classic"],
    weights: [
      { when: { materials: ["cards"] }, points: 20, because: "You have a deck, which is the entire apparatus." },
      { when: { effort: ["hour"] }, points: 25, because: "You told us an hour per retrieval is acceptable." },
      { when: { threat: ["targeted"] }, points: 10, because: "It is much harder than the other pen-and-paper ciphers here." },
      { when: { effort: ["seconds", "minutes"] }, points: -45, because: "Solitaire runs about a minute per character; it will not fit your patience." },
      { when: { retrieval: ["often"] }, points: -40, because: "Nobody does this weekly for long." },
    ],
  },
  {
    id: "columnar-transposition",
    stage: "encode",
    name: "Columnar transposition",
    tagline: "Keep every character but scramble the order, using a keyword to number the columns.",
    security: "obfuscation",
    ratings: { effort: 2, speed: 4, errorRisk: 2, memoryLoad: 2 },
    materials: ["Pen and squared paper", "A keyword you keep in your head"],
    protects: [
      "Anyone who tries typing what is on the sheet",
      "Frequency analysis when stacked on top of a substitution cipher - the combination is far stronger than either alone",
    ],
    failsAgainst: [
      "Anagramming by hand. Alone, a short transposition is solved on a train journey",
      "Nothing about the character set changes, so a finder sees your password's shape and length",
    ],
    steps: {
      encode: [
        "Number the letters of your keyword in alphabetical order. For SECRET: E=1, E=2, C=3 ... write the numbering rule down as a rule, never the word.",
        "Write the password in rows under the keyword, one character per column.",
        "Pad the last row with random characters, not with X, so the padding is not obvious.",
        "Read the columns out in the numbered order, and write that as your ciphertext.",
      ],
      decode: [
        "Work out the column heights from the ciphertext length and the number of columns.",
        "Write the ciphertext back down the columns in the keyword's numbered order.",
        "Read the rows left to right, and discard the padding you recognise at the end.",
      ],
    },
    example: {
      title: "Keyword CAT over quarryladle",
      lines: [
        "Columns numbered: C=2  A=1  T=3",
        "Rows:  q u a",
        "       r r y",
        "       l a d",
        "       l e 7   <- 7 is random padding",
        "Read column A first, then C, then T: 'urae qrll ayd7'",
        "Ciphertext: uraeqrllayd7",
      ],
    },
    pitfalls: [
      "On its own this is weak. Use it as the second layer after Vigenere or a substitution, never as the only layer.",
      "Pad with random characters. Padding with XXXX tells an attacker your grid width immediately.",
      "Note the column count somewhere you can reconstruct, or you will be guessing at recovery time.",
    ],
    pairsWith: ["vigenere", "memorised-pepper"],
    tags: ["classic", "layering", "no-printable"],
    weights: [
      { when: { threat: ["casual"] }, points: 15, because: "It stops the person who simply tries what is written." },
      { when: { effort: ["seconds", "minutes"] }, points: 10, because: "It is quick to apply and quick to undo." },
      { when: { threat: ["targeted"] }, points: -40, because: "A short transposition is trivially anagrammed by anyone skilled." },
      { when: { secret: ["seed", "estate"] }, points: -15, because: "Too weak on its own for the most valuable thing you own." },
    ],
  },
  {
    id: "caesar-shift",
    stage: "encode",
    name: "Caesar shift",
    tagline: "Shift every letter by the same amount. Included so you know exactly how little it buys you.",
    security: "obfuscation",
    ratings: { effort: 1, speed: 5, errorRisk: 1, memoryLoad: 1 },
    materials: ["Pen and paper"],
    protects: [
      "A child, a houseguest glancing at your desk, and nothing beyond that",
      "The shoulder-surfer who sees the sheet for two seconds",
    ],
    failsAgainst: [
      "Everyone else. There are 25 possible keys, and a person tries them all in a few minutes",
      "Any attacker at all who suspects a cipher is in use",
    ],
    steps: {
      encode: [
        "Pick a shift from 1 to 25 and keep it in your head.",
        "Move each letter forward by that many places, wrapping Z round to A.",
        "Leave digits and symbols alone, or shift digits separately by the same amount modulo 10.",
      ],
      decode: ["Shift every letter back by the same amount, wrapping A round to Z."],
    },
    example: {
      title: "Shift of 3",
      lines: ["Plaintext:  quarry", "Ciphertext: txdusb", "Anyone who suspects a shift solves this in under a minute."],
    },
    pitfalls: [
      "Do not use this as your only protection for anything you would mind losing.",
      "If you want something this simple, use the memorised pepper instead - same effort, vastly more protection.",
    ],
    pairsWith: ["memorised-pepper"],
    tags: ["classic", "weak", "teaching"],
    weights: [
      { when: { threat: ["casual"] }, points: 5, because: "It is marginally better than plaintext against an idle glance." },
      { when: { threat: ["burglar", "targeted"] }, points: -60, because: "Twenty-five keys is not a barrier to anyone who is actually trying." },
      { when: { secret: ["seed", "master", "estate"] }, points: -50, because: "Far too weak for something this valuable." },
    ],
  },

  /* ------------------------------------------------------------------- SPLIT */
  {
    id: "two-share-split",
    stage: "split",
    name: "Two-of-two split",
    tagline: "Turn the secret into two sheets. Either one alone is provably worthless noise.",
    security: "proven",
    ratings: { effort: 3, speed: 3, errorRisk: 3, memoryLoad: 1 },
    materials: ["The printed character code table", "Dice", "Two locations"],
    protects: [
      "A burglary, a fire, a search, a subpoena at one address - one sheet is mathematically nothing",
      "The person who finds sheet A, however clever they are",
    ],
    failsAgainst: [
      "Losing either sheet, which loses the secret completely. This is a two-of-two, and both halves are required",
      "Storing both shares in the same building, which converts the scheme into writing the password down twice",
    ],
    steps: {
      encode: [
        "Convert each character of the secret into two digits with the code table.",
        "Roll the same number of random digits. That row is share A.",
        "Add the secret digits to share A column by column, keeping only the last digit and never carrying. That row is share B.",
        "Write share A on one sheet, share B on another. Label them with something neutral - a date, not 'key 1 of 2'.",
        "Put the sheets in different buildings, then destroy your working.",
      ],
      decode: [
        "Bring both sheets together.",
        "Subtract share A from share B column by column, adding 10 to the top digit where needed.",
        "Read the result in pairs through the code table.",
      ],
    },
    example: {
      title: "Splitting the same password",
      lines: [
        "Secret digits: 52821685662001",
        "Share A (dice): 73914082655193",
        "Share B (sum):  25735667217194",
        "Either sheet alone is a uniformly random number. It contains no information at all.",
      ],
    },
    pitfalls: [
      "This is the same arithmetic as the one-time pad, viewed differently: share A is the pad. All the same rules apply, including never reusing share A.",
      "Two-of-two has no redundancy. If one location burns down, the secret is gone - use the two-of-three version if that worries you.",
      "Label the sheets so future-you knows they belong together, without telling a stranger the same thing.",
    ],
    pairsWith: ["geographic-split", "tamper-evident", "checksum-line"],
    tags: ["dice", "unbreakable", "printable"],
    printable: "code-table",
    weights: [
      { when: { separate: ["yes"] }, points: 40, because: "You have a genuinely separate location, which is what makes splitting real." },
      { when: { threat: ["burglar", "targeted"] }, points: 30, because: "A theft or search at one address yields nothing." },
      { when: { memory: ["none"] }, points: 25, because: "Nothing here has to be remembered - the protection is physical separation." },
      { when: { secret: ["seed", "estate"] }, points: 20, because: "High-value, rarely-touched secrets are exactly what splitting is for." },
      { when: { separate: ["no"] }, points: -50, because: "With one location only, both shares end up in the same place and the split is theatre." },
      { when: { retrieval: ["often"] }, points: -35, because: "You would be travelling to the other location every time you need it." },
    ],
  },
  {
    id: "shamir-2of3",
    stage: "split",
    name: "Two-of-three split, by hand",
    tagline: "Three sheets, any two of which rebuild the secret. One can burn down and you are still fine.",
    security: "proven",
    ratings: { effort: 4, speed: 2, errorRisk: 4, memoryLoad: 1 },
    materials: ["The printed character code table", "Dice", "Three locations or three trusted holders"],
    protects: [
      "Loss and theft at the same time: one sheet destroyed is survivable, one sheet stolen reveals nothing",
      "Inheritance, because you can give sheets to three people and require any two to agree",
    ],
    failsAgainst: [
      "Arithmetic mistakes, which are more likely here than anywhere else in this catalogue - do the check step",
      "Two holders colluding, which by design is enough to recover everything",
    ],
    steps: {
      encode: [
        "Convert each character to its code number, 0 to 94, with the code table.",
        "For each character, roll a random number k from 0 to 96 using two dice and the printed table.",
        "Work out three shares, subtracting 97 whenever a total reaches 97 or more: share 1 = s + k, share 2 = s + k + k, share 3 = s + k + k + k.",
        "Write each share as a two-digit number on its own sheet, in order, one sheet per holder.",
        "Check before you file them: share 1 plus share 3, minus share 2, should come back to the original code number. If it does not, redo that character.",
      ],
      decode: [
        "Collect any two sheets.",
        "Sheets 1 and 2: secret = share1 + share1 - share2. Sheets 2 and 3: secret = share2 + share2 + share2 - share3 - share3.",
        "Sheets 1 and 3: take share3 - share1; if that is odd, add 97; halve it to recover k; then secret = share1 - k.",
        "After every step, add or subtract 97 until the answer sits between 0 and 96, then read it through the code table.",
      ],
    },
    example: {
      title: "The letter T, code 52, with k = 37",
      lines: [
        "Share 1 = 52 + 37 = 89",
        "Share 2 = 89 + 37 = 126 -> 126 - 97 = 29",
        "Share 3 = 29 + 37 = 66",
        "From 1 and 2: 89 + 89 - 29 = 149 -> 149 - 97 = 52  ✓",
        "From 2 and 3: 29 + 29 + 29 - 66 - 66 = -45 -> -45 + 97 = 52  ✓",
        "From 1 and 3: 66 - 89 = -23 -> +97 = 74, odd? no, halve -> 37 = k, so 89 - 37 = 52  ✓",
      ],
    },
    pitfalls: [
      "Use a fresh random k for every single character. One k reused across the whole secret collapses the scheme.",
      "Number the sheets 1, 2 and 3 clearly. The recovery formulas depend on knowing which share is which.",
      "Rehearse a recovery from two sheets before you distribute them. Discovering an error in a crisis is discovering it too late.",
    ],
    pairsWith: ["geographic-split", "heir-packet", "tamper-evident", "restore-drill"],
    tags: ["dice", "unbreakable", "printable", "advanced", "inheritance"],
    printable: "code-table",
    weights: [
      { when: { heirs: ["yes"] }, points: 40, because: "Any two holders can recover it without you, and no single holder can act alone." },
      { when: { secret: ["estate", "seed"] }, points: 35, because: "This is the classic scheme for inheritance and for crypto seeds." },
      { when: { separate: ["yes"] }, points: 25, because: "You have somewhere separate, so the shares can genuinely be apart." },
      { when: { threat: ["targeted", "burglar"] }, points: 20, because: "One stolen share is provably useless." },
      { when: { effort: ["hour", "minutes"] }, points: 10, because: "You will accept real work at recovery time." },
      { when: { separate: ["no"] }, points: -45, because: "Three shares in one home is three copies of the password." },
      { when: { retrieval: ["often"] }, points: -40, because: "Gathering two shares is not a weekly activity." },
      { when: { effort: ["seconds"] }, points: -35, because: "The arithmetic takes real minutes." },
    ],
  },
  {
    id: "split-by-meaning",
    stage: "split",
    name: "Cutting the secret in half",
    tagline: "The obvious split - first half here, second half there. Better than nothing, and much weaker than it looks.",
    security: "obfuscation",
    ratings: { effort: 1, speed: 4, errorRisk: 1, memoryLoad: 1 },
    materials: ["Scissors or a second sheet"],
    protects: [
      "A thief who takes one drawer and cannot be bothered to look further",
      "Accidental disclosure - a half password cannot be typed in by mistake",
    ],
    failsAgainst: [
      "Anyone who finds one half of a passphrase: half of six words is three words, and the remaining search space is often small enough to grind",
      "The maths, which is the real point. A proper split leaks nothing; half a password leaks half a password",
    ],
    steps: {
      encode: [
        "Split the secret at a point you will remember without a note.",
        "Write each half on a separate sheet, with no indication which is first.",
        "Keep them in different places.",
      ],
      decode: ["Bring both halves together and join them in the right order."],
    },
    example: {
      title: "What the finder learns",
      lines: [
        "Secret:  quarry-ladle-drifting-unmapped-copper-thistle",
        "Sheet A: quarry-ladle-drifting",
        "Sheet B: unmapped-copper-thistle",
        "Sheet A alone has cut the attacker's problem from 77 bits to 38. That is a real loss.",
      ],
    },
    pitfalls: [
      "Use the two-of-two split instead when you can. Same two sheets, same two locations, but one sheet leaks nothing rather than half.",
      "Never split so that one half is guessable from the other - do not split on a word boundary that reveals the pattern.",
    ],
    pairsWith: ["geographic-split"],
    tags: ["simple", "weak"],
    weights: [
      { when: { effort: ["seconds"] }, points: 15, because: "It costs nothing and needs no arithmetic." },
      { when: { materials: ["none"] }, points: 20, because: "You said you have no dice or cards, and this needs neither." },
      { when: { threat: ["targeted"] }, points: -35, because: "Half a secret is a genuine head start for a skilled attacker." },
      { when: { secret: ["seed"] }, points: -30, because: "Half a seed phrase is a widely attacked target - do not do this with crypto." },
    ],
  },

  /* ------------------------------------------------------------------- STORE */
  {
    id: "tamper-evident",
    stage: "store",
    name: "Sealed, signed, numbered envelope",
    tagline: "You cannot stop someone opening it. You can guarantee you will know.",
    security: "operational",
    ratings: { effort: 1, speed: 4, errorRisk: 1, memoryLoad: 1 },
    materials: ["Opaque envelopes", "A pen", "Optionally sticky tape and a phone camera for the record shot"],
    protects: [
      "Silent compromise - the attack where someone reads your sheet and puts it back",
      "Your own uncertainty later about whether the copy in the loft is still trustworthy",
    ],
    failsAgainst: [
      "The contents. A sealed envelope is not encryption - seal encrypted material, not a bare password",
      "A patient attacker with a steamer and a spare envelope, unless you sign across the seal",
    ],
    steps: {
      encode: [
        "Put the sheet in an opaque envelope - hold it up to a lamp first and check nothing reads through.",
        "Seal it, then sign your name across the flap so the signature crosses onto the envelope body.",
        "Write the date and a sequence number on the front. Nothing else.",
        "Run a strip of clear tape over the signature so it cannot be lifted and reapplied.",
        "Photograph the sealed envelope for your own records, and store the photo anywhere - it reveals nothing.",
      ],
      decode: [
        "Before opening, compare the seal and signature with your reference photo.",
        "If anything differs, treat every secret inside as compromised and rotate it.",
        "Open, use, then re-seal in a fresh envelope with the next sequence number.",
      ],
    },
    example: {
      title: "What goes on the outside",
      lines: ["Front: 2026-09-17  #003", "Flap: signature crossing the seam, taped over", "Nothing on the envelope says what is inside or why it matters."],
    },
    pitfalls: [
      "Do not write 'PASSWORDS - DO NOT OPEN' on the front. You have just addressed the envelope to the thief.",
      "Re-seal every time you open it, and increment the number. An envelope you opened and taped shut tells you nothing next time.",
    ],
    pairsWith: ["otp-digits", "two-share-split", "geographic-split", "heir-packet"],
    tags: ["physical", "cheap", "beginner"],
    weights: [
      { when: {}, points: 20, because: "Tamper evidence is worth doing for every offline secret, whatever else you choose." },
      { when: { threat: ["casual", "burglar", "targeted"] }, points: 15, because: "It turns a silent compromise into one you will notice." },
      { when: { retrieval: ["rarely", "sometimes"] }, points: 10, because: "Sheets you rarely touch are exactly the ones read without you knowing." },
    ],
  },
  {
    id: "geographic-split",
    stage: "store",
    name: "Different buildings, not different drawers",
    tagline: "Separation only counts if one event cannot reach both places.",
    security: "operational",
    ratings: { effort: 2, speed: 2, errorRisk: 1, memoryLoad: 1 },
    materials: ["A second location: a relative's house, an office, a bank box, a solicitor"],
    protects: [
      "House fires, floods, burglary and eviction, all of which take a whole address at once",
      "Every split and pad scheme here, none of which work if both parts share a roof",
    ],
    failsAgainst: [
      "Convenience. You will be tempted to bring the other half home 'temporarily', and it will stay",
      "Relationships that end - choose a location that survives a falling-out",
    ],
    steps: {
      encode: [
        "Write down the threat: fire, theft, flood, a landlord, a search. Then pick a location none of those reach at the same time as your home.",
        "Bank safe deposit boxes, a solicitor's file, a sibling's house and a workplace locker all qualify. The car does not. The loft does not.",
        "Record where the other part is, in a way that means something to you and your executor and nothing to a stranger.",
        "Diarise a yearly visit to confirm it is still there and still legible.",
      ],
      decode: ["Retrieve both parts, use them, and return them separately the same week - not next month."],
    },
    example: {
      title: "Separation that holds",
      lines: [
        "Home: ciphertext sheet in a sealed envelope",
        "Sister's house, 40 miles away: the pad, in a sealed envelope",
        "One burglary, one fire or one flood cannot reach both.",
      ],
    },
    pitfalls: [
      "A fireproof box in the same house is not separation. It helps with fire and does nothing about theft.",
      "Bank boxes can be frozen on death - if inheritance matters, use a solicitor or a named person instead.",
      "Do not tell the holder what it is. They cannot leak what they do not know.",
    ],
    pairsWith: ["two-share-split", "shamir-2of3", "otp-digits", "tamper-evident"],
    tags: ["physical", "essential"],
    weights: [
      { when: { separate: ["yes"] }, points: 35, because: "You already have a second location, so this costs you nothing." },
      { when: { threat: ["burglar", "targeted"] }, points: 25, because: "Theft and search take one address at a time." },
      { when: { secret: ["seed", "estate"] }, points: 20, because: "Irreplaceable secrets need to survive losing a building." },
      { when: { separate: ["no"] }, points: -40, because: "You told us there is nowhere separate available." },
      { when: { separate: ["sameplace"] }, points: -15, because: "Another room in the same home does not survive a fire or a burglary." },
    ],
  },
  {
    id: "steel-stamp",
    stage: "store",
    name: "Stamped into metal",
    tagline: "Paper burns at 230C and dissolves in a flood. Steel does neither.",
    security: "operational",
    ratings: { effort: 4, speed: 2, errorRisk: 3, memoryLoad: 1 },
    materials: ["A steel plate or washer set", "A letter punch set and a hammer", "Eye protection"],
    protects: [
      "Fire, flood, damp lofts, silverfish, faded ink and the twenty-year problem generally",
      "Anything you expect to still need after you are gone",
    ],
    failsAgainst: [
      "Anyone who picks it up and reads it. Stamp encrypted or split material, never a bare seed",
      "Mistakes, because a mis-stamped character cannot be erased",
    ],
    steps: {
      encode: [
        "Decide what goes on the metal: a share, a ciphertext or the first four letters of each seed word - never the whole plaintext secret.",
        "Lay the characters out on paper first, in the exact grid you will stamp.",
        "Punch on a hard flat surface, checking each character against your layout before moving on.",
        "Store the plate somewhere that is boring and low: a fire will find a loft long before it finds a cellar.",
        "Burn the paper layout once you have checked the plate.",
      ],
      decode: ["Read the plate. Then apply whatever cipher or split scheme produced what is stamped on it."],
    },
    example: {
      title: "What to commit to metal",
      lines: [
        "Good: one share of a two-of-three split",
        "Good: the first four letters of each seed word, which identify each word uniquely in the standard list",
        "Bad: the whole seed phrase, in plain words, where a burglar can read it",
      ],
    },
    pitfalls: [
      "Do not use aluminium tags for fire protection; use stainless steel or titanium.",
      "Do not stamp the plaintext of anything a finder could spend.",
      "Photograph the finished plate only if you are photographing ciphertext. Never photograph plaintext.",
    ],
    pairsWith: ["shamir-2of3", "two-share-split", "geographic-split"],
    tags: ["physical", "durable", "crypto"],
    weights: [
      { when: { materials: ["steel"] }, points: 30, because: "You already have metal backup stock." },
      { when: { secret: ["seed"] }, points: 30, because: "Crypto seeds are the standard case for metal backups." },
      { when: { retrieval: ["rarely"] }, points: 15, because: "Write-once metal suits something you will read once, in an emergency." },
      { when: { secret: ["estate"] }, points: 15, because: "It has to outlast paper, and you." },
      { when: { retrieval: ["often"] }, points: -30, because: "Metal is write-once; frequent changes mean a new plate each time." },
    ],
  },
  {
    id: "decoy-sheet",
    stage: "store",
    name: "The decoy sheet",
    tagline: "Give the searcher something to find, so they stop looking.",
    security: "operational",
    ratings: { effort: 2, speed: 5, errorRisk: 2, memoryLoad: 2 },
    materials: ["A second sheet, written in the same hand and the same ink"],
    protects: [
      "The search that ends when something plausible turns up",
      "Coercion, to a limited extent: there is something to hand over",
    ],
    failsAgainst: [
      "A thorough adversary who keeps searching after the first find",
      "Anyone who tests the decoy passwords and comes back angry. Consider what happens next before relying on this",
    ],
    steps: {
      encode: [
        "Write a believable sheet: real-looking site names, plausible passwords, a few crossings-out, the same pen.",
        "Put the decoy where a searcher looks first - a desk drawer, under the keyboard tray, in the bedside table.",
        "Point the decoy passwords at accounts that exist but hold nothing, so they fail believably rather than obviously.",
        "Keep the real material somewhere a first pass will not reach, and ideally in another building.",
      ],
      decode: ["Nothing to decode - just never confuse the two sheets. Mark the real one in a way only you would notice."],
    },
    example: {
      title: "A believable decoy",
      lines: [
        "email - Sunflower!92",
        "shopping - Sunflower!92b",
        "bank - Hollyhock#41 (changed May)",
        "Aged with a coffee ring and one crossed-out line.",
      ],
    },
    pitfalls: [
      "A pristine decoy sheet in a used desk is a tell. It has to look lived with.",
      "Do not point decoy passwords at accounts that matter, and do not use any real password on the decoy.",
      "Be honest about coercion: if someone is standing over you, a decoy buys time, not safety.",
    ],
    pairsWith: ["memorised-pepper", "grid-lookup"],
    tags: ["physical", "deniability"],
    weights: [
      { when: { threat: ["burglar", "targeted"] }, points: 20, because: "A search that stops early is a search you survive." },
      { when: { threat: ["none"] }, points: -30, because: "You said there is no adversary, so a decoy is pure overhead." },
      { when: { heirs: ["yes"] }, points: -15, because: "Your heirs may find the decoy and conclude the real sheet is lost." },
    ],
  },
  {
    id: "heir-packet",
    stage: "store",
    name: "The inheritance packet",
    tagline: "Written for someone who has never heard of any of this, and is having the worst month of their life.",
    security: "operational",
    ratings: { effort: 3, speed: 2, errorRisk: 2, memoryLoad: 1 },
    materials: ["A plain envelope", "Two sides of paper", "A solicitor, executor or trusted holder"],
    protects: [
      "The real failure mode of offline encryption: a perfectly protected secret nobody left alive can unlock",
      "Your family's ability to reach accounts, photographs, domains and funds",
    ],
    failsAgainst: [
      "Being too clever. If the instructions need your cryptographic taste to follow, they will fail",
      "Being too open. The packet must not contain the secret itself, or it is just the password in a drawer",
    ],
    steps: {
      encode: [
        "Write what exists and where, in plain language: 'There are two sealed envelopes. One is in the bureau, one is with Aunt Ruth.'",
        "Write how to combine them, in numbered steps, with a fully worked example on made-up numbers.",
        "Include the printed code table or cipher square the scheme needs. These are not secret and they will not be to hand later.",
        "Do not include the secret, any share, or any key in this packet.",
        "Lodge it with your solicitor or executor, referenced by your will, and tell one living person it exists.",
        "Re-read it every year as if you knew nothing. Rewrite any step that made you pause.",
      ],
      decode: ["Your executor opens it, follows the numbered steps, and gathers the pieces named in it."],
    },
    example: {
      title: "Opening lines that actually work",
      lines: [
        "1. This letter does not contain any password.",
        "2. You need two envelopes. Envelope A is in the bureau, second drawer. Envelope B is held by Ruth Okafor, whose number is with my will.",
        "3. Each envelope holds a grid of two-digit numbers. Put them side by side and follow step 4.",
        "4. Worked example with four characters, done in full, follows overleaf.",
      ],
    },
    pitfalls: [
      "Never put a share and the instructions in the same envelope - that is the entire secret in one place.",
      "Name a person, not a role. 'My executor' is not a person your family can phone.",
      "Test it: hand the instructions and two dummy shares to a non-technical friend and watch them fail. Fix what broke.",
    ],
    pairsWith: ["shamir-2of3", "two-share-split", "tamper-evident", "restore-drill"],
    tags: ["inheritance", "essential", "writing"],
    weights: [
      { when: { heirs: ["yes"] }, points: 45, because: "Someone else must be able to recover this without you." },
      { when: { secret: ["estate"] }, points: 35, because: "This is an estate bundle, and instructions are most of the job." },
      { when: { memory: ["strong", "short"] }, points: 10, because: "Anything you keep in your head has to be written down somewhere for them." },
      { when: { heirs: ["no"] }, points: -35, because: "Nobody else needs to recover this." },
    ],
  },

  /* ------------------------------------------------------------------ VERIFY */
  {
    id: "checksum-line",
    stage: "verify",
    name: "A check digit you can work out by hand",
    tagline: "One extra character catches the transcription error that would otherwise cost you the account.",
    security: "operational",
    ratings: { effort: 1, speed: 5, errorRisk: 1, memoryLoad: 1 },
    materials: ["Pen and paper"],
    protects: [
      "The single most common real failure: a 5 written as an S, or a dropped character, discovered three years later",
      "Arithmetic slips in the pad and split methods, where one wrong column ruins everything after it",
    ],
    failsAgainst: [
      "Two errors that cancel out, and swapped neighbours, which a simple sum does not catch",
      "Nothing about secrecy - the check digit reveals almost nothing, but it is not protection",
    ],
    steps: {
      encode: [
        "For a row of digits: add them all up and keep the last digit of the total. Write it after a slash.",
        "For letters: number A=0 to Z=25, add them, take the remainder after dividing by 26, and write that letter after a slash.",
        "Do this on the ciphertext, and separately on the plaintext you recover during a rehearsal.",
        "Write the check character on the sheet. On its own it gives an attacker essentially nothing.",
      ],
      decode: [
        "Recompute the sum before you trust what you have read.",
        "If it does not match, stop and find the error. Do not start typing it into an account with three attempts left.",
      ],
    },
    example: {
      title: "Checking a ciphertext row",
      lines: [
        "Ciphertext: 25735667217194",
        "2+5+7+3+5+6+6+7+2+1+7+1+9+4 = 65",
        "Last digit: 5",
        "Write: 25735667217194/5",
        "Letters: HORSE -> 7+14+17+18+4 = 60, and 60 - 52 = 8 -> 'I'. Write HORSE/I",
      ],
    },
    pitfalls: [
      "A matching check digit proves you copied it right. It does not prove you decrypted it right - rehearse as well.",
      "Use the same convention everywhere, and note which convention you used on the sheet: '/d' for digits, '/L' for letters.",
    ],
    pairsWith: ["otp-digits", "two-share-split", "shamir-2of3", "dice-charset"],
    tags: ["essential", "cheap", "beginner"],
    weights: [
      { when: {}, points: 25, because: "Every handwritten secret should carry a check character; it costs one character." },
      { when: { retrieval: ["rarely"] }, points: 20, because: "The longer the gap before you read it back, the more a silent copying error costs." },
      { when: { effort: ["seconds"] }, points: 10, because: "It adds seconds, not minutes." },
    ],
  },
  {
    id: "restore-drill",
    stage: "verify",
    name: "The yearly restore drill",
    tagline: "An untested backup is a rumour. Book a date and prove it still works.",
    security: "operational",
    ratings: { effort: 2, speed: 2, errorRisk: 1, memoryLoad: 2 },
    materials: ["A calendar reminder", "An hour, once a year"],
    protects: [
      "Faded ink, damp, a share someone quietly moved, a rule you no longer remember, an edition of a book you replaced",
      "The discovery that you cannot actually follow your own instructions",
    ],
    failsAgainst: [
      "Nothing - this is the step people skip, and the step that would have saved them",
    ],
    steps: {
      encode: [
        "Put a recurring reminder in your calendar. Name it something dull, like 'annual filing'.",
        "On the day, retrieve every piece and decrypt the secret fully, on paper, without notes or hints.",
        "Confirm it actually works by logging in once with the recovered value.",
        "Note what was awkward. Rewrite the instruction that caused the pause.",
        "Re-seal everything in fresh envelopes, increment the numbers, and return the parts to their separate places the same week.",
      ],
      decode: ["Nothing to decode - this stage is the rehearsal."],
    },
    example: {
      title: "What a drill turns up",
      lines: [
        "Year 1: pencil had faded on the pad sheet. Rewritten in archival ink.",
        "Year 2: the second share had been moved during a house move, and took two days to find.",
        "Year 3: the heir instructions said 'my executor' and named nobody.",
      ],
    },
    pitfalls: [
      "Do not shortcut the drill by using a copy you keep on your computer. That copy is the thing you were trying to avoid.",
      "If you have to look at your own cheat notes to complete the drill, the instructions are not good enough yet.",
    ],
    pairsWith: ["heir-packet", "tamper-evident", "shamir-2of3"],
    tags: ["essential", "process"],
    weights: [
      { when: {}, points: 20, because: "Every offline scheme needs one rehearsal a year or it quietly rots." },
      { when: { retrieval: ["rarely"] }, points: 25, because: "You may only read this once ever, so the rehearsal is the only test it will get." },
      { when: { heirs: ["yes"] }, points: 20, because: "The drill is how you find out your instructions are unusable." },
      { when: { secret: ["seed", "estate"] }, points: 15, because: "There is no support line for a lost seed phrase." },
    ],
  },
  {
    id: "two-copies",
    stage: "verify",
    name: "Two copies, two places, one format",
    tagline: "One copy is a single point of failure. Three copies is three things to steal.",
    security: "operational",
    ratings: { effort: 2, speed: 3, errorRisk: 2, memoryLoad: 1 },
    materials: ["Archival ink or pencil", "Acid-free paper", "Two locations"],
    protects: [
      "Loss, which destroys more offline secrets than theft ever has",
      "Damage: coffee, damp, a leaking roof, a child with scissors",
    ],
    failsAgainst: [
      "Copy drift. Two copies that disagree are worse than one copy, so change both or neither",
      "Over-copying. Each extra copy is another chance for someone to find one",
    ],
    steps: {
      encode: [
        "Make exactly two copies of each encrypted sheet or share. Not one, not four.",
        "Write both in the same hand, the same format and the same order, so they can be compared character by character.",
        "Use pencil or pigment ink on acid-free paper. Gel and inkjet fade; thermal paper goes blank in a few years.",
        "Check them against each other before you separate them, with the check digit.",
        "Log the locations in your inheritance packet, never on the sheets themselves.",
      ],
      decode: ["Use either copy. If you ever change one, change the other the same day or destroy it."],
    },
    example: {
      title: "A copy policy that holds up",
      lines: [
        "Share 1: copy at home, copy with the solicitor",
        "Share 2: copy at sister's, copy in the bank box",
        "Every copy is a share, never the whole secret, so a found copy is still worthless.",
      ],
    },
    pitfalls: [
      "Never photocopy a sheet at work, in a library or in a print shop. Copiers keep images.",
      "Never photograph a sheet 'just as a temporary backup'. That is the exact failure this whole approach exists to avoid.",
      "Date every copy so you can tell which one is current.",
    ],
    pairsWith: ["geographic-split", "tamper-evident", "steel-stamp"],
    tags: ["essential", "physical"],
    weights: [
      { when: {}, points: 18, because: "Loss beats theft as a cause of failure, and redundancy is the only answer to it." },
      { when: { threat: ["none"] }, points: 30, because: "You named disaster recovery rather than an adversary, which is exactly this." },
      { when: { separate: ["yes"] }, points: 20, because: "You have a second location to hold the second copy." },
      { when: { secret: ["seed", "estate"] }, points: 15, because: "These are the secrets with no recovery path if the paper is lost." },
    ],
  },
];
