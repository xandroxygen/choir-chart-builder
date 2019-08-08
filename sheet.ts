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

export function dataSectionStacksSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  return getSheetByName(references().sheets.Data.SectionStacks);
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

export function showSectionStacks(
  sectionStacks: number[][],
  rows: Row[],
  sections: Section[]
) {
  const [r, c] = references().cells.sectionStacks;
  const numRows = 1 + rows.length + 2; // header + rows + total + actual
  const numColumns = 1 + sections.length + 2; // header + sections + total + actual

  const values: any[][] = [];
  values.push(["", ...sections.map(s => s.title), "Total", "Actual"]);

  for (let i = rows.length - 1; i >= 0; i--) {
    const stackRow = sectionStacks.map(stack => stack[i]);
    const stackTotal = stackRow.reduce((total, num) => total + num, 0);
    values.push([rows[i].letter, ...stackRow, stackTotal, rows[i].seats]);
  }

  const stackTotals = sectionStacks.map(stack =>
    stack.reduce((total, num) => total + num, 0)
  );
  values.push(["Total", ...stackTotals, "", ""]);
  values.push(["Actual", ...sections.map(s => s.count), "", ""]);

  configurationSheet()
    .getRange(r, c, numRows, numColumns)
    .setValues(values);
}

export function getConfirmedSectionStacks(cSections: number, cRows: number) {
  const [r, c] = references().cells.sectionStacks;
  const values: number[][] = configurationSheet()
    .getRange(r + 1, c + 1, cRows, cSections)
    .getValues();

  // values need to be reversed and inverted for storage
  // reverse row order
  values.reverse();

  // invert rows and columns
  const sectionStacks: number[][] = [];
  for (let i = 0; i < cSections; i++) {
    const stack = values.map(row => row[i]);
    sectionStacks.push(stack);
  }

  return sectionStacks;
}

export function saveSectionStacks(sectionStacks: number[][]) {
  const [r, c] = references().cells.data.sectionStacks;
  dataSectionStacksSheet()
    .getRange(r, c, sectionStacks.length, sectionStacks[0].length)
    .setValues(sectionStacks);
}

export function readSectionStacks(): number[][] {
  const values = dataSectionStacksSheet()
    .getDataRange()
    .getValues();

  // remove header row
  values.shift();

  // remove first column
  return values.map(row => row.slice(1));
}

export function references() {
  const cells = {
    cAvailableRows: "A11",
    startingRow: "A14",
    cGeneratedRows: [2, 1],
    sectionStacks: [1, 4], //D1
    data: {
      rows: [2, 1], //A2
      sections: [2, 1], //A2
      singers: [2, 1], //A2
      sectionStacks: [2, 2] //B2
    }
  };

  const dataPrefix = "INTERNAL | DO NOT CHANGE |";
  const sheets = {
    Configuration: "Configuration",
    Input: "Input",
    Data: {
      Rows: `${dataPrefix} Rows`,
      Sections: `${dataPrefix} Sections`,
      Singers: `${dataPrefix} Singers`,
      SectionStacks: `${dataPrefix} Section Stacks`
    }
  };

  return {
    cells,
    sheets
  };
}
