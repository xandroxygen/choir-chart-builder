import { Section, Row, IncorrectPair } from "./definitions";
import { references, Sheet } from "./Sheet";
import { Config } from "./Config";

export function SectionStacks() {
  /**
   * Calculates seats per section per row.
   *
   * assumptions:
   * - there will be an even number of incorrect sections
   * - the incorrect sections will always be 1 off either way
   * - the number of positive incorrect sections will match the negative
   * - there will be an even number of incorrect rows
   *
   * @param sections
   * @param rows
   */
  function buildSectionStacks(sections: Section[], rows: Row[]): number[][] {
    const total: number = sections.reduce((total, s) => total + s.count, 0);

    // 1st dimension is sections, 2nd is rows
    const sectionStacks: number[][] = sections
      .map(section => section.count / total)
      .map(proportion => rows.map(row => Math.round(proportion * row.seats)));

    const [rowsForAdding, rowsForSubtracting] = rows.reduce(
      ([forAdding, forSubtracting], row, i) => {
        // sum up calculated row from stacks
        const rowCount = sectionStacks.reduce(
          (total, stack) => total + stack[i],
          0
        );

        // find imbalanced rows and note their indices
        if (rowCount < row.seats) {
          forAdding.push(i);
        } else if (rowCount > row.seats) {
          forSubtracting.push(i);
        }

        return [forAdding, forSubtracting];
      },
      [[], []] as [number[], number[]] // initial return values
    );

    const [sectionsForAdding, sectionsForSubtracting] = sections.reduce(
      ([forAdding, forSubtracting], section, i) => {
        // sum up calculated section from stack
        const sectionCount = sectionStacks[i].reduce((sum, c) => sum + c, 0);

        // find imbalanced sections and note their indices
        if (sectionCount < section.count) {
          forAdding.push(i);
        } else if (sectionCount > section.count) {
          forSubtracting.push(i);
        }
        return [forAdding, forSubtracting];
      },
      [[], []] as [number[], number[]] // initial return values
    );

    // to solve this problem just think about:
    //    rows to add, sections to add, rows to subtract, sections to subtract
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

    const rowCombinationsForAdjusting = findCombinationsForAdjusting(
      rowsForAdding,
      rowsForSubtracting
    );

    const sectionCombinationsForAdjusting = findCombinationsForAdjusting(
      sectionsForAdding,
      sectionsForSubtracting
    );

    for (let rowCombo of rowCombinationsForAdjusting) {
      for (let sectionCombo of sectionCombinationsForAdjusting) {
        // adjust stacks
        const resetAllRows = rowCombo.map(pair =>
          applyRowPair(pair, sectionStacks, rows)
        );
        const resetAllSections = sectionCombo.map(pair =>
          applySectionPair(pair, sectionStacks, rows)
        );

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

  /*
   * Build helpers
   */

  function findCombinationsForAdjusting(
    forAdding,
    forSubtracting
  ): IncorrectPair[][] {
    const combinations: IncorrectPair[][] = [];
    const firstRow = forSubtracting[0];

    do {
      // make a copy so shifting doesn't break things
      const forSubtractingCopy = [...forSubtracting];

      // create pairs without reusing rows
      const rowPairs: IncorrectPair[] = forAdding.map(forAdding => ({
        forAdding,
        forSubtracting: forSubtractingCopy.shift()
      }));
      combinations.push(rowPairs);

      // shift subtracting rows forward
      forSubtracting.push(forSubtracting.shift());

      // check if we have reached the beginning again
    } while (forSubtracting[0] !== firstRow);

    return combinations;
  }

  /**
   * apply pair of incorrect rows, one for adding and one for subtracting
   *
   * find the first column that is still valid when adjusted to make row counts match
   * @param rowPair
   * @returns a reset function that will undo the adjustments to section stacks
   */
  function applyRowPair(
    rowPair: IncorrectPair,
    sectionStacks: number[][],
    rows: Row[]
  ): Function {
    let adjustedColumnIndex: number;
    for (let k = 0; k < sectionStacks.length; k++) {
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
  }

  /**
   * apply pair of incorrect sections, one for adding and one for subtracting
   *
   * find the first row that is still valid when adjusted to make section counts match
   * @param sectionPair
   * @returns a reset function that will undo the adjustments to section stacks
   */
  function applySectionPair(
    sectionPair: IncorrectPair,
    sectionStacks: number[][],
    rows: Row[]
  ): Function {
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
  }

  /*
   * Sheet interface
   */
  function showSectionStacks(
    sectionStacks: number[][],
    rows: Row[],
    sections: Section[]
  ) {
    const [r, c] = references().cells.sectionStacks;
    const numRows = 1 + rows.length + 2; // header + rows + total + actual
    const numColumns = 1 + sections.length + 2; // header + sections + total + actual

    const values: any[][] = [];
    values.push(["", ...sections.map(s => s.title), "Total", "Desired Total"]);

    for (let i = rows.length - 1; i >= 0; i--) {
      const stackRow = sectionStacks.map(stack => stack[i]);
      const stackTotal = stackRow.reduce((total, num) => total + num, 0);
      values.push([rows[i].letter, ...stackRow, stackTotal, rows[i].seats]);
    }

    const stackTotals = sectionStacks.map(stack =>
      stack.reduce((total, num) => total + num, 0)
    );
    values.push(["Total", ...stackTotals, "", ""]);
    values.push(["Desired Total", ...sections.map(s => s.count), "", ""]);

    const sheet = Sheet().configurationSheet();

    sheet
      .getRange(r, c, numRows, numColumns)
      .setValues(values)
      .setBackground(Config().colors().grey);

    sheet.getRange(r, c, 1, numColumns).setFontWeight("bold");
    sheet.getRange(r, c, numRows, 1).setFontWeight("bold");
  }

  function getConfirmedSectionStacks(cSections: number, cRows: number) {
    const [r, c] = references().cells.sectionStacks;
    const values: number[][] = Sheet()
      .configurationSheet()
      .getRange(r + 1, c + 1, cRows, cSections)
      .getValues();

    // values need to be reversed and inverted for storage
    // reverse row order
    values.reverse();

    // invert rows and columns
    const sectionStacks: number[][] = [];
    for (let i = 0; i < cSections; i++) {
      const stack = values.map(row => row[i]);
      sectionStacks.push(stack);
    }

    return sectionStacks;
  }

  function saveSectionStacks(sectionStacks: number[][]) {
    const [r, c] = references().cells.data.sectionStacks;
    Sheet()
      .dataSectionStacksSheet()
      .getRange(r, c, sectionStacks.length, sectionStacks[0].length)
      .setValues(sectionStacks);
  }

  function readSectionStacks(): number[][] {
    const values = Sheet()
      .dataSectionStacksSheet()
      .getDataRange()
      .getValues();

    // remove header row
    values.shift();

    // remove first column
    return values.map(row => row.slice(1));
  }

  return {
    buildSectionStacks,
    saveSectionStacks,
    readSectionStacks,
    getConfirmedSectionStacks,
    showSectionStacks
  };
}
