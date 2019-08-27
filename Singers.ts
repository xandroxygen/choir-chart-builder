import { Singer, SectionLayout, Section } from "./definitions";
import { references, Sheet } from "./Sheet";

export function Singers() {
  /**
   * Converts height from "ft-in" to inches.
   * @param {string} height The height in "ft-in" format
   * @returns {number} The height in inches
   */
  function convertHeight(height: string): number {
    // make sure height is provided as either
    // "ft", or "ft-in"
    if (!/\d($|-\d+)/.test(height)) {
      throw new Error(`Incorrect height provided: ${height}`);
    }

    const [feet, inches] = height.split("-").map(s => parseFloat(s));

    // if height is a single number, inches will be undefined
    return feet * 12 + (inches || 0);
  }

  function buildSingers(inputData: string[][]): Singer[] {
    try {
      return inputData.map(inputRow => {
        inputRow = inputRow.filter(col => col !== "");

        if (inputRow.length < 4) {
          throw new Error(`Not enough columns in row: ${inputRow}`);
        }

        if (inputRow.length > 4) {
          throw new Error(`Too many columns in row: ${inputRow}`);
        }

        const [firstName, lastName, section, height] = inputRow;
        return {
          firstName,
          lastName,
          section,
          height: convertHeight(height),
          seat: {
            row: "A",
            num: 1
          }
        } as Singer;
      });
    } catch (e) {
      Sheet().alert(
        `There is corrupt data in the Input sheet, please fix it and try again:
        
        Error: ${e.message}`
      );

      // severe error, stop execution
      throw e;
    }
  }

  function layoutSingers(
    singers: Singer[],
    sectionLayouts: SectionLayout[],
    sections: Section[]
  ): Singer[] {
    const seatedSingers = [];

    try {
      sections.forEach((section, i) => {
        const sectionLayout = sectionLayouts[i];
        const sectionSingers = singers
          // only singers in this section
          .filter(singer => singer.section === section.title)
          // tallest singers should be sorted first
          .sort((a, b) =>
            a.height > b.height ? -1 : a.height < b.height ? 1 : 0
          );

        // iterate through each row in section layout and assign singers a seat
        Object.keys(sectionLayout).forEach(letter => {
          const seats: number[] = sectionLayout[letter];
          for (let seatNumber of seats) {
            const singer = sectionSingers.pop();
            singer.seat = {
              row: letter,
              num: seatNumber
            };
            seatedSingers.push(singer);
          }
        });
      });
    } catch (e) {
      Sheet().alert(
        `Something went wrong giving each singer a seat. Check input data and try again, or start over: ${e.message}`
      );
      throw e;
    }

    return seatedSingers;
  }

  function saveSingers(singers: Singer[], isAlternate: boolean = false) {
    const [r, c] = references().cells.data.singers;
    const values = singers.map(singer => [
      singer.firstName,
      singer.lastName,
      singer.section,
      singer.height,
      `${singer.seat.row}${singer.seat.num}`
    ]);

    const sheet = isAlternate
      ? Sheet().dataSingersSheet()
      : Sheet().dataAlternateSingersSheet();

    sheet.getRange(r, c, singers.length, 5).setValues(values);
  }

  function saveSingersAlternate(singers: Singer[]) {
    return saveSingers(singers, true);
  }

  function readSingers(isAlternate: boolean = false): Singer[] {
    const sheet = isAlternate
      ? Sheet().dataSingersSheet()
      : Sheet().dataAlternateSingersSheet();

    const values = sheet.getDataRange().getValues();

    // remove header row
    values.shift();

    return values.map(
      ([firstName, lastName, section, height, seat]) =>
        ({
          firstName,
          lastName,
          section,
          height: parseFloat(height),
          seat: {
            row: seat.slice(0, 1),
            num: parseInt(seat.slice(1))
          }
        } as Singer)
    );
  }

  function readSingersAlternate(): Singer[] {
    return readSingers(true);
  }

  return {
    buildSingers,
    layoutSingers,
    saveSingers,
    readSingers,
    saveSingersAlternate,
    readSingersAlternate
  };
}
