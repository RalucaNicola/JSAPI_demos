require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/SceneLayer",
  "dojo/has",
  "dojo/domReady!"
], function (WebScene, SceneView,
  SceneLayer, has) {

  var webscene = new WebScene({
    portalItem: {
      id: "74904be5976b418f9a4647db3dd3e989"
    }
  });

  var view = new SceneView({
    container: "viewDiv",
    map: webscene
  });

  view.when(function() {

    view.environment.lighting.directShadowsEnabled = true;
    const sitePlanLayer = new SceneLayer({
      // Data copyright: Houseal Lavigne Associates, LLC
      url: "https://tiles.arcgis.com/tiles/74bZbbuf05Ctvbzv/arcgis/rest/services/SitePlan_Clean/SceneServer",
      renderer: {
        type: "simple",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: {
              color: "#ffffff",
              colorMixMode: "tint"
            },
            edges: {
              type: "sketch",
              color: [0, 0, 0, 0.65],
              extensionLength: 10,
              size: 1
            }
          }]
        }
      },
      popupEnabled: false
    });

    const buildingsLayer = new SceneLayer({
      // Data copyright: Houseal Lavigne Associates, LLC
      url: "https://tiles.arcgis.com/tiles/74bZbbuf05Ctvbzv/arcgis/rest/services/Buildings/SceneServer",
      renderer: {
        type: "simple",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: {
              color: "#ffffff",
              colorMixMode: "replace"
            },
            edges: {
              type: "sketch",
              color: [0, 0, 0, 0.65],
              extensionLength: 10,
              size: 1
            }
          }]
        }
      },
      popupEnabled: false
    });

    const proposedProjectLayer = new SceneLayer({
      // Data copyright: Houseal Lavigne Associates, LLC
      url: "https://tiles.arcgis.com/tiles/74bZbbuf05Ctvbzv/arcgis/rest/services/Option2_r/SceneServer",
      renderer: {
        type: "simple",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: {
              color: "#ffffff",
              colorMixMode: "replace"
            },
            edges: {
              type: "sketch",
              color: [0, 0, 0, 0.65],
              extensionLength: 10,
              size: 1
            }
          }]
        }
      },
      popupEnabled: false
    });

    webscene.addMany([sitePlanLayer, proposedProjectLayer, buildingsLayer]);

    if (isMobile()) {
      view.ui.empty("top-left");
    }
  })
  .catch(function() {
    document.getElementById("viewDiv").innerHTML = "<h2>Sorry, it seems your browser doesn't support WebGL :(</h2>";
  });

  function isMobile() {
    if (has("ui-mode:phone") || has("ui-mode:tablet")) {
      return true;
    }
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent);
  }
});
