import { Singer, Row, SectionTitle } from "./definitions";

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

  function displaySeatingChart(singers: Singer[]) {
    // sort singers into rows, indexed by letter
    const singersByRow = singers.reduce((rows, singer) => {
      if (!rows[singer.seat.row]) {
        rows[singer.seat.row] = [];
      }
      rows[singer.seat.row].push(singer);
      return rows;
    }, {});

    const sortedRows: { letter: string; singers: Singer[] }[] = Object.keys(
      singersByRow
    )
      // turn rows object into array of objects
      .reduce(
        (sorted, letter) => [
          ...sorted,
          { letter, singers: singersByRow[letter] }
        ],
        []
      )
      // sort rows by letter from largest to smallest
      .sort((a, b) => (a.letter > b.letter ? -1 : 1))
      // sort singers in rows by number from smallest to largest
      .map(row => {
        row.singers.sort((a: Singer, b: Singer) =>
          a.seat.num > b.seat.num ? 1 : -1
        );
        return row;
      });

    const maxRowSize = sortedRows.reduce(
      (max, row) => (row.singers.length > max ? row.singers.length : max),
      0
    );

    const seatNumbers = singers.map(s => s.seat.num);
    const maxSeatNumber = Math.max(...seatNumbers);
    const minSeatNumber = Math.min(...seatNumbers);

    const colors = {
      none: "white",
      green: "#a8d08d",
      blue: "#9cc3e6",
      red: "#ff5050",
      yellow: "#ffd965"
    };

    const sectionColors = {
      [SectionTitle.T2]: colors.green,
      [SectionTitle.T1]: colors.blue,
      [SectionTitle.B2]: colors.red,
      [SectionTitle.B1]: colors.yellow
    };

    const headerRow: any[] = ["", ""];
    const headerColorRow = [colors.none, colors.none];
    for (let i = minSeatNumber; i <= maxSeatNumber; i++) {
      headerRow.push(i);
      headerColorRow.push(colors.none);
    }

    const values: any[][] = [headerRow];
    const colorValues: string[][] = [headerColorRow];
    sortedRows.forEach(row => {
      const leftPadding = row.singers[0].seat.num - minSeatNumber;
      const rightPadding =
        maxSeatNumber - row.singers[row.singers.length - 1].seat.num;

      const rowValues = [row.letter, row.singers.length];
      const rowColorValues = [colors.none, colors.none];
      for (let i = 0; i < leftPadding; i++) {
        rowValues.push("");
        rowColorValues.push(colors.none);
      }
      rowValues.push(...row.singers.map(s => `${s.firstName} ${s.lastName}`));
      rowColorValues.push(...row.singers.map(s => sectionColors[s.section]));
      for (let i = 0; i < rightPadding; i++) {
        rowValues.push("");
        rowColorValues.push(colors.none);
      }

      values.push(rowValues);
      colorValues.push(rowColorValues);
    });

    const [r, c] = references().cells.output.chart;
    const numRows = 1 + sortedRows.length;
    const numColumns = 2 + maxRowSize;

    outputChartSheet().setRowHeights(1, numRows, 21);

    outputChartSheet()
      .getRange(r, c, numRows, 2)
      .setFontWeight("bold");

    outputChartSheet()
      .getRange(r, c, 1, numColumns)
      .setFontWeight("bold");

    outputChartSheet()
      .getRange(r, c, numRows, numColumns)
      .setValues(values)
      .setBackgrounds(colorValues);
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

  return {
    getSheetByName,
    configurationSheet,
    dataRowsSheet,
    dataSectionStacksSheet,
    dataSectionsSheet,
    dataSingersSheet,
    getAvailableRows,
    getStartingRow,
    getRowsRange,
    displaySeatingChart,
    clearDataSheets,
    initializeDataSheets,
    resetConfigurationSheet,
    outputChartSheet,
    outputListsSheet
  };
}

export function references() {
  const cells = {
    cAvailableRows: "A11",
    startingRow: "A14",
    cGeneratedRows: [2, 1],
    sectionStacks: [1, 4], //D1
    output: {
      chart: [1, 1] //A1
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
