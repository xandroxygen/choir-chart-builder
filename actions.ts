import { Sheet, references } from "./Sheet";
import { SectionStacks } from "./SectionStacks";
import { Singers } from "./Singers";
import { Sections } from "./Sections";
import { Rows } from "./Rows";

function parseInput() {
  const RowsFactory = Rows();
  const SectionsFactory = Sections();
  const SingersFactory = Singers();
  const SheetFactory = Sheet();

  const inputRange = SheetFactory.getSheetByName(
    references().sheets.Input
  ).getDataRange();

  // set everything to text format
  inputRange.setNumberFormat("@");

  const inputData = inputRange.getValues();

  // remove header row
  inputData.shift();

  // handle rows
  const total = inputData.length;
  const availableRows = SheetFactory.getAvailableRows();
  const startingRow = SheetFactory.getStartingRow();
  const rows = RowsFactory.buildRows(total, availableRows, startingRow);

  RowsFactory.setGeneratedRows(rows);
  RowsFactory.saveRows(rows);

  // handle sections
  const inputSections = inputData.map(inputRow => inputRow[2]);
  const sections = SectionsFactory.buildSections(inputSections);
  SectionsFactory.saveSections(sections);

  // handle singers
  const singers = SingersFactory.buildSingers(inputData);
  SingersFactory.saveSingers(singers);
}

function confirmRowCounts() {
  const RowsFactory = Rows();
  const SectionStacksFactory = SectionStacks();

  const rows = RowsFactory.readRows();
  const generatedRowCounts = RowsFactory.getGeneratedRowCounts();

  for (let i = 0; i < rows.length; i++) {
    rows[i].seats = generatedRowCounts[i];
  }

  RowsFactory.saveRows(rows);

  // handle and display section stacks
  const sections = Sections().readSections();
  const sectionStacks = SectionStacksFactory.buildSectionStacks(sections, rows);
  SectionStacksFactory.showSectionStacks(sectionStacks, rows, sections);
  SectionStacksFactory.saveSectionStacks(sectionStacks);
}

function confirmSectionStacks() {
  const SectionStacksFactory = SectionStacks();

  const rows = Rows().readRows();
  const sections = Sections().readSections();
  const sectionStacks = SectionStacksFactory.getConfirmedSectionStacks(
    sections.length,
    rows.length
  );

  SectionStacksFactory.saveSectionStacks(sectionStacks);

  buildChart();
}

function buildChart() {
  const SectionsFactory = Sections();
  const SingersFactory = Singers();

  const rows = Rows().readRows();
  const sections = SectionsFactory.readSections();
  const singers = SingersFactory.readSingers();
  const sectionStacks = SectionStacks().readSectionStacks();

  // layout section stacks in seats
  const sectionLayouts = SectionsFactory.layoutSections(sectionStacks, rows);

  const seatedSingers = SingersFactory.layoutSingers(
    singers,
    sectionLayouts,
    sections
  );

  SingersFactory.saveSingers(seatedSingers);
  Sheet().displaySeatingChart(seatedSingers);
}

function showChart() {
  const singers = Singers().readSingers();
  Sheet().displaySeatingChart(singers);
}

function reset() {
  const SheetFactory = Sheet();
  SheetFactory.clearDataSheets();
  SheetFactory.initializeDataSheets();
  SheetFactory.resetConfigurationSheet();
  SheetFactory.outputChartSheet().clear();
  SheetFactory.outputListsSheet().clear();
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
    {
      name: "Generate seating chart",
      functionName: "showChart"
    },
    {
      name: "Start over",
      functionName: "reset"
    }
  ]);
}
