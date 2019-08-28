import {
  Section,
  Row,
  SectionLayout,
  SectionConfig,
  SectionTitle
} from "./definitions";
import { references, Sheet } from "./Sheet";
import { Config } from "./Config";

export function Sections() {
  function buildSections(
    inputSections: string[],
    sectionConfig: SectionConfig[]
  ): Section[] {
    const sections = sectionConfig.reduce((sections, { title }) => {
      sections[title] = {
        title,
        count: 0
      };
      return sections;
    }, {});

    try {
      inputSections.forEach(title => (sections[title].count += 1));
    } catch (e) {
      Sheet().alert(
        `Please check for incorrect section titles in Input sheet!
        
        Technical error: ${e.message}`
      );
    }

    return Object.keys(sections).map(k => sections[k]);
  }

  function buildSectionsAlternate(
    inputSections: string[],
    sectionConfig: SectionConfig[]
  ): Section[] {
    const sections = buildSections(inputSections, sectionConfig);

    // CC alternate layout uses the same sections
    if (Config().configIsCC()) {
      return sections;
    }

    // determine number of octets
    // there should always be at least 2 singers from every section in an octet
    // so use the smallest section
    const octetCount = Math.min(...sections.map(s => s.count)) / 2;
    const total = sections.reduce((sum, s) => sum + s.count, 0);
    const initialCount = Math.floor(total / octetCount);
    const remainder = total % octetCount;

    const octets: Section[] = [];
    for (let i = 0; i < octetCount; i++) {
      octets.push({
        title: `O${i + 1}` as SectionTitle,
        count: i < remainder ? initialCount + 1 : initialCount
      });
    }

    const octetSeatSum = octets.reduce((sum, octet) => sum + octet.count, 0);
    if (octetSeatSum !== total) {
      throw new Error(
        `Something went wrong counting out octets. Expected a total of ${total}, but got ${octetSeatSum}.`
      );
    }

    return octets;
  }

  function layoutSections(
    sectionStacks: number[][],
    rows: Row[]
  ): SectionLayout[] {
    try {
      return Config().configIsCC()
        ? layoutSectionsInTwoRows(sectionStacks, rows)
        : layoutSectionsInOneRow(sectionStacks, rows);
    } catch (e) {
      throw new Error(
        `Something went wrong laying out seats into sections. Please check input and configuration and start over: ${e.message}`
      );
    }
  }

  /**
   * lay out sections for choirs like CC,
   * where each section spans one half of the height of the choir,
   * and half of the section is on each row
   * the sections are not centered around the midpoint, but are just
   * filled in from left to right
   * @param sectionStacks
   * @param rows
   */
  function layoutSectionsInTwoRows(
    sectionStacks: number[][],
    rows: Row[]
  ): SectionLayout[] {
    // an array of sections, each containing rows,
    // indexed by letter, each containing the seat numbers for that row
    const sectionLayouts = initializeSectionLayouts(sectionStacks, rows);

    // start at the beginning of each row
    // where the row is centered around the midpoint
    const midpoints = madsenMidpoints();
    let startPoints = {};
    for (let row of rows) {
      startPoints[row.letter] =
        midpoints[row.letter] - Math.ceil(row.seats / 2);
    }

    for (let i = 0; i < sectionStacks.length; i++) {
      const stack = sectionStacks[i];
      for (let j = 0; j < stack.length; j++) {
        if (stack[j] > 0) {
          const letter = rows[j].letter;
          const startPoint = startPoints[letter];
          const endPoint = startPoint + stack[j];
          sectionLayouts[i][letter].push(...addSeats(startPoint, endPoint));
          startPoints[letter] = endPoint;
        }
      }
    }

    return sectionLayouts;
  }

  /**
   * lay out sections for choirs like MC and WC,
   * where each section spans from top to bottom of the choir
   * and the sections are centered around the midpoint
   * @param sectionStacks
   * @param rows
   */
  function layoutSectionsInOneRow(
    sectionStacks: number[][],
    rows: Row[]
  ): SectionLayout[] {
    // an array of sections, each containing rows,
    // indexed by letter, each containing the seat numbers for that row
    const sectionLayouts = initializeSectionLayouts(sectionStacks, rows);

    // start at the midpoint for every row
    const midpoints = madsenMidpoints();
    let startPoints = {};
    for (let { letter } of rows) {
      startPoints[letter] = midpoints[letter];
    }

    // for each section left of the midpoint and row in the section,
    // count out the seat numbers from the start point on the right
    // to the end point on the left
    // and store them in sectionSeats[section][row.letter]
    for (let i = sectionStacks.length / 2 - 1; i >= 0; i--) {
      const stack = sectionStacks[i];
      for (let j = 0; j < stack.length; j++) {
        const letter = rows[j].letter;
        const startPoint = startPoints[letter];
        const endPoint = startPoint - stack[j];
        sectionLayouts[i][letter].push(...addSeats(endPoint, startPoint));
        startPoints[letter] = endPoint;
      }
    }

    // reset start points to midpoint
    for (let { letter } of rows) {
      startPoints[letter] = midpoints[letter];
    }

    // for each section right of the midpoint and row in the section,
    // count out the seat numbers from the start point on the left
    // to the end point on the right
    // and store them in sectionSeats[section][row.letter]
    for (let i = sectionStacks.length / 2; i < sectionStacks.length; i++) {
      const stack = sectionStacks[i];
      for (let j = 0; j < stack.length; j++) {
        const letter = rows[j].letter;
        const startPoint = startPoints[letter];
        const endPoint = startPoint + stack[j];
        sectionLayouts[i][letter].push(...addSeats(startPoint, endPoint));
        startPoints[letter] = endPoint;
      }
    }

    // adjust rows to fit with Madsen layout
    fixRowOverflow(rows, sectionLayouts);

    return sectionLayouts;
  }

  /**
   * Adjusts section layouts in place to not overflow beyond ends of rows
   * @param rows Row[]
   * @param sectionLayouts SectionLayout[] *modified in place*
   */
  function fixRowOverflow(rows: Row[], sectionLayouts: SectionLayout[]) {
    // check if row needs adjusting to fit within Madsen layout
    const maxRowSize = 36;
    for (let { letter } of rows) {
      // row is overflowing left, move right
      const leftOverflow = 1 - sectionLayouts[0][letter][0];
      if (leftOverflow > 0) {
        for (let layout of sectionLayouts) {
          const row = layout[letter] as number[];

          // remove overflow from the left
          row.splice(0, leftOverflow);

          // add overflow back to the right
          const lastInRow = peek(row);
          for (let j = lastInRow; j < lastInRow + leftOverflow; j++) {
            // add 1 because seat numbers are 1-based
            row.push(j + 1);
          }
        }
      }

      // row is overflowing right, move left
      const lastSection = peek(sectionLayouts)[letter] as number[];
      const rightOverflow = peek(lastSection) - maxRowSize;
      if (rightOverflow > 0) {
        for (let layout of sectionLayouts) {
          const row = layout[letter] as number[];

          // remove overflow from the right
          row.splice(-rightOverflow, rightOverflow);

          // add overflow back to the left
          const firstInRow = row[0];
          for (let j = firstInRow; j > firstInRow - rightOverflow; j--) {
            // subtract 1 because seat numbers are 1-based
            row.unshift(j - 1);
          }
        }
      }
    }
  }

  function layoutSectionsAlternate(
    rows: Row[],
    sections: Section[]
  ): SectionLayout[] {
    try {
      return Config().configIsCC()
        ? layoutSectionPerRow(rows, sections)
        : layoutSectionsInOctets(rows, sections);
    } catch (e) {
      throw new Error(
        `Something went wrong laying out seats into sections. Please check input and configuration and start over: ${e.message}`
      );
    }
  }

  function layoutSectionPerRow(
    rows: Row[],
    sections: Section[]
  ): SectionLayout[] {
    // this is a pretty CC-specific hack, as far as hard-coding section order
    // I don't like it, I don't agree with it. But I accept it.
    const sectionOrder = ["S1", "S2", "A1", "A2", "T1", "T2", "B1", "B2"];
    const layoutsBySectionTitle = {};
    const midpoints = madsenMidpoints();

    // sort sections by the order above
    const sectionsByTitle = sections.reduce((ret, section) => {
      ret[section.title] = section;
      return ret;
    }, {});
    const sortedSections: Section[] = sectionOrder.map(
      title => sectionsByTitle[title]
    );

    // from bottom row to top row
    for (let row of rows) {
      const midpoint = midpoints[row.letter];

      // lay the first section out to the left of the midpoint
      const leftSection = sortedSections.shift();
      const leftEndpoint = midpoint - leftSection.count;
      const leftSectionLayout = rowsByTitle(rows);
      leftSectionLayout[row.letter].push(...addSeats(leftEndpoint, midpoint));
      layoutsBySectionTitle[leftSection.title] = leftSectionLayout;

      // lay the second section out to the right of the midpoint
      const rightSection = sortedSections.shift();
      const rightEndpoint = midpoint + rightSection.count;
      const rightSectionLayout = rowsByTitle(rows);
      rightSectionLayout[row.letter].push(...addSeats(midpoint, rightEndpoint));
      layoutsBySectionTitle[rightSection.title] = rightSectionLayout;
    }

    // keep layouts in original section order
    const sectionLayouts: SectionLayout[] = sections.map(
      ({ title }) => layoutsBySectionTitle[title]
    );

    // adjust rows to fit with Madsen layout
    fixRowOverflow(rows, sectionLayouts);

    return sectionLayouts;
  }

  function layoutSectionsInOctets(
    rows: Row[],
    sections: Section[]
  ): SectionLayout[] {
    // center each row on the midpoint
    const midpoints = madsenMidpoints();
    const maxRowSize = 36;
    const rowPoints = rows.reduce((ret, row) => {
      const startPoint = midpoints[row.letter] - Math.ceil(row.seats / 2);
      const endPoint = startPoint + row.seats;
      // start and end points are zero-based
      // no rows should overflow beyond 0
      // this will be 0 or positive, to move rows right
      const leftOverflow = startPoint < 0 ? 0 - startPoint : 0;
      // no rows should overflow beyond 36, either
      // this will be 0 or negative, to move rows left
      const rightOverflow = endPoint > maxRowSize ? maxRowSize - endPoint : 0;

      ret[row.letter] = {
        startPoint: startPoint + leftOverflow + rightOverflow,
        endPoint: endPoint + leftOverflow + rightOverflow
      };
      return ret;
    }, {});

    // sort rows so the higher rows come first
    const sortedRows = rows.sort((a, b) => (a.letter > b.letter ? -1 : 1));

    const firstRowIterator = {
      letter: sortedRows[0].letter,
      num: rowPoints[sortedRows[0].letter].startPoint
    };
    const secondRowIterator = {
      letter: sortedRows[1].letter,
      num: rowPoints[sortedRows[1].letter].startPoint
    };

    const leftoverSeats: { letter: string; num: number }[] = [];
    const seatedOctets: {
      title: string;
      count: number;
      seats: SectionLayout;
    }[] = [];

    // add seats to sections as octets
    const octets = sections.map(({ title, count }) => ({
      title,
      count,
      seats: rowsByTitle(rows)
    }));
    // if octet has an odd count, we don't always want the larger half to be
    // on the top row, so flip which row has the larger half each time
    let isFirstHalfLarger = true;
    // iterate through rows and seats in each row
    // when the end of a row is reached without being able
    // to make a full octet, move the iterators down two rows
    // stop this process when either of the iterators reaches row A or below
    let isAnIteratorBelowB = false;
    while (!isAnIteratorBelowB && octets.length > 0) {
      const octet = octets.shift();
      const [firstHalf, secondHalf] = getHalves(octet.count, isFirstHalfLarger);

      // for the next octet, flip the halves
      isFirstHalfLarger = !isFirstHalfLarger;

      // these seats are where the octets will end
      const firstHalfEndpoint = firstRowIterator.num + firstHalf;
      const secondHalfEndpoint = secondRowIterator.num + secondHalf;

      // if the octet can fit in both rows without overflowing,
      // then give it those seats
      if (
        firstHalfEndpoint <= rowPoints[firstRowIterator.letter].endPoint ||
        secondHalfEndpoint <= rowPoints[secondRowIterator.letter].endPoint
      ) {
        // add seats from both rows to the octet
        octet.seats[firstRowIterator.letter].push(
          ...addSeats(firstRowIterator.num, firstHalfEndpoint)
        );
        octet.seats[secondRowIterator.letter].push(
          ...addSeats(secondRowIterator.num, secondHalfEndpoint)
        );

        seatedOctets.push(octet);

        firstRowIterator.num = firstHalfEndpoint;
        secondRowIterator.num = secondHalfEndpoint;
      } else {
        // put the octet back on the stack
        octets.unshift(octet);

        // add the rest of the seats in both rows to leftovers
        leftoverSeats.push(
          ...addSeats(
            firstRowIterator.num,
            rowPoints[firstRowIterator.letter].endPoint
          ).map(num => ({ letter: firstRowIterator.letter, num }))
        );
        leftoverSeats.push(
          ...addSeats(
            secondRowIterator.num,
            rowPoints[secondRowIterator.letter].endPoint
          ).map(num => ({ letter: secondRowIterator.letter, num }))
        );

        // move both iterators down two rows
        try {
          firstRowIterator.letter = moveNLetters(firstRowIterator.letter, -2);
          secondRowIterator.letter = moveNLetters(secondRowIterator.letter, -2);
          firstRowIterator.num = rowPoints[firstRowIterator.letter].startPoint;
          secondRowIterator.num =
            rowPoints[secondRowIterator.letter].startPoint;
        } catch (e) {
          // an iterator letter moved out of bounds, so it's definitely below B
          isAnIteratorBelowB = true;
        }

        // check if either iterator is at row A
        isAnIteratorBelowB =
          isAnIteratorBelowB ||
          (firstRowIterator.letter === "A" || secondRowIterator.letter === "A");
      }
    }

    // handle leftovers
    // at this point all octets left aren't seated yet
    for (let octet of octets) {
      // take the needed number of seats from leftovers
      // and give them to the octet
      const seats = leftoverSeats.splice(0, octet.count);
      for (let seat of seats) {
        octet.seats[seat.letter].push(seat.num);
      }
      seatedOctets.push(octet);
    }

    // double check that all octets have the right number of seats
    for (let octet of seatedOctets) {
      const seatsCount = Object.keys(octet.seats).reduce(
        (count, key) => count + octet.seats[key].length,
        0
      );

      if (octet.count !== seatsCount) {
        throw new Error(
          `Something went wrong assigning seats to octets. This octet should have ${octet.count} seats, but has ${seatsCount}.`
        );
      }
    }

    return seatedOctets.map(octet => octet.seats);
  }

  /**
   * "move" n letters up or down the alphabet
   * eg: passing "G", -2 returns "E"
   * throws if n moves out of bounds
   * @param letter a single, upper-case character
   * @param n the number to move - negative for backwards, positive for forwards
   * @returns a single, upper-case character
   */
  function moveNLetters(letter: string, n: number) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const index = alphabet.indexOf(letter);
    if (index === -1) {
      throw new Error("Invalid n-letter move");
    }
    return alphabet[index + n];
  }

  function getHalves(num: number, isFirstHalfLarger: boolean) {
    const largerHalf = Math.ceil(num / 2);
    const smallerHalf = Math.floor(num / 2);
    return isFirstHalfLarger
      ? [largerHalf, smallerHalf]
      : [smallerHalf, largerHalf];
  }

  function addSeats(start, end) {
    const ret: number[] = [];
    for (let i = start; i < end; i++) {
      // add 1 because seat numbers are 1-based
      ret.push(i + 1);
    }
    return ret;
  }

  function madsenMidpoints() {
    // midpoint of each row is after this seat number
    return {
      J: 18,
      H: 18,
      G: 18,
      F: 17,
      E: 17,
      D: 17,
      C: 16,
      B: 16
    };
  }

  function initializeSectionLayouts(
    sections: any[],
    rows: Row[]
  ): SectionLayout[] {
    return sections.map(_ => rowsByTitle(rows));
  }

  function rowsByTitle(rows: Row[]) {
    return rows.reduce((ret, row) => {
      ret[row.letter] = [];
      return ret;
    }, {});
  }

  function peek(arr: any[]) {
    return arr[arr.length - 1];
  }

  function saveSections(sections: Section[], isAlternate = false) {
    const [r, c] = references().cells.data.sections;
    const values = sections.map(section => [section.title, section.count]);

    getSectionsSheet(isAlternate)
      .getRange(r, c, sections.length, 2)
      .setValues(values);
  }

  function saveSectionsAlternate(sections: Section[]) {
    return saveSections(sections, true);
  }

  function readSections(isAlternate = false): Section[] {
    const values = getSectionsSheet(isAlternate)
      .getDataRange()
      .getValues();

    // remove header row
    values.shift();

    return values.map(([title, count]) => ({ title, count } as Section));
  }

  function readSectionsAlternate() {
    return readSections(true);
  }

  function getSectionsSheet(isAlternate = false) {
    return isAlternate
      ? Sheet().dataAlternateSectionsSheet()
      : Sheet().dataSectionsSheet();
  }

  return {
    buildSections,
    layoutSections,
    saveSections,
    readSections,
    buildSectionsAlternate,
    layoutSectionsAlternate,
    saveSectionsAlternate,
    readSectionsAlternate
  };
}
