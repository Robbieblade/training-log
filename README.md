# Training log

A one-page tracker for three gym sessions a week plus golf, classes and padel. It writes everything to a Google Sheet you own, so the data survives a new phone and you can chart it yourself.

Files: `index.html` (the site), `Code.gs` (the Apps Script that talks to the sheet).

## Setup, about fifteen minutes

**1. Make the sheet.** New Google Sheet, call it Training Log. Nothing to set up inside it, the script builds the tabs.

**2. Add the script.** Extensions → Apps Script. Delete whatever is in the editor, paste in all of `Code.gs`, save.

**3. Deploy it.** Deploy → New deployment → type: Web app.
- Execute as: **Me**
- Who has access: **Anyone**

Google will warn you about permissions the first time. Click through Advanced → Go to project → Allow. You are authorising your own script against your own sheet.

Copy the web app URL it gives you. It ends in `/exec`.

**4. Wire up the page.** Open `index.html`, find `const SHEET_URL = "";` near the top of the script, paste the URL between the quotes.

**5. Publish.** New repo under the robbieblade account, `index.html` in the root, push with GitHub Desktop, Settings → Pages → deploy from `main` / root. Open the URL on your phone and add it to your home screen.

## "Who has access: Anyone" — what that means

The URL is the only credential. Anyone who has it could read or write your training log, but it is a long random string that you are not publishing anywhere, and the worst case is someone knowing you leg pressed 100kg. Set to "Anyone with a Google account" instead and the page breaks, because the browser can't sign in on your behalf.

Keep the URL out of the repo's README and out of any public post, and it's fine. If it ever leaks, Deploy → Manage deployments → Archive, then create a new deployment and paste the fresh URL in.

## How the sheet is laid out

**Gym tab** — one row per set: Date, Day, Exercise, Set, Weight, Reps, Session ID, Logged. One row per set rather than per session, so you can drop a pivot table on it and chart weight over time per exercise without reshaping anything.

**Activity tab** — one row per entry: Date, Type, Holes, Score, Class, Minutes, Note, ID, Logged.

Don't rename the tabs or reorder the columns. The script reads them by position.

## Offline

Everything saves to the phone first, then uploads. If there's no signal at the gym, the entry queues and goes up next time you open the page. The status line under the title tells you which state you're in.

Editing rows in the sheet by hand is fine and the page will pick the changes up on its next reload. Deleting a row by hand is also fine. Just leave the ID column alone, because that's how deletes from the page find their rows.

## Next things worth building

- A chart of top weight per exercise over time.
- Rest timer, 20 seconds inside a pair and 75 after a round.
- Editing a saved session rather than removing and re-entering.
- A four-week view alongside the weekly summary.
