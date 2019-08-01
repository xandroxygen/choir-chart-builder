// Compiled using ts2gas 1.6.2 (TypeScript 3.5.2)
var exports = exports || {};
var module = module || { exports: exports };
//import {SectionTitle, Row, SectionNumbers} from "./definitions"
function buildChart() {
    var sheet = SpreadsheetApp.getActive().getSheetByName('Input');
    var inputData = sheet.getDataRange().getValues();
}
/**
 * Converts height from "ft-in" to inches.
 * @param {string} height The height in "ft-in" format
 * @returns {number} The height in inches
 * @customfunction
 */
function convertHeight(height) {
    var _a = height.split("-").map(function (s) { return parseFloat(s); }), feet = _a[0], inches = _a[1];
    return (feet * 12) + inches;
}
exports.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
function buildRows(total, availableRows, startingRow) {
    if (!alphabet.includes(startingRow)) {
        throw Error("startingRow must be one upper-case letter");
    }
    var seatsPerRow = Math.floor(total / availableRows);
    var startingRowIndex = alphabet.indexOf(startingRow);
    var rowLetters = alphabet.slice(startingRowIndex, startingRowIndex + availableRows);
    return rowLetters.map(function (letter) { return ({ letter: letter, seats: seatsPerRow }); });
}
function getSeatsPerRow(total, availableRows, rows) {
    var remainder = total % availableRows;
    // add 1 to the top {remainder} rows
    for (var i = 0; i < remainder; i++) {
        rows[availableRows - i].seats += 1;
    }
    // create gaps of 2 between rows
    for (var i = 0; i < availableRows; i++) {
        // offset = (i - middle index) * 2
        // ^ this works for arrays with odd length
        // offset = ((i - index of middle floored) * 2) - 1
        var middleIndex = Math.floor(availableRows / 2);
        // for odd-length arrays, the middle index should be offset at 0
        // for even-length arrays, the "middle" index should be floored,
        // and the offset should start at -1
        var offset = ((i - middleIndex) * 2) - 1;
        rows[i].seats += offset;
    }
    // check for overflow beyond max row size
    // start with the top row and bump down overflow
    var maxRowSize = 36;
    for (var i = availableRows; i >= 0; i--) {
        if (rows[i].seats > maxRowSize) {
            if (i == 0) {
                // if the bottom row is overflowing, we have a problem
                throw new Error("Number of rows and number of available seats isn't enough to contain everyone.");
            }
            // bump overflow down to the previous row
            var overflow = rows[i].seats - maxRowSize;
            rows[i].seats -= overflow;
            rows[i - 1].seats += overflow;
        }
    }
    // move the 3-gap to between second and third
    // row, if there is one
    // start at the top and don't check the bottom row
    var gapToSwitch = rows[2].seats - rows[1].seats;
    for (var i = availableRows; i > 0; i--) {
        var gap = rows[i].seats - rows[i - 1].seats;
        if (gap > 2 && i != 2) {
            var difference = gap - gapToSwitch;
        }
    }
    return [];
}
function getSeatsFromSection(sectionCounts, rows) {
    var total = sectionCounts.reduce(function (total, section) { return total + section.count; }, 0);
    var proportions = sectionCounts.map(function (section) { return section.count / total; });
    var sectionStacks = proportions.map(function (proportion) {
        return rows.map(function (row) { return proportion * row.seats; });
    });
    var _loop_1 = function (i) {
        var isRowFull = sectionStacks.reduce(function (total, stack) { return total + stack[i]; }, 0) === rows[i].seats;
    };
    for (var i = 0; i < rows.length; i++) {
        _loop_1(i);
    }
}
