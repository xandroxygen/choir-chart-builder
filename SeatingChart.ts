import { Singer, FailedUpdate, SectionConfig } from "./definitions";
import { Sheet, references } from "./Sheet";
import { Config } from "./Config";

export function SeatingChart() {
  function displayChartAlternate(
    singers: Singer[],
    sectionConfig: SectionConfig[]
  ) {
    return displayChart(singers, sectionConfig, true);
  }

  function displayChart(
    singers: Singer[],
    sectionConfig: SectionConfig[],
    isAlternate: boolean = false
  ) {
    try {
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
      const blankColor = Config().colors().none;

      const sectionColors = sectionConfig.reduce((colors, config) => {
        colors[config.title] = config.color;
        return colors;
      }, {});
      const getSectionColor = getSectionColorBuilder(
        sectionColors,
        Config().colors(),
        isAlternate,
        Config().configIsCC()
      );

      const headerRow: any[] = ["", ""];
      const headerColorRow = [blankColor, blankColor];
      for (let i = minSeatNumber; i <= maxSeatNumber; i++) {
        headerRow.push(i);
        headerColorRow.push(blankColor);
      }

      const values: any[][] = [headerRow];
      const colorValues: string[][] = [headerColorRow];
      sortedRows.forEach(row => {
        const leftPadding = row.singers[0].seat.num - minSeatNumber;
        const rightPadding =
          maxSeatNumber - row.singers[row.singers.length - 1].seat.num;

        const rowValues = [row.letter, row.singers.length];
        const rowColorValues = [blankColor, blankColor];
        for (let i = 0; i < leftPadding; i++) {
          rowValues.push("");
          rowColorValues.push(blankColor);
        }
        rowValues.push(...row.singers.map(s => `${s.firstName} ${s.lastName}`));
        rowColorValues.push(...row.singers.map(s => getSectionColor(s)));
        for (let i = 0; i < rightPadding; i++) {
          rowValues.push("");
          rowColorValues.push(blankColor);
        }

        values.push(rowValues);
        colorValues.push(rowColorValues);
      });

      const [r, c] = references().cells.output.chart;
      const numRows = values.length;
      const numColumns = values[0].length;

      const sheet = getChartSheet(isAlternate);

      sheet
        .getRange(r, c, numRows, numColumns)
        .setValues(values)
        .setBackgrounds(colorValues)
        .setFontWeight("normal");

      sheet.getRange(r, c, 1, numColumns).setFontWeight("bold");
      sheet.getRange(r, c, numRows, 2).setFontWeight("bold");
      sheet.setRowHeights(1, numRows, 21);
    } catch (e) {
      throw new Error(
        `Something went wrong displaying the seating chart. Input data may be incorrect, try again or start over: ${e.message}`
      );
    }
  }

  function getSectionColorBuilder(
    sectionColors,
    allColors,
    isAlternate: boolean,
    isConfigCC: boolean
  ): Function {
    // cache values once and return a function that only
    // takes the singer for faster iteration

    if (isAlternate && !isConfigCC) {
      // for octet layout specifically
      // rotate through almost all available colors
      // use an odd number so that it fits better
      const colorKeys = Object.keys(allColors).splice(2, 5);
      const colorCount = colorKeys.length;

      return (singer: Singer): string => {
        // pull number out of section, eg "O12" -> 12
        const sectionNumber = parseInt(singer.section.slice(1));
        // rotate through all available colors
        const colorKey = colorKeys[sectionNumber % colorCount];
        return allColors[colorKey];
      };
    } else {
      // otherwise look up color normally
      return (singer: Singer): string => sectionColors[singer.section];
    }
  }

  function displayFullListAlternate(singers: Singer[]) {
    return displayFullList(singers, true);
  }

  function displayFullList(singers: Singer[], isAlternate: boolean = false) {
    try {
      const sheet = getListsSheet(isAlternate);
      const [r, c] = references().cells.output.fullList;

      const values = [
        ["First Name", "Last Name", "Seat"],
        ...singers.map(singer => [
          singer.firstName,
          singer.lastName,
          `${singer.seat.row}${singer.seat.num}`
        ])
      ];

      sheet.getRange(r, c, 1 + singers.length, 3).setValues(values);
      sheet.getRange(r, c, 1, 3).setFontWeight("bold");
    } catch (e) {
      throw new Error(
        `Something went wrong displaying the list of singers. Input data may be incorrect, try again or start over: ${e.message}`
      );
    }
  }

  function displayListBySectionAlternate(singers: Singer[]) {
    return displayListBySection(singers, true);
  }

  function displayListBySection(
    singers: Singer[],
    isAlternate: boolean = false
  ) {
    try {
      const sheet = getListsSheet(isAlternate);
      const [r, c] = references().cells.output.sectionList;

      const singersBySection = singers.reduce((sections, singer) => {
        if (!sections[singer.section]) {
          sections[singer.section] = [];
        }
        sections[singer.section].push(singer);
        return sections;
      }, {});

      const sections: { title: string; singers: Singer[] }[] = Object.keys(
        singersBySection
      )
        .reduce(
          (sections, title) => [
            ...sections,
            { title, singers: singersBySection[title] }
          ],
          []
        )
        .map(section => {
          section.singers.sort((a: Singer, b: Singer) =>
            a.lastName > b.lastName ? 1 : -1
          );
          return section;
        });

      const maxSectionSize = Math.max(...sections.map(s => s.singers.length));

      const titleRow = [];
      const headerRow = [];
      for (let section of sections) {
        titleRow.push(...[section.title, "", "", ""]);
        headerRow.push(...["First Name", "Last Name", "Seat", ""]);
      }
      const values = [titleRow, headerRow];

      for (let i = 0; i < maxSectionSize; i++) {
        const rowValues = [];
        for (let section of sections) {
          if (section.singers.length > 0) {
            const singer = section.singers.shift();
            rowValues.push(
              ...[
                singer.firstName,
                singer.lastName,
                `${singer.seat.row}${singer.seat.num}`,
                ""
              ]
            );
          } else {
            rowValues.push(...["", "", "", ""]);
          }
        }
        values.push(rowValues);
      }

      const numRows = 2 + maxSectionSize;
      const numColumns = sections.length * 4;
      sheet.getRange(r, c, numRows, numColumns).setValues(values);
      sheet.getRange(r, c, 2, numColumns).setFontWeight("bold");
    } catch (e) {
      throw new Error(
        `Something went wrong displaying the lists of singers by section. Input data may be incorrect, try again or start over: ${e.message}`
      );
    }
  }

  function readChartAlternate(singers: Singer[]) {
    return readChart(singers, true);
  }

  function readChart(
    singers: Singer[],
    isAlternate: boolean = false
  ): [Singer[], FailedUpdate[]] {
    const sheet = getChartSheet(isAlternate);
    const values = sheet.getDataRange().getValues();

    const seatsFromChart = [];

    for (let i = 1; i < values.length; i++) {
      for (let j = 2; j < values[i].length; j++) {
        const row = values[i][0];
        const num = values[0][j];
        const name = values[i][j];
        if (name !== "")
          seatsFromChart.push({ row, num, name, cell: { r: i + 1, c: j + 1 } });
      }
    }

    // assumption:
    // - no two singers will ever have the exact same name
    const singersByName = singers.reduce((byName, singer) => {
      const name = `${singer.firstName} ${singer.lastName}`;
      byName[name] = singer;
      return byName;
    }, {});

    const failedUpdates = [];
    seatsFromChart.forEach(({ row, num, name, cell }) => {
      const singer: Singer = singersByName[name];
      if (!singer) {
        failedUpdates.push({ name, cell });
      } else if (singer.seat.row !== row || singer.seat.num !== num) {
        singer.seat = { row, num };
      }
    });

    return [
      Object.keys(singersByName).map(name => singersByName[name]),
      failedUpdates
    ];
  }

  function displayFailedUpdatesAlternate(failedUpdates: FailedUpdate[]) {
    return displayFailedUpdates(failedUpdates, true);
  }

  function displayFailedUpdates(
    failedUpdates: FailedUpdate[],
    isAlternate: boolean = false
  ) {
    const failedUpdateValues = [];
    failedUpdates.forEach(({ name, cell }) => {
      const range = getChartSheet(isAlternate).getRange(cell.r, cell.c);

      range
        .setBackground("red")
        .setFontWeight("bold")
        .setValue(name);

      failedUpdateValues.push(`${name}, ${range.getA1Notation()}`);
    });

    if (failedUpdateValues.length > 0)
      Sheet().alert(
        `The following singers weren't updated because of spelling errors,
        and have been highlighted in red:
        ${failedUpdateValues}
        Chart and lists are not accurate until this is fixed.
        Please make your updates again, and re-save.`
      );
  }

  function getChartSheet(isAlternate: boolean = false) {
    return isAlternate
      ? Sheet().outputAlternateChartSheet()
      : Sheet().outputChartSheet();
  }

  function getListsSheet(isAlternate: boolean = false) {
    return isAlternate
      ? Sheet().outputAlternateListsSheet()
      : Sheet().outputListsSheet();
  }

  return {
    displayChart,
    displayChartAlternate,
    displayFullList,
    displayFullListAlternate,
    displayListBySection,
    displayListBySectionAlternate,
    readChart,
    readChartAlternate,
    displayFailedUpdates,
    displayFailedUpdatesAlternate
  };
}
