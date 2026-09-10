// ---------------------------------------------------------------------
// RSVP -> Google Sheets endpoint.
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
// Every RSVP submitted on the site will show up as a new row here.
// If you ever change the form fields, update the appendRow() call below
// to match.
// ---------------------------------------------------------------------

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Family Name', 'Attending', 'Guest Count', 'Guest Names', 'Email']);
  }

  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.family_name || '',
    data.attending ? 'Yes' : 'No',
    data.guest_count || '',
    data.guest_names || '',
    data.email || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Lets you sanity-check the deployed URL by opening it directly in a browser.
function doGet(e) {
  return ContentService.createTextOutput('RSVP endpoint is live.');
}
