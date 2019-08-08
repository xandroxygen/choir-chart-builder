import {
  getSheetByName,
  getStartingRow,
  getAvailableRows,
  references,
  getGeneratedRowCounts,
  setGeneratedRows,
  saveRows,
  readRows,
  saveSections,
  saveSingers,
  readSections,
  readSingers,
  showSectionStacks,
  readSectionStacks,
  saveSectionStacks
} from "./sheet";
import { buildRows, buildSections, buildSingers, layoutSections } from "./Code";
import { buildSectionStacks } from "./sectionStacks";

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
  buildChart();
}

function buildChart() {
  const rows = readRows();
  const sections = readSections();
  const singers = readSingers();
  const sectionStacks = readSectionStacks();

  // layout section stacks in seats
}

function test() {
  const rows = readRows();
  const sections = readSections();
  const sectionStacks = buildSectionStacks(sections, rows);
  const sectionSeats = layoutSections(sectionStacks, rows);
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
    },
    { name: "test", functionName: "test" }
  ]);
}
