require([
  "esri/WebScene",
  "esri/views/SceneView",

  "esri/layers/FeatureLayer",
  "esri/layers/VectorTileLayer",
  "esri/layers/SceneLayer",
  "esri/layers/ElevationLayer",

  "esri/renderers/ClassBreaksRenderer",
  "esri/renderers/SimpleRenderer",

  "esri/symbols/MeshSymbol3D",
  "esri/symbols/FillSymbol3DLayer",
  "esri/symbols/PointSymbol3D",
  "esri/symbols/IconSymbol3DLayer",
  "esri/symbols/callouts/LineCallout3D",
  "esri/symbols/LabelSymbol3D",
  "esri/symbols/TextSymbol3DLayer",

  "esri/widgets/Search",
  "dojo/domReady!"
], function (WebScene, SceneView,
  FeatureLayer, VectorTileLayer, SceneLayer, ElevationLayer,
  ClassBreaksRenderer, SimpleRenderer,
  MeshSymbol3D, FillSymbol3DLayer, PointSymbol3D, IconSymbol3DLayer, LineCallout3D, LabelSymbol3D, TextSymbol3DLayer,
  Search) {

  /************************
   * Create basemap layers
   ***********************/

  // create watercolor vector tile layer as basemap layer
  const basemapLayer = new VectorTileLayer({
    url:
      "https://www.arcgis.com/sharing/rest/content/items/fdf540eef40344b79ead3c0c49be76a9/resources/styles/root.json",
    opacity: 0.5
  });

  /*************************
   * Create view and webscene
   * and add basemap layers
   *************************/

  const webscene = new WebScene({
    basemap: {
      // Add the white background and the watercolor basemap layers
      baseLayers: [basemapLayer]
    },
    // Set the ground to world elevation, otherwise buildings will float
    ground: {
      layers: [
        new ElevationLayer({
          url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
        })
      ],
      surfaceColor: "#ffffff"
    }
  });

  const view = new SceneView({
    container: "viewDiv",
    map: webscene,
    alphaCompositingEnabled: true,
    environment: {
      lighting: {
        directShadowsEnabled: true,
        ambientOcclusionEnabled: false,
      },
      background: {
        type: "color",
        color: [0, 0, 0, 0]
      },
      starsEnabled: false,
      atmosphereEnabled: false
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

  /************************************
   * Create and add the buildings layer
   ***********************************/

  const buildingsLayer = new SceneLayer({
    url: "https://tiles.arcgis.com/tiles/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Buildings_NewYork_Galleries/SceneServer",
    // Popups are not needed for the buildings
    popupEnabled: false,
    // Render buildings with 2 colors depending on whether they have an art gallery or not
    renderer: new ClassBreaksRenderer({
      // This field contains the number of art galleries or null if the building doesn't have any art gallery
      field: "NoArtGalleries",
      // If the building doesn't have any art gallery then the attribute value is null and defaultSymbol will be used
      defaultSymbol: new MeshSymbol3D({
        symbolLayers: [new FillSymbol3DLayer({
          material: {
            color: [255, 235, 190, 0.9]
          },
          edges: {
            type: "solid",
            color: [122, 107, 78, 0.6]
          }
        })]
      }),
      // If the building has art galleries then their number vary between 1 and 30 and they will have a purple color
      classBreakInfos: [{
        minValue: 1,
        maxValue: 30,
        symbol: new MeshSymbol3D({
          symbolLayers: [new FillSymbol3DLayer({
            material: { color: [187, 165, 181] },
            edges: {
              type: "solid",
              color: [122, 107, 78, 0.6]
            }
          })]
        })
      }]
    })
  });

  webscene.add(buildingsLayer);

  /****************************************
   * Create and add the art galleries layer
   ***************************************/

  // Set the popup template to display more information about each art gallery
  const popupTemplate = {
    title: "{name}",
    content: "<p><b>Address:</b> {address1}, {city}</p>" +
    "<p><b>Telephone:</b> {tel}</p>" +
    "<p><a href={url} target='_blank'>Visit homepage</a></p>",
  };

  window.view = view;

  // Create Feature Layer from the points
  const artGalleriesLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/art_galleries_nyc/FeatureServer",
    renderer: new SimpleRenderer({
      symbol: new PointSymbol3D({
        symbolLayers: [new IconSymbol3DLayer({
          resource: {
            href: "./img/icon.png"
          },
          size: 28,
        })],
        // Vertical offset will shift the points vertically so that a line callout can be applied
        verticalOffset: {
          screenLength: 40,
          maxWorldLength: 200,
          minWorldLength: 35
        },
        // Line callouts are applied to help interpret point location
        callout: new LineCallout3D({
          color: "#534741",
          size: 1
        })
      })
    }),
    // Depth perception is improved by using screenSizePerspectiveEnabled
    // screenSizePerspectiveEnabled: true, // by default this is set to true, set it to false when using sizeVisualVariables
    popupEnabled: true,
    popupTemplate: popupTemplate,
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
        symbol: new LabelSymbol3D({
          symbolLayers: [new TextSymbol3DLayer({
            material: {
              color: "white"
            },
            // Set a halo on the font to make the labels more visible with any kind of background
            halo: {
              size: 1,
              color: [50, 50, 50]
            },
            size: 10
          })]
        })
      }],
    labelsVisible: true
  });

  webscene.add(artGalleriesLayer);

  /******************************
   * Create and add search widget
   *****************************/

  const search = new Search({
    view: view,
    sources: [{
      // the widget will only use the art galleries layer for the search
      layer: artGalleriesLayer,
      outFields: ["*"],
      autoNavigate: true,
      searchFields: ["name"],
      displayField: "name",
      exactMatch: false,
      placeholder: "Search art gallery",
      popupTemplate: popupTemplate,
      popupOpenOnSelect: true
    }],
    suggestionsEnabled: true,
    maxResults: 10,
    searchAllEnabled: true,
    popupOpenOnSelect: true,
    resultGraphicEnabled: false,
    popUpEnabled: true,
    includeDefaultSources: false
  });

  view.ui.add(search, {
    position: "top-right"
  });

  // Once the view is ready go to the extent of the buildings layer
  view.when(function() {
    view.goTo({ target: buildingsLayer.fullExtent, tilt: 60, zoom: 15 }).catch(function(error) {console.log(error);});
  });

});
