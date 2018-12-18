define([
  "esri/layers/FeatureLayer",
  "esri/WebMap",
], function(FeatureLayer, WebMap) {

  function generateWebMap(id) {

    const renderer = {
      type: "simple", // autocasts as new SimpleRenderer()
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        style: "solid",
        outline: {  // autocasts as new SimpleLineSymbol()
          color: [150, 150, 150, 0.7],
          width: 0.1
        }
      },
      visualVariables: [
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

    const webmap = new WebMap({
      portalItem: {
        id: id
      }
    });

    webmap.addMany([countyPopLayer]);

    return webmap;
  }

  return generateWebMap;
});


