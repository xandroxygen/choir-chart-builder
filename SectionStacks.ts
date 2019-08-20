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
   * - there will either be one or two rows of sections
   *
   * @param sections
   * @param rows
   */
  function buildSectionStacks(sections: Section[], rows: Row[]): number[][] {
    // 1st dimension is sections, 2nd is rows
    const sectionStacks = buildInitialSectionStacks(sections, rows);

    const [rowsForAdding, rowsForSubtracting] = rows.reduce(
      ([forAdding, forSubtracting], row, i) => {
        // sum up calculated row from stacks
        const rowCount = sectionStacks.reduce(
          (sum, stack) => sum + stack[i],
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

    const {
      rowCombinationsForAdjusting,
      sectionCombinationsForAdjusting
    } = buildCombinations(
      rowsForAdding,
      rowsForSubtracting,
      sectionsForAdding,
      sectionsForSubtracting,
      rows,
      sectionStacks
    );

    for (let rowCombo of rowCombinationsForAdjusting) {
      for (let sectionCombo of sectionCombinationsForAdjusting) {
        // adjust stacks
        const resetAllRows = rowCombo.map(pair =>
          applyRowPair(pair, sectionStacks)
        );
        const resetAllSections = sectionCombo.map(pair =>
          applySectionPair(pair, sectionStacks)
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

  function buildInitialSectionStacks(
    sections: Section[],
    rows: Row[]
  ): number[][] {
    const sectionConfig = Config().getSections();
    const configIsCC = Config().configIsCC();
    const total: number = sections.reduce((total, s) => total + s.count, 0);
    const rowMidpoint = Math.ceil(rows.length / 2);

    if (Config().configIsMC() || Config().configIsWC()) {
      return sections
        .map(section => section.count / total)
        .map(proportion => rows.map(row => Math.round(proportion * row.seats)));
    } else if (configIsCC) {
      // split the rows in half, and create section stacks for each half in the same way
      const topHalfSections = sectionConfig[0].map(config => config.title);

      return sections.map(section => {
        const isTopHalfSection = topHalfSections.indexOf(section.title) > -1;
        const proportion = (section.count / total) * 2;
        return rows.map((row, index) => {
          const isTopHalfRow = index >= rowMidpoint;
          return (isTopHalfRow && isTopHalfSection) ||
            (!isTopHalfRow && !isTopHalfSection)
            ? Math.round(proportion * row.seats)
            : 0;
        });
      });
    } else {
      throw new Error(
        "Currently, only two rows of sections are supported in the section order"
      );
    }
  }

  function buildCombinations(
    rowsForAdding: number[],
    rowsForSubtracting: number[],
    sectionsForAdding: number[],
    sectionsForSubtracting: number[],
    rows: Row[],
    sectionStacks: number[][]
  ): {
    rowCombinationsForAdjusting: any[];
    sectionCombinationsForAdjusting: any[];
  } {
    try {
      const rowMidpoint = Math.ceil(rows.length / 2);
      const sectionStackMidpoint = Math.ceil(sectionStacks.length / 2);

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

      if (Config().configIsCC()) {
        const [topHalfRowsForAdding, bottomHalfRowsForAdding] = getHalves(
          rowsForAdding,
          rowMidpoint
        );

        const [
          topHalfRowsForSubtracting,
          bottomHalfRowsForSubtracting
        ] = getHalves(rowsForSubtracting, rowMidpoint);

        const [
          topHalfSectionsForAdding,
          bottomHalfSectionsForAdding
        ] = getHalves(sectionsForAdding, sectionStackMidpoint);

        const [
          topHalfSectionsForSubtracting,
          bottomHalfSectionsForSubtracting
        ] = getHalves(sectionsForSubtracting, sectionStackMidpoint);

        return {
          rowCombinationsForAdjusting: [
            ...findCombinationsForAdjusting(
              topHalfRowsForAdding,
              topHalfRowsForSubtracting
            ),
            ...findCombinationsForAdjusting(
              bottomHalfRowsForAdding,
              bottomHalfRowsForSubtracting
            )
          ],

          sectionCombinationsForAdjusting: [
            ...findCombinationsForAdjusting(
              topHalfSectionsForAdding,
              topHalfSectionsForSubtracting
            ),
            ...findCombinationsForAdjusting(
              bottomHalfSectionsForAdding,
              bottomHalfSectionsForSubtracting
            )
          ]
        };
      } else {
        return {
          rowCombinationsForAdjusting: findCombinationsForAdjusting(
            rowsForAdding,
            rowsForSubtracting
          ),

          sectionCombinationsForAdjusting: findCombinationsForAdjusting(
            sectionsForAdding,
            sectionsForSubtracting
          )
        };
      }
    } catch (e) {
      Sheet().alert(
        `Some calculations went wrong, and section counts per row will not be adjusted automatically.
        Please adjust them manually, following the guidelines given.`
      );
      return {
        rowCombinationsForAdjusting: [],
        sectionCombinationsForAdjusting: []
      };
    }
  }

  function getHalves(arr, mid): [any[], any[]] {
    return [arr.filter(a => a < mid), arr.filter(a => a >= mid)];
  }

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
    sectionStacks: number[][]
  ): Function {
    if (rowPair.forAdding == null || rowPair.forSubtracting == null) {
      return () => {};
    }

    let adjustedColumnIndex: number;
    try {
      for (let k = 0; k < sectionStacks.length; k++) {
        // apply both changes
        sectionStacks[k][rowPair.forAdding] += 1;
        sectionStacks[k][rowPair.forSubtracting] -= 1;

        // check if both changes are valid
        const isPossibleColumn: boolean = [
          rowPair.forAdding,
          rowPair.forSubtracting
        ].every(l => {
          const isTopRow = l === sectionStacks[k].length - 1;
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
    } catch (e) {
      Sheet().alert(
        `Something went wrong when trying to adjust rows, and section counts per row may not be accurate.
        Please make sure to double check these counts, according to the guidelines.`
      );
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
    sectionStacks: number[][]
  ): Function {
    if (sectionPair.forAdding == null || sectionPair.forSubtracting == null) {
      return () => {};
    }

    let adjustedRowIndex: number;
    try {
      const sectionForSubtracting = sectionStacks[sectionPair.forSubtracting];
      const sectionForAdding = sectionStacks[sectionPair.forAdding];
      const rowCount = sectionForAdding.length;
      for (let k = 0; k < rowCount; k++) {
        const isTopRow = k === rowCount - 1;
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
    } catch (e) {
      Sheet().alert(
        `Something went wrong when trying to adjust sections, and section counts per row may not be accurate.
        Please make sure to double check these counts, according to the guidelines.`
      );
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
    try {
      const [r, c] = references().cells.sectionStacks;
      const numRows = 1 + rows.length + 2; // header + rows + total + actual
      const numColumns = 1 + sections.length + 2; // header + sections + total + actual

      const values: any[][] = [];
      values.push([
        "",
        ...sections.map(s => s.title),
        "Total",
        "Desired Total"
      ]);

      const startingRow = r + 1;
      const startingColumn = c + 1;
      const startingColumnChar = Sheet().getCharColumn(startingColumn);
      const column = Sheet().getCharColumn(
        startingColumn + sectionStacks.length - 1
      );
      for (let i = rows.length - 1; i >= 0; i--) {
        const stackRow = sectionStacks.map(stack => stack[i]);
        const row = startingRow + (rows.length - 1 - i);
        values.push([
          rows[i].letter,
          ...stackRow,
          `=SUM(${startingColumnChar}${row}:${column}${row})`,
          rows[i].seats
        ]);
      }

      const totalEquations = sectionStacks.map((_, i) => {
        const row = startingRow + rows.length - 1;
        const column = Sheet().getCharColumn(startingColumn + i);

        return `=SUM(${column}${startingRow}:${column}${row})`;
      });

      values.push(["Total", ...totalEquations, "", ""]);
      values.push(["Desired Total", ...sections.map(s => s.count), "", ""]);

      const sheet = Sheet().configurationSheet();

      sheet
        .getRange(r, c, numRows, numColumns)
        .setValues(values)
        .setBackground(Config().colors().grey);

      sheet.getRange(r, c, 1, numColumns).setFontWeight("bold");
      sheet.getRange(r, c, numRows, 1).setFontWeight("bold");
    } catch (e) {
      throw new Error(
        `Something went wrong while displaying seats per row per section: ${e.message}`
      );
    }
  }

  function getConfirmedSectionStacks(sections: Section[], rows: Row[]) {
    const [r, c] = references().cells.sectionStacks;
    const values: number[][] = Sheet()
      .configurationSheet()
      .getRange(r + 1, c + 1, rows.length, sections.length)
      .getValues();

    // values need to be reversed and inverted for storage
    // reverse row order
    values.reverse();

    // invert rows and columns
    const sectionStacks: number[][] = [];
    for (let i = 0; i < sections.length; i++) {
      const stack = values.map(row => row[i]);
      sectionStacks.push(stack);
    }

    // check if every user-provided value is a number
    if (sectionStacks.some(stack => stack.some(isNaN))) {
      throw new Error(
        `Make sure every seat count for sections and rows is a number, and try again.`
      );
    }

    // check that counts match for sections and rows
    for (let i = 0; i < sectionStacks.length; i++) {
      const stackTotal = sectionStacks[i].reduce((sum, c) => sum + c, 0);
      if (stackTotal !== sections[i].count) {
        throw new Error(
          "Section totals don't match, check totals and try again."
        );
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const rowTotal = sectionStacks.reduce((sum, stack) => sum + stack[i], 0);
      if (rowTotal !== rows[i].seats) {
        throw new Error("Row totals don't match, check totals and try again.");
      }
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
