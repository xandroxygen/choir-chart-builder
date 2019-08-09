export function Sheet() {
  function getSheetByName(name: string): GoogleAppsScript.Spreadsheet.Sheet {
    return SpreadsheetApp.getActive().getSheetByName(name);
  }

  function configurationSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Configuration);
  }

  function dataRowsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Data.Rows);
  }

  function dataSectionsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Data.Sections);
  }

  function dataSingersSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Data.Singers);
  }

  function dataSectionStacksSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Data.SectionStacks);
  }

  function getAvailableRows(): number {
    return parseInt(
      configurationSheet()
        .getRange(references().cells.cAvailableRows)
        .getValue()
    );
  }

  function getStartingRow(): string {
    return configurationSheet()
      .getRange(references().cells.startingRow)
      .getValue();
  }

  function getRowsRange(
    r: number,
    c: number,
    sheet: GoogleAppsScript.Spreadsheet.Sheet
  ): GoogleAppsScript.Spreadsheet.Range {
    return sheet.getRange(r, c, getAvailableRows(), 2);
  }

  return {
    getSheetByName,
    configurationSheet,
    dataRowsSheet,
    dataSectionStacksSheet,
    dataSectionsSheet,
    dataSingersSheet,
    getAvailableRows,
    getStartingRow,
    getRowsRange
  };
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
