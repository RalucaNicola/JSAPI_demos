require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/ElevationLayer",
  "esri/layers/BaseElevationLayer",
], function (WebScene, SceneView, ElevationLayer, BaseElevationLayer) {
  const ExaggeratedElevationLayer = BaseElevationLayer.createSubclass({
    properties: {
      exaggeration: 2,
    },

    load: function () {
      this._elevation = new ElevationLayer({
        url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
      });

      this.addResolvingPromise(this._elevation.load());
    },

    fetchTile: function (level, row, col, options) {
      // calls fetchTile() on the elevationlayer for the tiles
      // visible in the view
      return this._elevation.fetchTile(level, row, col, options).then(
        function (data) {
          var exaggeration = this.exaggeration;
          for (var i = 0; i < data.values.length; i++) {
            data.values[i] = data.values[i] * exaggeration;
          }

          return data;
        }.bind(this)
      );
    },
  });

  const map = new WebScene({
    portalItem: {
      id: "77e1524d2deb4aeea696d744ba4141a8",
    },
  });

  map.when(function () {
    map.ground.layers = [new ExaggeratedElevationLayer()];
  });

  const view = new SceneView({
    container: "viewDiv",
    viewingMode: "global",
    map: map,
    alphaCompositingEnabled: true,
    qualityProfile: "high",
    environment: {
      background: {
        type: "color",
        color: [255, 252, 244, 0],
      },
      starsEnabled: false,
      atmosphereEnabled: false,
    },
  });

  view.when(() => {
    const canvas = document.querySelector("#viewDiv canvas");

    document.getElementById("sketchSwitch").addEventListener("calciteSwitchChange", evt => {
      canvas.style.filter = evt.target.checked ? "url(#cel-shade)" : "none";
    });
  });

  window.view = view;
});
