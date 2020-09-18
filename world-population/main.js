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
    // create the graticule layer
    var graticule = new FeatureLayer({
      url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/World_graticule_15deg/FeatureServer",
      opacity: 0.6,
      legendEnabled: false
    });

    // create the map
    var map = new Map({
      layers: [graticule],
      ground: {
        surfaceColor: "#eaf2ff"
      }
    });

    // create the view of the map
    var view = new SceneView({
      map: map,
      container: "viewDiv",
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
          directShadowsEnabled: false,
          date: "Sun Jul 15 2018 11:00:00 GMT+0200 (W. Europe Daylight Time)",
          cameraTrackingEnabled: true,
          ambientOcclusionEnabled: false
        }
      },
      highlightOptions: {
        color: "#ffee00",
        fillOpacity: 0
      }
    });
    view.ui.empty("top-left");
    window.view = view;

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

    // generates a renderer based on the year attribute
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
            title: "Number of persons/grid unit"
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

    // create 5 population layers, one for each year
    for (let i = 2000; i <= 2020; i += 5) {
      const layer = new FeatureLayer({
        url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/World_population/FeatureServer",
        opacity: 0,
        outFields: ["*"],
        renderer: getRenderer(i),
        title: "Population " + i.toString(),
        legendEnabled: false
      });
      map.layers.push(layer);
    }

    // utility function to get the layer currently displayed
    function getCurrentLayer() {
      const layer = map.layers.find(function (layer) {
        return (layer.title === "Population " + currentYear);
      });
      return layer;
    }

    let popLayerView;
    let oldLayer;
    let currentHighlight = null;
    let currentYear = 2000;
    let currentLayer = getCurrentLayer();
    const loader = document.getElementById("loader");

    view.whenLayerView(currentLayer)
      .then(function (lyrView) {
        popLayerView = lyrView;
        watchUtils.whenFalseOnce(popLayerView, "updating", function () {
          fadeIn(currentLayer);
          currentLayer.legendEnabled = true;
          loader.style.display = "none";
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
      if (currentYear !== parseInt(evt.target.innerHTML)) {
        oldLayer = currentLayer;
        currentYear = parseInt(evt.target.innerHTML);
        currentLayer = getCurrentLayer();
        currentLayer.legendEnabled = true;
        currentLayer.opacity = 1;
        view.whenLayerView(currentLayer)
          .then(function (layerView) {
            popLayerView = layerView;
          });
        oldLayer.opacity = 0;
        oldLayer.legendEnabled = false;
      }
    });

    view.on("pointer-move", function (event) {
      view.hitTest(event).then(function (response) {
        var result = response.results[0];
        if (result && result.graphic && popLayerView) {
          if (currentHighlight) {
            currentHighlight.remove();
          }
          currentHighlight = popLayerView.highlight([result.graphic.attributes.OBJECTID]);
          if (result.graphic.attributes[`pop${currentYear}`]) {
            document.getElementById("info").innerHTML = "Selected bar has a population of: " + result.graphic.attributes[`pop${currentYear}`].toLocaleString();
          }
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
      container: "legend"
    });

    const portrait = window.matchMedia("(max-width: 600px)");
    portrait.addListener(setPadding);
    function setPadding() {
      console.log(portrait);
      if (portrait.matches) {
        view.padding = {
          bottom: 200
        };
      }
      else {
        view.padding = {
          left: 250
        };
      }
    }
    setPadding();
  });
