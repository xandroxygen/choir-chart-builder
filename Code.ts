import { SectionTitle, Row, Section, Singer } from "./definitions";

/**
 * Converts height from "ft-in" to inches.
 * @param {string} height The height in "ft-in" format
 * @returns {number} The height in inches
 * @customfunction
 */
function convertHeight(height: string): number {
  let feet: number;
  let inches: number = 0;

  // if height is provided as "ft", convert without inches
  // +height provides number if valid, otherwise NaN
  if (!isNaN(+height)) {
    feet = +height;
  } else {
    [feet, inches] = height.split("-").map(s => parseFloat(s));
  }

  return feet * 12 + inches;
}

export function buildRows(
  total: number,
  availableRows: number,
  startingRow: string
): Row[] {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const startingRowIndex = alphabet.indexOf(startingRow.toUpperCase());

  if (startingRowIndex === -1) {
    throw Error("startingRow must be one letter");
  }

  // get letters for each needed row
  const rowLetters = alphabet.slice(
    startingRowIndex,
    startingRowIndex + availableRows
  );

  const seatsPerRow = Math.floor(total / availableRows);
  const remainder = total % availableRows;

  const rows = rowLetters.map(
    letter => ({ letter, seats: seatsPerRow } as Row)
  );

  // add 1 to the top {remainder} rows
  for (let i = 1; i < remainder + 1; i++) {
    rows[availableRows - i].seats += 1;
  }

  // create gaps of 2 between rows
  for (let i = 0; i < availableRows; i++) {
    // offset = (i - middle index) * 2
    // ^ this works for arrays with odd length
    // offset = ((i - index of middle floored) * 2) - 1
    const middleIndex = Math.floor((availableRows - 1) / 2);

    // for odd-length arrays, the middle index should be offset at 0
    // for even-length arrays, the "middle" index should be floored,
    // and the offset should start at -1
    const offset = (i - middleIndex) * 2 - 1;

    rows[i].seats += offset;
  }

  // check for overflow beyond max row size
  // start with the top row and bump down overflow
  const maxRowSize = 36;
  for (let i = availableRows - 1; i >= 0; i--) {
    if (rows[i].seats > maxRowSize) {
      if (i == 0) {
        // if the bottom row is overflowing, we have a problem
        throw new Error(
          "Number of rows and number of available seats isn't enough to contain everyone."
        );
      }

      // bump overflow down to the previous row
      const overflow = rows[i].seats - maxRowSize;
      rows[i].seats -= overflow;
      rows[i - 1].seats += overflow;
    }
  }

  return rows;
}

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

export function buildSingers(inputData: string[][]): Singer[] {
  return inputData.map(
    ([firstName, lastName, section, height]) =>
      ({
        firstName,
        lastName,
        section,
        height: convertHeight(height),
        seat: "A1"
      } as Singer)
  );
}

export function layoutSections(sectionStacks: number[][], rows: Row[]) {
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
  const sectionSeats = sectionStacks.map(_ =>
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
        sectionSeats[i][letter].push(k + 1);
      }
      startPoints[letter] = endPoint;
    }
  }

  // reset start points to midpoint
  for (let { letter } of rows) {
    startPoints[letter] = madsenMidpoint[letter];
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
        sectionSeats[i][letter].push(k + 1);
      }
      startPoints[letter] = endPoint;
    }
  }

  // check if row needs adjusting to fit within Madsen layout
  const maxRowSize = 36;
  for (let { letter } of rows) {
    // row is overflowing left, move right
    const leftOverflow = 1 - sectionSeats[0][letter][0];
    if (leftOverflow > 0) {
      for (let i = 0; i < sectionSeats.length; i++) {
        const section = sectionSeats[i][letter];

        // remove overflow from the left
        section.splice(0, leftOverflow);

        // add overflow back to the right
        const lastSeatNumber = section[section.length - 1];
        for (let j = lastSeatNumber; j < lastSeatNumber + leftOverflow; j++) {
          // add 1 because seat numbers are 1-based
          section.push(j + 1);
        }
      }
    }

    // row is overflowing right, move left
    const lastSection = sectionSeats[sectionSeats.length - 1][letter];
    const rightOverflow = lastSection[lastSection.length - 1] - maxRowSize;
    if (rightOverflow > 0) {
      for (let i = 0; i < sectionSeats.length; i++) {
        const section = sectionSeats[i][letter];

        // remove overflow from the right
        section.splice(-rightOverflow, rightOverflow);

        // add overflow back to the left
        const firstSeatNumber = section[0];
        for (
          let j = firstSeatNumber;
          j > firstSeatNumber - rightOverflow;
          j--
        ) {
          // subtract 1 because seat numbers are 1-based
          section.unshift(j - 1);
        }
      }
    }
  }

  return sectionSeats;
}
