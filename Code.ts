import { SectionTitle, Row, Section, Singer } from "./definitions";

/**
 * Converts height from "ft-in" to inches.
 * @param {string} height The height in "ft-in" format
 * @returns {number} The height in inches
 * @customfunction
 */
function convertHeight(height: string): number {
  let feet;
  let inches = 0;

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
    const middleIndex = Math.floor(availableRows / 2);

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

function getSeatsFromSection(sections: Section[], rows: Row[]) {
  const total: number = sections.reduce(
    (total, section) => total + section.count,
    0
  );
  const proportions: number[] = sections.map(section => section.count / total);

  const sectionStacks: number[][] = proportions.map(proportion =>
    rows.map(row => proportion * row.seats)
  );

  for (let i = 0; i < rows.length; i++) {
    const isRowFull: boolean =
      sectionStacks.reduce((total, stack) => total + stack[i], 0) ===
      rows[i].seats;
  }
}

export function buildSections(inputSections: string[]): Section[] {
  const sections = {
    [SectionTitle.T1]: {
      title: SectionTitle.T1,
      count: 0
    } as Section,
    [SectionTitle.T2]: {
      title: SectionTitle.T2,
      count: 0
    } as Section,
    [SectionTitle.B1]: {
      title: SectionTitle.B1,
      count: 0
    } as Section,
    [SectionTitle.B2]: {
      title: SectionTitle.B2,
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
