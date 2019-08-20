import { Config, SectionConfig } from "./definitions";
import { Sheet, references } from "./Sheet";

export function Config() {
  function defaultConfigurations() {
    return {
      MC: {
        availableRows: 6,
        startingRow: "B",
        sections: [
          [
            { title: "T2", color: colors().green },
            { title: "T1", color: colors().blue },
            { title: "B2", color: colors().red },
            { title: "B1", color: colors().yellow }
          ]
        ]
      } as Config,
      WC: {
        availableRows: 6,
        startingRow: "B",
        sections: [
          [
            { title: "S2", color: colors().green },
            { title: "S1", color: colors().blue },
            { title: "A2", color: colors().red },
            { title: "A1", color: colors().yellow }
          ]
        ]
      } as Config,
      CC: {
        availableRows: 4,
        startingRow: "B",
        sections: [
          [
            { title: "B1", color: colors().ltBlue },
            { title: "B2", color: colors().blue },
            { title: "T1", color: colors().ltGreen },
            { title: "T2", color: colors().green }
          ],
          [
            { title: "S1", color: colors().ltRed },
            { title: "S2", color: colors().red },
            { title: "A1", color: colors().ltYellow },
            { title: "A2", color: colors().yellow }
          ]
        ]
      } as Config
    };
  }

  function colors() {
    return {
      none: "white",
      grey: "#cccccc",
      green: "#a8d08d",
      blue: "#9cc3e6",
      red: "#ff5050",
      yellow: "#ffd965",
      ltGreen: "#e2ebda",
      ltYellow: "#fbe0d5",
      ltBlue: "#dde9f4",
      ltRed: "#f4aaaf"
    };
  }

  function showConfig(config: Config) {
    const sheet = Sheet().configurationSheet();

    sheet
      .getRange(references().cells.cAvailableRows)
      .setValue(config.availableRows);

    sheet.getRange(references().cells.startingRow).setValue(config.startingRow);

    const [r, c, numRows, numColumns] = references().cells.sections;
    const values: string[][] = [];
    const backgroundValues: string[][] = [];

    for (let i = 0; i < numRows; i++) {
      values.push([]);
      backgroundValues.push([]);
      for (let j = 0; j < numColumns; j++) {
        values[i].push("");
        backgroundValues[i].push(colors().grey);
      }
    }

    for (let i = 0; i < config.sections.length; i++) {
      const row = config.sections[i];
      for (let j = 0; j < row.length; j++) {
        values[i][j] = row[j].title;
        backgroundValues[i][j] = row[j].color;
      }
    }

    sheet
      .getRange(r, c, numRows, numColumns)
      .setValues(values)
      .setBackgrounds(backgroundValues);
  }

  function clearConfig() {
    const sheet = Sheet().configurationSheet();
    const cellReferences = references().cells;

    sheet.getRange(cellReferences.configChoice).setValue("");

    sheet.getRange(cellReferences.cAvailableRows).setValue("");

    sheet.getRange(cellReferences.startingRow).setValue("");

    let [r, c, numRows, numColumns] = cellReferences.sections;

    sheet
      .getRange(r, c, numRows, numColumns)
      .setValue("")
      .setBackground(colors().grey);

    [r, c, numRows, numColumns] = cellReferences.cGeneratedRows;

    sheet
      .getRange(r, c, numRows, numColumns)
      .setValue("")
      .setBackground(colors().grey);

    [r, c, numRows, numColumns] = cellReferences.sectionStacks;

    sheet
      .getRange(r, c, numRows, numColumns)
      .setValue("")
      .setBackground(colors().grey);
  }

  function getSections(): SectionConfig[][] {
    const [r, c, numRows, numColumns] = references().cells.sections;
    const range = Sheet()
      .configurationSheet()
      .getRange(r, c, numRows, numColumns);

    const values = range.getValues();
    const colorValues = range.getBackgrounds();
    const sections: SectionConfig[][] = [];

    for (let i = 0; i < values.length; i++) {
      sections.push([]);
      for (let j = 0; j < values[i].length; j++) {
        if (values[i][j] !== "")
          sections[i].push({ title: values[i][j], color: colorValues[i][j] });
      }
    }

    return sections.filter(s => s.length > 0);
  }

  function getFlatSections(): SectionConfig[] {
    return [].concat(...getSections());
  }

  function getAvailableRows(): number {
    return parseInt(
      Sheet()
        .configurationSheet()
        .getRange(references().cells.cAvailableRows)
        .getValue()
    );
  }

  function getStartingRow(): string {
    return Sheet()
      .configurationSheet()
      .getRange(references().cells.startingRow)
      .getValue();
  }

  function getConfigChoice(): string {
    return Sheet()
      .configurationSheet()
      .getRange(references().cells.configChoice)
      .getValue();
  }

  function configIsCC(): boolean {
    return getConfigChoice() === "CC";
  }

  function configIsMC(): boolean {
    return getConfigChoice() === "MC";
  }

  function configIsWC(): boolean {
    return getConfigChoice() === "WC";
  }

  return {
    defaultConfigurations,
    colors,
    showConfig,
    clearConfig,
    getAvailableRows,
    getStartingRow,
    getSections,
    getFlatSections,
    configIsCC,
    configIsMC,
    configIsWC
  };
}
