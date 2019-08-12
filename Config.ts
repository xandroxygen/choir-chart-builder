import { Config } from "./definitions";
import { Sheet, references } from "./Sheet";

export function Config() {
  function defaultConfigurations() {
    return {
      MC: {
        availableRows: 6,
        startingRow: "B",
        sections: {
          T2: colors().green,
          T1: colors().blue,
          B2: colors().red,
          B1: colors().yellow
        }
      } as Config
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
      // CC: {
      //   availableRows: 4,
      //   startingRow: "B",
      //   sections: {
      //     S1: colors().ltRed,
      //     S2: colors().red,
      //     A1: colors().ltYellow,
      //     A2: colors().yellow,
      //     T1: colors().ltGreen,
      //     T2: colors().green,
      //     B1: colors().ltBlue,
      //     B2: colors().blue
      //   }
      // } as Config
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

    const [r, c] = references().cells.sections;
    const numRows = Object.keys(config.sections).length;
    const values = Object.keys(config.sections).map(title => [title, ""]);
    const backgroundValues = Object.keys(config.sections).map(title => [
      colors().grey,
      config.sections[title]
    ]);

    sheet
      .getRange(r, c, numRows, 2)
      .setValues(values)
      .setBackgrounds(backgroundValues);
  }

  function clearConfig() {
    const sheet = Sheet().configurationSheet();

    sheet.getRange(references().cells.cAvailableRows).setValue("");

    sheet.getRange(references().cells.startingRow).setValue("");

    const [r, c] = references().cells.sections;

    sheet
      .getRange(r, c, 8, 2)
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
