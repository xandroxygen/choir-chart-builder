export function references() {
  const cells = {
    cAvailableRows: "A11",
    cGeneratedRows: "A2:A7",
    cFinalRows: "C2:C7",
    startingRow: "A14"
  };

  const sheets = {
    Configuration: "Configuration",
    Input: "Input"
  };

  return {
    cells,
    sheets
  };
}
