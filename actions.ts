import {
  getAvailableRows,
  getStartingRow,
  setGeneratedRowCounts,
  getSheetByName,
  references
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

  setGeneratedRowCounts(balancedRows.map(row => row.seats));
}

function confirmRowCounts() {
  const sheet = SpreadsheetApp.getActive().getSheetByName("Configuration");
  const rowCounts = sheet
    .getRange(references().cells.cGeneratedRows)
    .getValues();
  sheet.getRange(references().cells.cFinalRows).setValues(rowCounts);
}

function onOpenTrigger() {
  const spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.addMenu("Actions", [
    { name: "Generate row counts", functionName: "generateRowCounts" }
  ]);
}
