require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",

  "esri/Graphic",
  "esri/geometry/Point",

  "dojo/domReady!"
],
function (
  WebScene, SceneView, FeatureLayer,
  Graphic, Point
) {

  const webscene = new WebScene({
    portalItem: {
      id: "78c30bad75594188b2176b32bd0ad1de"
    }
  });

  webscene.when(function () {
    webscene.ground.opacity = 0;
  })

  const view = new SceneView({
    container: "viewDiv",
    map: webscene,
    viewingMode: 'global',
    qualityProfile: "high",
    alphaCompositingEnabled: true,
    environment: {
      background: {
        type: "color",
        color: [0, 0, 0, 0]
      },
      starsEnabled: false,
      atmosphereEnabled: false
    },
    constraints: {
      altitude: {
        min: 5000,
        max: 100000
      }
    }
  });

  const contourLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/Zurich_contourLines/FeatureServer",
    elevationInfo: {
      mode: "absolute-height",
      featureExpressionInfo: {
        expression: "$feature.elevation * 3"
      }
    },
    renderer: {
      type: "simple",
      symbol: {
        type: "line-3d",
        symbolLayers: [{
          type: "line",
          size: "1px"
        }]
      },
      visualVariables: [{
        type: 'color',
        field: 'elevation',
        stops: [{
          value: 0,
          color: '#f4efe3'
        }, {
          value: 800,
          color: [86, 72, 31]
        }]
      }]
    }
  });
  webscene.add(contourLayer);

  const waterLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/waterZurich/FeatureServer/4",
    elevationInfo: {
      mode: "relative-to-ground",
      offset: 700
    },
    renderer: {
      type: "simple",
      symbol: {
        type: "polygon-3d",
        symbolLayers: [{
          type: "extrude",
          material: {
            color: [86, 72, 31]
          },
          size: 50
        }]
      }
    },
    labelingInfo: [{
      labelExpressionInfo: {
        expression: "$feature.NAME"
      },
      where: "name <> Zürichsee AND name <> Limmat",
      symbol: {
        type: "label-3d",
        symbolLayers: [{
          type: "text",
          material: {
            color: [244, 239, 227, 0.9]
          },
          font: {
            weight: "bold"
          },
          size: 10
        }]
      }
    }]
  });

  webscene.add(waterLayer);

  const peaksLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/hillsZurich/FeatureServer",
    elevationInfo: {
      mode: "absolute-height",
      featureExpressionInfo: {
        expression: "Geometry($feature).Z * 3"
      }
    },
    renderer: {
      type: "simple", // autocasts as new SimpleRenderer()
      symbol: {
        type: "point-3d", // autocasts as new PointSymbol3D()
        symbolLayers: [{
          type: "icon", // autocasts as new IconSymbol3DLayer()
          resource: {
            primitive: "circle"
          },
          material: {
            color: [86, 72, 31]
          },
          size: "4px"
        }]
      }
    },
    outFields: ["*"],
    screenSizePerspectiveEnabled: false,
    labelingInfo: [{
      labelPlacement: "above-center",
      labelExpressionInfo: {
        value: "{NAME}"
      },
      symbol: {
        type: "label-3d",
        symbolLayers: [{
          type: "text",
          material: {
            color: [86, 72, 31]
          },
          halo: {
            color: [244, 239, 227, 0.6],
            size: 2
          },
          font: {
            weight: "bold"
          },
          size: 10
        }],
        verticalOffset: {
          screenLength: 50,
          maxWorldLength: 1000,
          minWorldLength: 20
        },
        callout: {
          type: "line",
          size: 1,
          color: [86, 72, 31]
        }
      }
    }]
  });

  webscene.add(peaksLayer);

  const zurichLabel = new Graphic({
    symbol: {
      type: "point-3d",
      symbolLayers: [{
        type: "text",
        material: {
          color: [86, 72, 31]
        },
        font: {
          weight: "bold"
        },
        halo: {
          color: [244, 239, 227, 0.6],
          size: 2
        },
        text: "Zürich",
        size: 12
      }],
      verticalOffset: {
        screenLength: 100,
        maxWorldLength: 1000,
        minWorldLength: 30
      },
      callout: {
        type: "line",
        size: 1,
        color: [86, 72, 31]
      }
    },
    geometry: new Point({
      latitude: 47.3765,
      longitude: 8.526979,
      z: 900,
      spatialReference: {
        wkid: 3857
      }
    })
  });

  const zurichSymbol = new Graphic({
    symbol: {
      type: "point-3d",
      symbolLayers: [{
        type: "object",
        resource: {
          primitive: "sphere"
        },
        material: {
          color: [86, 72, 31]
        },
        height: 50,
        width: 250,
        depth: 250
      }]
    },
    geometry: new Point({
      latitude: 47.3765,
      longitude: 8.526979,
      z: 900,
      spatialReference: {
        wkid: 3857
      }
    })
  });

  const zurichLakeLabel = new Graphic({
    symbol: {
      type: "point-3d",
      symbolLayers: [{
        type: "text",
        text: "Zürichsee",
        material: {
          color: [244, 239, 227, 0.9]
        },
        font: {
          weight: "bold"
        },
        size: 10
      }]
    },
    geometry: new Point({
      latitude: 47.271163,
      longitude: 8.6033646,
      z: 1200,
      spatialReference: {
        wkid: 3857
      }
    })
  });

  view.graphics.addMany([zurichLabel, zurichSymbol, zurichLakeLabel]);

  function addEvents(className, slideNumber) {
    const elements = document.getElementsByClassName(className);

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      el.addEventListener("click", function () {
        view.goTo(webscene.presentation.slides.getItemAt(slideNumber).viewpoint, {
          duration: 2000
        });
      });
    }
  }

  addEvents("home", 0);
  addEvents("uetliberg", 2);
  addEvents("felsenegg", 3);
  addEvents("zurichberg", 4);
  addEvents("albis", 5);
  addEvents("east", 6);

});
