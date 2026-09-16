/**
 * Training log — Google Sheets backend.
 * Paste this into Extensions → Apps Script on a new Google Sheet, then deploy
 * as a web app (execute as: me / who has access: anyone).
 *
 * Two tabs are created automatically the first time something is saved:
 *   Gym      — one row per set, so progression is easy to chart
 *   Activity — one row per round of golf, class or padel
 */

var GYM_HEADERS = ['Date', 'Day', 'Exercise', 'Set', 'Weight (kg)', 'Reps', 'Session ID', 'Logged'];
var ACT_HEADERS = ['Date', 'Type', 'Holes', 'Score', 'Class', 'Minutes', 'Note', 'ID', 'Logged'];

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_(list_());
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.action === 'add')    return json_(add_(req));
    if (req.action === 'list')   return json_(list_());
    if (req.action === 'delete') return json_(del_(req.id));
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function add_(req) {
  var stamp = new Date();
  if (req.kind === 'gym') {
    var sh = sheet_('Gym', GYM_HEADERS);
    var rows = [];
    (req.entries || []).forEach(function (entry) {
      (entry.sets || []).forEach(function (set, i) {
        if (!set.weight && !set.reps) return;
        rows.push([
          req.date, req.day, entry.exercise, i + 1,
          set.weight === '' ? '' : Number(set.weight),
          set.reps === '' ? '' : Number(set.reps),
          req.id, stamp
        ]);
      });
    });
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, GYM_HEADERS.length).setValues(rows);
    return { ok: true, rows: rows.length };
  }

  var ash = sheet_('Activity', ACT_HEADERS);
  ash.appendRow([
    req.date,
    req.type,
    req.holes === undefined ? '' : req.holes,
    req.score || '',
    req.classType || '',
    req.mins === undefined ? '' : req.mins,
    req.note || '',
    req.id,
    stamp
  ]);
  return { ok: true, rows: 1 };
}

function list_() {
  var sessions = [];
  var activities = [];

  var gym = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Gym');
  if (gym && gym.getLastRow() > 1) {
    var g = gym.getRange(2, 1, gym.getLastRow() - 1, GYM_HEADERS.length).getValues();
    var byId = {};
    g.forEach(function (r) {
      var id = String(r[6]);
      if (!id) return;
      if (!byId[id]) {
        byId[id] = { id: id, date: iso_(r[0]), day: r[1], entries: [] };
        sessions.push(byId[id]);
      }
      var s = byId[id];
      var entry = s.entries.filter(function (x) { return x.exercise === r[2]; })[0];
      if (!entry) { entry = { exercise: r[2], sets: [] }; s.entries.push(entry); }
      entry.sets[Number(r[3]) - 1] = { weight: String(r[4]), reps: String(r[5]) };
    });
    sessions.forEach(function (s) {
      s.entries.forEach(function (e) {
        for (var i = 0; i < 3; i++) if (!e.sets[i]) e.sets[i] = { weight: '', reps: '' };
      });
    });
  }

  var act = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Activity');
  if (act && act.getLastRow() > 1) {
    var a = act.getRange(2, 1, act.getLastRow() - 1, ACT_HEADERS.length).getValues();
    a.forEach(function (r) {
      if (!String(r[7])) return;
      activities.push({
        id: String(r[7]),
        date: iso_(r[0]),
        type: String(r[1]),
        holes: r[2] === '' ? undefined : Number(r[2]),
        score: String(r[3] || ''),
        classType: String(r[4] || ''),
        mins: r[5] === '' ? undefined : Number(r[5]),
        note: String(r[6] || '')
      });
    });
  }

  return { ok: true, sessions: sessions, activities: activities };
}

function del_(id) {
  var removed = 0;
  [['Gym', 7], ['Activity', 8]].forEach(function (pair) {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(pair[0]);
    if (!sh || sh.getLastRow() < 2) return;
    var col = sh.getRange(2, pair[1], sh.getLastRow() - 1, 1).getValues();
    for (var i = col.length - 1; i >= 0; i--) {
      if (String(col[i][0]) === String(id)) { sh.deleteRow(i + 2); removed++; }
    }
  });
  return { ok: true, removed: removed };
}

function iso_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v).slice(0, 10);
}
