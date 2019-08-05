export function getConfigurationSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  return SpreadsheetApp.getActive().getSheetByName(
    references().sheets.Configuration
  );
}

export function getSheetByName(
  name: string
): GoogleAppsScript.Spreadsheet.Sheet {
  return SpreadsheetApp.getActive().getSheetByName(name);
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

export function references() {
  const cells = {
    cAvailableRows: "A11",
    cGeneratedRows: "A2:A7",
    cFinalRows: "C2:C7",
    startingRow: "A14"
  };

  const dataPrefix = "INTERNAL | DO NOT CHANGE |";
  const sheets = {
    Configuration: "Configuration",
    Input: "Input",
    Data: {
      RowCounts: `${dataPrefix} Row Counts`
    }
  };

  return {
    cells,
    sheets
  };
}
