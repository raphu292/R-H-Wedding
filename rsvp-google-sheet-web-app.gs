// R & H Wedding 2027 RSVP Google Sheet Web App
// Use this in Google Apps Script to connect the website RSVP form to the test Google Sheet.
//
// Setup:
// 1. Open https://script.google.com/
// 2. Create a new project.
// 3. Paste this file into Code.gs.
// 4. Deploy > New deployment > Web app.
// 5. Execute as: Me.
// 6. Who has access: Anyone.
// 7. Copy the Web App URL.
// 8. In index.html, replace PASTE_APPS_SCRIPT_WEB_APP_URL_HERE with that Web App URL.

const SPREADSHEET_ID = '1IhgD8tGTrum4Yx9cLDdUTAKJYpSisQJWhy6jOsGjdOk';
const RESPONSE_SHEET_NAME = 'RSVP Responses';

function doPost(e) {
  const params = e.parameter || {};

  // Honeypot spam protection: real guests will never fill this hidden field.
  if (params.website) {
    return HtmlService.createHtmlOutput('Ignored');
  }

  const name = clean_(params.name);
  const attendance = clean_(params.attendance);

  if (!name || !attendance) {
    return HtmlService.createHtmlOutput('Missing required fields');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(RESPONSE_SHEET_NAME) || ss.insertSheet(RESPONSE_SHEET_NAME);

  sheet.appendRow([
    new Date(),
    name,
    attendance,
    clean_(params.guestCount),
    clean_(params.companion),
    clean_(params.dietary),
    clean_(params.message),
    clean_(params.source) || 'Wedding website'
  ]);

  return HtmlService.createHtmlOutput('RSVP received');
}

function doGet() {
  return HtmlService.createHtmlOutput('R & H Wedding RSVP endpoint is active.');
}

function clean_(value) {
  return String(value || '').trim();
}
