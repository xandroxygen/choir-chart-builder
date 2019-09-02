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

  function dataAlternateSectionsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Data.AlternateSections);
  }

  function dataSingersSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Data.Singers);
  }

  function dataAlternateSingersSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Data.AlternateSingers);
  }

  function dataSectionStacksSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Data.SectionStacks);
  }

  function outputChartSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Output.Chart);
  }

  function outputAlternateChartSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Output.AlternateChart);
  }

  function outputListsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Output.Lists);
  }

  function outputAlternateListsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    return getSheetByName(references().sheets.Output.AlternateLists);
  }

  function readInputData(): any[][] {
    try {
      // read input data from sheet
      const inputRange = Sheet()
        .getSheetByName(references().sheets.Input)
        .getDataRange();

      // set everything to text format
      inputRange.setNumberFormat("@");

      const inputData = inputRange.getValues();

      // remove header row
      inputData.shift();

      return inputData;
    } catch (e) {
      throw new Error(
        `Input data is somehow corrupted. Please examine and try again. Original error: ${e.message}`
      );
    }
  }

  function resetInputSheet() {
    const sheet = Sheet().getSheetByName(references().sheets.Input);
    sheet.clear();
    sheet
      .getRange("A1:D1")
      .setValues([["FIRST", "LAST", "SECTION", "HEIGHT"]])
      .setFontWeight("bold");
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
    dataAlternateSectionsSheet().clear();
    dataAlternateSingersSheet().clear();
  }

  function clearOutputSheets() {
    outputChartSheet().clear();
    outputListsSheet().clear();
    outputAlternateChartSheet().clear();
    outputAlternateListsSheet().clear();
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

    dataAlternateSingersSheet()
      .getRange("A1:E1")
      .setValues([["First Name", "Last Name", "Section", "Height", "Seat"]])
      .setFontWeight("bold");

    dataSectionsSheet()
      .getRange("A1:B1")
      .setValues([["Section Title", "Count"]])
      .setFontWeight("bold");

    dataAlternateSectionsSheet()
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

  function alert(message: string) {
    SpreadsheetApp.getUi().alert(message);
  }

  return {
    getSheetByName,
    configurationSheet,
    dataRowsSheet,
    dataSectionStacksSheet,
    dataSectionsSheet,
    dataAlternateSectionsSheet,
    dataSingersSheet,
    dataAlternateSingersSheet,
    readInputData,
    resetInputSheet,
    getRowsRange,
    clearDataSheets,
    clearOutputSheets,
    initializeDataSheets,
    resetConfigurationSheet,
    outputChartSheet,
    outputListsSheet,
    outputAlternateChartSheet,
    outputAlternateListsSheet,
    getCharColumn,
    alert
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
      Lists: `${outputPrefix} Lists`,
      AlternateChart: `${outputPrefix} Alternate Seating Chart`,
      AlternateLists: `${outputPrefix} Alternate Lists`
    },
    Data: {
      Rows: `${dataPrefix} Rows`,
      Sections: `${dataPrefix} Sections`,
      Singers: `${dataPrefix} Singers`,
      SectionStacks: `${dataPrefix} Section Stacks`,
      AlternateSingers: `${dataPrefix} Alternate Singers`,
      AlternateSections: `${dataPrefix} Alternate Sections`
    }
  };

  return {
    cells,
    sheets
  };
}
