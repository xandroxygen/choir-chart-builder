import { Row } from "./definitions";
import { references, Sheet } from "./Sheet";

export function Rows() {
  function buildRows(
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

  function setGeneratedRows(rows: Row[]) {
    const SheetFactory = Sheet();
    const [r, c] = references().cells.cGeneratedRows;
    // copy rows here bc reverse is in-place
    const output = [...rows].reverse().map(row => [row.letter, row.seats]);
    SheetFactory.getRowsRange(
      r,
      c,
      SheetFactory.configurationSheet()
    ).setValues(output);
  }

  function getGeneratedRowCounts(): number[] {
    const SheetFactory = Sheet();
    const [r, c] = references().cells.cGeneratedRows;
    return (
      SheetFactory.configurationSheet()
        // only read the counts, not the letters
        .getRange(r, c + 1, SheetFactory.getAvailableRows())
        .getValues()
        .map(([value]) => value)
        .reverse()
    );
  }

  function saveRows(rows: Row[]) {
    const SheetFactory = Sheet();
    const [r, c] = references().cells.data.rows;
    const values = rows.map(row => [row.letter, row.seats]);
    SheetFactory.getRowsRange(r, c, SheetFactory.dataRowsSheet()).setValues(
      values
    );
  }

  function readRows(): Row[] {
    const SheetFactory = Sheet();
    const [r, c] = references().cells.data.rows;
    return SheetFactory.getRowsRange(r, c, SheetFactory.dataRowsSheet())
      .getValues()
      .map(([letter, seats]) => ({ letter, seats } as Row));
  }

  return {
    buildRows,
    setGeneratedRows,
    getGeneratedRowCounts,
    saveRows,
    readRows
  };
}
