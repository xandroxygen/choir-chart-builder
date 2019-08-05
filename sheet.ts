import { Row, Section, Singer } from "./definitions";

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

export function dataSectionsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  return getSheetByName(references().sheets.Data.Sections);
}

export function dataSingersSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  return getSheetByName(references().sheets.Data.Singers);
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

export function saveSections(sections: Section[]) {
  const [r, c] = references().cells.data.sections;
  const values = sections.map(section => [section.title, section.count]);

  dataSectionsSheet()
    .getRange(r, c, sections.length, 2)
    .setValues(values);
}

export function readSections(): Section[] {
  const values = dataSectionsSheet()
    .getDataRange()
    .getValues();

  // remove header row
  values.shift();

  return values.map(([title, count]) => ({ title, count } as Section));
}

export function saveSingers(singers: Singer[]) {
  const [r, c] = references().cells.data.singers;
  const values = singers.map(singer => [
    singer.firstName,
    singer.lastName,
    singer.section,
    singer.height,
    singer.seat
  ]);

  dataSingersSheet()
    .getRange(r, c, singers.length, 5)
    .setValues(values);
}

export function readSingers(): Singer[] {
  const values = dataSingersSheet()
    .getDataRange()
    .getValues();

  // remove header row
  values.shift();

  return values.map(
    ([firstName, lastName, section, height, seat]) =>
      ({
        firstName,
        lastName,
        section,
        height: parseFloat(height),
        seat
      } as Singer)
  );
}

export function references() {
  const cells = {
    cAvailableRows: "A11",
    startingRow: "A14",
    cGeneratedRows: [2, 1],
    data: {
      rows: [2, 1],
      sections: [2, 1],
      singers: [2, 1]
    }
  };

  const dataPrefix = "INTERNAL | DO NOT CHANGE |";
  const sheets = {
    Configuration: "Configuration",
    Input: "Input",
    Data: {
      Rows: `${dataPrefix} Rows`,
      Sections: `${dataPrefix} Sections`,
      Singers: `${dataPrefix} Singers`
    }
  };

  return {
    cells,
    sheets
  };
}
