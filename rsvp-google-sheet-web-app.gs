// R & H Wedding 2027 RSVP Google Sheet Web App
// Header-safe version: values are written under the correct column name even if columns move.
//
// Sheet headers supported:
// Timestamp | Full Name | Invited Party / Family | Attendance | Number Attending
// Companion Name | Dietary Restrictions | Song Request | Message | Contact Number
//
// Setup after changing this file in Google Apps Script:
// 1. Replace Code.gs with this full code.
// 2. Save.
// 3. Deploy > Manage deployments > Edit pencil.
// 4. Version: New version.
// 5. Execute as: Me.
// 6. Who has access: Anyone.
// 7. Deploy.
// 8. Use the Web App URL ending in /exec on the website form.

const SPREADSHEET_ID = '1IhgD8tGTrum4Yx9cLDdUTAKJYpSisQJWhy6jOsGjdOk';
const RESPONSE_SHEET_NAME = 'RSVP Responses';

const DEFAULT_HEADERS = [
  'Timestamp',
  'Full Name',
  'Invited Party / Family',
  'Attendance',
  'Number Attending',
  'Companion Name',
  'Dietary Restrictions',
  'Song Request',
  'Message',
  'Contact Number'
];

function doPost(e) {
  const params = e.parameter || {};

  // Honeypot spam protection: real guests will never fill this hidden field.
  if (params.website) {
    return output_('Ignored');
  }

  const name = clean_(params.name);
  const attendance = clean_(params.attendance);

  if (!name || !attendance) {
    return output_('Missing required fields');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RESPONSE_SHEET_NAME) || ss.insertSheet(RESPONSE_SHEET_NAME);
    ensureHeaders_(sheet);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const valuesByHeader = {
      'Timestamp': new Date(),
      'Full Name': name,
      'Invited Party / Family': clean_(params.invitedParty),
      'Attendance': attendance,
      'Number Attending': clean_(params.guestCount),
      'Companion Name': clean_(params.companion),
      'Dietary Restrictions': clean_(params.dietary),
      'Song Request': clean_(params.songRequest),
      'Message': clean_(params.message),
      'Contact Number': clean_(params.contactNumber),
      'Source': clean_(params.source) || 'R-H-Wedding website'
    };

    const row = headers.map(header => valuesByHeader[String(header).trim()] || '');
    sheet.appendRow(row);

    return output_('RSVP received');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return output_('R & H Wedding RSVP endpoint is active.');
}

function ensureHeaders_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), DEFAULT_HEADERS.length);
  const firstRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const hasHeaders = firstRow.some(value => String(value || '').trim());

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, DEFAULT_HEADERS.length).setValues([DEFAULT_HEADERS]);
    return;
  }

  // If important columns are missing, append them to the right instead of breaking existing data.
  const existing = firstRow.map(value => String(value || '').trim()).filter(Boolean);
  const missing = DEFAULT_HEADERS.filter(header => !existing.includes(header));

  if (missing.length) {
    sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  }
}

function clean_(value) {
  return String(value || '').trim();
}

function output_(message) {
  return HtmlService.createHtmlOutput(message);
}
