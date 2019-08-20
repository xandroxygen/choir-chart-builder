import { Section, Row, SectionLayout, SectionConfig } from "./definitions";
import { references, Sheet } from "./Sheet";
import { Config } from "./Config";

export function Sections() {
  function buildSections(
    inputSections: string[],
    sectionConfig: SectionConfig[]
  ): Section[] {
    const sections = sectionConfig.reduce((sections, { title }) => {
      sections[title] = {
        title,
        count: 0
      };
      return sections;
    }, {});

    try {
      inputSections.forEach(title => (sections[title].count += 1));
    } catch (e) {
      Sheet().alert(
        `Please check for incorrect section titles in Input sheet: ${e.message}`
      );
    }

    return Object.keys(sections).map(k => sections[k]);
  }

  function layoutSections(
    sectionStacks: number[][],
    rows: Row[]
  ): SectionLayout[] {
    try {
      return Config().configIsCC()
        ? layoutSectionsInTwoRows(sectionStacks, rows)
        : layoutSectionsInOneRow(sectionStacks, rows);
    } catch (e) {
      throw new Error(
        `Something went wrong laying out seats into sections. Please check input and configuration and start over: ${e.message}`
      );
    }
  }

  /**
   * lay out sections for choirs like CC,
   * where each section spans one half of the height of the choir,
   * and half of the section is on each row
   * the sections are not centered around the midpoint, but are just
   * filled in from left to right
   * @param sectionStacks
   * @param rows
   */
  function layoutSectionsInTwoRows(
    sectionStacks: number[][],
    rows: Row[]
  ): SectionLayout[] {
    // an array of sections, each containing rows,
    // indexed by letter, each containing the seat numbers for that row
    const sectionLayouts = initializeSectionLayouts(sectionStacks, rows);

    // start at the beginning of each row
    // where the row is centered around the midpoint
    const midpoints = madsenMidpoints();
    let startPoints = {};
    for (let row of rows) {
      startPoints[row.letter] =
        midpoints[row.letter] - Math.ceil(row.seats / 2);
    }

    for (let i = 0; i < sectionStacks.length; i++) {
      const stack = sectionStacks[i];
      for (let j = 0; j < stack.length; j++) {
        if (stack[j] > 0) {
          const letter = rows[j].letter;
          const startPoint = startPoints[letter];
          const endPoint = startPoint + stack[j];
          for (let k = startPoint; k < endPoint; k++) {
            // add 1 because seat numbers are 1-based
            sectionLayouts[i][letter].push(k + 1);
          }
          startPoints[letter] = endPoint;
        }
      }
    }

    return sectionLayouts;
  }

  /**
   * lay out sections for choirs like MC and WC,
   * where each section spans from top to bottom of the choir
   * and the sections are centered around the midpoint
   * @param sectionStacks
   * @param rows
   */
  function layoutSectionsInOneRow(
    sectionStacks: number[][],
    rows: Row[]
  ): SectionLayout[] {
    // an array of sections, each containing rows,
    // indexed by letter, each containing the seat numbers for that row
    const sectionLayouts = initializeSectionLayouts(sectionStacks, rows);

    // start at the midpoint for every row
    const midpoints = madsenMidpoints();
    let startPoints = {};
    for (let { letter } of rows) {
      startPoints[letter] = midpoints[letter];
    }

    // for each section left of the midpoint and row in the section,
    // count out the seat numbers from the start point on the right
    // to the end point on the left
    // and store them in sectionSeats[section][row.letter]
    for (let i = sectionStacks.length / 2 - 1; i >= 0; i--) {
      const stack = sectionStacks[i];
      for (let j = 0; j < stack.length; j++) {
        const letter = rows[j].letter;
        const startPoint = startPoints[letter];
        const endPoint = startPoint - stack[j];
        for (let k = endPoint; k < startPoint; k++) {
          // add 1 because seat numbers are 1-based
          sectionLayouts[i][letter].push(k + 1);
        }
        startPoints[letter] = endPoint;
      }
    }

    // reset start points to midpoint
    for (let { letter } of rows) {
      startPoints[letter] = midpoints[letter];
    }

    // for each section right of the midpoint and row in the section,
    // count out the seat numbers from the start point on the left
    // to the end point on the right
    // and store them in sectionSeats[section][row.letter]
    for (let i = sectionStacks.length / 2; i < sectionStacks.length; i++) {
      const stack = sectionStacks[i];
      for (let j = 0; j < stack.length; j++) {
        const letter = rows[j].letter;
        const startPoint = startPoints[letter];
        const endPoint = startPoint + stack[j];
        for (let k = startPoint; k < endPoint; k++) {
          // add 1 because seat numbers are 1-based
          sectionLayouts[i][letter].push(k + 1);
        }
        startPoints[letter] = endPoint;
      }
    }

    // check if row needs adjusting to fit within Madsen layout
    const maxRowSize = 36;
    for (let { letter } of rows) {
      // row is overflowing left, move right
      const leftOverflow = 1 - sectionLayouts[0][letter][0];
      if (leftOverflow > 0) {
        for (let layout of sectionLayouts) {
          const row = layout[letter] as number[];

          // remove overflow from the left
          row.splice(0, leftOverflow);

          // add overflow back to the right
          const lastInRow = peek(row);
          for (let j = lastInRow; j < lastInRow + leftOverflow; j++) {
            // add 1 because seat numbers are 1-based
            row.push(j + 1);
          }
        }
      }

      // row is overflowing right, move left
      const lastSection = peek(sectionLayouts)[letter] as number[];
      const rightOverflow = peek(lastSection) - maxRowSize;
      if (rightOverflow > 0) {
        for (let layout of sectionLayouts) {
          const row = layout[letter] as number[];

          // remove overflow from the right
          row.splice(-rightOverflow, rightOverflow);

          // add overflow back to the left
          const firstInRow = row[0];
          for (let j = firstInRow; j > firstInRow - rightOverflow; j--) {
            // subtract 1 because seat numbers are 1-based
            row.unshift(j - 1);
          }
        }
      }
    }

    return sectionLayouts;
  }

  function madsenMidpoints() {
    // midpoint of each row is after this seat number
    return {
      J: 18,
      H: 18,
      G: 18,
      F: 17,
      E: 17,
      D: 17,
      C: 16,
      B: 16
    };
  }

  function initializeSectionLayouts(
    sectionStacks: number[][],
    rows: Row[]
  ): SectionLayout[] {
    return sectionStacks.map(_ =>
      rows.reduce((ret, row) => {
        ret[row.letter] = [];
        return ret;
      }, {})
    );
  }

  function peek(arr: any[]) {
    return arr[arr.length - 1];
  }

  function saveSections(sections: Section[]) {
    const [r, c] = references().cells.data.sections;
    const values = sections.map(section => [section.title, section.count]);

    Sheet()
      .dataSectionsSheet()
      .getRange(r, c, sections.length, 2)
      .setValues(values);
  }

  function readSections(): Section[] {
    const values = Sheet()
      .dataSectionsSheet()
      .getDataRange()
      .getValues();

    // remove header row
    values.shift();

    return values.map(([title, count]) => ({ title, count } as Section));
  }

  return {
    buildSections,
    layoutSections,
    saveSections,
    readSections
  };
}
