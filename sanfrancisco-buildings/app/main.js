define([
  "app/config",
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/GraphicsLayer",
  "esri/widgets/Sketch/SketchViewModel",
  "esri/widgets/BasemapToggle",
  "esri/widgets/Expand",
  "esri/widgets/DirectLineMeasurement3D",
  "esri/widgets/AreaMeasurement3D",
  "esri/widgets/LineOfSight",
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
  BasemapToggle,
  Expand,
  DirectLineMeasurement3D,
  AreaMeasurement3D,
  LineOfSight,
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

      const directLineMeasurement3D = new DirectLineMeasurement3D({
        view: view
      });

      const lineMeasureExpand = new Expand({
        view: view,
        content: directLineMeasurement3D,
        expandIconClass: "esri-icon-polyline",
        expandTooltip: "Start line measurement",
        collapseTooltip: "Stop line measurement"
      });

      lineMeasureExpand.watch("expanded", function(value) {
        if (!value) {
          directLineMeasurement3D.viewModel.clear();
        } else {
          directLineMeasurement3D.viewModel.start();
        }
      });

      const areaMeasurement3D = new AreaMeasurement3D({
        view: view
      });

      const areaMeasureExpand = new Expand({
        view: view,
        content: areaMeasurement3D,
        expandIconClass: "esri-icon-polygon",
        expandTooltip: "Start area measurement",
        collapseTooltip: "Stop area measurement"
      });

      areaMeasureExpand.watch("expanded", function(value) {
        if (!value) {
          areaMeasurement3D.viewModel.clear();
        } else {
          areaMeasurement3D.viewModel.start();
        }
      });

      const lineOfSight = new LineOfSight({
        view: view
      });

      const lineOfSightExpand = new Expand({
        view: view,
        content: lineOfSight,
        expandIconClass: "esri-icon-visible",
        expandTooltip: "Start line of sight",
        collapseTooltip: "Stop line of sight"
      });

      lineOfSightExpand.watch("expanded", function(value) {
        if (!value) {
          lineOfSight.viewModel.clear();
        } else {
          lineOfSight.viewModel.start();
        }
      });

      const basemapToggle = new BasemapToggle({
        view: view,
        nextBasemap: "satellite"
      });
      view.ui.add([lineMeasureExpand, areaMeasureExpand, lineOfSightExpand, basemapToggle], "top-left");

      view.when(function () {
        webscene.allLayers.forEach(layer => {
          if (layer.title === config.buildingLayerTitle) {
            bdgLayer = layer;
            bdgLayer.popupTemplate = {
              content: `Building is {${config.heightField}}m tall, was built in
              {${config.yearField}} and is has a {${config.usageField}} use.`
            };
            bdgLayer.outFields = [config.heightField, config.yearField, config.usageField];
            view.whenLayerView(layer).then(function (lyrView) {
              bdgLayerView = lyrView;
              // add time slider
              const timeSlider = time.createTimeSlider(view, config);
              timeSlider.watch("timeExtent", function (timeExtent) {
                appState.maxYear = timeExtent.end.getFullYear();
                updateMap();
              });

              // watch for changes on the layer
              bdgLayerView.watch("updating", function (updating) {
                if (!updating) {
                  console.log("updating");
                  runQuery();
                }
              });
            });
          }
        });
      });

      // add sketch functionality

      const sketchLayer = new GraphicsLayer({
        elevationInfo: {
          mode: "on-the-ground"
        }
      });
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
          bdgLayerView.filter = {
            geometry: appState.filterGeometry,
            spatialRelationship: "intersects"
          };
          runQuery();
        }
      });

      sketchViewModel.on("update", function (event) {
        if (!event.cancelled && event.graphics.length) {
          appState.filterGeometry = event.graphics[0].geometry;
          bdgLayerView.filter = {
            geometry: appState.filterGeometry,
            spatialRelationship: "intersects"
          };
          runQuery();
        }
      });

      const debouncedRunQuery = promiseUtils.debounce(function () {
        const query = bdgLayerView.createQuery();
        query.geometry = appState.filterGeometry;
        query.outStatistics = statistics.totalStatDefinitions;
        return bdgLayerView.queryFeatures(query).then(charts.updateCharts);
      });

      function runQuery() {
        debouncedRunQuery().catch((error) => {
          if (error.name === "AbortError") {
            return;
          }
          console.error(error);
        });
      }

      document.getElementById("drawPolygon").addEventListener("click", function () {
        sketchViewModel.create("polygon");
      });

      document.getElementById("clearSelection").addEventListener("click", function () {
        appState.filterGeometry = null;
        bdgLayerView.filter = null;
        sketchViewModel.cancel();
        sketchLayer.removeAll();
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

      function updateMap() {
        bdgLayer.definitionExpression = `${config.yearField} <= ${appState.maxYear}`;
      }
    }
  }
});
