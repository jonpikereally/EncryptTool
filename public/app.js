/*
 * UI wiring. Deliberately dependency-free and deliberately inert: nothing here
 * reads a secret, generates one, stores anything or talks to the network.
 *
 * The page is six choices on the left and the result on the right. The result
 * appears as soon as every choice has an answer, and changes live after that.
 */
(function app() {
  "use strict";

  const $ = (selector, root) => (root || document).querySelector(selector);

  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

  const list = (items, tag, className) =>
    `<${tag} class="${className || ""}">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</${tag}>`;

  const numbers = (values) => values.map((n) => ({ value: String(n), label: String(n) }));

  /* ---------------------------------------------------------------- choices */

  /*
   * A choice is one numbered question. Most have one row of pills; the
   * password choice has three, with the length row swapping to a word-count
   * row when the password is a passphrase.
   */
  const CHOICES = [
    {
      prompt: "Where should the randomness come from?",
      rows: [
        {
          id: "random",
          options: [
            { value: "dice", label: "Dice" },
            { value: "cards", label: "Playing cards" },
            { value: "none", label: "None, I already have the password" },
          ],
        },
      ],
    },
    {
      prompt: "How many methods do you want to see?",
      rows: [{ id: "count", options: numbers([2, 3, 4, 5]) }],
    },
    {
      prompt: "How complex should the encryption be?",
      rows: [
        {
          id: "complexity",
          options: [
            { value: "simple", label: "Simple", hint: "minutes of pen work, little to remember" },
            { value: "balanced", label: "Balanced", hint: "some arithmetic, one thing to remember" },
            { value: "maximum", label: "Maximum", hint: "a ceremony, for a vault you rarely open" },
          ],
        },
      ],
    },
    {
      prompt: "How long, and which characters?",
      rows: [
        {
          id: "type",
          options: [
            { value: "letters", label: "Letters" },
            { value: "alnum", label: "Letters + digits" },
            { value: "full", label: "Letters, digits + symbols" },
            { value: "words", label: "Words" },
          ],
        },
        { id: "length", unit: "characters", options: numbers([8, 12, 16, 20, 24, 32]), when: (c) => c.type !== "words" },
        { id: "words", unit: "words", options: numbers([4, 5, 6, 7, 8]), when: (c) => c.type === "words" },
      ],
    },
    {
      prompt: "Who might find it?",
      rows: [
        {
          id: "threat",
          options: [
            { value: "none", label: "Nobody, just fire and forgetting" },
            { value: "casual", label: "Household or a burglar" },
            { value: "targeted", label: "Someone targeting me" },
          ],
        },
      ],
    },
    {
      prompt: "Can a second sheet live in another building?",
      rows: [
        {
          id: "separate",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No, one place only" },
          ],
        },
      ],
    },
  ];

  const ROWS = CHOICES.flatMap((choice) => choice.rows);

  function renderChoices() {
    $("#choices-form").innerHTML = CHOICES.map((choice, index) => {
      const rows = choice.rows
        .map((row) => {
          const pills = row.options
            .map((option) => {
              const id = `${row.id}-${option.value}`;
              return `
                <input class="pill-input" type="radio" name="${esc(row.id)}" id="${esc(id)}" value="${esc(option.value)}" />
                <label class="pill" for="${esc(id)}"${option.hint ? ` title="${esc(option.hint)}"` : ""}>${esc(option.label)}</label>`;
            })
            .join("");
          const unit = row.unit ? `<span class="row-unit">${esc(row.unit)}</span>` : "";
          return `<div class="row" data-row="${esc(row.id)}"><div class="pills">${pills}</div>${unit}</div>`;
        })
        .join("");

      return `
        <fieldset class="choice">
          <legend><span class="choice-num">${index + 1}</span>${esc(choice.prompt)}</legend>
          ${rows}
        </fieldset>`;
    }).join("");
  }

  function collect() {
    const form = $("#choices-form");
    const choices = {};
    for (const row of ROWS) {
      const checked = form.querySelector(`input[name="${row.id}"]:checked`);
      if (checked) choices[row.id] = checked.value;
    }
    return choices;
  }

  const rowIsActive = (row, choices) => !row.when || row.when(choices);

  /* ----------------------------------------------------------- translation */

  /*
   * The scoring engine in recommend.js speaks the older eight-question
   * vocabulary. Six choices map onto it like this.
   */
  const COMPLEXITY = {
    simple: { retrieval: "often", effort: "seconds", memory: "short" },
    balanced: { retrieval: "sometimes", effort: "minutes", memory: "short" },
    maximum: { retrieval: "rarely", effort: "hour", memory: "strong" },
  };
  const THREAT = { none: "none", casual: "burglar", targeted: "targeted" };
  const MATERIALS = { dice: ["dice", "printer"], cards: ["cards", "printer"], none: ["printer"] };

  function answersFrom(c) {
    return {
      secret: c.type === "words" ? "master" : "few",
      threat: THREAT[c.threat],
      ...COMPLEXITY[c.complexity],
      separate: c.separate,
      heirs: "no",
      materials: MATERIALS[c.random],
    };
  }

  /* --------------------------------------------------------------- generate */

  const BITS = { word: Math.log2(7776), gridChar: Math.log2(36), gridLetter: Math.log2(26), card: Math.log2(52) };

  function grade(bits) {
    if (bits >= 80) return "very strong";
    if (bits >= 60) return "strong";
    if (bits >= 45) return "adequate";
    return "weak";
  }

  /** The generate step, sized to the password the user asked for. */
  function generatePlan(c) {
    if (c.random === "none") return null;
    const words = c.type === "words";
    const n = Number(words ? c.words : c.length);
    let id;
    let recipe;
    let bits;
    let caveat = "";

    if (c.random === "dice" && words) {
      id = "dice-passphrase";
      recipe = `Roll five dice ${n} times and take one word per roll from the printed word list.`;
      bits = n * BITS.word;
    } else if (c.random === "dice") {
      id = "dice-charset";
      if (c.type === "letters") {
        recipe = `Roll two dice ${n} times and read each pair off the character grid, rolling again whenever you land on a digit.`;
        bits = n * BITS.gridLetter;
      } else {
        recipe = `Roll two dice ${n} times and read each pair off the character grid.`;
        bits = n * BITS.gridChar;
      }
      if (c.type === "full") {
        caveat = "The grid has no symbols. Add one or two by a fixed rule of your own, and do not count them towards strength.";
      }
    } else if (words) {
      id = "card-shuffle";
      recipe = `A deck deals letters, not words. Deal ${n * 5} cards from the card table and write them in ${n} blocks of five, or pick dice for a real word list.`;
      bits = n * 5 * BITS.card;
    } else {
      id = "card-shuffle";
      recipe = `Riffle shuffle at least seven times, then deal ${n} cards and take one letter each from the card table.`;
      bits = n * BITS.card;
      if (c.type !== "letters") {
        caveat = "The card table gives letters only. Add digits and symbols by a fixed rule of your own, and do not count them towards strength.";
      }
    }

    return { method: window.METHODS.find((method) => method.id === id), recipe, bits: Math.round(bits), caveat };
  }

  /* ---------------------------------------------------------------- render */

  function howTo(method) {
    const sheet = method.printable ? window.PRINTABLES.find((item) => item.id === method.printable) : null;
    const decode = method.steps.decode.filter((step) => !/nothing to decode/i.test(step));
    return `
      <details class="howto">
        <summary>How to do it</summary>
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
          ${sheet ? `<p><button type="button" class="link-button" data-sheet="${esc(sheet.id)}">Print the ${esc(sheet.name.toLowerCase())}</button></p>` : ""}
        </div>
      </details>`;
  }

  function badge(method) {
    const security = window.SECURITY_CLASSES[method.security];
    return `<span class="badge badge-${esc(method.security)}" title="${esc(security.label)}">${esc(security.short)}</span>`;
  }

  function renderPlaceholder(answered, total) {
    $("#result-body").innerHTML = `
      <div class="placeholder">
        <p class="placeholder-title">Your methods appear here.</p>
        <p class="placeholder-count">${answered} of ${total} chosen</p>
      </div>`;
  }

  function renderResult(c) {
    const answers = answersFrom(c);
    const result = window.recommend(answers);
    const hits = result.ranked
      .filter((entry) => entry.method.stage === "encode" || entry.method.stage === "split")
      .slice(0, Number(c.count));
    const gen = generatePlan(c);

    const notes = [];
    if (c.separate === "no") {
      notes.push("With one location only, the provably unbreakable methods are off the table: they all keep a key in another building.");
    }
    if (c.threat === "targeted" && hits.some((entry) => entry.method.security === "obfuscation")) {
      notes.push("Against a skilled adversary only the Proven methods hold. The rest are ranked for completeness, not endorsement.");
    }

    const genHtml = gen
      ? `
        <section class="gen">
          <p class="kicker">First, make it</p>
          <div class="hit-head"><h3>${esc(gen.method.name)}</h3>${badge(gen.method)}</div>
          <p class="recipe">${esc(gen.recipe)}</p>
          <p class="bits"><strong>About ${gen.bits} bits</strong>, ${esc(grade(gen.bits))}.</p>
          ${gen.caveat ? `<p class="caveat">${esc(gen.caveat)}</p>` : ""}
          ${howTo(gen.method)}
        </section>`
      : "";

    const hitsHtml = hits
      .map(
        (entry, index) => `
        <article class="hit">
          <div class="rank" aria-hidden="true">${index + 1}</div>
          <div class="hit-main">
            <div class="hit-head"><h3>${esc(entry.method.name)}</h3>${badge(entry.method)}</div>
            <p class="why">${esc(entry.pros[0] || entry.cons[0] || "")}</p>
            ${howTo(entry.method)}
          </div>
        </article>`,
      )
      .join("");

    $("#result-body").innerHTML = `
      <div class="result-head">
        <p class="kicker">${gen ? "Then, hide it" : "Hide it"}</p>
        <button type="button" class="button" id="print-result">Print</button>
      </div>
      ${genHtml}
      <div class="hits" data-count="${hits.length}">${hitsHtml}</div>
      ${notes.length ? `<div class="notes">${notes.map((note) => `<p>${esc(note)}</p>`).join("")}</div>` : ""}
      <p class="legend">
        <span class="badge badge-proven">Proven</span> unbreakable when the rules are followed ·
        <span class="badge badge-strong">Strong</span> needs a memorised rule or a second building ·
        <span class="badge badge-obfuscation">Obfuscation</span> stops a person, not an expert ·
        60 bits is plenty for an account, 80 or more for a master password
      </p>`;
  }

  function update() {
    const choices = collect();
    let total = 0;
    let answered = 0;
    for (const row of ROWS) {
      const active = rowIsActive(row, choices);
      const wrapper = document.querySelector(`.row[data-row="${row.id}"]`);
      if (wrapper) wrapper.hidden = !active;
      if (!active) continue;
      total += 1;
      if (choices[row.id]) answered += 1;
    }
    if (answered < total) {
      renderPlaceholder(answered, total);
      return;
    }
    renderResult(choices);
  }

  /* ----------------------------------------------------------------- print */

  function printWith(mode) {
    document.body.dataset.print = mode;
    const clear = () => {
      delete document.body.dataset.print;
      $("#print-sheet").hidden = true;
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

  /* ------------------------------------------------------------------ boot */

  function renderBuildStamp() {
    const info = window.BUILD_INFO || {};
    const date = info.buildDate ? new Date(info.buildDate) : null;
    const stamp = date ? date.toISOString().slice(0, 10) : "unknown";
    $("#build-stamp").textContent = `Build ${info.buildNumber ?? "?"} · ${stamp} · ${info.commit ?? "unknown"}`;
  }

  function wireEvents() {
    $("#choices-form").addEventListener("change", update);
    document.addEventListener("click", (event) => {
      const sheetButton = event.target.closest("[data-sheet]");
      if (sheetButton) {
        printSheet(sheetButton.dataset.sheet);
        return;
      }
      if (event.target.closest("#print-result")) printWith("result");
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

  renderChoices();
  update();
  renderBuildStamp();
  wireEvents();
  registerServiceWorker();
})();
