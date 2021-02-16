require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/CSVLayer",
  "esri/layers/FeatureLayer",
  "esri/Basemap",
  "esri/core/watchUtils"
], function(Map, SceneView, CSVLayer, FeatureLayer, Basemap, watchUtils) {
  const countryBorders = new FeatureLayer({
    url:
      "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0",
    renderer: {
      type: "simple",
      symbol: {
        type: "polygon-3d",
        symbolLayers: [
          {
            type: "fill",
            outline: {
              color: [255, 255, 255, 0.8],
              size: 1
            }
          }
        ]
      }
    }
  });

  const plateTectonicBorders = new FeatureLayer({
    url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/plate_tectonics_boundaries/FeatureServer",
    elevationInfo: {
      mode: "on-the-ground"
    },
    renderer: {
      type: "simple",
      symbol: {
        type: "line-3d",
        symbolLayers: [
          {
            type: "line",
            material: { color: [255, 133, 125, 0.7] },
            size: 3
          }
        ]
      }
    }
  });

  const map = new Map({
    ground: {
      opacity: 0
    },
    basemap: new Basemap({
      baseLayers: [countryBorders, plateTectonicBorders]
    })
  });

  // the view associated with the map has a transparent background
  // so that we can apply a CSS shadow filter for the glow
  const view = new SceneView({
    container: "view-container",
    qualityProfile: "high",
    map: map,
    alphaCompositingEnabled: true,
    environment: {
      background: {
        type: "color",
        color: [0, 0, 0, 0]
      },
      starsEnabled: false,
      atmosphereEnabled: false
    },
    ui: {
      components: []
    },
    highlightOptions: {
      color: "white"
    },
    padding: {
      bottom: 200
    },
    popup: {
      collapseEnabled: false,
      dockEnabled: false,
      dockOptions: {
        breakpoint: false
      }
    }
  });

  function getDepth(exaggeration) {
    return {
      mode: "absolute-height",
      featureExpressionInfo: {
        expression: `-$feature.depth * ${exaggeration}`
      },
      unit: "kilometers"
    }
  }

  const exaggeratedElevation = {
    mode: "absolute-height",
    featureExpressionInfo: {
      expression: "-$feature.depth * 6"
    },
    unit: "kilometers"
  };

  const realElevation = {
    mode: "absolute-height",
    featureExpressionInfo: {
      expression: "-$feature.depth"
    },
    unit: "kilometers"
  };
  let exaggerated = true;

  // define the earthquakes layer
  const earthquakeLayer = new CSVLayer({
    url: "./earthquake_data.csv",
    elevationInfo: exaggeratedElevation,
    screenSizePerspectiveEnabled: false,
    renderer: {
      type: "simple",
      symbol: {
        type: "point-3d",
        symbolLayers: [
          {
            type: "object",
            resource: {
              primitive: "sphere"
            },
            material: { color: [255, 250, 239, 0.8] },
            depth: 10000,
            height: 10000,
            width: 10000
          }
        ]
      },
      visualVariables: [
        {
          type: "size",
          field: "mag",
          axis: "all",
          stops: [
            { value: 5.5, size: 70000, label: "<15%" },
            { value: 7, size: 250000, label: "25%" }
          ]
        },
        {
          type: "color",
          field: "mag",
          legendOptions: {
            title: "Magnitude"
          },
          stops: [
            { value: 6, color: [254, 240, 217], label: "4.5 - 6" },
            { value: 7, color: [179, 0, 0], label: ">7" }
          ]
        }
      ]
    },
    popupTemplate: {
      content: "Magnitude {mag} {type} hit {place} on {time} at a depth of {depth} km.",
      title: "Earthquake info",
      fieldInfos: [
        {
          fieldName: "time",
          format: {
            dateFormat: "short-date-long-time-24"
          }
        },
        {
          fieldName: "mag",
          format: {
            places: 1,
            digitSeparator: true
          }
        },
        {
          fieldName: "depth",
          format: {
            places: 1,
            digitSeparator: true
          }
        }
      ]
    }
  });

  map.add(earthquakeLayer);

  let earthquakeLayerView = null;
  let highlightHandler = null;

  view.whenLayerView(earthquakeLayer).then(function(lyrView) {
    earthquakeLayerView = lyrView;
  });

  function formatDate(date) {
    const fDate = new Date(date);
    const year = fDate.getFullYear();
    const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(fDate);
    const day = fDate.getDate();
    const hours = fDate.getHours();
    const minutes = fDate.getMinutes();
    const prefix = minutes < 10 ? "0" : "";
    return `${day} ${month} ${year}, at ${hours}:${prefix}${minutes}`;
  }

  earthquakeLayer
    .queryFeatures({
      where: "mag > 7",
      returnGeometry: true
    })
    .then(function(result) {
      const features = result.features;
      const list = document.getElementById("earthquake-list");
      features.forEach(function(earthquake) {
        const attr = earthquake.attributes;
        const content = document.createElement("div");
        content.innerHTML = `
          <div>
            <h3>${attr.place}</h3>
            <span class="date-time"><i>${formatDate(attr.time)}</i></span>
            </br>
            Magnitude ${attr.mag} | Depth ${attr.depth} km
          </div>
        `;
        const goToButton = document.createElement("button");
        goToButton.innerText = "Zoom to earthquake";
        goToButton.addEventListener("click", function() {
          console.log(earthquake);
          view.goTo({ target: earthquake, zoom: 4 }, { speedFactor: 0.5 });
          if (earthquakeLayerView) {
            if (highlightHandler) {
              highlightHandler.remove();
            }
            highlightHandler = earthquakeLayerView.highlight(earthquake);
            view.popup.open({features: [earthquake], location: earthquake.geometry})
          }
        });
        content.appendChild(goToButton);
        list.appendChild(content);
      });
    })
    .catch(console.error);

  document.getElementById("actualDepth").addEventListener("click", function() {
    earthquakeLayer.elevationInfo = getDepth(1);
  });

  document.getElementById("exaggeratedTwo").addEventListener("click", function() {
    earthquakeLayer.elevationInfo = getDepth(2);
  });

  document.getElementById("exaggeratedSix").addEventListener("click", function() {
    earthquakeLayer.elevationInfo = getDepth(6);
  });


  function rotate() {
    if (!view.interacting) {
      const camera = view.camera.clone();
      camera.position.longitude -= 0.1;
      view.camera = camera;
      requestAnimationFrame(rotate);
    }
  }

  view.when(function() {
    view.constraints.clipDistance.far = 40000000;
    watchUtils.whenFalseOnce(view, "updating", function() {
      rotate();
    });
  });

  let legendVisible = true;
  const legendController = document.getElementById("legend-control");
  const legendContainer = document.getElementById("legend");
  legendController.addEventListener("click", function() {
    legendContainer.style.display = legendVisible ? "none" : "block";
    legendController.innerHTML = legendVisible ? "Show explanation" : "Hide explanation";
    legendVisible = !legendVisible;
  });
});
