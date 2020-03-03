define([
  "app/config",
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/GraphicsLayer",
  "esri/widgets/Sketch/SketchViewModel",
  "esri/config",
  "esri/core/promiseUtils",
  "app/time",
  "app/statistics",
  "app/renderers",
  "app/charts"
], function (config,
  WebScene,
  SceneView,
  GraphicsLayer,
  SketchViewModel,
  esriConfig,
  promiseUtils,
  time,
  statistics,
  renderers,
  charts) {

  return {
    init: function () {
      esriConfig.portalUrl = config.portalUrl;

      let bdgLayer = null;
      let bdgLayerView = null;
      let highlightHandle = null;

      const appState = {
        minYear: 0,
        maxYear: null,
        totalCount: null,
        filterGeometry: null,
        features: null
      };

      const webscene = new WebScene({
        portalItem: {
          id: config.itemId
        }
      });

      const view = new SceneView({
        container: "viewDiv",
        qualityProfile: "high",
        map: webscene
      });

      view.when(function () {
        webscene.allLayers.forEach(layer => {
          if (layer.title === config.buildingLayerTitle) {
            bdgLayer = layer;
            bdgLayer.outFields = [config.heightField, config.yearField, config.usageField];
            view.whenLayerView(layer).then(function (lyrView) {
              bdgLayerView = lyrView;
              // add time slider
              const timeSlider = time.createTimeSlider(view, config);
              timeSlider.watch("timeExtent", function (timeExtent) {
                appState.maxYear = timeExtent.end.getFullYear();
                updateMap();
                runQuery();
              });
            });
          }
        });
      });

      // add sketch functionality

      const sketchLayer = new GraphicsLayer();
      webscene.add(sketchLayer);

      const sketchViewModel = new SketchViewModel({
        layer: sketchLayer,
        defaultUpdateOptions: {
          tool: "reshape",
          toggleToolOnClick: false
        },
        view: view
      });

      sketchViewModel.on("create", function (event) {
        if (event.state === "complete") {
          appState.filterGeometry = event.graphic.geometry;
          runQuery();
        }
      });

      sketchViewModel.on("update", function (event) {
        if (event.state !== "cancel" && event.graphics.length) {
          appState.filterGeometry = event.graphics[0].geometry;
          runQuery();
        }
      });
      const debouncedRunQuery = promiseUtils.debounce(function () {
        if (appState.filterGeometry) {
          return promiseUtils.eachAlways([
            queryStatistics(),
            queryObjectIds()
          ])
        }
        return queryStatistics();
      });

      function queryStatistics() {
        const query = bdgLayerView.createQuery();
        query.geometry = appState.filterGeometry;
        query.outStatistics = statistics.totalStatDefinitions;
        return bdgLayerView.queryFeatures(query).then(charts.updateCharts);
      }

      function queryObjectIds() {
        const query = bdgLayerView.createQuery();
        query.geometry = appState.filterGeometry;
        return bdgLayerView.queryObjectIds(query).then(highlightBuildings);
      }

      function runQuery() {
        debouncedRunQuery().catch((error) => {
          if (error.name === "AbortError") {
            return;
          }
          console.error(error);
        });
      }

      view.watch("updating", function (updating) {
        if (!updating) {
          runQuery();
        }
      });

      document.getElementById("drawPolygon").addEventListener("click", function () {
        sketchViewModel.create("polygon");
      });

      document.getElementById("clearSelection").addEventListener("click", function () {
        appState.filterGeometry = null;
        sketchViewModel.cancel();
        sketchLayer.removeAll();
        clearHighlighting();
        runQuery();
      });

      document.getElementById("applyYearRenderer").addEventListener("click", function () {
        renderers.applyYearRenderer(bdgLayer);
      });

      document.getElementById("applyHeightRenderer").addEventListener("click", function () {
        renderers.applyHeightRenderer(bdgLayer);
      });

      document.getElementById("applyUsageRenderer").addEventListener("click", function () {
        renderers.applyUsageRenderer(bdgLayer);
      });

      document.getElementById("clearRenderer").addEventListener("click", function () {
        renderers.applyOriginalTexture(bdgLayer);
      });

      function clearHighlighting() {
        if (highlightHandle) {
          highlightHandle.remove();
          highlightHandle = null;
        }
      }

      function highlightBuildings(objectIds) {
        // Remove any previous highlighting
        clearHighlighting();
        highlightHandle = bdgLayerView.highlight(objectIds);
      }

      function updateMap() {
        bdgLayer.definitionExpression = `${config.yearField} <= ${appState.maxYear}`;
      }
    }
  }
});
