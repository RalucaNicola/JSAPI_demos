require([
  "esri/layers/FeatureLayer",
  "esri/Map",
  "esri/views/SceneView",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/PointSymbol3D",
  "esri/symbols/ObjectSymbol3DLayer",
  "esri/widgets/Legend",
  "esri/core/watchUtils",
  "dojo/domReady!"
], function (
  FeatureLayer,
  Map, SceneView,
  SimpleRenderer,
  PointSymbol3D,
  ObjectSymbol3DLayer,
  Legend,
  watchUtils
) {

  const stops = [
    {
      value: 0,
      size: 100000,
      color: "#FFFFE1"
    },
    {
      value: 400000,
      size: 250000,
      color: "#F3758C"
    },
    {
      value: 7000000,
      size: 1500000,
      color: "#7D2898"
    },
    {
      value: 30000000,
      size: 3500000,
      color: "#4C1E6E"
    }
  ];

  function getRenderer(year) {
    return new SimpleRenderer({
      symbol: new PointSymbol3D({
        symbolLayers: [new ObjectSymbol3DLayer({
          resource: {
            primitive: "cube"
          },
          anchor: "bottom",
          width: 80000
        })]
      }),
      visualVariables: [{
        type: "color",
        field: "pop" + year,
        stops: stops,
        legendOptions: {
          title: "Number of persons/grid cell"
        }
      }, {
        type: "size",
        field: "pop" + year,
        stops: stops,
        axis: "height",
        legendOptions: {
          showLegend: false
        }
      }, {
        type: "size",
        axis: "width-and-depth",
        useSymbolValue: true, // uses the width value defined in the symbol layer (80,000)
        legendOptions: {
          showLegend: false
        }
      }]
    });
  }

  const populationLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/World_population/FeatureServer",
    renderer: getRenderer(2000),
    opacity: 0
  });

  var graticule = new FeatureLayer({
    url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/World_graticule_15deg/FeatureServer",
    opacity: 0.6
  });

  var map = new Map({
    layers: [graticule, populationLayer],
    ground: {
      surfaceColor: "#eaf2ff"
    }
  });

  var view = new SceneView({
    map: map,
    container: "viewDiv",
    constraints: {
      collision: {
        enabled: true
      }
    },
    camera: {
      position: {
        spatialReference: {
          latestWkid: 4326,
          wkid: 4326
        },
        x: 50.34885653510194,
        y: 18.68409306191745,
        z: 19134228.85529455
      },
      heading: 0,
      tilt: 0.1
    },
    environment: {
      background: {
        type: "color",
        color: "white"
      },
      atmosphereEnabled: false,
      lighting: {
        directShadowsEnabled: true,
        date: "Sun Jul 15 2018 11:00:00 GMT+0200 (W. Europe Daylight Time)",
        cameraTrackingEnabled: true,
        ambientOcclusionEnabled: true
      }
    },
    highlightOptions: {
      color: "#ffee00",
      fillOpacity: 0
    }
  });
  view.ui.empty("top-left");
  window.view = view;

  let popLayerView;
  let currentHighlight = null;
  let currentYear = 2000;
  const loader = document.getElementById("loader");

  view.whenLayerView(populationLayer)
    .then(function (lyrView) {
      popLayerView = lyrView;
      watchUtils.watch(popLayerView, "updating", function (value) {
        if (value && !view.interacting) {
          populationLayer.opacity = 0;
          loader.style.display = "inherit";
        }
        if (!value) {
          fadeIn(populationLayer);
          loader.style.display = "none";
        }
      });
    });


  function fadeIn(layer) {
    const opacity = parseFloat((layer.opacity + 0.2).toFixed(2));
    layer.opacity = opacity;
    if (layer.opacity < 1) {
      window.requestAnimationFrame(function () {
        fadeIn(layer);
      });
    }
  }
  document.getElementById("populationYear").addEventListener("click", function (evt) {
    this.getElementsByClassName("selected")[0].classList.remove("selected");
    evt.target.className = "selected";
    currentYear = parseInt(evt.target.innerHTML);
    populationLayer.renderer = getRenderer(currentYear);
  });


  view.on("pointer-move", function (event) {
    view.hitTest(event).then(function (response) {
      var result = response.results[0];
      if (result && result.graphic && popLayerView && populationLayer.opacity) {
        if (currentHighlight) {
          currentHighlight.remove();
        }
        currentHighlight = popLayerView.highlight([result.graphic.attributes.OBJECTID]);
        document.getElementById("info").innerHTML = "Selected bar has a population of: " + result.graphic.attributes[`pop${currentYear}`];
      }
      else {
        if (currentHighlight) {
          currentHighlight.remove();
          document.getElementById("info").innerHTML = null;
        }
      }
    })
      .catch(console.error);
  });

  const legend = new Legend({
    view: view,
    container: "legend",
    layerInfos: [{
      title: "World population",
      layer: populationLayer
    }]
  });
});