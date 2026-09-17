/*
 * Printable worksheets.
 *
 * Everything in here is a lookup table or a blank form. None of it is secret,
 * none of it is generated from your secret, and nothing you fill in ever comes
 * back to this page - you fill these in with a pen.
 */

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** ASCII 32-126 as code 00-94, which is what the pad and split methods use. */
function characterCodes() {
  const rows = [];
  for (let code = 0; code <= 94; code += 1) {
    const char = String.fromCharCode(code + 32);
    rows.push({ code: String(code).padStart(2, "0"), char: char === " " ? "space" : char });
  }
  return rows;
}

function gridTable(caption, headers, rows, className) {
  const head = headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell, index) => (index === 0 ? `<th scope="row">${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`)).join("")}</tr>`)
    .join("");
  return `<table class="sheet-table ${className || ""}"><caption>${escapeHtml(caption)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

window.PRINTABLES = [
  {
    id: "code-table",
    name: "Character code table",
    blurb:
      "Turns any keyboard character into two digits, and back again. Needed by the one-time pad, the two-of-two split and the two-of-three split.",
    usedBy: ["otp-digits", "two-share-split", "shamir-2of3"],
    render() {
      const codes = characterCodes();
      const columns = 5;
      const perColumn = Math.ceil(codes.length / columns);
      let html = '<div class="code-columns">';
      for (let column = 0; column < columns; column += 1) {
        const slice = codes.slice(column * perColumn, (column + 1) * perColumn);
        html += '<table class="sheet-table compact"><thead><tr><th scope="col">Code</th><th scope="col">Character</th></tr></thead><tbody>';
        for (const entry of slice) {
          html += `<tr><th scope="row">${entry.code}</th><td class="mono">${escapeHtml(entry.char)}</td></tr>`;
        }
        html += "</tbody></table>";
      }
      html += "</div>";
      html +=
        '<p class="sheet-note">Read a password left to right, writing the two-digit code under each character. To go back, read the digits in pairs. Codes 95 to 99 are unused and never appear in a correctly encoded secret.</p>';
      return html;
    },
  },
  {
    id: "dice-digits",
    name: "Two dice to one random digit",
    blurb:
      "An unbiased way to roll digits 0-9 with ordinary six-sided dice. Six of the thirty-six outcomes say roll again, and that is what keeps it fair.",
    usedBy: ["otp-digits", "two-share-split", "shamir-2of3"],
    render() {
      const rows = [];
      for (let row = 1; row <= 6; row += 1) {
        const cells = [String(row)];
        for (let column = 1; column <= 6; column += 1) {
          const index = (row - 1) * 6 + (column - 1);
          cells.push(index < 30 ? String(index % 10) : "roll again");
        }
        rows.push(cells);
      }
      return (
        gridTable("First die down the side, second die across the top", ["", "1", "2", "3", "4", "5", "6"], rows, "square") +
        '<p class="sheet-note">Decide once which die is which colour, and never swap them. For a random number from 0 to 96 - which the two-of-three split needs - roll two digits to make 00 to 99, and roll again if you get 97, 98 or 99.</p>'
      );
    },
  },
  {
    id: "dice-grid",
    name: "Two dice to one random character",
    blurb: "Thirty-six cells covering A-Z and 0-9, for passwords that have to be characters rather than words.",
    usedBy: ["dice-charset"],
    render() {
      const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
      const rows = [];
      for (let row = 1; row <= 6; row += 1) {
        const cells = [String(row)];
        for (let column = 1; column <= 6; column += 1) {
          cells.push(charset[(row - 1) * 6 + (column - 1)]);
        }
        rows.push(cells);
      }
      return (
        gridTable("Row die down the side, column die across the top", ["", "1", "2", "3", "4", "5", "6"], rows, "square") +
        '<p class="sheet-note">Every cell is equally likely, so each pair of rolls is worth 5.17 bits. Twelve characters is about 62 bits; sixteen is about 82. Write in block capitals and slash your zeros.</p>'
      );
    },
  },
  {
    id: "pad-sheet",
    name: "One-time pad worksheet",
    blurb: "Blank rows for the pad you roll, the secret you are hiding, and the sums. Fill it in with a pen, then separate the two halves.",
    usedBy: ["otp-digits", "two-share-split"],
    render() {
      const columns = 30;
      const header = ['<tr><th scope="col" class="row-label">Row</th>'];
      for (let index = 1; index <= columns; index += 1) header.push(`<th scope="col">${index}</th>`);
      header.push("</tr>");

      const labels = ["Secret (two digits per character)", "Pad (rolled with dice)", "Sum, no carrying - this is what you keep"];
      const body = labels
        .map(
          (label) =>
            `<tr><th scope="row" class="row-label">${escapeHtml(label)}</th>${'<td class="write-cell"></td>'.repeat(columns)}</tr>`,
        )
        .join("");

      const block = `<table class="sheet-table pad"><thead>${header.join("")}</thead><tbody>${body}</tbody></table>`;
      return (
        `${block}${block}` +
        '<p class="sheet-note">Two blocks of thirty columns cover a thirty-character password. Add each column and keep only the last digit: 8 + 7 is 5. To decrypt, subtract, and when the top digit is smaller add ten first. Cross out every pad row the moment you have used it, and never use one twice.</p>' +
        '<p class="sheet-note">Check character: add every digit of the sum row and keep the last digit of the total. Write it after a slash at the end of the row.</p>'
      );
    },
  },
  {
    id: "shamir-sheet",
    name: "Two-of-three split worksheet",
    blurb: "One row per character. Any two of the three shares rebuild the secret; any one share alone is nothing.",
    usedBy: ["shamir-2of3"],
    render() {
      const headers = ["#", "Character", "Code s (00-94)", "Random k (00-96)", "Share 1 = s+k", "Share 2 = share1+k", "Share 3 = share2+k", "Check"];
      const rows = [];
      for (let index = 1; index <= 20; index += 1) {
        rows.push([String(index), "", "", "", "", "", "", ""]);
      }
      return (
        gridTable("Work one character per row", headers, rows, "write") +
        '<p class="sheet-note">Every time a total reaches 97 or more, subtract 97. Use a fresh random k for every row - reusing one k across the secret destroys the scheme.</p>' +
        '<p class="sheet-note"><strong>Check column:</strong> share 1 + share 3 - share 2 should equal the code s. If it does not, redo that row before you go any further.</p>' +
        '<p class="sheet-note"><strong>Recovery.</strong> From shares 1 and 2: s = share1 + share1 - share2. From shares 2 and 3: s = share2 + share2 + share2 - share3 - share3. From shares 1 and 3: take share3 - share1, add 97 if the result is odd, halve it to get k, then s = share1 - k. After every step, add or subtract 97 until the answer is between 0 and 96.</p>'
      );
    },
  },
  {
    id: "tabula-recta",
    name: "Tabula recta",
    blurb: "The 26 by 26 letter square the Vigenere cipher is worked on. Plaintext down the side, key across the top.",
    usedBy: ["vigenere"],
    render() {
      const rows = LETTERS.map((letter, rowIndex) => [
        letter,
        ...LETTERS.map((_, columnIndex) => LETTERS[(rowIndex + columnIndex) % 26]),
      ]);
      return (
        gridTable("Plaintext letter down the side, key letter across the top", ["", ...LETTERS], rows, "tiny") +
        '<p class="sheet-note">To encrypt, find the row for your plaintext letter and the column for your key letter, and take the letter where they meet. To decrypt, go along the key letter\'s row until you find the ciphertext letter, then read the plaintext letter from the top.</p>'
      );
    },
  },
  {
    id: "blank-grid",
    name: "Blank password card",
    blurb: "Twenty-six rows by fourteen columns, to fill with random characters. The card is meaningless without your path rule.",
    usedBy: ["grid-lookup"],
    render() {
      const columns = 14;
      const header = ['<tr><th scope="col"></th>'];
      for (let index = 1; index <= columns; index += 1) header.push(`<th scope="col">${index}</th>`);
      header.push("</tr>");
      const body = LETTERS.map(
        (letter) => `<tr><th scope="row">${letter}</th>${'<td class="write-cell"></td>'.repeat(columns)}</tr>`,
      ).join("");
      return (
        `<table class="sheet-table square write"><caption>Fill every cell with a random character before you use it</caption><thead>${header.join("")}</thead><tbody>${body}</tbody></table>` +
        '<p class="sheet-note">Filling this takes about twenty minutes with dice and the character grid. Do it once, photocopy it by hand onto a second card - never in a copy shop - and keep the spare in another building.</p>' +
        '<p class="sheet-note">Keep the path rule in your head. For example: row = the first letter of the site, column = the number of letters in its name, then read fourteen characters to the right, wrapping to the next row.</p>'
      );
    },
  },
  {
    id: "card-table",
    name: "Playing card to character table",
    blurb: "For households with a deck and no dice. Fifty-two cards cover every letter, upper and lower case.",
    usedBy: ["card-shuffle", "solitaire"],
    render() {
      const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      const suits = [
        { name: "Clubs", start: "A".charCodeAt(0) },
        { name: "Diamonds", start: "N".charCodeAt(0) },
        { name: "Hearts", start: "a".charCodeAt(0) },
        { name: "Spades", start: "n".charCodeAt(0) },
      ];
      const rows = suits.map((suit) => [suit.name, ...ranks.map((_, index) => String.fromCharCode(suit.start + index))]);
      return (
        gridTable("Suit down the side, rank across the top", ["", ...ranks], rows, "square") +
        '<p class="sheet-note">Riffle shuffle at least seven times before dealing, and shuffle again afterwards so the order is gone. If you need a digit, deal one extra card and use its pip value - ace is 1, ten is 0, and face cards mean deal again.</p>'
      );
    },
  },
  {
    id: "heir-letter",
    name: "Inheritance letter template",
    blurb:
      "The document that decides whether your family ever gets in. Fill it in by hand, seal it, and lodge it with your will - never with a share.",
    usedBy: ["heir-packet"],
    render() {
      const lines = [
        "This letter contains no password. On its own it unlocks nothing.",
        "",
        "There are ____ sealed envelopes. You need any ____ of them.",
        "",
        "Envelope 1 is held by: ______________________________________",
        "   Address or location: ______________________________________",
        "   Their phone number is with my will.",
        "",
        "Envelope 2 is held by: ______________________________________",
        "   Address or location: ______________________________________",
        "",
        "Envelope 3 is held by: ______________________________________",
        "   Address or location: ______________________________________",
        "",
        "Each envelope contains a sheet of two-digit numbers, one pair per character.",
        "The printed table you need is attached to this letter.",
        "",
        "Step 1. Lay two sheets side by side and line up the pairs.",
        "Step 2. Follow the recovery instructions on the attached worksheet.",
        "Step 3. Read the recovered pairs through the character code table.",
        "Step 4. The result is the ______________________________________",
        "        which is used at ______________________________________",
        "",
        "A fully worked example on made-up numbers is overleaf. Follow it once",
        "before you attempt the real thing.",
        "",
        "If a seal is broken or a signature does not match, assume the secret is",
        "compromised and tell ______________________________________ immediately.",
        "",
        "Written by: _____________________  Date: ______________",
        "Reviewed and still correct on: ______  ______  ______  ______",
      ];
      return (
        `<pre class="letter">${escapeHtml(lines.join("\n"))}</pre>` +
        '<p class="sheet-note">Read it once a year as though you knew nothing about any of this. Rewrite every line that makes you pause. Then hand it and two dummy shares to a non-technical friend, and watch where they get stuck.</p>'
      );
    },
  },
];
