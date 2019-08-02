function onOpen() {
    const spreadsheet = SpreadsheetApp.getActive();
    const menuItems = [
      {name: 'Confirm row counts', functionName: 'confirmRowCounts'},
      {name: 'Transform names', functionName: 'transformNames'}
    ];
    spreadsheet.addMenu('Actions', menuItems);
  }