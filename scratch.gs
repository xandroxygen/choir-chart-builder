function transformNames() {
    const sheet = SpreadsheetApp.getActive().getSheetByName('Input');
    const names = sheet.getRange('A2:E188').getValues();
    const result = names.map(([first, last, section, height, inchHeight], index) => {
      const ret = [`${inchHeight} - ${index}`];
      let retLast;
      switch (section) {
        case "T1":
          retLast = "Tenor 1"
          break;
        case "T2":
          retLast = "Tenor 2";
          break;
        case "B1":
          retLast = "Baritone";
          break;
        case "B2":
          retLast = "Bass";
          break;
      }
      
      ret.push(retLast, section, height)
      return ret;
    }) 
  
    sheet.getRange('G2:J188').setValues(result);
  }