import {
  getSheetByName,
  getStartingRow,
  getAvailableRows,
  references,
  getGeneratedRowCounts,
  setGeneratedRows,
  saveRows,
  readRows
} from "./sheet";
import { buildRows, getSeatsPerRow } from "./Code";

function generateRowCounts() {
  const inputData = getSheetByName(references().sheets.Input)
    .getDataRange()
    .getValues();

  // remove header row
  inputData.shift();

  const total = inputData.length;
  const rows = buildRows(total, getAvailableRows(), getStartingRow());

  const balancedRows = getSeatsPerRow(total, rows);

  setGeneratedRows(balancedRows);
  saveRows(rows);
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
    { name: "Generate row counts", functionName: "generateRowCounts" },
    { name: "Confirm row counts", functionName: "confirmRowCounts" }
  ]);
}
