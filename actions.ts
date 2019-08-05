import * as Sheet from "./sheet";
import { buildRows, getSeatsPerRow } from "./Code";

function generateRowCounts() {
  const inputData = Sheet.getSheetByName(Sheet.references().sheets.Input)
    .getDataRange()
    .getValues();

  // remove header row
  inputData.shift();

  const total = inputData.length;
  const rows = buildRows(
    total,
    Sheet.getAvailableRows(),
    Sheet.getStartingRow()
  );

  const balancedRows = getSeatsPerRow(total, rows);

  Sheet.setGeneratedRowCounts(balancedRows.map(row => row.seats));
}

function confirmRowCounts() {
  const rowCounts = Sheet.getConfigurationSheet()
    .getRange(Sheet.references().cells.cGeneratedRows)
    .getValues();
  Sheet.getSheetByName(Sheet.references().sheets.Data.RowCounts)
    .getRange(Sheet.references().cells.cFinalRows)
    .setValues(rowCounts);
}

function onOpenTrigger() {
  const spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.addMenu("Actions", [
    { name: "Generate row counts", functionName: "generateRowCounts" }
  ]);
}
