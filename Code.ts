import { SectionTitle, Row, SectionNumbers } from "./definitions";

function buildChart() {
  const sheet = SpreadsheetApp.getActive().getSheetByName("Input");
  const inputData = sheet.getDataRange().getValues();
}

/**
 * Converts height from "ft-in" to inches.
 * @param {string} height The height in "ft-in" format
 * @returns {number} The height in inches
 * @customfunction
 */
function convertHeight(height: string): number {
  const [feet, inches] = height.split("-").map(s => parseFloat(s));
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

  const rowLetters = alphabet.slice(
    startingRowIndex,
    startingRowIndex + availableRows
  );
  return rowLetters.map(letter => ({ letter, seats: 0 } as Row));
}

export function getSeatsPerRow(total: number, rows: Row[]): Row[] {
  const cRows = rows.length;
  const seatsPerRow = Math.floor(total / cRows);
  const remainder = total % cRows;

  for (let i = 0; i < cRows; i++) {
    rows[i].seats = seatsPerRow;
  }

  // add 1 to the top {remainder} rows
  for (let i = 1; i < remainder + 1; i++) {
    rows[cRows - i].seats += 1;
  }

  // create gaps of 2 between rows
  for (let i = 0; i < cRows; i++) {
    // offset = (i - middle index) * 2
    // ^ this works for arrays with odd length
    // offset = ((i - index of middle floored) * 2) - 1
    const middleIndex = Math.floor(cRows / 2);

    // for odd-length arrays, the middle index should be offset at 0
    // for even-length arrays, the "middle" index should be floored,
    // and the offset should start at -1
    const offset = (i - middleIndex) * 2 - 1;

    rows[i].seats += offset;
  }

  // check for overflow beyond max row size
  // start with the top row and bump down overflow
  const maxRowSize = 36;
  for (let i = cRows - 1; i >= 0; i--) {
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

function getSeatsFromSection(sectionCounts: SectionNumbers[], rows: Row[]) {
  const total: number = sectionCounts.reduce(
    (total, section) => total + section.count,
    0
  );
  const proportions: number[] = sectionCounts.map(
    section => section.count / total
  );

  const sectionStacks: number[][] = proportions.map(proportion =>
    rows.map(row => proportion * row.seats)
  );

  for (let i = 0; i < rows.length; i++) {
    const isRowFull: boolean =
      sectionStacks.reduce((total, stack) => total + stack[i], 0) ===
      rows[i].seats;
  }
}
