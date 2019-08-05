import {
  getSheetByName,
  getStartingRow,
  getAvailableRows,
  references,
  getConfigurationSheet,
  setGeneratedRowCounts
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
  const rowCounts = getConfigurationSheet()
    .getRange(references().cells.cGeneratedRows)
    .getValues();
  getSheetByName(references().sheets.Data.RowCounts)
    .getRange(references().cells.cFinalRows)
    .setValues(rowCounts);
}

function onOpenTrigger() {
  const spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.addMenu("Actions", [
    { name: "Generate row counts", functionName: "generateRowCounts" },
    { name: "Confirm row counts", functionName: "confirmRowCounts" }
  ]);
}
