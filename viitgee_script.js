/**
ViitGEE v1.0
Visual Image Interpretation Tool for Google Earth Engine (ViitGEE)
Developed by Emre Akturk, 2025
License: MIT License
https://tinyurl.com/viitgee
https://code.earthengine.google.com/0c3727d519c490ceb1a0a30421abb40f
**/

// Utility Function

function copyProps(src) {
  var tgt = {};
  for (var key in src) {
    if (src.hasOwnProperty(key)) {
      tgt[key] = src[key];
    }
  }
  return tgt;
}

// Global Variables

var intRes = [];
var currFeat = null;
var lastBuffLayer;
var lastGrid;

// Export Functions
// These functions export results to Google Drive in CSV and JSON formats.
// You may change file names or formats here.

function exportCSV() {
  if (intRes.length === 0) {
    print('No results to export.');
    return;
  }
  var feats = intRes.map(function(rec) {
    return ee.Feature(null, rec);
  });
  var fc = ee.FeatureCollection(feats);
  Export.table.toDrive({
    collection: fc,
    description: 'Results_CSV',
    fileFormat: 'CSV'
  });
  print('Export to Drive initiated (CSV).');
}

function exportJSON() {
  if (intRes.length === 0) {
    print('No results to export.');
    return;
  }
  var feats = intRes.map(function(rec) {
    return ee.Feature(null, rec);
  });
  var fc = ee.FeatureCollection(feats);
  Export.table.toDrive({
    collection: fc,
    description: 'Results_JSON',
    fileFormat: 'GeoJSON'
  });
  print('Export to Drive initiated (JSON).');
}

// (truncated here for brevity, the full script continues...)
