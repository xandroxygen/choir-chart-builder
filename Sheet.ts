import { Config } from "./Config";

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

  function outputChartSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Output.Chart);
  }

  function outputListsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Output.Lists);
  }

  function getRowsRange(
    r: number,
    c: number,
    sheet: GoogleAppsScript.Spreadsheet.Sheet
  ): GoogleAppsScript.Spreadsheet.Range {
    return sheet.getRange(r, c, Config().getAvailableRows(), 2);
  }

  function clearDataSheets() {
    dataRowsSheet().clear();
    dataSectionStacksSheet().clear();
    dataSectionsSheet().clear();
    dataSingersSheet().clear();
  }

  function initializeDataSheets() {
    dataSectionStacksSheet()
      .getRange("B1:D1")
      .setValues([["Row 1", "Row 2", "etc"]])
      .setFontWeight("bold");

    dataSectionStacksSheet()
      .getRange("A2:A4")
      .setValues([["Section 1"], ["Section 2"], ["etc"]])
      .setFontWeight("bold");

    dataSingersSheet()
      .getRange("A1:E1")
      .setValues([["First Name", "Last Name", "Section", "Height", "Seat"]])
      .setFontWeight("bold");

    dataSectionsSheet()
      .getRange("A1:B1")
      .setValues([["Section Title", "Count"]])
      .setFontWeight("bold");

    dataRowsSheet()
      .getRange("A1:B1")
      .setValues([["Row", "Seat Count"]])
      .setFontWeight("bold");
  }

  function resetConfigurationSheet() {
    const sheet = configurationSheet();
    sheet.clear();

    sheet
      .getRange("A1:B1")
      .setValues([["Generated Rows", "Seat Counts"]])
      .setFontWeight("bold");

    sheet
      .getRange("A10")
      .setValue("Available Rows")
      .setFontWeight("bold");

    sheet
      .getRange("A13")
      .setValue("Starting Row")
      .setFontWeight("bold");
  }

  function getCharColumn(c: number) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return alphabet[c - 1];
  }

  return {
    getSheetByName,
    configurationSheet,
    dataRowsSheet,
    dataSectionStacksSheet,
    dataSectionsSheet,
    dataSingersSheet,
    getRowsRange,
    clearDataSheets,
    initializeDataSheets,
    resetConfigurationSheet,
    outputChartSheet,
    outputListsSheet,
    getCharColumn
  };
}

export function references() {
  const cells = {
    configChoice: "C3",
    cAvailableRows: "C6",
    startingRow: "C9",
    sections: [12, 3, 4, 4], //C12:F15
    cGeneratedRows: [20, 3, 12, 2], //C20:D31
    sectionStacks: [36, 3, 10, 11], //C36:M45
    output: {
      chart: [1, 1], //A1
      fullList: [1, 1], //A1
      sectionList: [1, 5] //E1
    },
    data: {
      rows: [2, 1], //A2
      sections: [2, 1], //A2
      singers: [2, 1], //A2
      sectionStacks: [2, 2] //B2
    }
  };

  const dataPrefix = "INTERNAL | DO NOT CHANGE |";
  const outputPrefix = "OUTPUT |";
  const sheets = {
    Configuration: "Configuration",
    Input: "Input",
    Output: {
      Chart: `${outputPrefix} Seating Chart`,
      Lists: `${outputPrefix} Lists`
    },
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
