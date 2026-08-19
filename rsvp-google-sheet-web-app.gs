// R & H Wedding 2027 RSVP Google Sheet Web App
// Writes website RSVP submissions directly into the wedding planner Google Sheet.
//
// Website form fields supported:
// name | attendance | guestCount | companion | dietary | songRequest | message | contactNumber
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

const SPREADSHEET_ID = '12giowjOrQVK-m0r6dkZ0KhHr_uHtbXes188-I0IceSE';
const RESPONSE_SHEET_NAME = 'Guest List & RSVP';
const HEADER_ROW = 3;
const FIRST_DATA_ROW = 4;

const DEFAULT_HEADERS = [
  'Household / Group',
  'Guest Name',
  'Companion Name(s)',
  'Side',
  'Invitation Sent?',
  'RSVP Status',
  'Seats Reserved',
  'Attending',
  'Meal / Dietary Notes',
  'Song Request',
  'Table / Seating',
  'Gift / GCash Received',
  'Thank-You Sent?',
  'Phone / Email',
  'Notes'
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

    const headers = sheet.getRange(HEADER_ROW, 1, 1, Math.max(sheet.getLastColumn(), DEFAULT_HEADERS.length)).getValues()[0];
    const status = normalizeStatus_(attendance);
    const companionNames = normalizeCompanionNames_(params.companion);
    const submittedCount = Number(clean_(params.guestCount)) || 0;
    const calculatedCount = 1 + countCompanions_(companionNames);
    const seats = status === 'Confirmed' ? Math.max(submittedCount, calculatedCount) : 0;
    const attending = status === 'Confirmed' ? seats : 0;

    const valuesByHeader = {
      'Household / Group': '',
      'Guest Name': name,
      'Companion Name(s)': companionNames,
      'Side': '',
      'Invitation Sent?': 'Yes',
      'RSVP Status': status,
      'Seats Reserved': seats,
      'Attending': attending,
      'Meal / Dietary Notes': clean_(params.dietary),
      'Song Request': clean_(params.songRequest),
      'Table / Seating': '',
      'Gift / GCash Received': 'Pending',
      'Thank-You Sent?': 'No',
      'Phone / Email': clean_(params.contactNumber),
      'Notes': clean_(params.message)
    };

    const row = headers.map(header => valuesByHeader[String(header).trim()] || '');
    const nextRow = findNextEmptyRow_(sheet, 2);
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

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
  const firstRow = sheet.getRange(HEADER_ROW, 1, 1, lastColumn).getValues()[0];
  const hasHeaders = firstRow.some(value => String(value || '').trim());

  if (!hasHeaders) {
    sheet.getRange(HEADER_ROW, 1, 1, DEFAULT_HEADERS.length).setValues([DEFAULT_HEADERS]);
    return;
  }

  const existing = firstRow.map(value => String(value || '').trim()).filter(Boolean);
  const missing = DEFAULT_HEADERS.filter(header => !existing.includes(header));

  if (missing.length) {
    sheet.getRange(HEADER_ROW, existing.length + 1, 1, missing.length).setValues([missing]);
  }
}

function findNextEmptyRow_(sheet, keyColumn) {
  const maxRows = sheet.getMaxRows();
  const values = sheet.getRange(FIRST_DATA_ROW, keyColumn, maxRows - FIRST_DATA_ROW + 1, 1).getValues();

  for (let i = 0; i < values.length; i++) {
    if (!String(values[i][0] || '').trim()) {
      return FIRST_DATA_ROW + i;
    }
  }

  return sheet.getLastRow() + 1;
}

function normalizeStatus_(attendance) {
  const value = clean_(attendance).toLowerCase();

  if (value.includes('accept') || value.includes('yes') || value.includes('attend')) {
    return 'Confirmed';
  }

  if (value.includes('decline') || value.includes('no') || value.includes('regret')) {
    return 'Declined';
  }

  return attendance;
}

function normalizeCompanionNames_(value) {
  return String(value || '')
    .split(/[\n,]+/)
    .map(name => name.trim())
    .filter(Boolean)
    .join('\n');
}

function countCompanions_(value) {
  if (!value) return 0;
  return value.split('\n').filter(Boolean).length;
}

function clean_(value) {
  return String(value || '').trim();
}

function output_(message) {
  return HtmlService.createHtmlOutput(message);
}
