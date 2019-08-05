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
  saveSingers
} from "./sheet";
import { buildRows, buildSections, buildSingers } from "./Code";

function parseInput() {
  const inputRange = getSheetByName(references().sheets.Input).getDataRange();

  // set everything to text format
  inputRange.setNumberFormat("@");

  const inputData = inputRange.getValues();

  // remove header row
  inputData.shift();

  // handle rows
  const total = inputData.length;
  const rows = buildRows(total, getAvailableRows(), getStartingRow());

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

function onOpenTrigger() {
  const spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.addMenu("Actions", [
    { name: "Parse input", functionName: "parseInput" },
    { name: "Confirm row counts", functionName: "confirmRowCounts" }
  ]);
}
