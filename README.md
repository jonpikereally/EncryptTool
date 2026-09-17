# EncryptYourLife

Encryption tools and passwords you write down and keep off every computer.

Choose what to make - **an encryption tool**, **a password**, or both - set a few options,
press **Generate**, and get five results each. An encryption tool is the actual thing you use
with a pen: a one-time pad, a filled password card, a Vigenere keyword, a Playfair square, a
memorised pepper - generated for you, labelled honestly with what it defeats, with the
worked instructions and printable worksheets one click away. A password is a passphrase from
the EFF word list or a character string, with its strength in bits.

The page opens with a short onboarding on why the secrets that matter most - a password
manager's master password, seed phrases, recovery codes - belong on paper rather than on a
computer, and why "written down" should never mean "readable".

## The rules this site follows

- **Nothing is stored, logged or sent.** Passwords and key material come from
  `crypto.getRandomValues` on your own device, are shown once, and vanish on reload. No
  cookies, no analytics, no network calls after load. The CSP in `src/index.js` is
  `default-src 'none'` and that is what enforces it.
- **No copy button.** The results are meant to be written down. Copying a secret into the
  clipboard is the leak this site exists to avoid.
- **Dice are always an option.** Choose *"I'll roll dice"* and the encryption-tool results
  give rolling instructions and blank worksheets instead of generated material, so no
  computer touches the key at all.
- **Works offline.** A service worker precaches the whole site, word list included.

## Honesty about strength

Every method carries one of four labels, and nothing is rated above what it earns:

| Label | Meaning |
| --- | --- |
| `proven` | Information-theoretically secure when the rules are followed - one-time pads, two-of-two and two-of-three splits |
| `strong` | No practical attack on the paper, because the key is in your head or in another building |
| `obfuscation` | Stops a burglar or a houseguest, not a cryptanalyst - Vigenere, Playfair, transposition, book ciphers |
| `operational` | Not encryption: tamper evidence, geographic separation, metal backups, inheritance letters, rehearsals |

Choosing **Maximum** complexity puts proven methods first regardless of convenience.
Choosing **No randomness** limits results to schemes that rest entirely on a rule or keyword
you memorise - and says so.

## Layout

```
public/            flat static site, served by the ASSETS binding
  index.html       onboarding + the two makers + results, one screen
  styles.css       one stylesheet, no external fonts
  app.js           makers, CSPRNG generation, tool ranking, key material rendering
  methods.js       the method catalogue (content lives here)
  recommend.js     the scoring engine (written for an earlier eight-question UI; app.js maps onto it)
  printables.js    the printable worksheets
  wordlist.js      EFF long word list, 7,776 words, CC BY 3.0
  sw.js            offline cache
  build-info.js    generated - build number, date, commit
src/index.js       Worker: security headers, robots.txt, sitemap.xml, /__build
scripts/
  build-info.mjs   writes the build stamp
  og-image.py      renders public/og.png with no image library
  check.mjs        parses every shipped script
wrangler.jsonc     one config, named env.staging, custom_domain route for production
```

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:8787. `npm run dev` stamps the build first, so the footer and
`/__build` always match what you are running.

```bash
npm run check    # every shipped script parses
npm run build    # build stamp + Open Graph image
```

## Deploying

Branches: land and test on `staging`, then merge to `main`.

```bash
npm run deploy:staging   # wrangler deploy --env staging
npm run deploy           # production
```

CI (`.github/workflows/deploy.yml`) deploys `staging` and `main` on push and needs the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.

Non-secret configuration lives in `vars`. `SITE_URL` may be left empty, in which case
canonical, Open Graph and sitemap URLs fall back to the request origin - that is what makes
staging correct without a second config file. Before the first production deploy, set the
real hostname in the `routes` entry in `wrangler.jsonc` and add the domain to the Cloudflare
account.

The Cloudflare worker is still named `encrypttool` (staging: `encrypttool-staging`), matching
the GitHub repository. Renaming it creates a new worker and a new `workers.dev` URL, so that
is a deliberate, separate step.

## Security posture

Set on every response by the Worker:

- `Content-Security-Policy` - `default-src 'none'`, everything else `'self'`
- `Strict-Transport-Security` - one year, includeSubDomains, preload
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy` - camera, microphone, geolocation and the rest switched off
- `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy: same-origin`

`run_worker_first` is on so those headers apply to static assets too.

## SEO

Title, meta description, canonical, Open Graph, Twitter card, JSON-LD (`WebApplication`
plus an `FAQPage`), plus `robots.txt` and `sitemap.xml` generated by the Worker from the
live hostname.

## Adding or changing a method

Everything a method needs is one object in `public/methods.js`: `stage`, `security`,
`ratings`, the honest `protects` / `failsAgainst` pair, `steps`, a worked `example`,
`pitfalls`, and `weights` - each `{ when, points, because }`, where `because` is shown to
the user as the reason. To generate key material for a new method, add a case to
`material()` in `public/app.js`.

## Credits

Passphrases use the [EFF Long Wordlist](https://www.eff.org/dice) (CC BY 3.0).

## Not a substitute for

A password manager. Paper is for the small number of secrets that genuinely should never
be on a computer: the master password itself, crypto seed phrases, recovery codes, and
whatever your family will need. Everything else belongs in a manager behind a strong master
password.
