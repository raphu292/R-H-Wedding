// R & H Wedding 2027 RSVP Google Sheet Web App
// Use this in Google Apps Script to connect the website RSVP form to the test Google Sheet.
//
// IMPORTANT:
// The appendRow order below must match your Google Sheet columns exactly:
// A Timestamp
// B Full Name
// C Invited Party / Family
// D Attendance
// E Number Attending
// F Companion Name
// G Dietary Restrictions
// H Song Request
// I Message
// J Contact Number
//
// Setup:
// 1. Open https://script.google.com/
// 2. Create a new project or open your existing RSVP project.
// 3. Replace Code.gs with this full code.
// 4. Deploy > Manage deployments > Edit pencil.
// 5. Version: New version.
// 6. Execute as: Me.
// 7. Who has access: Anyone.
// 8. Deploy and copy the Web App URL ending in /exec.

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

  // Keep this order exactly the same as the sheet header row A:J.
  sheet.appendRow([
    new Date(),                         // A Timestamp
    name,                               // B Full Name
    clean_(params.invitedParty),        // C Invited Party / Family
    attendance,                         // D Attendance
    clean_(params.guestCount),          // E Number Attending
    clean_(params.companion),           // F Companion Name
    clean_(params.dietary),             // G Dietary Restrictions
    clean_(params.songRequest),         // H Song Request
    clean_(params.message),             // I Message
    clean_(params.contactNumber)        // J Contact Number
  ]);

  return HtmlService.createHtmlOutput('RSVP received');
}

function doGet() {
  return HtmlService.createHtmlOutput('R & H Wedding RSVP endpoint is active.');
}

function clean_(value) {
  return String(value || '').trim();
}
