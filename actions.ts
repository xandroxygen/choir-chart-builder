import { Sheet, references } from "./Sheet";
import { SectionStacks } from "./SectionStacks";
import { Singers } from "./Singers";
import { Sections } from "./Sections";
import { Rows } from "./Rows";
import { SeatingChart } from "./SeatingChart";
import { Config } from "./Config";

function parseInput() {
  const RowsFactory = Rows();
  const SectionsFactory = Sections();
  const SingersFactory = Singers();
  const ConfigFactory = Config();

  const inputRange = Sheet()
    .getSheetByName(references().sheets.Input)
    .getDataRange();

  // set everything to text format
  inputRange.setNumberFormat("@");

  const inputData = inputRange.getValues();

  // remove header row
  inputData.shift();

  // handle rows
  const total = inputData.length;
  const availableRows = ConfigFactory.getAvailableRows();
  const startingRow = ConfigFactory.getStartingRow();
  const rows = RowsFactory.buildRows(total, availableRows, startingRow);

  RowsFactory.setGeneratedRows(rows);
  RowsFactory.saveRows(rows);

  // handle sections
  const sectionConfig = Config().getFlatSections();
  const inputSections = inputData.map(inputRow => inputRow[2]);
  const sections = SectionsFactory.buildSections(inputSections, sectionConfig);
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
  showChart();
}

function showChart() {
  const seatingChart = SeatingChart();
  const singers = Singers().readSingers();
  const sectionConfig = Config().getFlatSections();

  seatingChart.displayChart(singers, sectionConfig);
  seatingChart.displayFullList(singers);
  seatingChart.displayListBySection(singers);
}

function saveChart() {
  const seatingChart = SeatingChart();
  const singers = Singers().readSingers();
  const sectionConfig = Config().getFlatSections();
  const [updatedSingers, failedUpdates] = seatingChart.readChart(singers);

  Singers().saveSingers(updatedSingers);

  seatingChart.displayChart(updatedSingers, sectionConfig);
  seatingChart.displayFullList(updatedSingers);
  seatingChart.displayListBySection(updatedSingers);
  seatingChart.displayFailedUpdates(failedUpdates);
}

function reset() {
  const SheetFactory = Sheet();
  Config().clearConfig();
  SheetFactory.clearDataSheets();
  SheetFactory.initializeDataSheets();
  SheetFactory.outputChartSheet().clear();
  SheetFactory.outputListsSheet().clear();
}

function onEditTrigger(e: GoogleAppsScript.Events.SheetsOnEdit) {
  if (e.range.getSheet().getName() === references().sheets.Configuration) {
    if (e.range.getA1Notation() === references().cells.configChoice) {
      const ConfigFactory = Config();
      const configChoice = e.range.getValue();
      const defaultConfig = ConfigFactory.defaultConfigurations()[configChoice];

      defaultConfig
        ? ConfigFactory.showConfig(defaultConfig)
        : ConfigFactory.clearConfig();
    }
  }
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
      name: "Save seating chart changes",
      functionName: "saveChart"
    },
    {
      name: "Start over",
      functionName: "reset"
    }
  ]);
}
