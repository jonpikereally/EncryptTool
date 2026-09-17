/*
 * UI wiring for EncryptYourLife.
 *
 * Two makers - an encryption tool and a password - each with a few options,
 * one Generate button, five results each. Everything random comes from
 * crypto.getRandomValues on this device; nothing is stored, logged or sent.
 */
(function app() {
  "use strict";

  const $ = (selector, root) => (root || document).querySelector(selector);

  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

  const list = (items, tag, className) =>
    `<${tag} class="${className || ""}">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</${tag}>`;

  const numbers = (values) => values.map((n) => ({ value: String(n), label: String(n) }));

  /* ------------------------------------------------------------ randomness */

  /** Uniform integer in [0, max) with rejection sampling, so no modulo bias. */
  function randomInt(max) {
    const buffer = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    do crypto.getRandomValues(buffer);
    while (buffer[0] >= limit);
    return buffer[0] % max;
  }

  const pick = (array) => array[randomInt(array.length)];
  const pickWord = () => pick(window.WORDLIST);

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = randomInt(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const LOWER = "abcdefghijklmnopqrstuvwxyz";
  const DIGITS = "0123456789";
  const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/";
  /* For a suffix on a handwritten passphrase: symbols that survive handwriting. */
  const EASY_SYMBOLS = "!@#$%&*?+=";
  const CHARSETS = {
    letters: UPPER + LOWER,
    alnum: UPPER + LOWER + DIGITS,
    full: UPPER + LOWER + DIGITS + SYMBOLS,
  };
  const WORD_BITS = Math.log2(window.WORDLIST.length);

  function grade(bits) {
    if (bits >= 80) return "very strong";
    if (bits >= 60) return "strong";
    if (bits >= 45) return "adequate";
    return "weak";
  }

  /* --------------------------------------------------------------- options */

  const TOOL_ROWS = [
    {
      id: "complexity",
      label: "How complicated",
      options: [
        { value: "simple", label: "Simple", hint: "seconds to use, one thing to remember" },
        { value: "balanced", label: "Balanced", hint: "a few minutes of pen work" },
        { value: "maximum", label: "Maximum", hint: "a ceremony, for a vault you rarely open" },
      ],
      initial: "balanced",
    },
    {
      id: "chars",
      label: "What the password contains",
      options: [
        { value: "letters", label: "Letters" },
        { value: "alnum", label: "Letters + digits" },
        { value: "full", label: "Letters, digits + symbols" },
        { value: "words", label: "Words" },
      ],
      initial: "alnum",
    },
    { id: "length", label: "Up to", unit: "characters", options: numbers([8, 12, 16, 20, 24, 32]), initial: "16", when: (o) => o.chars !== "words" },
    { id: "words", label: "Up to", unit: "words", options: numbers([4, 5, 6, 7, 8]), initial: "6", when: (o) => o.chars === "words" },
    {
      id: "random",
      label: "Incorporate randomness",
      options: [
        { value: "yes", label: "Yes - make the key material for me" },
        { value: "no", label: "No - only rules I keep in my head" },
      ],
      initial: "yes",
    },
    {
      id: "source",
      label: "Randomness from",
      options: [
        { value: "device", label: "This device" },
        { value: "dice", label: "I'll roll dice - give me blank sheets" },
      ],
      initial: "device",
      when: (o) => o.random === "yes",
    },
  ];

  const PASSWORD_ROWS = [
    {
      id: "ptype",
      label: "Kind",
      options: [
        { value: "words", label: "Passphrase (words)" },
        { value: "chars", label: "Characters" },
      ],
      initial: "words",
    },
    { id: "pwords", label: "Length", unit: "words", options: numbers([4, 5, 6, 7, 8]), initial: "6", when: (o) => o.ptype === "words" },
    { id: "plength", label: "Length", unit: "characters", options: numbers([8, 12, 16, 20, 24, 32]), initial: "16", when: (o) => o.ptype === "chars" },
    {
      id: "pchars",
      label: "Characters",
      options: [
        { value: "letters", label: "Letters" },
        { value: "alnum", label: "Letters + digits" },
        { value: "full", label: "Letters, digits + symbols" },
      ],
      initial: "full",
      when: (o) => o.ptype === "chars",
    },
    {
      id: "psep",
      label: "Between words",
      options: [
        { value: "-", label: "Hyphen" },
        { value: " ", label: "Space" },
        { value: "", label: "Nothing, capitalise each word" },
      ],
      initial: "-",
      when: (o) => o.ptype === "words",
    },
    {
      id: "pstrict",
      label: "Satisfy picky sites",
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes - guarantee a capital, a digit and a symbol" },
      ],
      initial: "no",
    },
  ];

  function renderRows(container, rows) {
    container.innerHTML = rows
      .map((row) => {
        const pills = row.options
          .map((option) => {
            const id = `${row.id}-${option.value === "" ? "none" : option.value}`;
            return `
              <input class="pill-input" type="radio" name="${esc(row.id)}" id="${esc(id)}" value="${esc(option.value)}"${option.value === row.initial ? " checked" : ""} />
              <label class="pill" for="${esc(id)}"${option.hint ? ` title="${esc(option.hint)}"` : ""}>${esc(option.label)}</label>`;
          })
          .join("");
        const unit = row.unit ? `<span class="row-unit">${esc(row.unit)}</span>` : "";
        return `
          <div class="row" data-row="${esc(row.id)}">
            <span class="row-label">${esc(row.label)}</span>
            <div class="pills">${pills}</div>${unit}
          </div>`;
      })
      .join("");
  }

  function collect(rows) {
    const form = $("#maker-form");
    const values = {};
    for (const row of rows) {
      const checked = form.querySelector(`input[name="${row.id}"]:checked`);
      if (checked) values[row.id] = checked.value;
    }
    return values;
  }

  function syncRows(rows, values) {
    for (const row of rows) {
      const wrapper = document.querySelector(`.row[data-row="${row.id}"]`);
      if (wrapper) wrapper.hidden = row.when ? !row.when(values) : false;
    }
  }

  function syncMakers() {
    const tool = $("#make-tool").checked;
    const password = $("#make-password").checked;
    $("#tool-options").hidden = !tool;
    $("#password-options").hidden = !password;
    syncRows(TOOL_ROWS, collect(TOOL_ROWS));
    syncRows(PASSWORD_ROWS, collect(PASSWORD_ROWS));
  }

  /* ------------------------------------------------------------- passwords */

  function hasClasses(value, set) {
    if (!/[A-Z]/.test(value) || !/[a-z]/.test(value)) return false;
    if (set !== "letters" && !/[0-9]/.test(value)) return false;
    if (set === "full" && ![...SYMBOLS].some((s) => value.includes(s))) return false;
    return true;
  }

  function makePassword(o) {
    if (o.ptype === "chars") {
      const set = CHARSETS[o.pchars];
      const n = Number(o.plength);
      let value = "";
      for (let attempt = 0; attempt < 200; attempt += 1) {
        value = Array.from({ length: n }, () => set[randomInt(set.length)]).join("");
        if (o.pstrict !== "yes" || hasClasses(value, o.pchars)) break;
      }
      const bits = n * Math.log2(set.length);
      return { value, bits, detail: `${n} characters from a set of ${set.length}` };
    }

    const n = Number(o.pwords);
    let words = Array.from({ length: n }, pickWord);
    let bits = n * WORD_BITS;
    let detail = `${n} words from the EFF list of ${window.WORDLIST.length.toLocaleString()}`;
    if (o.psep === "") words = words.map((w) => w[0].toUpperCase() + w.slice(1));
    let value = words.join(o.psep);
    if (o.pstrict === "yes") {
      if (o.psep !== "") value = value[0].toUpperCase() + value.slice(1);
      const suffix = `${DIGITS[randomInt(10)]}${EASY_SYMBOLS[randomInt(EASY_SYMBOLS.length)]}`;
      value += (o.psep === " " ? " " : "") + suffix;
      bits += Math.log2(10) + Math.log2(EASY_SYMBOLS.length);
      detail += ", plus a capital, a digit and a symbol";
    }
    return { value, bits, detail };
  }

  /* --------------------------------------------------- encryption tools */

  const NEEDS_RANDOM = new Set(["otp-digits", "two-share-split", "shamir-2of3", "grid-lookup", "solitaire"]);
  const LETTERS_ONLY = new Set(["playfair"]);
  const COMPLEXITY = {
    simple: { retrieval: "often", effort: "seconds", memory: "short", threat: "casual" },
    balanced: { retrieval: "sometimes", effort: "minutes", memory: "short", threat: "burglar" },
    maximum: { retrieval: "rarely", effort: "hour", memory: "strong", threat: "targeted" },
  };
  const TIER = { proven: 0, strong: 1, obfuscation: 2, operational: 3 };

  function rankTools(o) {
    const answers = {
      secret: o.chars === "words" ? "master" : "few",
      ...COMPLEXITY[o.complexity],
      separate: o.random === "yes" ? "yes" : "no",
      heirs: "no",
      materials: o.random === "yes" ? ["dice", "printer"] : ["printer"],
    };
    let ranked = window
      .recommend(answers)
      .ranked.filter((entry) => entry.method.stage === "encode" || entry.method.stage === "split")
      .filter((entry) => o.random === "yes" || !NEEDS_RANDOM.has(entry.method.id))
      .filter((entry) => o.chars === "letters" || o.chars === "words" || !LETTERS_ONLY.has(entry.method.id));
    if (o.complexity === "maximum") {
      /* "Maximum" means maximum strength, so a proven method never sits below an obfuscation one. */
      ranked = ranked.slice().sort((a, b) => TIER[a.method.security] - TIER[b.method.security] || b.score - a.score);
    }
    return ranked.slice(0, 5);
  }

  /** How many characters the key material has to cover. */
  const coverage = (o) => (o.chars === "words" ? Number(o.words) * 8 : Number(o.length));

  const digitsBlock = (digits) => {
    const groups = digits.match(/.{1,5}/g) || [];
    const rows = [];
    for (let i = 0; i < groups.length; i += 5) rows.push(groups.slice(i, i + 5).join(" "));
    return rows.join("\n");
  };
  const checkDigit = (digits) => [...digits].reduce((sum, d) => sum + Number(d), 0) % 10;
  const randomDigits = (n) => Array.from({ length: n }, () => DIGITS[randomInt(10)]).join("");
  const words = (n) => Array.from({ length: n }, pickWord);
  const lettersOf = (text) => text.toUpperCase().replace(/[^A-Z]/g, "");

  function playfairSquare(keyword) {
    const seen = new Set();
    const cells = [];
    for (const ch of lettersOf(keyword).replace(/J/g, "I") + UPPER.replace("J", "")) {
      if (!seen.has(ch)) {
        seen.add(ch);
        cells.push(ch);
      }
    }
    const rows = [];
    for (let r = 0; r < 5; r += 1) rows.push(cells.slice(r * 5, r * 5 + 5));
    return rows;
  }

  function gridCharset(o) {
    if (o.chars === "alnum") return UPPER + LOWER + DIGITS;
    if (o.chars === "full") return UPPER + LOWER + DIGITS + "!@#$%&*+=?";
    return UPPER + LOWER;
  }

  function table(caption, headers, rows, className) {
    const head = headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("");
    const body = rows
      .map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${esc(cell)}</th>` : `<td>${esc(cell)}</td>`)).join("")}</tr>`)
      .join("");
    return `<table class="sheet-table ${className || ""}"><caption>${esc(caption)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  function keyBits(text, wordCount) {
    return wordCount ? Math.round(wordCount * WORD_BITS) : null;
  }

  /**
   * The generated key material for a method - the actual "tool". Returns
   * { title, html, note } or null when the method has nothing to generate.
   */
  function material(method, o) {
    const n = coverage(o);
    const dice = o.source === "dice";
    const sheet = (id, label) => {
      const s = window.PRINTABLES.find((item) => item.id === id);
      return s ? `<button type="button" class="link-button" data-sheet="${esc(s.id)}">${esc(label || `Print the ${s.name.toLowerCase()}`)}</button>` : "";
    };

    switch (method.id) {
      case "otp-digits":
      case "two-share-split": {
        const count = Math.ceil((n * 2) / 5) * 5;
        const label = method.id === "otp-digits" ? "Your pad" : "Share A (the random half)";
        if (dice) {
          return {
            title: label,
            html: `<p>Roll <strong>${count} digits</strong> with two dice and the digit table, and write them on the pad worksheet. That covers a password of up to ${n} characters.</p><p>${sheet("dice-digits")} · ${sheet("pad-sheet")} · ${sheet("code-table")}</p>`,
          };
        }
        const digits = randomDigits(count);
        return {
          title: `${label} - ${count} digits, covers up to ${n} characters`,
          html: `<pre class="digits">${digitsBlock(digits)}</pre><p class="material-note">Check digit ${checkDigit(digits)}. Write it after a slash so you can spot a copying slip later.</p><p>${sheet("code-table")} · ${sheet("pad-sheet")}</p>`,
          note: "Use each pad exactly once. Keep it in a different building from the ciphertext.",
        };
      }
      case "shamir-2of3": {
        if (dice) {
          return {
            title: "Your random k values",
            html: `<p>Roll <strong>${n} numbers from 00 to 96</strong> - two digits each, roll again on 97 to 99 - one per character, and write them in the k column of the worksheet.</p><p>${sheet("dice-digits")} · ${sheet("shamir-sheet")} · ${sheet("code-table")}</p>`,
          };
        }
        const ks = Array.from({ length: n }, () => String(randomInt(97)).padStart(2, "0"));
        return {
          title: `Your random k values - one per character, ${n} of them`,
          html: `<pre class="digits">${digitsBlock(ks.join(""))}</pre><p class="material-note">Read them in pairs, left to right. A fresh k for every character is what makes the split hold.</p><p>${sheet("shamir-sheet")} · ${sheet("code-table")}</p>`,
        };
      }
      case "grid-lookup": {
        if (dice) {
          return {
            title: "Your card",
            html: `<p>Fill every cell of the blank card with dice and the character grid - about twenty minutes, once.</p><p>${sheet("blank-grid")} · ${sheet("dice-grid")}</p>`,
          };
        }
        const set = gridCharset(o);
        const cols = 14;
        const rows = [...UPPER].map((letter) => [letter, ...Array.from({ length: cols }, () => set[randomInt(set.length)])]);
        return {
          title: "Your card - carry it, memorise only the path rule",
          html: `<details class="fold"><summary>Show the card - 26 rows by ${cols} columns</summary>${table("Row by first letter of the site, column by your rule", ["", ...Array.from({ length: cols }, (_, i) => String(i + 1))], rows, "square tiny card")}</details>`,
          note: "Print two copies. The card alone is noise; the rule stays in your head.",
        };
      }
      case "vigenere": {
        const ws = words(3);
        const keyword = lettersOf(ws.join(""));
        return {
          title: "Your keyword - memorise it, never write it",
          html: `<p class="keyword">${esc(ws.join(" "))}</p><p class="material-note">Used as <span class="mono">${esc(keyword)}</span>, ${keyword.length} letters, about ${keyBits(keyword, 3)} bits. Three real words are far easier to keep in your head than random letters, and just as good here.</p><p>${sheet("tabula-recta")}</p>`,
        };
      }
      case "playfair": {
        const ws = words(2);
        const square = playfairSquare(ws.join(""));
        return {
          title: "Your keyword and square",
          html: `<p class="keyword">${esc(ws.join(" "))}</p>${table("5x5 square built from the keyword, I and J share a cell", ["", "1", "2", "3", "4", "5"], square.map((row, i) => [String(i + 1), ...row]), "square")}<p class="material-note">Rebuild the square from the keyword whenever you need it; the square itself need not be kept.</p>`,
        };
      }
      case "columnar-transposition": {
        const ws = words(2);
        const keyword = lettersOf(ws.join(""));
        const order = [...keyword].map((ch, i) => ({ ch, i })).sort((a, b) => a.ch.localeCompare(b.ch) || a.i - b.i);
        const numbering = new Array(keyword.length);
        order.forEach((item, rank) => (numbering[item.i] = rank + 1));
        return {
          title: "Your keyword and column order",
          html: `<p class="keyword">${esc(ws.join(" "))}</p><pre class="digits">${esc([...keyword].join(" "))}\n${esc(numbering.map((x) => String(x).padStart(1)).join(" "))}</pre><p class="material-note">${keyword.length} columns. Read them out in the numbered order.</p>`,
        };
      }
      case "memorised-pepper": {
        const set = UPPER + LOWER + DIGITS + "!@#$%&*?";
        const pepper = Array.from({ length: 6 }, () => set[randomInt(set.length)]).join("");
        const position = 2 + randomInt(5);
        return {
          title: "Your pepper and rule - memorise both, never write them",
          html: `<p class="keyword mono">${esc(pepper)}</p><p class="material-note">Rule: insert it after the <strong>${position}${["st", "nd", "rd"][position - 1] || "th"}</strong> character of every password on the sheet. About ${Math.round(6 * Math.log2(set.length))} bits that never touch paper.</p>`,
        };
      }
      case "solitaire": {
        const suits = ["♣", "♦", "♥", "♠"];
        const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const deck = shuffle([...suits.flatMap((s) => ranks.map((r) => r + s)), "JkA", "JkB"]);
        if (dice) {
          return {
            title: "Your keyed deck",
            html: `<p>Riffle shuffle at least seven times, then write the deck's order down, top to bottom, on a sheet you keep with the ciphertext's twin - that order is the key.</p><p>${sheet("card-table")}</p>`,
          };
        }
        const rows = [];
        for (let i = 0; i < deck.length; i += 9) rows.push(deck.slice(i, i + 9).join("  "));
        return {
          title: "Your keyed deck order - top to bottom",
          html: `<pre class="digits">${esc(rows.join("\n"))}</pre><p class="material-note">Arrange a real deck in exactly this order before encrypting or decrypting. About 237 bits, and every one of them is in the deck.</p>`,
        };
      }
      case "caesar-shift": {
        const shift = 1 + randomInt(25);
        return { title: "Your shift", html: `<p class="keyword mono">${shift}</p><p class="material-note">Twenty-five possible keys. Included so the weakness is visible, not as a recommendation.</p>` };
      }
      default:
        return null;
    }
  }

  /* ---------------------------------------------------------------- render */

  function badge(method) {
    const security = window.SECURITY_CLASSES[method.security];
    return `<span class="badge badge-${esc(method.security)}" title="${esc(security.label)}">${esc(security.short)}</span>`;
  }

  function howTo(method) {
    const sheets = window.PRINTABLES.filter((sheet) => sheet.usedBy.includes(method.id));
    const decode = method.steps.decode.filter((step) => !/nothing to decode/i.test(step));
    return `
      <details class="howto">
        <summary>How to use it</summary>
        <div class="howto-body">
          <p class="tagline">${esc(method.tagline)}</p>
          <div class="two-col">
            <div><h4>What it stops</h4>${list(method.protects, "ul")}</div>
            <div><h4>What it does not stop</h4>${list(method.failsAgainst, "ul")}</div>
          </div>
          <h4>You will need</h4>
          ${list(method.materials, "ul")}
          <h4>Doing it</h4>
          ${list(method.steps.encode, "ol", "steps")}
          ${decode.length ? `<h4>Reading it back</h4>${list(decode, "ol", "steps")}` : ""}
          <h4>${esc(method.example.title)}</h4>
          <pre>${esc(method.example.lines.join("\n"))}</pre>
          <h4>Where people go wrong</h4>
          ${list(method.pitfalls, "ul")}
          ${sheets.length ? `<p class="sheets">Worksheets: ${sheets.map((s) => `<button type="button" class="link-button" data-sheet="${esc(s.id)}">${esc(s.name)}</button>`).join(" · ")}</p>` : ""}
        </div>
      </details>`;
  }

  function renderTools(o) {
    const hits = rankTools(o);
    const cards = hits
      .map((entry, index) => {
        const m = material(entry.method, o);
        return `
          <article class="hit">
            <div class="rank" aria-hidden="true">${index + 1}</div>
            <div class="hit-main">
              <div class="hit-head"><h3>${esc(entry.method.name)}</h3>${badge(entry.method)}</div>
              <p class="why">${esc(entry.pros[0] || entry.method.tagline)}</p>
              ${
                m
                  ? `<div class="material"><h4>${esc(m.title)}</h4>${m.html}${m.note ? `<p class="caveat">${esc(m.note)}</p>` : ""}</div>`
                  : `<p class="material-none">Nothing to generate - this one works with something you already own or already know.</p>`
              }
              ${howTo(entry.method)}
            </div>
          </article>`;
      })
      .join("");

    const notes = [];
    if (o.random === "no") notes.push("With no random key material, every one of these rests on a rule or keyword you keep in your head - and on your memory holding. Write the rule once, seal it, and lodge it somewhere separate.");
    if (o.random === "yes" && o.source === "device") notes.push("Generated on this device and shown once. Write it down or print it now; reload the page and it is gone for good.");
    if (o.complexity === "maximum") notes.push("Maximum puts the proven methods first regardless of convenience. Each one needs its key kept in a different building from the sheet it protects.");

    return `
      <section class="result-group">
        <div class="result-head"><p class="kicker">Encryption tools</p></div>
        <div class="hits" data-count="${hits.length}">${cards}</div>
        ${notes.length ? `<div class="notes">${notes.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
      </section>`;
  }

  function renderPasswords(o) {
    const items = Array.from({ length: 5 }, () => makePassword(o));
    const cards = items
      .map(
        (item, index) => `
        <article class="pw">
          <div class="rank" aria-hidden="true">${index + 1}</div>
          <div class="pw-main">
            <p class="pw-value">${esc(item.value)}</p>
            <p class="bits"><strong>About ${Math.round(item.bits)} bits</strong>, ${esc(grade(item.bits))} - ${esc(item.detail)}</p>
          </div>
        </article>`,
      )
      .join("");
    return `
      <section class="result-group">
        <div class="result-head">
          <p class="kicker">Passwords</p>
          <button type="button" class="button" id="mask-toggle" aria-pressed="false">Hide</button>
        </div>
        <div class="pws">${cards}</div>
        <div class="notes">
          <p>Pick one and write it down by hand. Do not copy it into a notes app, a message or the clipboard - that is the exact leak this page exists to avoid. 60 bits is plenty for an account; 80 or more for a master password or a seed.</p>
        </div>
      </section>`;
  }

  function renderPlaceholder() {
    $("#result-body").innerHTML = `
      <div class="placeholder">
        <p class="placeholder-title">Five results appear here.</p>
        <p class="placeholder-count">Choose what to make, set the options, then Generate.</p>
      </div>`;
  }

  function generate() {
    const tool = $("#make-tool").checked;
    const password = $("#make-password").checked;
    const note = $("#form-note");
    if (!tool && !password) {
      note.textContent = "Pick at least one thing to make.";
      renderPlaceholder();
      return;
    }
    note.textContent = "";
    const parts = [];
    if (tool) parts.push(renderTools(collect(TOOL_ROWS)));
    if (password) parts.push(renderPasswords(collect(PASSWORD_ROWS)));
    $("#result-body").innerHTML = `
      <div class="result-top">
        <p class="legend">
          <span class="badge badge-proven">Proven</span> unbreakable when the rules are followed ·
          <span class="badge badge-strong">Strong</span> needs a memorised rule or a second building ·
          <span class="badge badge-obfuscation">Obfuscation</span> stops a person, not an expert
        </p>
        <button type="button" class="button" id="print-result">Print</button>
      </div>
      ${parts.join("")}`;
    $("#result").scrollTop = 0;
    if (window.matchMedia("(max-width: 860px)").matches) $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ----------------------------------------------------------------- print */

  function printWith(mode) {
    document.body.dataset.print = mode;
    /* A closed <details> prints nothing, so open them all for the print and put them back after. */
    const closed = Array.from(document.querySelectorAll("#result details:not([open])"));
    for (const item of closed) item.open = true;
    const clear = () => {
      delete document.body.dataset.print;
      $("#print-sheet").hidden = true;
      for (const item of closed) item.open = false;
      window.removeEventListener("afterprint", clear);
    };
    window.addEventListener("afterprint", clear);
    window.print();
  }

  function printSheet(id) {
    const sheet = window.PRINTABLES.find((item) => item.id === id);
    if (!sheet) return;
    const holder = $("#print-sheet");
    holder.innerHTML = `<h2>${esc(sheet.name)}</h2><p class="sheet-blurb">${esc(sheet.blurb)}</p>${sheet.render()}`;
    holder.hidden = false;
    printWith("sheet");
  }

  /* ------------------------------------------------------------ onboarding */

  function openOnboarding() {
    const panel = $("#onboarding");
    panel.hidden = false;
    document.body.classList.add("has-dialog");
    $("#ob-start").focus();
  }

  function closeOnboarding() {
    $("#onboarding").hidden = true;
    document.body.classList.remove("has-dialog");
    $("#make-title").setAttribute("tabindex", "-1");
    $("#make-title").focus();
  }

  /* ------------------------------------------------------------------ boot */

  function renderBuildStamp() {
    const info = window.BUILD_INFO || {};
    const date = info.buildDate ? new Date(info.buildDate) : null;
    const stamp = date ? date.toISOString().slice(0, 10) : "unknown";
    $("#build-stamp").textContent = `Build ${info.buildNumber ?? "?"} · ${stamp} · ${info.commit ?? "unknown"}`;
  }

  function wireEvents() {
    $("#maker-form").addEventListener("change", syncMakers);
    $("#maker-form").addEventListener("submit", (event) => {
      event.preventDefault();
      generate();
    });
    $("#ob-start").addEventListener("click", closeOnboarding);
    $("#ob-open").addEventListener("click", openOnboarding);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#onboarding").hidden) closeOnboarding();
    });
    document.addEventListener("click", (event) => {
      const sheetButton = event.target.closest("[data-sheet]");
      if (sheetButton) {
        printSheet(sheetButton.dataset.sheet);
        return;
      }
      if (event.target.closest("#print-result")) {
        printWith("result");
        return;
      }
      const mask = event.target.closest("#mask-toggle");
      if (mask) {
        const on = $("#result").classList.toggle("masked");
        mask.textContent = on ? "Show" : "Hide";
        mask.setAttribute("aria-pressed", String(on));
      }
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Offline caching is a bonus, never a requirement. */
      });
    });
  }

  renderRows($("#tool-rows"), TOOL_ROWS);
  renderRows($("#password-rows"), PASSWORD_ROWS);
  syncMakers();
  renderPlaceholder();
  renderBuildStamp();
  wireEvents();
  registerServiceWorker();
  openOnboarding();
})();
