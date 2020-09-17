require([
  "esri/Map",
  "esri/layers/GeoJSONLayer",
  "esri/views/SceneView",
  "esri/Basemap",
  "esri/layers/TileLayer",
  "esri/widgets/Legend",
  "esri/widgets/HistogramRangeSlider",
  "esri/smartMapping/statistics/histogram",
  "esri/core/promiseUtils"
], function(Map, GeoJSONLayer, SceneView, Basemap, TileLayer, Legend, HistogramRangeSlider, histogram, promiseUtils) {


  /*****************************************
   * Define map and view
   *****************************************/

  const map = new Map({
    basemap: new Basemap({
      baseLayers: [new TileLayer({
        url: "https://tiles.arcgis.com/tiles/nGt4QxSblgDfeJn9/arcgis/rest/services/VintageShadedRelief/MapServer",
        opacity: 0.7,
        minScale: 0
      })]
    }),
    ground: {
      surfaceColor: [255, 255, 255]
    }
  });

  const view = new SceneView({
    container: "viewDiv",
    camera: {
      position: [-96.22, 15.26, 20000000],
      heading: 0,
      tilt: 0
    },
    qualityProfile: "high",
    map: map,
    alphaCompositingEnabled: true,
    environment: {
      background: {
        type: "color",
        color: [0, 0, 0, 0]
      },
      lighting: {
        date: "Sun Jul 15 2018 21:04:41 GMT+0200 (Central European Summer Time)",
      },
      starsEnabled: false,
      atmosphereEnabled: false
    },
    highlightOptions: {
      fillOpacity: 0,
      color: "#ffffff"
    },
    constraints: {
      altitude: {
        min: 400000
      }
    }
  });


  /*****************************************
   * Create GeoJSONLayer
   * from the USGS earthquake feed
   *****************************************/

  const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";

  const earthquakesLayer = new GeoJSONLayer({
    url: url,
    copyright: "USGS Earthquakes",
    screenSizePerspectiveEnabled: false,
    title: "Earthquakes in the last 30 days",
    popupTemplate: {
      title: "Earthquake Info",
      content: "Magnitude <b>{mag}</b> {type} hit <b>{place}</b> on <b>{time}</b>",
      fieldInfos: [
        {
          fieldName: "time",
          format: {
            dateFormat: "short-date-short-time"
          }
        }
      ]
    }
  });

  map.add(earthquakesLayer);

  // the number of earthquakes in each class is displayed in the legend

  const statDefinitions = [{
    onStatisticField:
      "CASE WHEN mag < 5.0 THEN 1 ELSE 0 END",
    outStatisticFieldName: "minor",
    statisticType: "sum"
  }, {
    onStatisticField:
      "CASE WHEN mag < 7.0 AND mag >= 5.0 THEN 1 ELSE 0 END",
    outStatisticFieldName: "medium",
    statisticType: "sum"
  }, {
    onStatisticField:
      "CASE WHEN mag >= 7.0 THEN 1 ELSE 0 END",
    outStatisticFieldName: "major",
    statisticType: "sum"
  }, {
    onStatisticField: "mag",
    outStatisticFieldName: "total",
    statisticType: "count"
  }];

  // the symbol for each earthquake class is composed of multiple symbol layers

  const baseSymbolLayer = {
    type: "icon",
    resource: { primitive: "circle"},
    material: { color: [245, 116, 73, 0.9] },
    size: 3
  };

  const secondSymbolLayer = {
    type: "icon",
    resource: { primitive: "circle"},
    material: { color: [245, 116, 73, 0] },
    outline: {color: [245, 116, 73, 0.7], size: 1},
    size: 20
  };

  const thirdSymbolLayer = {
    type: "icon",
    resource: { primitive: "circle"},
    material: { color: [245, 116, 73, 0] },
    outline: {color: [245, 116, 73, 0.5], size: 1},
    size: 40
  };

  earthquakesLayer.queryFeatures({where: "1=1", outStatistics: statDefinitions})
    .then(function(result){
      statResults = result.features[0].attributes;
      const renderer = {
        type: "class-breaks",
        field: "mag",
        legendOptions: {
          title: "Legend"
        },
        classBreakInfos: [{
          minValue: -2,
          maxValue: 5,
          symbol: {
            type: "point-3d",
            symbolLayers: [baseSymbolLayer]
          },
          label: annotate(statResults.minor) + " lower than 5. They don't cause any significant damage."
        }, {
          minValue: 5,
          maxValue: 7,
          symbol: {
            type: "point-3d",
            symbolLayers: [baseSymbolLayer, secondSymbolLayer]
          },
          label: annotate(statResults.medium) + " between 5 and 7. They can damage buildings and other structures in populated areas."
        },
          {
          minValue: 7,
          maxValue: 10,
          symbol: {
            type: "point-3d",
            symbolLayers: [baseSymbolLayer, secondSymbolLayer, thirdSymbolLayer]
          },
          label: annotate(statResults.major) + " larger than 7. These earthquakes are likely to cause damage even to earthquake resistant structures."
        }]
      }
      earthquakesLayer.renderer = renderer;
    });

    function annotate(no) {
      if (no && no !== 0) {
        if (no === 1) {
          return "1 earthquake";
        }
        return no.toString() + " earthquakes";
      }
      return "0 earthquakes";
    }

  /*****************************************
   * Create a histogram with a range slider
   * to filter earthquakes based on magnitude
   *****************************************/

  view.whenLayerView(earthquakesLayer).then(function(lyrView) {
    const min = -2;
    const max = 10;
    histogram({
      layer: earthquakesLayer,
      field: "mag",
      numBins: 30,
      minValue: min,
      maxValue: max
    }).then(function(histogramResponse) {
      const slider = new HistogramRangeSlider({
        bins: histogramResponse.bins,
        min: min,
        max: max,
        values: [min, max],
        includedBarColor: [245, 116, 73],
        excludedBarColor: [200, 200, 200],
        rangeType: "between",
        container: document.getElementById("histogram")
      });

      slider.on(["thumb-change", "thumb-drag", "segment-drag"], function() {
        filterByHistogramRange().catch(function(error) {
          if (error.name !== "AbortError") {
            console.error(error);
          }
        });
      });

      const filterByHistogramRange = promiseUtils.debounce(function() {
        const filterClause = slider.generateWhereClause("mag");
        lyrView.filter = {
          where: filterClause
        };
        return updateHistogramCount(filterClause, slider.values);
      });

      updateHistogramCount("1=1", [min, max]);
    })
    .catch(console.error);
  });

  function updateHistogramCount(clause, values) {
    const query = earthquakesLayer.createQuery();
    query.where = clause;
    query.outStatistics = statDefinitions;
    return earthquakesLayer.queryFeatures(query)
      .then(function(result){
        document.getElementById("histCount").innerHTML = annotate(result.features[0].attributes.total) + " with magnitude between " + transform(values[0]) + " and " + transform(values[1]);
      });
  }

  function transform(number) {
    return (Math.round(number * 100)/100).toString();
  }

  /*****************************************
   * Add side panel with legend and histogram
   * to the view
   *****************************************/

  const sidePanelInfo = document.getElementById("sidePanelInfo");
  view.ui.add(sidePanelInfo, "top-right");

  new Legend({
    view: view,
    container: document.getElementById("legend")
  });
});
