
const TERRAIN_URL = "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer";
const TREES_URL = "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/Laax_trees_updated_WM/SceneServer";
const BUILDINGS_URL = "https://tiles.arcgis.com/tiles/oPre3pOfRfefL8y0/arcgis/rest/services/swissbuildings3D/SceneServer";
const MIN_SCALE = 15000;
const COLORS = [
  [189, 215, 231],
  [255, 255, 255],
];

const camera1 = {
  position: [
    7.25623913,
    43.27183065,
    178214.54207
  ],
  heading: 13.38,
  tilt: 58.37
};

const camera2 = {
  position: [
    9.26882965,
    46.81231760,
    1544.83425
  ],
  heading: 343.44,
  tilt: 67.53
}

const camera3 = {
  position: [
    9.24759830,
    46.68389824,
    5222.66937
  ],
  heading: 4.65,
  tilt: 76.55
}

const state = {
  music: false,
  snow: false
}

const getExpression = ({overview}) => {
  if (overview) {
    return  "KURZTEXT IN ('Bern', 'Zürich',  'Lausanne', 'Genève', 'Luzern', 'Winterthur', 'Lugano')";
  } else {
    return "KURZTEXT IN ('Laax GR', 'Flims Dorf', 'Falera')"
  }
}

require([
  "esri/layers/SceneLayer",
  "esri/layers/FeatureLayer",
  "esri/layers/ImageryTileLayer",
  "esri/layers/VectorTileLayer",
  "esri/layers/BaseTileLayer",
  "esri/layers/TileLayer",
  "esri/rest/support/MultipartColorRamp",
  "esri/layers/support/LabelClass",
  "esri/Map",
  "esri/views/SceneView",
  "esri/Basemap"
], function (
  SceneLayer,
  FeatureLayer,
  ImageryTileLayer,
  VectorTileLayer,
  BaseTileLayer,
  TileLayer,
  MultipartColorRamp,
  LabelClass,
  Map,
  SceneView,
  Basemap
) {

  const soundButton = document.getElementById("sound");
  const audioElement = new Audio("./assets/music.mp3");
  audioElement.loop = true;
  const snowButton = document.getElementById("snow");
  const slide1 = document.getElementById("slide1");
  const slide2 = document.getElementById("slide2");

  const treesLayer = new SceneLayer({
    url: TREES_URL,
    minScale: MIN_SCALE,
    title: "Trees",
    renderer: {
      type: "simple",
      symbol: {
        type: "point-3d",
        symbolLayers: [{
          type: "object",
          resource: { href: "https://ralucanicola.github.io/3d-models/Norway_Spruce.glb" },
          material: { color: [177, 222, 133] }
        }]
      },
      visualVariables: [{
        type: "size",
        axis: "height",
        valueExpression: "$feature.height"
      }, {
        type: "rotation",
        valueExpression: "Random() * 360"
      }]
    }
  });

  const buildingsLayer = new SceneLayer({
    url: BUILDINGS_URL,
    minScale: MIN_SCALE,
    renderer: {
      type: "simple",
      symbol: {
        type: "mesh-3d",
        symbolLayers: [{
          type: "fill",
          material: {
            color: [255, 255, 255],
            colorMixMode: "replace"
          }
        }]
      }
    }
  });

  const citiesLayer = new FeatureLayer({
    url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/swiss_cities/FeatureServer",
    definitionExpression: getExpression({overview: false}),
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
        style: "circle",
        size: "0",  // pixels
        outline: {
          width: 0  // points
        }
      }
    },
    labelingInfo: [
          new LabelClass({
            labelExpressionInfo: { expression: "$feature.KURZTEXT"},
            symbol: {
              type: "label-3d",
              symbolLayers: [{
                type: "text",
                material: {
                  color: [0, 48, 125]
                },
                halo: {
                  size:  0
                },
                font: {
                  size:  10,
                  weight: "normal",
                  family: '"Open Sans", sans-serif'
                }
              }],
              verticalOffset: {
                screenLength: 20,
                maxWorldLength: 10000,
                minWorldLength: 0
              },
              callout: {
                type: "line",
                size: 0.75,
                color: [0, 48, 125],
                border: {
                  color: [0, 0, 0, 0]
                }
              }
            }
          })
        
    ]
  });

  const createColorRamps = (colors) => {
    const colorRamps = [];
    colors.forEach((color, index) => {
      if (index < colors.length - 1) {
        colorRamps.push({
          fromColor: color,
          toColor: colors[index + 1]
        });
      }
    });
    return MultipartColorRamp.fromJSON({
      type: "multipart",
      colorRamps
    });
  };

  const terrainGradientLayer = new ImageryTileLayer({
    url: TERRAIN_URL,
    renderer: {
      type: "raster-stretch",
      colorRamp: createColorRamps(COLORS),
      stretchType: "min-max",
      statistics: [[1000, 1800]]
    },
    title: "Terrain gradient"
  });

  const PurpleHillshadeLayer = BaseTileLayer.createSubclass({

    load: function () {
      this.layer = new TileLayer({
        url: "https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer"
      });
      this.addResolvingPromise(
        this.layer.load().then(() => {
          this.tileInfo = this.layer.tileInfo;
          this.tileInfo.lods = this.tileInfo.lods.slice(0, 17);
        })
      );
      return Promise.resolve();
    },

    fetchTile: function (level, row, col, options) {
      return this.layer.fetchTile(level, row, col, options).then((data) => {
        if (options && options.signal && options.signal.aborted) {
          throw promiseUtils.createAbortError();
        }

        const width = this.tileInfo.size[0];
        const height = this.tileInfo.size[0];
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;
        context.filter = `hue-rotate(190deg) saturate(600%)`;
        context.drawImage(data, 0, 0, width, height);

        return canvas;
      });
    }
  })

  const purpleHillshadeLayer = new PurpleHillshadeLayer({ opacity: 0.5, title: "Purple hillshade" });

  const streetsLayer = new VectorTileLayer({
    url: "https://zurich.maps.arcgis.com/sharing/rest/content/items/97fa1365da1e43eabb90d0364326bc2d/resources/styles/root.json",
    blendMode: "lighter"
  });

  const map = new Map({
    ground: "world-elevation",
    basemap: new Basemap({
      baseLayers: [terrainGradientLayer, purpleHillshadeLayer, streetsLayer]
    }),
    layers: [treesLayer, buildingsLayer, citiesLayer]
  });

  const view = new SceneView({
    map,
    container: "viewDiv",
    qualityProfile: "high",
    camera: camera3,
    environment: {
      lighting: {
        date: "Thu Jun 15 2023 13:28:59 GMT+0200 (Central European Summer Time)"
      }
    }
  });
  view.ui.empty("top-left");

  view.whenLayerView(treesLayer).then((lyrView) => {
    window.view = view;
    lyrView.maximumNumberOfFeatures = 51000;
    view.map.ground.surfaceColor = [255, 255, 255];
  });

  soundButton.addEventListener("click", () => {
    state.music = !state.music;
    if (state.music) { 
      audioElement.play();
      soundButton.classList.replace("on", "off");
    } else {
      audioElement.pause();
      soundButton.classList.replace("off", "on");
    }
  });
  snowButton.addEventListener("click", () => {
    state.snow = !state.snow;
    if (state.snow) { 
      snowButton.classList.replace("on", "off");
      view.environment.weather = {
        type: "snowy",
        cloudCover: 0,
        precipitation: 0.5
      }
    } else {
      snowButton.classList.replace("off", "on");
      view.environment.weather = {
        type: "sunny",
        cloudCover: 0.8
      }
    }
  });

  slide1.addEventListener("click", () => {
    view.goTo(camera1);
    citiesLayer.definitionExpression = getExpression({overview: true});
  });

  slide2.addEventListener("click", () => {
    view.goTo(camera2);
    citiesLayer.definitionExpression = getExpression({overview: false});
  });

  slide3.addEventListener("click", () => {
    view.goTo(camera3);
    citiesLayer.definitionExpression = getExpression({overview: false});
  });
});
