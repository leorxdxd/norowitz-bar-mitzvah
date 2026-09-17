// ---------------------------------------------------------------------
// RSVP -> Google Sheets endpoint (+ optional confirmation email).
//
// SETUP:
// 1. Create a new Google Sheet (this will hold your RSVPs).
// 2. Extensions -> Apps Script.
// 3. Delete whatever is in Code.gs and paste this whole file in its place.
// 4. Click Deploy -> New deployment -> gear icon -> "Web app".
//      - Execute as: Me
//      - Who has access: Anyone
// 5. Click Deploy, authorize the permissions it asks for, then copy the
//    "Web app URL" it gives you (ends in /exec).
// 6. Paste that URL into js/config.js as window.GOOGLE_SCRIPT_URL.
//
// UPDATING an already-deployed script (e.g. after this email feature was
// added): Deploy -> Manage deployments -> pencil/edit icon on the active
// deployment -> Version: "New version" -> Deploy. This keeps the same
// /exec URL, so js/config.js does not need to change.
//
// Every RSVP submitted on the site will show up as a new row here, and
// if the guest gave an email address they'll get a short confirmation
// email automatically (sent from your own Gmail/Google Workspace
// account — Apps Script's free daily email quota is generous enough for
// a Bar Mitzvah guest list). If you ever change the form fields, update
// the appendRow() call below to match.
// ---------------------------------------------------------------------

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Family Name', 'Attending', 'Guest Count', 'Guest Names', 'Email', 'Notes']);
  }

  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.family_name || '',
    data.attending ? 'Yes' : 'No',
    data.guest_count || '',
    data.guest_names || '',
    data.email || '',
    data.notes || ''
  ]);

  if (data.email) {
    try {
      sendConfirmationEmail(data);
    } catch (err) {
      // An email hiccup (bad address, quota, etc.) should never cost the
      // guest their saved RSVP — just log it and move on.
      Logger.log('Confirmation email failed: ' + err);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendConfirmationEmail(data) {
  var name = data.family_name || 'there';
  var attending = !!data.attending;
  var guestCount = data.guest_count;

  var attendingLine = attending
    ? "We're delighted you'll be joining us"
      + (guestCount ? ' (' + guestCount + (Number(guestCount) === 1 ? ' guest' : ' guests') + ')' : '')
      + '.'
    : "We're sorry you won't be able to join us, but thank you so much for letting us know.";

  var subject = 'RSVP Confirmed — Yehoshua Norowitz Bar Mitzvah';

  var htmlBody = ''
    + '<div style="font-family:Georgia,\'Times New Roman\',serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#F6EFE0;color:#241C12;">'
    + '<div style="text-align:center;font-size:28px;letter-spacing:2px;color:#AD8A44;margin-bottom:24px;">YN</div>'
    + '<h1 style="text-align:center;font-weight:normal;font-size:22px;margin:0 0 16px;">Thank you, ' + escapeHtml(name) + '.</h1>'
    + '<p style="text-align:center;font-size:16px;line-height:1.6;margin:0 0 20px;">' + attendingLine + '</p>'
    + '<hr style="border:none;border-top:1px solid #EAD9AC;margin:24px 0;">'
    + '<p style="text-align:center;font-size:14px;color:#5B4E39;margin:0;">Yehoshua Norowitz &middot; Bar Mitzvah &middot; November 18&ndash;21, 2026</p>'
    + '</div>';

  var plainBody = 'Thank you, ' + name + '.\n\n'
    + attendingLine.replace(/<[^>]*>/g, '') + '\n\n'
    + 'Yehoshua Norowitz - Bar Mitzvah - November 18-21, 2026';

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Lets you sanity-check the deployed URL by opening it directly in a browser.
function doGet(e) {
  return ContentService.createTextOutput('RSVP endpoint is live.');
}
