require([
  "esri/layers/FeatureLayer",
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/PointSymbol3D",
  "esri/symbols/IconSymbol3DLayer",
  "dojo/domReady!"
], function (
  FeatureLayer,
  WebScene, SceneView,
  SimpleRenderer,
  PointSymbol3D,
  IconSymbol3DLayer
) {

    // renderer for the population layer
    const renderer = {
      type: "class-breaks",
      field: "mag",
      classBreakInfos: [{
        minValue: 2.5,
        maxValue: 4.0,
        symbol: {
          type: "point-3d",
          symbolLayers: [{
            type: "icon",
            resource: { primitive: "circle" },
            material: { color: "#57db48" }
          }]
        }
      }, {
        minValue: 4.01,
        maxValue: 7.0,
        symbol: {
          type: "point-3d",
          symbolLayers: [{
            type: "icon",
            resource: { primitive: "circle" },
            material: { color: "#00E9FF" }
          }]
        }
      }, {
        minValue: 7.01,
        maxValue: 10.0,
        symbol: {
          type: "point-3d",
          symbolLayers: [{
            type: "icon",
            resource: { primitive: "circle" },
            material: { color: "#ff5400" }
          }]
        }
      }],
      visualVariables: [{
          type: "size",
          field: "mag",
          stops: [{
            value: 2.5,
            size: 1
          },{
            value: 7,
            size: 5
          }]
      }]
    };

    const template = {
      title: "Earthquake at {longitude}, {latitude}",
      content: [{
        type: "fields",
        fieldInfos: [{
          fieldName: "dateTime",
          label: "Date/Time",
          visible: true
        }, {
          fieldName: "mag",
          label: "Magnitude",
          visible: true,
        }, {
          fieldName: "depthSigM",
          label: "Depth",
          visible: true
        }]
      }]
    };

    const earthquakesLayer = new FeatureLayer({
      url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/World_Earthquakes/FeatureServer/0/",
      //definitionExpression: "mag > 5",
      renderer: renderer,
      outfields: ["dateTime", "mag", "depthSigM", "latitude", "longitude"],
      elevationInfo: {
        mode: "absolute-height",
        featureExpressionInfo: {
          expression: "-Geometry($feature).z * 10"
        }
      },
      popupTemplate: template
    });

    const scene = new WebScene({
      portalItem: {
        id: "f5941614c9934b4a9346e732fb1af400"
      }
    });

    scene.add(earthquakesLayer);


    // set the environment
    const view = new SceneView({
      map: scene,
      container: "viewDiv",
      constraints: {
        collision: {
          enabled: true
        }
      },
      padding: {
        bottom: 200
      },
      highlightOptions: {
        color: "#b096ff"
      },
      ui: {
        components: []
      }
    });
    window.view = view;

  });