import { Row } from "./definitions";

export function getSheetByName(
  name: string
): GoogleAppsScript.Spreadsheet.Sheet {
  return SpreadsheetApp.getActive().getSheetByName(name);
}

export function configurationSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  return getSheetByName(references().sheets.Configuration);
}

export function dataRowsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  return getSheetByName(references().sheets.Data.Rows);
}

export function getAvailableRows(): number {
  return parseInt(
    configurationSheet()
      .getRange(references().cells.cAvailableRows)
      .getValue()
  );
}

export function getStartingRow(): string {
  return configurationSheet()
    .getRange(references().cells.startingRow)
    .getValue();
}

export function setGeneratedRows(rows: Row[]) {
  const [r, c] = references().cells.cGeneratedRows;
  // copy rows here bc reverse is in-place
  const output = [...rows].reverse().map(row => [row.letter, row.seats]);
  getRowsRange(r, c, configurationSheet()).setValues(output);
}

export function getGeneratedRowCounts(): number[] {
  const [r, c] = references().cells.cGeneratedRows;
  return (
    configurationSheet()
      // only read the counts, not the letters
      .getRange(r, c + 1, getAvailableRows())
      .getValues()
      .map(([value]) => value)
      .reverse()
  );
}

export function saveRows(rows: Row[]) {
  const [r, c] = references().cells.data.rows;
  const values = rows.map(row => [row.letter, row.seats]);
  getRowsRange(r, c, dataRowsSheet()).setValues(values);
}

export function readRows(): Row[] {
  const [r, c] = references().cells.data.rows;
  return getRowsRange(r, c, dataRowsSheet())
    .getValues()
    .map(([letter, seats]) => ({ letter, seats } as Row));
}

export function getRowsRange(
  r: number,
  c: number,
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): GoogleAppsScript.Spreadsheet.Range {
  return sheet.getRange(r, c, getAvailableRows(), 2);
}

export function references() {
  const cells = {
    cAvailableRows: "A11",
    startingRow: "A14",
    cGeneratedRows: [2, 1],
    data: {
      rows: [2, 1]
    }
  };

  const dataPrefix = "INTERNAL | DO NOT CHANGE |";
  const sheets = {
    Configuration: "Configuration",
    Input: "Input",
    Data: {
      Rows: `${dataPrefix} Rows`
    }
  };

  return {
    cells,
    sheets
  };
}
