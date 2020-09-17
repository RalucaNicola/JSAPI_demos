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
  "esri/widgets/Daylight",
  "esri/config",
  "esri/core/promiseUtils",
  "app/time",
  "app/statistics",
  "app/renderers",
  "app/charts",
  "app/utils"
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
  Daylight,
  esriConfig,
  promiseUtils,
  time,
  statistics,
  renderers,
  charts,
  utils) {

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
        features: null,
        selection: false
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

      /* add widgets for measurement, line of sight, daylight settings and basemap toggle */

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
          directLineMeasurement3D.viewModel.clearMeasurement();
        } else {
          directLineMeasurement3D.viewModel.newMeasurement();
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
          areaMeasurement3D.viewModel.clearMeasurement();
        } else {
          areaMeasurement3D.viewModel.newMeasurement();
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

      const daylightExpand = new Expand({
        view: view,
        content: new Daylight({
          view: view
        }),
        expandIconClass: "esri-icon-environment-settings",
        expandTooltip: "Open daylight settings",
        collapseTooltip: "Close daylight settings"
      })
      view.ui.add([lineMeasureExpand, areaMeasureExpand, lineOfSightExpand, daylightExpand, basemapToggle], "top-left");

      view.ui.add("statsContainer", "top-right");
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
                runQuery();
              });
              runQuery();
              addChartEventListeners();
            });
          }
        });
      });

      function addChartEventListeners() {
        charts.usageChart.options.hover.onHover = function(event, elements) {
          if (elements[0]) {
            let whereClause = "";
            try {
              const element = config.usageValues.find(usage => usage.label === elements[0]._model.label);
              whereClause = `${config.usageField} = '${element.value}'`;
            } catch {
              sqlClauses = config.usageValues.map(function(e) {
                return `${config.usageField} <> '${e.value}'`;
              });
              whereClause = sqlClauses.join(" AND ");
            }
            if (bdgLayerView.filter) {
              if (elements[0]._model.label === "Other") {
                bdgLayerView.filter.where = whereClause;
              } else {
                bdgLayerView.filter.where = whereClause;
              }
            } else {
              bdgLayerView.filter = {
                where: whereClause
              }
            }
          } else {
            removeWhereFilter();
          }
        }

        charts.yearChart.options.hover.onHover = function(event, elements) {
          if (elements[0]) {
            const element = config.yearClasses.find(yearClass => yearClass.label === elements[0]._model.label);
            const whereClause = `${config.yearField} < ${element.maxYear} AND ${config.yearField} >= ${element.minYear}`;
            if (bdgLayerView.filter) {
              bdgLayerView.filter.where = whereClause;
            } else {
              bdgLayerView.filter = {
                where: whereClause
              }
            }
          } else {
            removeWhereFilter();
          }
        }

        charts.heightChart.options.hover.onHover = function(event, elements) {
          if (elements[0]) {
            const element = utils.heightBins.find(heightBin => heightBin.label === elements[0]._model.label);
            if (bdgLayerView.filter) {
              bdgLayerView.filter.where = element.whereClause;
            } else {
              bdgLayerView.filter = {
                where: element.whereClause
              }
            }
          } else {
            removeWhereFilter();
          }
        }
      }

      function removeWhereFilter() {
        if (bdgLayerView.filter) {
          bdgLayerView.filter.where = null;
        } else {
          bdgLayerView.filter = {
            where: null
          }
        }
      }

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

        if (appState.selection) {
          const query = bdgLayerView.createQuery();
          query.geometry = appState.filterGeometry;
          query.outStatistics = statistics.totalStatDefinitions;
          return bdgLayerView.queryFeatures(query).then(function(result) {
            charts.updateCharts(result, appState.selection);
          }).catch(console.error);
        } else {
          const query = bdgLayer.createQuery();
          query.outStatistics = statistics.totalStatDefinitions;
          return bdgLayer.queryFeatures(query).then(function(result) {
            charts.updateCharts(result);
          }).catch(console.error);
        }

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
        appState.selection = true;
        sketchViewModel.create("polygon");
      });

      document.getElementById("clearSelection").addEventListener("click", function () {
        appState.filterGeometry = null;
        appState.selection = false;
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
