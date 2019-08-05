import { references } from "./references";

export function getConfigurationSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  return SpreadsheetApp.getActive().getSheetByName(
    references().sheets.Configuration
  );
}

export function getInputSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  return SpreadsheetApp.getActive().getSheetByName(references().sheets.Input);
}

export function getAvailableRows(): number {
  return parseInt(
    getConfigurationSheet()
      .getRange(references().cells.cAvailableRows)
      .getValue()
  );
}

export function getStartingRow(): string {
  return getConfigurationSheet()
    .getRange(references().cells.startingRow)
    .getValue();
}

export function setGeneratedRowCounts(rowCounts: number[]) {
  const output = rowCounts.reverse().map(c => [c]);
  getConfigurationSheet()
    .getRange(references().cells.cGeneratedRows)
    .setValues(output);
}
