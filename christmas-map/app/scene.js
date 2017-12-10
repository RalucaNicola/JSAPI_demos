define([
  'esri/WebScene',
  'esri/views/SceneView',
  'esri/layers/VectorTileLayer',
  'esri/layers/FeatureLayer',
], function (WebScene, SceneView, VectorTileLayer, FeatureLayer) {


  function _init(store) {

  /*************************
   * Create view and webscene
   * and add basemap layers
   *************************/
    var christmasLayer = new VectorTileLayer({
      url: "https://basemaps.arcgis.com/b2/arcgis/rest/services/World_Basemap/VectorTileServer"
    });
    christmasLayer.loadStyle("christmas-style.json");

    var webscene = new WebScene({
      basemap: {
        // Add the white background and the watercolor basemap layers
        baseLayers: [christmasLayer]
      }
    });

    var view = new SceneView({
      container: "viewDiv",
      map: webscene,
      viewingMode: "local",
      environment: {
        lighting: {
          directShadowsEnabled: true,
          ambientOcclusionEnabled: false
        }
      },
      popup: {
        dockEnabled: true,
        dockOptions: {
          // Disables the dock button from the popup
          buttonEnabled: false,
          // Ignore the default sizes that trigger responsive docking
          breakpoint: false,
          position: "top-right"
        },
        // Features will be highlighted when popup opens
        highlightEnabled: true
      },
      // Set a custom color for the highlight
      highlightOptions: {
        color: "#ff9900"
      }
    });
    // Clear the top-left corner to make place for the title
    view.ui.empty("top-left");

    view.on("click", function (event) {

      // get the returned screen x, y coordinates and use it
      // with hitTest to find if any graphics were clicked
      // (using promise chaining for cleaner code and error handling)
      view.hitTest(event).then(function (response) {

        // we're only interested in the first result
        var result = response.results[0];
        if (result && result.graphic) {
          return result.graphic;
        }
      }).then(function (graphic) {

        // now extract the object id from the graphic
        var objectid = graphic.attributes.objectid;
        store.dispatch({
          type: 'SELECT COUNTRY',
          selected: graphic
        });

      });
    });

  /************************************
   * Create and add the countries layer
   ***********************************/

  // Create Feature Layer from the points
  var artGalleriesLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/art_galleries_nyc/FeatureServer",
    renderer: {
      type: 'simple',
      symbol: {
        type: 'point-3d',
        symbolLayers: [{
          type: 'icon',
          resource: {
            href: "./img/icon.png"
          },
          size: 28,
        }],
        // Vertical offset will shift the points vertically so that a line callout can be applied
        verticalOffset: {
          screenLength: 40,
          maxWorldLength: 200,
          minWorldLength: 35
        },
        // Line callouts are applied to help interpret point location
        callout: {
          type: 'line',
          color: "#534741",
          size: 1
        }
      }
    },
    elevationInfo: {
      // Elevation mode that will place points on top of the buildings or other SceneLayer 3D objects
      mode: "relative-to-scene"
    },
    outFields: ["*"],
    // Feature reduction is set to selection because our scene contains too many points and they overlap
    featureReduction: {
      type: "selection"
    },
    labelingInfo: [
      {
        labelExpressionInfo: {
          value: "{name}"
        },
        symbol: {
          type: 'label-3d',
          symbolLayers: [{
            type: 'text',
            material: {
              color: [250, 250, 250]
            },
            // Set a halo on the font to make the labels more visible with any kind of background
            halo: {
              size: 1,
              color: [250, 10, 10]
            },
            font: {
              family: 'Berkshire Swash'
            },
            size: 15
          }]
        }
      }],
    labelsVisible: true
  });

  webscene.add(artGalleriesLayer);
  }

  return {
    init: _init
  }
});
