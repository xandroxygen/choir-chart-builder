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
