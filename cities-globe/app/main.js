define([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",
  "esri/layers/support/LabelClass"
], function (WebScene, SceneView, FeatureLayer, LabelClass) {

  return {

    init: function() {

      const webscene = new WebScene({
        basemap: null,
        ground: {
          surfaceColor: [226, 240, 255]
        }
      });

      const view = new SceneView({
        container: "view",
        map: webscene,
        alphaCompositingEnabled: true,
        camera: {
          position: {
            spatialReference: {
              wkid: 4326
            },
            x: 94.28248677690586,
            y: 21.553684553226123,
            z: 25000000
          },
          heading: 0,
          tilt: 0.12089379039103153
        },
        constraints: {
          altitude: {
            min: 18000000,
            max: 25000000
          }
        },
        environment: {
          background: {
            type: "color",
            color: [0, 0, 0, 0]
          },
          lighting: {
            date: "Sun Jul 15 2018 15:30:00 GMT+0900 (W. Europe Daylight Time)",
          },
          starsEnabled: false,
          atmosphereEnabled: false
        }
      });
      window.view = view;

      view.ui.empty("top-left");

      const countryBoundaries = new FeatureLayer({
        url: "http://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer",
        title: "World Countries",
        renderer: {
          type: "simple",
          symbol: {
            type: "polygon-3d",
            symbolLayers: [{
              type: "fill",  // autocasts as new FillSymbol3DLayer()
              material: { color: [255, 250, 239, 0.8] },
              outline: {
                color: [70, 70, 70, 0.7]
              }
            }]
          }
        }
      });

      const populationLayer = new FeatureLayer({
        url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities_analysis/FeatureServer",
        definitionExpression: "POP > 6000000",
        renderer: {
          type: "simple",
          symbol: {
            type: "point-3d",
            symbolLayers: [{
              type: "icon",
              size: 8,
              resource: { primitive: "circle" },
              material: { color: "#4c397f" },
              outline: {
                size: 1,
                color: "white"
              }
            }],
            verticalOffset: {
              screenLength: 20
            },
            callout: {
              type: "line", // autocasts as new LineCallout3D()
              size: 1.5,
              color: "#4c397f"
            }
          }
        },
        screenSizePerspectiveEnabled: false,
        labelingInfo: [
          new LabelClass({
            labelExpressionInfo: { expression: "$feature.CITY_NAME" },
            symbol: {
              type: "label-3d",
              symbolLayers: [{
                type: "text",  // autocasts as new TextSymbol3DLayer()
                material: { color: "#4c397f" },
                size: 10,
                font: {
                  family: "Open Sans",
                  weight: "bold"
                },
                halo: {
                  color: "white",
                  size: 1
                }
              }]
            }
          })
        ]
      });

      const graticule = new FeatureLayer({
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/World_graticule_15deg/FeatureServer",
        opacity: 0.8
      });

      webscene.addMany([graticule, countryBoundaries, populationLayer]);

      view.watch('zoom', function (newValue, oldValue) {
        if (parseInt(newValue) !== parseInt(oldValue)) {
          radius = (45 - 37) / (2.4 - 1.3) * (newValue - 1.3) + 37;
          document.getElementById("circle").setAttribute("style", "shape-outside: circle(" + radius.toFixed(2) + "%); float: right; display: inherit;");
        }
      });
    }
  }
});
