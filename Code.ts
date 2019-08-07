import {
  SectionTitle,
  Row,
  Section,
  Singer,
  IncorrectPair
} from "./definitions";

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

export function getSeatsFromSection(
  sections: Section[],
  rows: Row[]
): number[][] {
  const total: number = sections.reduce(
    (total, section) => total + section.count,
    0
  );
  const proportions: number[] = sections.map(section => section.count / total);

  // 1st dimension is sections, 2nd is rows
  const sectionStacks: number[][] = proportions.map(proportion =>
    rows.map(row => Math.round(proportion * row.seats))
  );

  const stackCounts = sectionStacks.map(stack =>
    stack.reduce((sum, num) => sum + num, 0)
  );

  const rowCounts = rows.map((row, i) =>
    sectionStacks.reduce((total, stack) => total + stack[i], 0)
  );

  // assumptions:
  // - there will be an even number of incorrect sections
  // - the incorrect sections will always be 1 off either way
  // - the number of positive incorrect sections will match the negative
  // - there will be an even number of incorrect rows

  const rowsForSubtracting: number[] = [];
  const rowsForAdding: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (rowCounts[i] < rows[i].seats) {
      rowsForAdding.push(i);
    } else if (rowCounts[i] > rows[i].seats) {
      rowsForSubtracting.push(i);
    }
  }

  const sectionsForSubtracting: number[] = [];
  const sectionsForAdding: number[] = [];
  for (let i = 0; i < sections.length; i++) {
    if (stackCounts[i] < sections[i].count) {
      sectionsForAdding.push(i);
    } else if (stackCounts[i] > sections[i].count) {
      sectionsForSubtracting.push(i);
    }
  }

  // JUST KIDDING
  // instead of adjusting rows and sections, I need to be adjusting only the section stacks
  // keep the indices of the positive/negative rows/sections, instead of actual rows/sections
  // adjust the rows, check if it fits
  // adjust the sections, check if it fits
  // adjust both, check if it fits?

  // JUST KIDDING SOME MORE
  // instead of thinking about it in pairs just think about rows to add, sections to add, rows to subtract, sections to subtract
  // and all possible combos of those
  // ie rows to add: 2,4
  // rows to subtract: 3,5
  // sections to add: 0, 2
  // sections to subtract: 1, 3
  // combos:
  // - s 0,1 2,3 r 2,3 4,5
  // - s 0,1 2,3 r 2,5 4,3
  // - s 0,3 2,1 r 2,3 4,5
  // - s 0,3 2,1 r 2,5 4,3
  // so construct row/section pairs separately and then iterate over both

  // while subtracting rows aren't exhausted
  //    make a copy of subtracting rows
  //    for each row that needs adding
  //      shift the first subtracting row from copy
  //      make a pair
  //    shift subtracting rows forward
  //    check if we have finished cycling
  const rowCombinationsForAdjusting: IncorrectPair[][] = [];
  let finishedCyclingSubtractedRows = false;
  const firstRowForSubtracting = rowsForSubtracting[0];
  while (!finishedCyclingSubtractedRows) {
    // make a copy so shifting doesn't break things
    const rowsForSubtractingCopy = [...rowsForSubtracting];
    const rowPairs: IncorrectPair[] = [];

    // create pairs without reusing rows
    rowsForAdding.forEach(forAdding => {
      const forSubtracting = rowsForSubtractingCopy.shift();
      rowPairs.push({ forAdding, forSubtracting });
    });
    rowCombinationsForAdjusting.push(rowPairs);

    // shift subtracting rows forward
    rowsForSubtracting.push(rowsForSubtracting.shift());

    // check if we have reached the beginning again
    finishedCyclingSubtractedRows =
      rowsForSubtracting[0] === firstRowForSubtracting;
  }

  const sectionCombinationsForAdjusting: IncorrectPair[][] = [];
  let finishedCyclingSubtractedSections = false;
  const firstSectionForSubtracting = sectionsForSubtracting[0];
  while (!finishedCyclingSubtractedSections) {
    // make a copy so shifting doesn't break things
    const sectionsForSubtractingCopy = [...sectionsForSubtracting];
    const sectionPairs: IncorrectPair[] = [];

    // create pairs without reusing rows
    sectionsForAdding.forEach(forAdding => {
      const forSubtracting = sectionsForSubtractingCopy.shift();
      sectionPairs.push({ forAdding, forSubtracting });
    });
    sectionCombinationsForAdjusting.push(sectionPairs);

    // shift subtracting rows forward
    sectionsForSubtracting.push(sectionsForSubtracting.shift());

    // check if we have reached the beginning again
    finishedCyclingSubtractedSections =
      sectionsForSubtracting[0] === firstSectionForSubtracting;
  }

  const applyRowPair = (rowPair: IncorrectPair): Function => {
    let adjustedColumnIndex: number;
    for (let k = 0; k < sections.length; k++) {
      // apply both changes
      sectionStacks[k][rowPair.forAdding] += 1;
      sectionStacks[k][rowPair.forSubtracting] -= 1;

      // check if both changes are valid
      const isPossibleColumn: boolean = [
        rowPair.forAdding,
        rowPair.forSubtracting
      ].every(l => {
        const isTopRow = l === rows.length - 1;
        const isBottomRow = l === 0;
        const rowValue = sectionStacks[k][l];

        const isGteRowBelow =
          isBottomRow || rowValue >= sectionStacks[k][l - 1];
        const isCloseToRowBelow =
          isBottomRow || rowValue - sectionStacks[k][l - 1] < 2;
        const isLteRowAbove = isTopRow || rowValue <= sectionStacks[k][l + 1];
        const isCloseToRowAbove =
          isTopRow || sectionStacks[k][l + 1] - rowValue < 2;

        return isGteRowBelow && isLteRowAbove;
      });

      if (isPossibleColumn) {
        // use these changes
        adjustedColumnIndex = k;
        break;
      } else {
        // reset these changes
        sectionStacks[k][rowPair.forAdding] -= 1;
        sectionStacks[k][rowPair.forSubtracting] += 1;
      }
    }

    const reset = () => {
      if (adjustedColumnIndex != null) {
        sectionStacks[adjustedColumnIndex][rowPair.forAdding] -= 1;
        sectionStacks[adjustedColumnIndex][rowPair.forSubtracting] += 1;
      }
    };

    // if row and section changes don't work out, provide a way to reset later
    return reset;
  };

  const applySectionPair = (sectionPair: IncorrectPair): Function => {
    let adjustedRowIndex: number;
    const sectionForSubtracting = sectionStacks[sectionPair.forSubtracting];
    const sectionForAdding = sectionStacks[sectionPair.forAdding];
    for (let k = 0; k < rows.length; k++) {
      const isTopRow = k === rows.length - 1;
      const isBottomRow = k === 0;

      // row works for subtracting if the remaining number in that row is gte the row below it, (unless it's the bottom row)
      // and the difference between the remaining number in that row and the row above is less than 2 (unless it's the top row)
      const isGteRowBelow =
        isBottomRow ||
        sectionForSubtracting[k] + 1 >= sectionForSubtracting[k - 1];
      const isCloseToRowAbove =
        isTopRow ||
        sectionForSubtracting[k + 1] - sectionForSubtracting[k] + 1 < 2;
      const isPossibleRowForSubtracting = isGteRowBelow && isCloseToRowAbove;

      // row works for adding if the remaining number in that row is lte the row above it (unless it's the top row),
      // and the difference between the remaining number in that row and the row below is lt 2 (unless it's the bottom row)
      const isLteRowAbove =
        isTopRow || sectionForAdding[k] + 1 <= sectionForAdding[k + 1];
      const isCloseToRowBelow =
        isBottomRow || sectionForAdding[k] + 1 - sectionForAdding[k - 1] < 2;
      const isPossibleRowForAdding = isLteRowAbove && isCloseToRowBelow;

      if (isPossibleRowForAdding && isPossibleRowForSubtracting) {
        sectionForAdding[k] += 1;
        sectionForSubtracting[k] -= 1;
        adjustedRowIndex = k;
        break;
      }
    }
    const reset = () => {
      if (adjustedRowIndex != null) {
        sectionStacks[sectionPair.forAdding][adjustedRowIndex] -= 1;
        sectionStacks[sectionPair.forSubtracting][adjustedRowIndex] += 1;
      }
    };
    return reset;
  };

  for (let rowCombo of rowCombinationsForAdjusting) {
    for (let sectionCombo of sectionCombinationsForAdjusting) {
      // adjust stacks
      const resetAllRows = rowCombo.map(pair => applyRowPair(pair));
      const resetAllSections = sectionCombo.map(pair => applySectionPair(pair));

      const areRowsFull = rows
        .map((_, i) =>
          sectionStacks.reduce((total, stack) => total + stack[i], 0)
        )
        .every((count, i) => count === rows[i].seats);
      const areSectionsFull = sectionStacks
        .map(stack => stack.reduce((sum, num) => sum + num, 0))
        .every((count, i) => count === sections[i].count);

      if (areRowsFull && areSectionsFull) {
        // proper alignment found
        break;
      } else {
        // reset stacks
        resetAllRows.forEach(resetRow => resetRow());
        resetAllSections.forEach(resetSection => resetSection());
      }
    }
  }

  // assumptions
  // - by this point the incorrect things are fixed
  // - or we never had any to begin with
  // present these changes to the user and let them verify and tweak if needed
  return sectionStacks;
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
