require([
  "esri/layers/FeatureLayer",
  "esri/Map",
  "esri/views/SceneView",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/PointSymbol3D",
  "esri/symbols/ObjectSymbol3DLayer",
  "utils",
  "esri/smartMapping/statistics/summaryStatistics",
  "dojo/domReady!"
], function (
  FeatureLayer,
  Map, SceneView,
  SimpleRenderer,
  PointSymbol3D,
  ObjectSymbol3DLayer,
  utils,
  summaryStatistics
) {

    // renderer for the population layer
    const renderer = new SimpleRenderer({
      symbol: new PointSymbol3D({
        symbolLayers: [new ObjectSymbol3DLayer({
          resource: {
            primitive: "cube"
          },
          material: {
            color: "#00E9FF"
          },
          anchor: "bottom",
          width: 60000,
          depth: 60000,
          height: 60000
        })]
      })
    });

    const populationLayer = new FeatureLayer({
      url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/World_population_count_2020/FeatureServer",
      definitionExpression: "population_count > 10",
      renderer: renderer
    })

    const graticule = new FeatureLayer({
      url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/World_graticule_15deg/FeatureServer",
      renderer: {
        type: "simple",
        symbol: {
          type: "line-3d",
          symbolLayers: [{
            type: "line",
            material: {
              color: "#00E9FF"
            }
          }]
        }
      },
      opacity: 0.3
    });

    const countryBoundaries = new FeatureLayer({
      url: "http://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer",
      title: "World Countries",
      renderer: {
        type: "simple",
        symbol: {
          type: "polygon-3d",
          symbolLayers: [{
            type: "fill",  // autocasts as new FillSymbol3DLayer()
            material: { color: [255, 250, 239, 0] },
            outline: {
              color: "#00E9FF",
              size: 1
            },
          }]
        }
      }
    });

    const map = new Map({
      layers: [graticule, populationLayer, countryBoundaries],
      ground: {
        surfaceColor: [5, 50, 56],
        opacity: 0.7
      }
    });


    // set the environment
    const view = new SceneView({
      map: map,
      container: "viewDiv",
      camera: {
        position: {
          spatialReference: {
            latestWkid: 4326,
            wkid: 4326
          },
          x: -120.45651418690257,
          y: 20.813251923155075,
          z: 23057115
        },
        heading: 0,
        tilt: 0
      },
      padding: {
        bottom: 200
      },
      ui: {
        components: []
      },
      environment: {
        background: {
          type: "color",
          color: [5, 50, 56]
        },
        atmosphereEnabled: false,
        starsEnabled: false,
        lighting: {
          directShadowsEnabled: true,
          date: "Sun Jul 15 2018 23:47:59 GMT+0200 (Central European Summer Time)",
          cameraTrackingEnabled: true,
          ambientOcclusionEnabled: true
        }
      }
    });
    window.view = view;

    summaryStatistics({
      layer: populationLayer,
      field: "population_count"
    })
      .then((result) => {
        const slider = utils.createSlider(Math.log(result.min), Math.log(result.max));
        view.whenLayerView(populationLayer).then(function(populationLayerView) {

          slider.on('update', function (values, handles, unencoded) {
            const min = parseInt(Math.exp(unencoded[0]));
            const max = parseInt(Math.exp(unencoded[1]));
            populationLayerView.filter = {
              where: `population_count >= ${min} AND population_count <= ${max}`
            };
          });
        });
      })
      .catch((err) => {
        console.log(err);
      });

  });
