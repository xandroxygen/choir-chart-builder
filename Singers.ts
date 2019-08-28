import {
  Singer,
  SectionLayout,
  Section,
  SectionTitle,
  SingerObj,
  NumberObj
} from "./definitions";
import { references, Sheet } from "./Sheet";
import { Config } from "./Config";

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

  function layoutSingersAlternate(
    singers: Singer[],
    sectionLayouts: SectionLayout[],
    sections: Section[]
  ): Singer[] {
    // CC doesn't need to do anything special before singer layout
    if (Config().configIsCC()) {
      return layoutSingers(singers, sectionLayouts, sections);
    }

    // keep track of the order that sections come in
    // sort by section title for later use
    const sectionTitles: SectionTitle[] = [];
    const singersBySection: SingerObj = singers.reduce((sections, singer) => {
      if (!sections[singer.section]) {
        sections[singer.section] = [];
        sectionTitles.push(singer.section);
      }
      sections[singer.section].push(singer);
      return sections;
    }, {});

    // the base number of singers from each section that belong in an octet
    // hopefully this should be 2, but may not be
    const sectionCountsPerOctet: NumberObj = {};
    // the leftover singers that need to be grouped into octets
    const remaindersPerSection: NumberObj = {};
    for (let title of sectionTitles) {
      const count = singersBySection[title].length;
      sectionCountsPerOctet[title] = Math.floor(count / sections.length);
      remaindersPerSection[title] = count % sections.length;
    }

    // all the remainders from all the sections, formatted as a
    // list of section titles
    // round robin through each of the section titles so that
    // octets are filled with a variety of sections, and not
    // with the same section
    // ex: ["T2", "T1, "B2", "B1", "T2", ...]
    const remainderAssignments: SectionTitle[] = [];
    const maxAssignments = Math.max(
      ...sectionTitles.map(key => remaindersPerSection[key])
    );
    for (let i = 0; i < maxAssignments; i++) {
      for (let title of sectionTitles) {
        if (i < remaindersPerSection[title]) {
          remainderAssignments.push(title as SectionTitle);
        }
      }
    }

    // assign singers to each octet
    const seatedSingers: Singer[] = [];
    for (let i = 0; i < sections.length; i++) {
      const octet = sections[i];
      const octetCounts: NumberObj = {};
      let octetTotal = 0;

      // try to fill the octet with the base number from each section
      for (let title of sectionTitles) {
        const sectionCounts = sectionCountsPerOctet[title];
        octetCounts[title] = (octetCounts[title] || 0) + sectionCounts;
        octetTotal += sectionCounts;
      }

      // fill the difference with remainders
      const difference = octet.count - octetTotal;
      if (difference > 0) {
        for (let j = 0; j < difference; j++) {
          const remainderAssignment = remainderAssignments.shift();
          octetCounts[remainderAssignment] += 1;
        }
      }

      // now that we have an accurate count for each section
      // for this octet, reassign that many singers from
      // each section to this octet
      const octetSingers = [];
      for (let title of sectionTitles) {
        octetSingers.push(
          ...singersBySection[title]
            .splice(0, octetCounts[title])
            .map(singer => {
              singer.section = octet.title;
              return singer;
            })
        );
      }

      // give each singer in the octet a seat from the
      // octet's layout
      const sectionLayout = sectionLayouts[i];
      for (let letter of Object.keys(sectionLayout)) {
        const seats: number[] = sectionLayout[letter];
        for (let seatNumber of seats) {
          const singer = octetSingers.shift();
          singer.seat = {
            row: letter,
            num: seatNumber
          };
          seatedSingers.push(singer);
        }
      }

      seatedSingers.push(...octetSingers);
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
    layoutSingersAlternate,
    saveSingers,
    readSingers,
    saveSingersAlternate,
    readSingersAlternate
  };
}
