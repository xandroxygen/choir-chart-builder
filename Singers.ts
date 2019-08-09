import { Singer, SectionLayout, Section } from "./definitions";
import { references, Sheet } from "./Sheet";

export function Singers() {
  /**
   * Converts height from "ft-in" to inches.
   * @param {string} height The height in "ft-in" format
   * @returns {number} The height in inches
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

  function buildSingers(inputData: string[][]): Singer[] {
    return inputData.map(
      ([firstName, lastName, section, height]) =>
        ({
          firstName,
          lastName,
          section,
          height: convertHeight(height),
          seat: {
            row: "A",
            num: 1
          }
        } as Singer)
    );
  }

  function layoutSingers(
    singers: Singer[],
    sectionLayouts: SectionLayout[],
    sections: Section[]
  ): Singer[] {
    const seatedSingers = [];

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

    return seatedSingers;
  }

  function saveSingers(singers: Singer[]) {
    const [r, c] = references().cells.data.singers;
    const values = singers.map(singer => [
      singer.firstName,
      singer.lastName,
      singer.section,
      singer.height,
      `${singer.seat.row}${singer.seat.num}`
    ]);

    Sheet()
      .dataSingersSheet()
      .getRange(r, c, singers.length, 5)
      .setValues(values);
  }

  function readSingers(): Singer[] {
    const values = Sheet()
      .dataSingersSheet()
      .getDataRange()
      .getValues();

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

  return {
    buildSingers,
    layoutSingers,
    saveSingers,
    readSingers
  };
}
