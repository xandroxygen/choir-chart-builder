import {SectionTitle, Row, SectionNumbers} from "./definitions"

function buildChart() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Input');
  const inputData = sheet.getDataRange().getValues();
}

/**
 * Converts height from "ft-in" to inches.
 * @param {string} height The height in "ft-in" format
 * @returns {number} The height in inches
 * @customfunction
 */
function convertHeight(height: string) : number {
  const [feet, inches] = height.split("-").map(s => parseFloat(s));
  return (feet * 12) + inches;
}

export const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function buildRows(total: number, availableRows: number, startingRow: string): Row[] {
  if (!alphabet.includes(startingRow)) {
    throw Error("startingRow must be one upper-case letter");
  }

  const seatsPerRow = Math.floor(total / availableRows);  
  const startingRowIndex = alphabet.indexOf(startingRow);

  const rowLetters = alphabet.slice(startingRowIndex, startingRowIndex + availableRows);
  return rowLetters.map(letter => ({ letter, seats: seatsPerRow} as Row));
}

function getSeatsPerRow(total: number, availableRows: number, rows: Row[]): Row[]
{
  const remainder = total % availableRows;

  // add 1 to the top {remainder} rows
  for (let i = 0; i < remainder; i++)
  {
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
    const offset = ((i - middleIndex) * 2) - 1;
    
    rows[i].seats += offset;
  }

  // check for overflow beyond max row size
  // start with the top row and bump down overflow
  const maxRowSize = 36;
  for (let i = availableRows; i >= 0; i--) {
    if (rows[i].seats > maxRowSize) {
      if (i == 0) {
        // if the bottom row is overflowing, we have a problem
        throw new Error("Number of rows and number of available seats isn't enough to contain everyone.");
      }

      // bump overflow down to the previous row
      const overflow = rows[i].seats - maxRowSize;
      rows[i].seats -= overflow;
      rows[i - 1].seats += overflow;
    }
  }

  // move the 3-gap to between second and third
  // row, if there is one
  // start at the top and don't check the bottom row
  const gapToSwitch = rows[2].seats - rows[1].seats;
  for (let i = availableRows; i > 0; i--) {
    const gap = rows[i].seats - rows[i-1].seats;
    if (gap > 2 && i != 2) {
      const difference = gap - gapToSwitch;

    }
  }
  
  


  return [];
}

function getSeatsFromSection(sectionCounts: SectionNumbers[], rows: Row[]) {
  const total: number = sectionCounts.reduce((total, section) => total + section.count, 0);
  const proportions: number[] = sectionCounts.map(section => section.count / total);
  
  const sectionStacks: number[][] = proportions.map(proportion => 
    rows.map(row => proportion * row.seats)
  );

  for (let i = 0; i < rows.length; i++) {
    const isRowFull: boolean = sectionStacks.reduce((total, stack) => total + stack[i], 0) === rows[i].seats;
  }
}

function confirmRowCounts() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Confirmation');
  const rowCounts = sheet.getRange('A2:A7').getValues();
  sheet.getRange('C2:C7').setValues(rowCounts);
}