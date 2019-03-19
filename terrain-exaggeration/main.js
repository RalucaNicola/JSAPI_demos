require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/ElevationLayer",
  "esri/layers/BaseElevationLayer",
  "esri/layers/CSVLayer"
], function (
  WebScene,
  SceneView,
  ElevationLayer,
  BaseElevationLayer,
  CSVLayer
) {

  const ExaggeratedElevationLayer = BaseElevationLayer.createSubclass({

    properties: {
      exaggeration: 5
    },

    load: function () {
      this._elevation = new ElevationLayer({
        url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
      });

      this.addResolvingPromise(this._elevation.load());
    },

    fetchTile: function (level, row, col) {
      // calls fetchTile() on the elevationlayer for the tiles
      // visible in the view
      return this._elevation.fetchTile(level, row, col)
        .then(function (data) {

          var exaggeration = this.exaggeration;
          for (var i = 0; i < data.values.length; i++) {
            data.values[i] = data.values[i] * exaggeration;
          }

          return data;
        }.bind(this));
    }
  });

  const map = new WebScene({
    portalItem: {
      id: "2e057e1597f24ee39a63041208917d90"
    }
  });

  map.when(function () {
    map.ground.layers = [
      new ExaggeratedElevationLayer()
    ]
  });

  var view = new SceneView({
    container: "viewDiv",
    viewingMode: "global",
    map: map,
    alphaCompositingEnabled: true,
    environment: {
      background: {
        type: "color",
        color: [255, 252, 244, 0]
      },
      starsEnabled: false,
      atmosphereEnabled: false
    },
    constraints: {
      altitude: {
        max: 70000
      }
    }
  });

  view.ui.empty("top-left");

  window.view = view;

  const renderer = {
    type: "simple",
    symbol: {
      type: "point-3d",
      symbolLayers: [{
        type: "icon",
        resource: {
          primitive: "circle"
        },
        material: {
          color: "black"
        },
        size: 1
      }]
    }
  };

  function getLabelingInfo(type) {

    const color = {
      river: "#284168",
      mountain: "#5b5245",
      valley: "#424140"
    }

    const size = {
      river: 16,
      mountain: 14,
      valley: 12
    }

    return [{
      labelPlacement: "above-center",
      labelExpressionInfo: {
        value: "{label}"
      },
      symbol: {
        type: "label-3d",
        symbolLayers: [{
          type: "text",
          material: {
            color: color[type]
          },
          halo: {
            color: [255, 255, 255, 0.7],
            size: 2
          },
          size: size[type]
        }],
        verticalOffset: {
          screenLength: 150,
          maxWorldLength: 2000,
          minWorldLength: 30
        },
        callout: {
          type: "line",
          size: 1,
          color: color[type]
        }
      }
    }]
  }

  // ugly hack because we don't support multiple label classes on csv layer
  const labelsRiver = new CSVLayer({
    url: "./labels.csv",
    definitionExpression: "type = 'river'",
    renderer: renderer,
    labelingInfo: getLabelingInfo('river')
  });

  const labelsMountains = new CSVLayer({
    url: "./labels.csv",
    definitionExpression: "type = 'mountain'",
    renderer: renderer,
    labelingInfo: getLabelingInfo('mountain')
  });

  const labelsValley = new CSVLayer({
    url: "./labels.csv",
    definitionExpression: "type = 'valley'",
    renderer: renderer,
    labelingInfo: getLabelingInfo('valley')
  });

  map.addMany([labelsValley, labelsMountains, labelsRiver]);

});
