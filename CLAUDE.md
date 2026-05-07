# CLAUDE.md

Instructions for Claude Code working on this repository.

## Never expose secrets or confidential documents

**Hard rule: do not commit, push, or otherwise persist anything to a publicly
accessible location (GitHub, GitHub Pages, public Convex deployments, public
gists, public buckets, blog posts, or any third-party tool that publishes
content) that contains:**

- Personal identity documents shared during a session — passport scans,
  driver's licenses, ID cards, residence permits, visa pages, birth
  certificates, or **any data extracted from them** (names, document
  numbers, dates of birth, MRZ strings, machine-readable fields).
- Photos of people, faces, or signatures.
- Credentials of any kind — API keys, deploy keys, OAuth tokens, AWS keys,
  passwords, private SSH keys, session cookies, `.env` contents.
- Customer PII — phone numbers, home addresses, real names tied to
  reservation records, payment confirmation screenshots, IBANs / account
  numbers belonging to customers.
- Any image or text the user pastes/shares in chat for the explicit purpose
  of debugging — by default, treat it as confidential and use it only in
  the working tree (and only when needed).

### Concrete dos and don'ts

- ✅ When debugging OCR / image-processing / parsing, you may copy the
  shared file to `/tmp` and run tooling against it. **Delete the temp
  files when done.**
- ✅ Synthesize **fake** equivalents (made-up names, fake document
  numbers, fake dates) for any test fixture that would otherwise need to
  carry a piece of the real document. Place these under `src/**/*.test.ts`
  or `convex/**/*.test.ts`.
- ❌ Never paste raw OCR output of a real document into any file under
  version control, even if the file is "just a test fixture."
- ❌ Never `git add` / `git commit` / `git push` a file that includes
  identifiable strings from a shared document.
- ❌ Never upload a shared image to a third-party API, transcription
  service, or any web tool. OCR via local `tesseract` / `tesseract.js` is
  fine; OpenAI Vision / Google Vision / etc. is not unless the user
  explicitly authorizes that call for that file.

### If a leak might have happened

If you suspect any sensitive content reached the index, a commit, a stash, a
remote, or a deployed asset:

1. Stop the current task immediately and tell the user.
2. Run a thorough audit before any further `git push`:
   ```
   git log --all --full-history --source -p | grep -i -E '<terms>'
   git stash list
   git reflog --all
   git fsck --unreachable --no-reflogs
   git ls-remote origin
   ```
3. If anything turns up, propose remediation (history rewrite via
   `git filter-repo`, force-push, secret rotation, deployed-asset purge)
   and wait for the user's explicit go-ahead before destructive actions
   on a remote.

## Deployment topology (so we don't push to the wrong place)

- **Live site:** `https://moto.popoyo.co/` (custom domain on GitHub
  Pages, served from `main` via `.github/workflows/deploy.yml`).
- **Convex prod:** `tough-meadowlark-233` — what the live site reads from.
  Update with `CONVEX_DEPLOY_KEY=<prod key> npx convex deploy`.
- **Convex dev:** `third-kookabura-106` — for local development only.
  Editing this in the dashboard does **not** affect the live site. The
  customer-facing seed of bikes / reviews / payment methods lives in prod.

When the user reports "I edited the DB and the site didn't update," check
which deployment they edited before assuming a code bug.
