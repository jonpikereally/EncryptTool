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

  /*
   * Every option is a dropdown. `options` may be a function of the current
   * values, for rows whose choices depend on another row; `when` hides a row.
   */
  const withUnit = (values, unit) => values.map((n) => ({ value: String(n), label: `${n} ${unit}` }));
  const CHAR_LENGTHS = [8, 12, 16, 20, 24, 32];
  const WORD_LENGTHS = [4, 5, 6, 7, 8];

  const TOOL_ROWS = [
    {
      id: "scope",
      label: "Encrypt",
      options: [
        { value: "one", label: "One password" },
        { value: "many", label: "Many passwords with one key" },
      ],
      initial: "one",
    },
    {
      id: "complexity",
      label: "How complicated",
      options: [
        { value: "simple", label: "Simple - seconds to use, one thing to remember" },
        { value: "balanced", label: "Balanced - a few minutes of pen work" },
        { value: "maximum", label: "Maximum - a ceremony, for a vault you rarely open" },
      ],
      initial: "balanced",
    },
    {
      id: "chars",
      label: "Password contains",
      options: [
        { value: "letters", label: "Letters" },
        { value: "alnum", label: "Letters and digits" },
        { value: "full", label: "Letters, digits and symbols" },
        { value: "words", label: "Words" },
      ],
      initial: "alnum",
    },
    {
      id: "length",
      label: "Password length",
      options: (o) => (o.chars === "words" ? withUnit(WORD_LENGTHS, "words") : withUnit(CHAR_LENGTHS, "characters")),
      initial: (o) => (o.chars === "words" ? "6" : "16"),
    },
    {
      id: "random",
      label: "Randomness",
      options: [
        { value: "device", label: "Made for me on this device" },
        { value: "dice", label: "I'll roll dice - give me blank sheets" },
        { value: "none", label: "None - only rules I keep in my head" },
      ],
      initial: "device",
    },
  ];

  const PASSWORD_ROWS = [
    {
      id: "ptype",
      label: "Kind",
      options: [
        { value: "words", label: "Passphrase - words" },
        { value: "chars", label: "Characters" },
      ],
      initial: "words",
    },
    {
      id: "plength",
      label: "Length",
      options: (o) => (o.ptype === "words" ? withUnit(WORD_LENGTHS, "words") : withUnit(CHAR_LENGTHS, "characters")),
      initial: (o) => (o.ptype === "words" ? "6" : "16"),
    },
    {
      id: "pchars",
      label: "Characters",
      options: [
        { value: "letters", label: "Letters" },
        { value: "alnum", label: "Letters and digits" },
        { value: "full", label: "Letters, digits and symbols" },
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
        { value: "", label: "Nothing - capitalise each word" },
      ],
      initial: "-",
      when: (o) => o.ptype === "words",
    },
    {
      id: "pstrict",
      label: "Picky sites",
      options: [
        { value: "no", label: "Don't mind" },
        { value: "yes", label: "Guarantee a capital, a digit and a symbol" },
      ],
      initial: "no",
    },
  ];

  const resolve = (value, o) => (typeof value === "function" ? value(o) : value);

  function optionsHtml(row, o, selected) {
    return resolve(row.options, o)
      .map((option) => `<option value="${esc(option.value)}"${option.value === selected ? " selected" : ""}>${esc(option.label)}</option>`)
      .join("");
  }

  function renderRows(container, rows) {
    const o = {};
    for (const row of rows) o[row.id] = resolve(row.initial, o);
    container.innerHTML = rows
      .map(
        (row) => `
          <div class="row" data-row="${esc(row.id)}">
            <label for="opt-${esc(row.id)}">${esc(row.label)}</label>
            <select class="select" id="opt-${esc(row.id)}" name="${esc(row.id)}">${optionsHtml(row, o, o[row.id])}</select>
          </div>`,
      )
      .join("");
  }

  function collect(rows) {
    const values = {};
    for (const row of rows) {
      const select = document.querySelector(`select[name="${row.id}"]`);
      if (select) values[row.id] = select.value;
    }
    return values;
  }

  /** Hide rows whose `when` fails and rebuild the option lists that depend on other rows. */
  function syncRows(rows) {
    const o = collect(rows);
    for (const row of rows) {
      const wrapper = document.querySelector(`.row[data-row="${row.id}"]`);
      const select = wrapper && wrapper.querySelector("select");
      if (!wrapper || !select) continue;
      wrapper.hidden = row.when ? !row.when(o) : false;
      if (typeof row.options !== "function") continue;
      const wanted = row.options(o).map((option) => option.value).join("|");
      const current = Array.from(select.options).map((option) => option.value).join("|");
      if (wanted === current) continue;
      /* The list itself changed (words vs characters), so a carried-over number would mean something else. */
      const keep = resolve(row.initial, o);
      select.innerHTML = optionsHtml(row, o, keep);
      o[row.id] = keep;
    }
  }

  function syncMakers() {
    const make = $("#make").value;
    $("#tool-options").hidden = make === "password";
    $("#password-options").hidden = make === "tool";
    syncRows(TOOL_ROWS);
    syncRows(PASSWORD_ROWS);
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

    const n = Number(o.plength);
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
  /* Schemes whose key must never be used twice - out when one key covers many passwords. */
  const ONE_TIME = new Set(["otp-digits", "two-share-split", "shamir-2of3", "split-by-meaning", "solitaire"]);
  const LETTERS_ONLY = new Set(["playfair"]);
  const COMPLEXITY = {
    simple: { retrieval: "often", effort: "seconds", memory: "short", threat: "casual" },
    balanced: { retrieval: "sometimes", effort: "minutes", memory: "short", threat: "burglar" },
    maximum: { retrieval: "rarely", effort: "hour", memory: "strong", threat: "targeted" },
  };
  const TIER = { proven: 0, strong: 1, obfuscation: 2, operational: 3 };

  function rankTools(o) {
    const answers = {
      secret: o.scope === "many" ? "few" : o.chars === "words" ? "master" : "few",
      ...COMPLEXITY[o.complexity],
      separate: o.random === "yes" ? "yes" : "no",
      heirs: "no",
      materials: o.random === "yes" ? ["dice", "printer"] : ["printer"],
    };
    let ranked = window
      .recommend(answers)
      .ranked.filter((entry) => entry.method.stage === "encode" || entry.method.stage === "split")
      .filter((entry) => o.random === "yes" || !NEEDS_RANDOM.has(entry.method.id))
      .filter((entry) => o.scope !== "many" || !ONE_TIME.has(entry.method.id))
      .filter((entry) => o.chars === "letters" || o.chars === "words" || !LETTERS_ONLY.has(entry.method.id));
    if (o.complexity === "maximum") {
      /* "Maximum" means maximum strength, so a proven method never sits below an obfuscation one. */
      ranked = ranked.slice().sort((a, b) => TIER[a.method.security] - TIER[b.method.security] || b.score - a.score);
    }
    return ranked.slice(0, 5);
  }

  /** How many characters the key material has to cover. */
  const coverage = (o) => (o.chars === "words" ? Number(o.length) * 8 : Number(o.length));

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
            html: `<p>Roll <strong>${count} digits</strong> with two dice and the digit table, and write them on the pad worksheet. That covers a password of up to ${n} characters.</p><p class="sheets">${sheet("dice-digits")} · ${sheet("pad-sheet")} · ${sheet("code-table")}</p>`,
          };
        }
        const digits = randomDigits(count);
        return {
          title: `${label} - ${count} digits, covers up to ${n} characters`,
          html: `<pre class="digits">${digitsBlock(digits)}</pre><p class="material-note">Check digit ${checkDigit(digits)}. Write it after a slash so you can spot a copying slip later.</p><p class="sheets">${sheet("code-table")} · ${sheet("pad-sheet")}</p>`,
          note: "Use each pad exactly once. Keep it in a different building from the ciphertext.",
        };
      }
      case "shamir-2of3": {
        if (dice) {
          return {
            title: "Your random k values",
            html: `<p>Roll <strong>${n} numbers from 00 to 96</strong> - two digits each, roll again on 97 to 99 - one per character, and write them in the k column of the worksheet.</p><p class="sheets">${sheet("dice-digits")} · ${sheet("shamir-sheet")} · ${sheet("code-table")}</p>`,
          };
        }
        const ks = Array.from({ length: n }, () => String(randomInt(97)).padStart(2, "0"));
        return {
          title: `Your random k values - one per character, ${n} of them`,
          html: `<pre class="digits">${digitsBlock(ks.join(""))}</pre><p class="material-note">Read them in pairs, left to right. A fresh k for every character is what makes the split hold.</p><p class="sheets">${sheet("shamir-sheet")} · ${sheet("code-table")}</p>`,
        };
      }
      case "grid-lookup": {
        if (dice) {
          return {
            title: "Your card",
            html: `<p>Fill every cell of the blank card with dice and the character grid - about twenty minutes, once.</p><p class="sheets">${sheet("blank-grid")} · ${sheet("dice-grid")}</p>`,
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
          html: `<p class="keyword">${esc(ws.join(" "))}</p><p class="material-note">Used as <span class="mono">${esc(keyword)}</span>, ${keyword.length} letters, about ${keyBits(keyword, 3)} bits. Three real words are far easier to keep in your head than random letters, and just as good here.</p><p class="sheets">${sheet("tabula-recta")}</p>`,
          note: o.scope === "many" ? "One keyword over many passwords is the classic way this cipher gets broken. Fine for the accounts that do not matter; not for the ones that do." : "",
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
            html: `<p>Riffle shuffle at least seven times, then write the deck's order down, top to bottom, on a sheet you keep with the ciphertext's twin - that order is the key.</p><p class="sheets">${sheet("card-table")}</p>`,
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
              <div class="hit-foot">
                ${howTo(entry.method)}
                <button type="button" class="link-button print-one" data-print-one>Print this one</button>
              </div>
            </div>
          </article>`;
      })
      .join("");

    const notes = [];
    if (o.scope === "many") notes.push("One key across many passwords: anyone who learns one of the passwords can start working on the key, so the one-time methods are left out. The card and the pepper are built for exactly this; the classical ciphers are for the accounts that do not matter much.");
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
        <p class="print-only charmap">Reading these back: <strong>0</strong> zero, <strong>O</strong> letter O, <strong>1</strong> one, <strong>l</strong> lower-case L, <strong>I</strong> upper-case i.</p>
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
    const make = $("#make").value;
    const parts = [];
    if (make !== "password") {
      const o = collect(TOOL_ROWS);
      /* The engine and the material renderer speak in random yes/no plus a source. */
      o.source = o.random;
      o.random = o.random === "none" ? "no" : "yes";
      parts.push(renderTools(o));
    }
    if (make !== "tool") parts.push(renderPasswords(collect(PASSWORD_ROWS)));
    const now = new Date();
    const stamped = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const info = window.BUILD_INFO || {};

    $("#result-body").innerHTML = `
      <header class="print-head print-only">
        <div class="print-head-row">
          <p class="print-brand">EncryptYourLife</p>
          <p class="print-meta">${esc(stamped)} · build ${esc(String(info.buildNumber ?? "?"))} · ${esc(location.host)}</p>
        </div>
        <p class="print-warn">This sheet may carry key material. Store it as each method says, keep it away from what it protects, and never photograph it or type it into a computer.</p>
      </header>
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
      for (const el of document.querySelectorAll(".print-target, .has-target")) el.classList.remove("print-target", "has-target");
      window.removeEventListener("afterprint", clear);
    };
    window.addEventListener("afterprint", clear);
    window.print();
  }

  /** Print one result card on its own, rather than the whole page of five. */
  function printOne(card) {
    card.classList.add("print-target");
    const group = card.closest(".result-group");
    if (group) group.classList.add("has-target");
    printWith("one");
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
    $("#make").addEventListener("change", renderPlaceholder);
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
      const one = event.target.closest("[data-print-one]");
      if (one) {
        printOne(one.closest(".hit"));
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
