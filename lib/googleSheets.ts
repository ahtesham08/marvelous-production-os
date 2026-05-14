import { google } from "googleapis";

export const TITLE_BANK_SPREADSHEET_ID = "1V8QJxGK4C9PdCf4FACx0dJyHqn-ZrhCvGrehOJH_5CE";
export const TITLE_BANK_TAB = "MV Titles 2025";
export const PRODUCTION_SPREADSHEET_ID = "1AImX41moogoEbKkX3qNxPVPzvsMZlQgowBMq1cuVmK8";
export const PRODUCTION_TABS = ["MV N", "LL", "Gamers", "Anime", "Long Reads"] as const;

export function hasGoogleSheetsConfig() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

export async function getSheetValues(spreadsheetId: string, tabName: string) {
  const sheets = getSheetsClient([
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly"
  ]);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tabName}'`
  });

  return response.data.values ?? [];
}

export async function updateSheetValues(spreadsheetId: string, range: string, values: unknown[][]) {
  const sheets = getSheetsClient(["https://www.googleapis.com/auth/spreadsheets"]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values
    }
  });
}

export function columnToA1(index: number) {
  let value = "";
  let current = index + 1;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    current = Math.floor((current - 1) / 26);
  }

  return value;
}

function getSheetsClient(scopes: string[]) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY.");
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes
  });

  return google.sheets({ version: "v4", auth });
}
