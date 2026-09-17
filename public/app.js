/*
 * UI wiring. Deliberately dependency-free and deliberately inert: nothing here
 * reads a secret, generates one, stores anything or talks to the network.
 */
(function app() {
  "use strict";

  const $ = (selector, root) => (root || document).querySelector(selector);

  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

  const list = (items, className) =>
    `<ul class="${className || ""}">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;

  let answers = {};
  let lastResult = null;

  /* ------------------------------------------------------------- questions */

  function renderQuestions() {
    const container = $("#questions");
    container.innerHTML = window.QUESTIONS.map((question, index) => {
      const type = question.multi ? "checkbox" : "radio";
      const options = question.options
        .map((option, optionIndex) => {
          const id = `${question.id}-${option.value}`;
          return `
            <div class="option">
              <input type="${type}" name="${esc(question.id)}" id="${esc(id)}" value="${esc(option.value)}"
                ${!question.multi && optionIndex === -1 ? "checked" : ""} />
              <label for="${esc(id)}">
                <span class="option-label">${esc(option.label)}</span>
                <span class="option-detail">${esc(option.detail)}</span>
              </label>
            </div>`;
        })
        .join("");

      return `
        <fieldset class="question" data-question="${esc(question.id)}">
          <legend><span class="question-number">${index + 1}</span> ${esc(question.prompt)}</legend>
          <p class="question-help">${esc(question.help)}</p>
          <div class="options">${options}</div>
        </fieldset>`;
    }).join("");
  }

  function collectAnswers() {
    const form = $("#question-form");
    const collected = {};
    for (const question of window.QUESTIONS) {
      const checked = Array.from(form.querySelectorAll(`input[name="${question.id}"]:checked`)).map((input) => input.value);
      if (checked.length === 0) continue;
      collected[question.id] = question.multi ? checked : checked[0];
    }
    return collected;
  }

  function missingQuestions(collected) {
    return window.QUESTIONS.filter((question) => !collected[question.id]);
  }

  /* --------------------------------------------------------------- ratings */

  const RATING_LABELS = {
    effort: { name: "Effort to set up", low: "easy", high: "demanding" },
    speed: { name: "Speed to retrieve", low: "slow", high: "instant" },
    errorRisk: { name: "Risk of a costly slip", low: "low", high: "high" },
    memoryLoad: { name: "Held in your head", low: "nothing", high: "a lot" },
  };

  function ratingBar(key, value) {
    const meta = RATING_LABELS[key];
    const pips = Array.from({ length: 5 }, (_, index) => `<span class="pip${index < value ? " on" : ""}"></span>`).join("");
    const caption = value <= 2 ? meta.low : value >= 4 ? meta.high : "moderate";
    return `
      <div class="rating">
        <span class="rating-name">${esc(meta.name)}</span>
        <span class="pips" role="img" aria-label="${esc(`${meta.name}: ${value} out of 5, ${caption}`)}">${pips}</span>
        <span class="rating-caption">${esc(caption)}</span>
      </div>`;
  }

  /* ---------------------------------------------------------- method cards */

  function methodCard(method, scored, options) {
    const opts = options || {};
    const security = window.SECURITY_CLASSES[method.security];
    const stage = window.STAGES.find((item) => item.id === method.stage);
    const printable = method.printable ? window.PRINTABLES.find((sheet) => sheet.id === method.printable) : null;
    const pairs = (method.pairsWith || [])
      .map((id) => window.METHODS.find((item) => item.id === id))
      .filter(Boolean);

    const fit =
      scored && typeof scored.score === "number"
        ? `<p class="fit"><span class="fit-score">${scored.score}</span><span class="fit-label">fit for your answers</span></p>`
        : "";

    const reasons =
      scored && (scored.pros.length || scored.cons.length)
        ? `
        <div class="reasons">
          ${scored.pros.length ? `<div class="reason-block good"><h5>Why it suits you</h5>${list(scored.pros)}</div>` : ""}
          ${scored.cons.length ? `<div class="reason-block bad"><h5>Where it works against you</h5>${list(scored.cons)}</div>` : ""}
        </div>`
        : "";

    return `
      <article class="method" id="method-${esc(method.id)}" data-stage="${esc(method.stage)}" data-security="${esc(method.security)}">
        <header class="method-head">
          <div class="method-title">
            <p class="method-stage">${esc(stage ? stage.name : "")}</p>
            <h3>${esc(method.name)}</h3>
            <p class="tagline">${esc(method.tagline)}</p>
          </div>
          ${fit}
        </header>
        <p class="security security-${esc(method.security)}">
          <strong>${esc(security.label)}.</strong> ${esc(security.blurb)}
        </p>
        ${reasons}
        <div class="ratings">${Object.keys(RATING_LABELS).map((key) => ratingBar(key, method.ratings[key])).join("")}</div>
        <details class="method-detail"${opts.open ? " open" : ""}>
          <summary>How to do it, and what it costs you</summary>
          <div class="detail-body">
            <div class="two-col">
              <div>
                <h4>What it stops</h4>
                ${list(method.protects)}
              </div>
              <div>
                <h4>What it does not stop</h4>
                ${list(method.failsAgainst)}
              </div>
            </div>
            <h4>You will need</h4>
            ${list(method.materials, "materials")}
            <h4>Doing it</h4>
            <ol class="steps">${method.steps.encode.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
            <h4>Reading it back</h4>
            <ol class="steps">${method.steps.decode.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
            <div class="worked-example">
              <h4>${esc(method.example.title)}</h4>
              <pre>${esc(method.example.lines.join("\n"))}</pre>
            </div>
            <h4>Where people go wrong</h4>
            ${list(method.pitfalls, "pitfalls")}
            ${
              printable
                ? `<p class="detail-link"><a href="#printables" data-printable="${esc(printable.id)}">Print the ${esc(printable.name.toLowerCase())} for this method</a></p>`
                : ""
            }
            ${
              pairs.length
                ? `<p class="detail-link">Pairs well with: ${pairs
                    .map((item) => `<a href="#method-${esc(item.id)}">${esc(item.name)}</a>`)
                    .join(", ")}</p>`
                : ""
            }
          </div>
        </details>
      </article>`;
  }

  /* ---------------------------------------------------------------- results */

  function renderResults(result) {
    const section = $("#results");
    const warnings = $("#warnings");
    const plan = $("#plan");

    warnings.innerHTML = result.warnings.length
      ? `<div class="warnings"><h3>Read these first</h3>${result.warnings.map((text) => `<p>${esc(text)}</p>`).join("")}</div>`
      : "";

    plan.innerHTML = result.plan
      .map((item) => {
        if (item.note) {
          return `
            <li class="plan-step skipped">
              <div class="plan-stage"><span class="stage-name">${esc(item.stage.name)}</span><span class="stage-verb">${esc(item.stage.verb)}</span></div>
              <div class="plan-body"><p class="plan-note">${esc(item.note)}</p></div>
            </li>`;
        }
        const runners = item.runnersUp.length
          ? `<p class="runners">Also worth a look: ${item.runnersUp
              .map((entry) => `<a href="#method-${esc(entry.method.id)}">${esc(entry.method.name)}</a> (${entry.score})`)
              .join(", ")}</p>`
          : "";
        return `
          <li class="plan-step">
            <div class="plan-stage"><span class="stage-name">${esc(item.stage.name)}</span><span class="stage-verb">${esc(item.stage.verb)}</span></div>
            <div class="plan-body">
              <p class="stage-blurb">${esc(item.stage.blurb)}</p>
              ${methodCard(item.entry.method, item.entry, { open: true })}
              ${runners}
            </div>
          </li>`;
      })
      .join("");

    if (result.avoid.length) {
      plan.insertAdjacentHTML(
        "beforeend",
        `<li class="plan-step avoid">
          <div class="plan-stage"><span class="stage-name">Avoid</span><span class="stage-verb">Not for you</span></div>
          <div class="plan-body">
            <p class="stage-blurb">These scored badly against your answers. They are not bad methods in general - they are wrong for this job.</p>
            ${list(result.avoid.map((entry) => `${entry.method.name} - ${entry.cons[0] || "poor fit for your answers"}`))}
          </div>
        </li>`,
      );
    }

    section.hidden = false;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* -------------------------------------------------------------- catalogue */

  function renderCatalogue() {
    const stageFilter = $("#filter-stage").value;
    const securityFilter = $("#filter-security").value;
    const sort = $("#sort-order").value;

    const scoreById = {};
    if (lastResult) for (const entry of lastResult.ranked) scoreById[entry.method.id] = entry;

    const securityOrder = ["proven", "strong", "obfuscation", "operational"];
    const stageOrder = window.STAGES.map((stage) => stage.id);

    let methods = window.METHODS.slice();
    if (stageFilter !== "all") methods = methods.filter((method) => method.stage === stageFilter);
    if (securityFilter !== "all") methods = methods.filter((method) => method.security === securityFilter);

    methods.sort((a, b) => {
      if (sort === "fit" && lastResult) {
        return (scoreById[b.id]?.score ?? 0) - (scoreById[a.id]?.score ?? 0) || a.name.localeCompare(b.name);
      }
      if (sort === "security") {
        return securityOrder.indexOf(a.security) - securityOrder.indexOf(b.security) || a.name.localeCompare(b.name);
      }
      return stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage) || a.name.localeCompare(b.name);
    });

    $("#method-list").innerHTML = methods.length
      ? methods.map((method) => methodCard(method, scoreById[method.id])).join("")
      : '<p class="empty">Nothing matches that combination. Widen the filters.</p>';
  }

  function populateFilters() {
    const stageSelect = $("#filter-stage");
    for (const stage of window.STAGES) {
      const option = document.createElement("option");
      option.value = stage.id;
      option.textContent = `${stage.name} - ${stage.verb.toLowerCase()}`;
      stageSelect.append(option);
    }
    const securitySelect = $("#filter-security");
    for (const [key, value] of Object.entries(window.SECURITY_CLASSES)) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = value.label;
      securitySelect.append(option);
    }
  }

  /* -------------------------------------------------------------- printables */

  function renderPrintablePicker() {
    const picker = $(".printable-picker");
    picker.innerHTML = window.PRINTABLES.map(
      (sheet) => `
        <button type="button" class="chip" data-sheet="${esc(sheet.id)}" aria-pressed="false">
          <span class="chip-name">${esc(sheet.name)}</span>
          <span class="chip-blurb">${esc(sheet.blurb)}</span>
        </button>`,
    ).join("");
  }

  function showPrintable(id) {
    const sheet = window.PRINTABLES.find((item) => item.id === id);
    if (!sheet) return;

    for (const button of document.querySelectorAll(".printable-picker .chip")) {
      button.setAttribute("aria-pressed", String(button.dataset.sheet === id));
    }

    $("#printable-output").innerHTML = `
      <div class="sheet" id="sheet-${esc(sheet.id)}">
        <div class="sheet-head no-print">
          <h3>${esc(sheet.name)}</h3>
          <button type="button" class="button" data-print-sheet>Print this sheet</button>
        </div>
        <h3 class="print-only">${esc(sheet.name)}</h3>
        <p class="sheet-blurb">${esc(sheet.blurb)}</p>
        ${sheet.render()}
      </div>`;
  }

  /* ------------------------------------------------------------------ print */

  function printWith(mode) {
    document.body.dataset.print = mode;
    const clear = () => {
      delete document.body.dataset.print;
      window.removeEventListener("afterprint", clear);
    };
    window.addEventListener("afterprint", clear);
    window.print();
  }

  /* ------------------------------------------------------------------- boot */

  function renderBuildStamp() {
    const info = window.BUILD_INFO || {};
    const date = info.buildDate ? new Date(info.buildDate) : null;
    const stamp = date
      ? `${date.toISOString().slice(0, 10)} at ${date.toISOString().slice(11, 16)} UTC`
      : "unknown";
    $("#build-stamp").textContent = `Build ${info.buildNumber ?? "?"} - ${stamp} - ${info.commit ?? "unknown"}`;
  }

  function wireEvents() {
    $("#question-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const collected = collectAnswers();
      const missing = missingQuestions(collected);
      const note = $("#form-note");

      if (missing.length) {
        note.textContent = `Still to answer: ${missing.map((question) => question.prompt).join(" ")}`;
        note.classList.add("error");
        const first = document.querySelector(`fieldset[data-question="${missing[0].id}"] input`);
        if (first) first.focus();
        return;
      }

      note.textContent = "";
      note.classList.remove("error");
      answers = collected;
      lastResult = window.recommend(answers);
      renderResults(lastResult);
      $("#sort-order").value = "fit";
      renderCatalogue();
    });

    $("#reset-button").addEventListener("click", () => {
      $("#question-form").reset();
      answers = {};
      lastResult = null;
      $("#results").hidden = true;
      $("#form-note").textContent = "";
      $("#sort-order").value = "stage";
      renderCatalogue();
      $("#advisor").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("#print-plan").addEventListener("click", () => printWith("plan"));

    for (const select of ["#filter-stage", "#filter-security", "#sort-order"]) {
      $(select).addEventListener("change", renderCatalogue);
    }

    document.addEventListener("click", (event) => {
      const chip = event.target.closest(".printable-picker .chip");
      if (chip) {
        showPrintable(chip.dataset.sheet);
        return;
      }
      if (event.target.closest("[data-print-sheet]")) {
        printWith("sheet");
        return;
      }
      const link = event.target.closest("a[data-printable]");
      if (link) {
        showPrintable(link.dataset.printable);
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

  renderQuestions();
  populateFilters();
  renderCatalogue();
  renderPrintablePicker();
  showPrintable(window.PRINTABLES[0].id);
  renderBuildStamp();
  wireEvents();
  registerServiceWorker();
})();
