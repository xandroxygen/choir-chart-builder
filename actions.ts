import {
  getSheetByName,
  getStartingRow,
  getAvailableRows,
  references
} from "./sheet";
import {
  buildSectionStacks,
  showSectionStacks,
  saveSectionStacks,
  getConfirmedSectionStacks,
  readSectionStacks
} from "./sectionStacks";
import {
  buildSingers,
  saveSingers,
  readSingers,
  layoutSingers
} from "./singers";
import {
  buildSections,
  saveSections,
  readSections,
  layoutSections
} from "./sections";
import {
  buildRows,
  setGeneratedRows,
  saveRows,
  readRows,
  getGeneratedRowCounts
} from "./rows";

function parseInput() {
  const inputRange = getSheetByName(references().sheets.Input).getDataRange();

  // set everything to text format
  inputRange.setNumberFormat("@");

  const inputData = inputRange.getValues();

  // remove header row
  inputData.shift();

  // handle rows
  const total = inputData.length;
  const availableRows = getAvailableRows();
  const startingRow = getStartingRow();
  const rows = buildRows(total, availableRows, startingRow);

  setGeneratedRows(rows);
  saveRows(rows);

  // handle sections
  const inputSections = inputData.map(inputRow => inputRow[2]);
  const sections = buildSections(inputSections);
  saveSections(sections);

  // handle singers
  const singers = buildSingers(inputData);
  saveSingers(singers);
}

function confirmRowCounts() {
  const rows = readRows();
  const generatedRowCounts = getGeneratedRowCounts();

  for (let i = 0; i < rows.length; i++) {
    rows[i].seats = generatedRowCounts[i];
  }

  saveRows(rows);

  // handle and display section stacks
  const sections = readSections();
  const sectionStacks = buildSectionStacks(sections, rows);
  showSectionStacks(sectionStacks, rows, sections);
  saveSectionStacks(sectionStacks);
}

function confirmSectionStacks() {
  const rows = readRows();
  const sections = readSections();
  const sectionStacks = getConfirmedSectionStacks(sections.length, rows.length);

  saveSectionStacks(sectionStacks);

  buildChart();
}

function buildChart() {
  Logger.log("reading rows");
  const rows = readRows();
  Logger.log("reading sections");
  const sections = readSections();
  Logger.log("reading singers");
  const singers = readSingers();
  Logger.log("reading section stacks");
  const sectionStacks = readSectionStacks();

  // layout section stacks in seats
  Logger.log("laying out sections");
  const sectionLayouts = layoutSections(sectionStacks, rows);

  Logger.log("laying out singers");
  const seatedSingers = layoutSingers(singers, sectionLayouts, sections);

  Logger.log("saving singers");
  saveSingers(seatedSingers);
}

function onOpenTrigger() {
  const spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.addMenu("Actions", [
    { name: "1. Read input", functionName: "parseInput" },
    {
      name: "2. Confirm row counts + continue",
      functionName: "confirmRowCounts"
    },
    {
      name: "3. Confirm seats per section + continue",
      functionName: "confirmSectionStacks"
    }
  ]);
}
