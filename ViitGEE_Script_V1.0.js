/**
ViitGEE v1.0
Visual Image Interpretation Tool for Google Earth Engine (ViitGEE)
Developed by Emre Akturk, 2025
License: MIT License
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

// Main Panel

var mainP = ui.Panel({
  style: { width: '500px', position: 'bottom-left', border: '4px solid black' }
});

mainP.add(ui.Label({
  value: 'ViitGEE (Visual Image Interpretation Tool) Version 1.0',
  style: {fontSize: '18px', fontWeight: 'bold', margin: '10px 0', color: 'blue', textDecoration: 'underline'}
}));
mainP.add(ui.Label({
  value: 'ViitGEE allows users to visually interpret areas using many features of Google Earth Engine. This tool was prepared by Dr. Emre AKTÜRK.',
  style: {fontSize: '12px', margin: '10px 0', fontStyle: 'italic'}
}));

// File Input Section

mainP.add(ui.Label({ value: 'File Input', style: {fontSize: '16px', fontWeight: 'bold', margin: '4px 0'} }));
mainP.add(ui.Label({ value: 'Enter the path to your shapefile asset...', style: {fontSize: '12px', margin: '10px 0', fontStyle: 'italic'} }));

var shpPathBox = ui.Textbox({ placeholder: 'Enter Your Asset Path', style: {margin: '10px 0', border: '1px solid black'} });
mainP.add(shpPathBox);

var statLabel = ui.Label({ value: '', style: {fontSize: '12px', margin: '4px 0'} });

var attrDrop = ui.Select({ items: [], placeholder: 'Attribute list will appear after submitting the file', disabled: true, style: {margin: '10px 0'} });

var submitBtn = ui.Button({
  label: 'Submit',
  onClick: function() {
    var shpPath = shpPathBox.getValue();
    if (shpPath) {
      var shpFC = ee.FeatureCollection(shpPath);
      shpFC.first().propertyNames().evaluate(function(props) {
        var newAttrDrop = ui.Select({
          items: props,
          placeholder: 'Select an attribute',
          disabled: false,
          style: {margin: '10px 0'}
        });
        var idx = mainP.widgets().indexOf(attrDrop);
        if (idx !== -1) mainP.widgets().set(idx, newAttrDrop);
        attrDrop = newAttrDrop;
      });
      statLabel.setValue('Shapefile Path Submitted Successfully: ' + shpPath);
      statLabel.style().set('color', 'green');
    } else {
      statLabel.setValue('Please enter a valid shapefile path.');
      statLabel.style().set('color', 'red');
    }
  },
  style: {margin: '10px 0'}
});
mainP.add(submitBtn);
mainP.add(statLabel);

// Attribute Selection Section

mainP.add(ui.Label({ value: 'Attribute Selection', style: {fontSize: '16px', fontWeight: 'bold', margin: '4px 0'} }));
mainP.add(ui.Label({ value: 'Select the attribute that shows the ID numbers...', style: {fontSize: '12px', margin: '10px 0', fontStyle: 'italic'} }));
mainP.add(attrDrop);

// Buffer Size Section

mainP.add(ui.Label({ value: 'Buffer Size Selection', style: {fontSize: '16px', fontWeight: 'bold', margin: '5px 0'} }));
mainP.add(ui.Label({ value: 'Enter a whole number (in meters)...', style: {fontSize: '12px', margin: '10px 0', fontStyle: 'italic'} }));

var buffSizeBox = ui.Textbox({ placeholder: 'Enter buffer size (meters)', style: {margin: '10px 0', border: '1px solid black'} });
mainP.add(buffSizeBox);

// Confirmation Button for Attribute and Buffer Settings

var attrBuffBtn = ui.Button({
  label: 'Confirm Attribute & Buffer Size',
  onClick: function() {
    var selAttr = attrDrop.getValue();
    var buSize = parseInt(buffSizeBox.getValue(), 10);
    if (selAttr && !isNaN(buSize)) {
      statLabel.setValue('Selected Attribute: ' + selAttr);
      statLabel.style().set('color', 'green');
      var shpFC = ee.FeatureCollection(shpPathBox.getValue());
      
// Shapefile Points Layer
      
      var ptLayer = shpFC.style({ color: 'red', pointSize: 5, pointShape: 'circle' });
      Map.addLayer(ptLayer, {}, 'Shapefile Points');
      Map.centerObject(shpFC);

// Point Attributes Panel

      var attrP = ui.Panel({ style: { width: '500px', border: '4px solid black', position: 'bottom-right' } });
      attrP.add(ui.Label({ value: 'Point Attributes', style: {fontSize: '16px', fontWeight: 'bold', margin: '10px 0'} }));
      attrP.add(ui.Label({ value: 'Choose a point...', style: {fontSize: '12px', margin: '4px 0', fontStyle: 'italic'} }));

// Dynamic Dropdown for Point Selection

      shpFC.aggregate_array(selAttr).evaluate(function(vals) {
        var dropItems = vals.map(function(value) {
          return {label: value.toString(), value: value};
        });
        var attrDropMenu = ui.Select({
          items: dropItems,
          placeholder: 'Select a point by ' + selAttr,
          style: {margin: '10px 0', border: '1px solid black'}
        });
        attrP.add(attrDropMenu);

        var ndviChartP, intP, intSaveLabel;

// Point Selection

        attrDropMenu.onChange(function(ptVal) {
          if (ptVal) {
            var selPoint = shpFC.filter(ee.Filter.eq(selAttr, ptVal)).first();
            selPoint.evaluate(function(ptFeat) {
              currFeat = ptFeat;
              var ptGeom = ee.Feature(ptFeat).geometry();
              
// Buffer
              
              var buffArea = ptGeom.bounds().buffer(buSize / 2).bounds();
              if (lastBuffLayer) Map.layers().remove(lastBuffLayer);
              lastBuffLayer = ui.Map.Layer(buffArea, { color: 'yellow', fillColor: '00000000' }, 'Buffered Area');
              Map.layers().add(lastBuffLayer);
              Map.centerObject(ee.Feature(ptFeat), 18);
              
// Grid Generation
              
              if (lastGrid) Map.layers().remove(lastGrid);
              var rectCoords = ee.List(buffArea.coordinates().get(0));
              var lonList = rectCoords.map(function(pt) { return ee.Number(ee.List(pt).get(0)); });
              var latList = rectCoords.map(function(pt) { return ee.Number(ee.List(pt).get(1)); });
              var minX = ee.Number(lonList.reduce(ee.Reducer.min()));
              var maxX = ee.Number(lonList.reduce(ee.Reducer.max()));
              var minY = ee.Number(latList.reduce(ee.Reducer.min()));
              var maxY = ee.Number(latList.reduce(ee.Reducer.max()));
              var numPts = 5;
              var gridPts = ee.List.sequence(0, numPts - 1).map(function(i) {
                return ee.List.sequence(0, numPts - 1).map(function(j) {
                  var x = minX.add(maxX.subtract(minX).multiply(ee.Number(i).add(0.5).divide(numPts)));
                  var y = minY.add(maxY.subtract(minY).multiply(ee.Number(j).add(0.5).divide(numPts)));
                  return ee.Feature(ee.Geometry.Point([x, y]));
                });
              }).flatten();
              var gridFC = ee.FeatureCollection(gridPts);
              lastGrid = ui.Map.Layer(gridFC, {color: 'blue'}, 'Grid Points');
              Map.layers().add(lastGrid);
              
// NDVI, NDWI and NDBI Time Series Charts
// Generate indices charts for the selected point using the MODIS from 2014 to 2024.

              if (ndviChartP && attrP.widgets().indexOf(ndviChartP) !== -1) {
                attrP.remove(ndviChartP);
              }

              var indexSelector = ui.Select({
                items: ['NDVI', 'NDWI', 'NDBI'],
                value: 'NDVI',
                style: {margin: '10px 0', width: '150px'},
                onChange: function(selected) {
                  updateIndexChart(selected, ptGeom);
                }
              });

              ndviChartP = ui.Panel({ style: {width: '500px', padding: '8px', margin: '10px 0'} });
              ndviChartP.add(indexSelector);
              attrP.add(ndviChartP);
              updateIndexChart('NDVI', ptGeom);

              function updateIndexChart(selectedIndex, geom) {
                var startDate = '2014-01-01';
                var endDate = '2024-08-31';
                var imgCollRaw = ee.ImageCollection('MODIS/061/MOD09A1')
                  .filterDate(startDate, endDate)
                  .map(function(img) {
                    var ndvi = img.normalizedDifference(['sur_refl_b02', 'sur_refl_b01']).rename('NDVI');
                    var ndwi = img.normalizedDifference(['sur_refl_b02', 'sur_refl_b05']).rename('NDWI');
                    var ndbi = img.normalizedDifference(['sur_refl_b06', 'sur_refl_b02']).rename('NDBI');
                    return ndvi.addBands([ndwi, ndbi]).set('system:time_start', img.get('system:time_start'));
                  });
                var chart = ui.Chart.image.series({
                  imageCollection: imgCollRaw.select(selectedIndex),
                  region: geom,
                  reducer: ee.Reducer.mean(),
                  scale: 500
                }).setOptions({
                  title: selectedIndex + ' Time Series (2014 - 2024)',
                  vAxis: {title: selectedIndex},
                  hAxis: {title: 'Date'},
                  lineWidth: 2,
                  pointSize: 4
                });
                if (ndviChartP.widgets().length > 1) ndviChartP.remove(ndviChartP.widgets().get(1));
                ndviChartP.add(chart);
              }

// Interpretation Panel
// Users can modify land cover classes and save their interpretation.
// CORINE Land Cover Classes is the default land cover classes scheme.

              if (intP && attrP.widgets().indexOf(intP) !== -1) attrP.remove(intP);
              var intDrop = ui.Select({ items: [
                  '1 - Artificial Surfaces',
                  '111 - Continuous Urban Fabric',
                  '112 - Discontinuous Dense Urban Fabric',
                  '113 - Discontinuous Medium Urban Fabric',
                  '121 - Industrial, Commercial and Transport Units',
                  '122 - Road and Rail Networks and Associated Land',
                  '123 - Port Areas',
                  '124 - Airports',
                  '131 - Mineral Extraction Sites',
                  '132 - Dump Sites',
                  '133 - Construction Sites',
                  '2 - Agricultural Areas',
                  '211 - Non-irrigated Arable Land',
                  '212 - Permanently Irrigated Land',
                  '213 - Rice Fields',
                  '221 - Vineyards',
                  '222 - Fruit Trees and Berry Plantations',
                  '223 - Olive Groves',
                  '231 - Pastures',
                  '241 - Complex Cultivation Patterns',
                  '242 - Land Principally Occupied by Agriculture with Significant Areas of Natural Vegetation',
                  '3 - Forests and Semi-natural Areas',
                  '311 - Broad-leaved Forest',
                  '312 - Coniferous Forest',
                  '313 - Mixed Forest',
                  '321 - Natural Grasslands',
                  '322 - Moors and Heathland',
                  '323 - Sclerophyllous Vegetation',
                  '4 - Wetlands',
                  '411 - Inland Marshes',
                  '412 - Peat Bogs',
                  '421 - Salt Marshes',
                  '422 - Salines',
                  '5 - Water Bodies',
                  '511 - Water Courses',
                  '512 - Lakes and Reservoirs'
                  ],
              placeholder: 'Select Land Cover class', style: {margin: '10px 0', border: '1px solid black'} });
              var saveBtn = ui.Button({
                label: 'Save Interpretation',
                onClick: function() {
                  var intCls = intDrop.getValue();
                  if (intCls) {
                    if (intSaveLabel && intP.widgets().indexOf(intSaveLabel) !== -1) intP.remove(intSaveLabel);
                    intSaveLabel = ui.Label({ value: 'Interpretation saved as: ' + intCls, style: {fontSize: '12px', margin: '10px 0', color: 'green'} });
                    intP.add(intSaveLabel);
                    
// Recording Interpretation
                    
                    var rec = copyProps(ptFeat.properties);
                    var coords = ptFeat.geometry.coordinates;
                    rec.longitude = coords[0];
                    rec.latitude = coords[1];
                    rec.timestamp = new Date().toISOString();
                    rec.interpretation = intCls;
                    rec.buffer = buSize;
                    intRes.push(rec);
                    print('Saved Interpretation:', rec);
                    if (ndviChartP && attrP.widgets().indexOf(ndviChartP) !== -1) attrP.remove(ndviChartP);
                  } else {
                    statLabel.setValue('Please select an interpretation class.');
                    statLabel.style().set('color', 'red');
                  }
                },
                style: {margin: '10px 0', border: '1px solid black'}
              });
              intP = ui.Panel({ style: {width: '400px', padding: '8px', margin: '10px 0'} });
              intP.add(intDrop);
              intP.add(saveBtn);
              intP.add(ui.Label({ value: "Export Section: Once all interpretations are complete, click the buttons below to export your results to Google Drive.",
              style: {fontSize: '12px', margin: '5px 0', color: 'red', fontStyle: 'italic'} }));
              
// Export Buttons
// Provides options to export results in CSV or JSON format.
              
              var expBtnP = ui.Panel({ layout: ui.Panel.Layout.Flow('horizontal'), style: {margin: '10px 0'} });
              expBtnP.add(ui.Button({ label: 'Export CSV', onClick: exportCSV, style: {margin: '0 5px 0 0', border: '1px solid black'} }));
              expBtnP.add(ui.Button({ label: 'Export JSON', onClick: exportJSON, style: {margin: '0 0 0 5px', border: '1px solid black'} }));
              intP.add(expBtnP);
              attrP.add(intP);
            });
          }
        });
      });
      ui.root.add(attrP);
    } else {
      statLabel.setValue('Please select an attribute and enter a valid buffer size.');
      statLabel.style().set('color', 'red');
    }
  },
  style: {margin: '10px 0'}
});
mainP.add(attrBuffBtn);



ui.root.insert(0, mainP);
Map.setOptions('SATELLITE');
ui.root.setLayout(ui.Panel.Layout.absolute());
