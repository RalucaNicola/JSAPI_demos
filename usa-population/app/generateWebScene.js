define([
  "esri/layers/FeatureLayer",
  "esri/WebScene",
], function(FeatureLayer, WebScene) {

  function generateWebScene(id) {
    const renderer = {
      type: "simple", // autocasts as new SimpleRenderer()
      symbol: {
        type: "polygon-3d", // autocasts as new PolygonSymbol3D()
        symbolLayers: [{
          type: "extrude",
          edges: {
            type: "solid", // autocasts as new SolidEdges3D()
            color: [50, 50, 50, 0.7],
            size: 1
          }
        }],
      },
      visualVariables: [{
        type: "size",
        valueExpression: "Round($feature.TOTPOP_CY/$feature.AREA, 2)",
        stops: [
        {
          value: 10,
          size: 1000,
          label: "1,000"
        },
        {
          value: 2000,
          size: 100000,
          label: ">150,000"
        },
        {
          value: 5000,
          size: 200000,
          label: ">150,000"
        },
        {
          value: 40000,
          size: 500000,
          label: ">150,000"
        }]
      },
      {
        type: "color",
        valueExpression: "Round($feature.TOTPOP_CY/$feature.AREA, 2)",
        legendOptions: {
          title: "Population density"
        },
        stops: [
          {
            value: 10,
            color: "#fff3e0",
            label: "10 pers/sqmi"
          },
          {
            value: 100,
            color: "#F0B5AD",
            label: "50 pers/sqmi"
          },
          {
            value: 2000,
            color: "#B9A0C7",
            label: "2000 pers/sqmi"
          },
          {
            value: 50000,
            color: "#7a558e",
            label: "50000 pers/sqmi"
          }
        ]
      }]
    };

    const countyPopLayer = new FeatureLayer({
      url: "https://services.arcgis.com/jIL9msH9OI208GCb/arcgis/rest/services/USA_Daytime_Population_2016/FeatureServer/1",
      renderer: renderer,
      title: "Population density by county in USA - 2016",
      minScale: 0,
      maxScale: 0,
      popupTemplate: { // autocasts as new PopupTemplate()
        title: "{NAME}, {STATE_NAME}",
        content: "{expression/density} people/sqmi",
        expressionInfos: [{
          name: "density",
          expression: "Round($feature.TOTPOP_CY/$feature.AREA, 2)"
        }]
      }
    });

    const states = new FeatureLayer({
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer",
      renderer: {
        type: "simple",
        symbol: {
          type: "polygon-3d",  // autocasts as new PolygonSymbol3D()
          symbolLayers: [{
            type: "fill",  // autocasts as new FillSymbol3DLayer()
            material: { color: [0, 0, 0, 0] },
            outline: {
              color: "black"
            }
          }]
        }
      },
      legendEnabled: false,
      labelingInfo: [{
        // When using callouts on labels, "above-center" is the only allowed position
        labelPlacement: "above-center",
        labelExpressionInfo: {
          value: "{STATE_NAME}"
        },
        symbol: {
          type: "label-3d", // autocasts as new LabelSymbol3D()
          symbolLayers: [{
            type: "text", // autocasts as new TextSymbol3DLayer()
            material: {
              color: "black"
            },
            halo: {
              color: [255, 255, 255, 0.7],
              size: 2
            },
            size: 12
          }],
          verticalOffset: {
            screenLength: 250,
            maxWorldLength: 50000
          },
          // The callout has to have a defined type (currently only line is possible)
          // The size, the color and the border color can be customized
          callout: {
            type: "line", // autocasts as new LineCallout3D()
            size: 0.5,
            color: [0, 0, 0],
            border: {
              color: [255, 255, 255, 0.7]
            }
          }
        }
      }]
    })

    const webscene = new WebScene({
      portalItem: {
        id: id
      }
    });

    webscene.addMany([countyPopLayer, states]);

    return webscene;
  }

  return generateWebScene;
});


