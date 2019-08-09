import { Section, SectionTitle, Row, SectionLayout } from "./definitions";
import { references, dataSectionsSheet } from "./sheet";

export function buildSections(inputSections: string[]): Section[] {
  const sections = {
    [SectionTitle.T2]: {
      title: SectionTitle.T2,
      count: 0
    } as Section,
    [SectionTitle.T1]: {
      title: SectionTitle.T1,
      count: 0
    } as Section,
    [SectionTitle.B2]: {
      title: SectionTitle.B2,
      count: 0
    } as Section,
    [SectionTitle.B1]: {
      title: SectionTitle.B1,
      count: 0
    } as Section
  };

  inputSections.forEach(
    inputSection => (sections[inputSection as SectionTitle].count += 1)
  );

  return Object.keys(sections).map(k => sections[k]);
}

export function layoutSections(
  sectionStacks: number[][],
  rows: Row[]
): SectionLayout[] {
  // midpoint of each row is after this seat number
  const madsenMidpoint = {
    J: 18,
    H: 18,
    G: 18,
    F: 17,
    E: 17,
    D: 17,
    C: 16,
    B: 16
  };

  // an array of sections, each containing rows,
  // indexed by letter, each containing the seat numbers for that row
  Logger.log("creating section layouts");
  const sectionLayouts: SectionLayout[] = sectionStacks.map(_ =>
    rows.reduce((ret, row) => {
      ret[row.letter] = [];
      return ret;
    }, {})
  );

  // start at the midpoint for every row
  let startPoints = {};
  for (let { letter } of rows) {
    startPoints[letter] = madsenMidpoint[letter];
  }

  Logger.log("counting seats left");
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
    startPoints[letter] = madsenMidpoint[letter];
  }

  Logger.log("counting seats right");
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
      Logger.log("overflowing left");
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
      Logger.log("overflowing right");
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

function peek(arr: any[]) {
  return arr[arr.length - 1];
}

export function saveSections(sections: Section[]) {
  const [r, c] = references().cells.data.sections;
  const values = sections.map(section => [section.title, section.count]);

  dataSectionsSheet()
    .getRange(r, c, sections.length, 2)
    .setValues(values);
}

export function readSections(): Section[] {
  const values = dataSectionsSheet()
    .getDataRange()
    .getValues();

  // remove header row
  values.shift();

  return values.map(([title, count]) => ({ title, count } as Section));
}
