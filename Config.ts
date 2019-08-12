import { Config } from "./definitions";
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
      // WC: {
      //   availableRows: 6,
      //   startingRow: "B",
      //   sections: {
      //     S2: colors().green,
      //     S1: colors().blue,
      //     A2: colors().red,
      //     A1: colors().yellow
      //   }
      // } as Config,
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

    const values: string[][] = [];
    const backgroundValues: string[][] = [];
    for (let i = 0; i < 4; i++) {
      values.push([]);
      backgroundValues.push([]);
      for (let j = 0; j < 4; j++) {
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

    const [r, c] = references().cells.sections;
    sheet
      .getRange(r, c, 4, 4)
      .setValues(values)
      .setBackgrounds(backgroundValues);
  }

  function clearConfig() {
    const sheet = Sheet().configurationSheet();

    sheet.getRange(references().cells.cAvailableRows).setValue("");

    sheet.getRange(references().cells.startingRow).setValue("");

    const [r, c] = references().cells.sections;

    sheet
      .getRange(r, c, 4, 4)
      .setValue("")
      .setBackground(colors().grey);
  }

  return {
    defaultConfigurations,
    colors,
    showConfig,
    clearConfig
  };
}
