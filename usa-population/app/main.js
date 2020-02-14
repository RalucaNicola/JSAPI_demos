require([], function() {
  const params = new URL(document.location).searchParams;
  const mode = params.get("mode") || "compare";

  switch (mode) {
    case "3D":
      document.getElementById("sceneDiv").classList.add("viewDiv");
      load3DMode();
      break;
    case "2D":
      document.getElementById("mapDiv").classList.add("viewDiv");
      load2DMode();
      break;
    case "compare":
      document.getElementById("sceneDiv").classList.add("compare", "viewDiv");
      document.getElementById("mapDiv").classList.add("compare", "viewDiv");
      loadCompareMode();
      break;
  }

  function load2DMode() {
    require(["esri/views/MapView", "app/generateWebMap"], function(
      MapView,
      generateWebMap
    ) {
      const webmap = generateWebMap("a37060f4a15e49498d8af4db9e3cc6f7");

      const mapView = new MapView({
        container: "mapDiv",
        map: webmap,
        highlightOptions: {
          fillOpacity: 0,
          color: "#42d2ff"
        }
      });
    });
  }

  function load3DMode() {
    require(["esri/views/SceneView", "app/generateWebScene"], function(
      SceneView,
      generateWebScene
    ) {
      const webscene = generateWebScene("dfdcdaef528b4f94b951262b4df38c86");

      const sceneView = new SceneView({
        container: "sceneDiv",
        map: webscene,
        qualityProfile: "high",
        highlightOptions: {
          fillOpacity: 0,
          color: "#42d2ff"
        }
      });
    });
  }

  function loadCompareMode() {
    require([
      "esri/views/SceneView",
      "esri/views/MapView",
      "app/generateWebMap",
      "app/generateWebScene",
      "app/syncUtil"
    ], function(
      SceneView,
      MapView,
      generateWebMap,
      generateWebScene,
      syncUtil
    ) {
      const webscene = generateWebScene("dfdcdaef528b4f94b951262b4df38c86");
      const webmap = generateWebMap("a37060f4a15e49498d8af4db9e3cc6f7");

      const mapView = new MapView({
        container: "mapDiv",
        map: webmap,
        highlightOptions: {
          fillOpacity: 0,
          color: "#42d2ff"
        },
        constraints: { snapToZoom: false }
      });

      const sceneView = new SceneView({
        container: "sceneDiv",
        map: webscene,
        qualityProfile: "high",
        highlightOptions: {
          fillOpacity: 0,
          color: "#42d2ff"
        }
      });

      // synchronize the two views
      syncUtil.syncViews(mapView, sceneView);
    });
  }
});
