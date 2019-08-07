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
  showSectionStacks
} from "./sheet";
import {
  buildRows,
  buildSections,
  buildSingers,
  getSeatsFromSection
} from "./Code";

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
}

function buildChart() {
  const rows = readRows();
  const sections = readSections();
  const singers = readSingers();
}

function buildSectionStacks() {
  // this should eventually happen right after row counts are confirmed
  const rows = readRows();
  const sections = readSections();
  const sectionStacks = getSeatsFromSection(sections, rows);
  showSectionStacks(sectionStacks, rows, sections);
}

function onOpenTrigger() {
  const spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.addMenu("Actions", [
    { name: "Parse input", functionName: "parseInput" },
    { name: "Confirm row counts", functionName: "confirmRowCounts" },
    { name: "Build seating chart", functionName: "buildChart" },
    { name: "(temp) Build section stacks", functionName: "buildSectionStacks" }
  ]);
}
