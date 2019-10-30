define([
  'esri/WebScene',
  'esri/views/SceneView',
  'esri/layers/VectorTileLayer',
  'esri/layers/FeatureLayer',
  'esri/config',
  'esri/widgets/Attribution',

  'app/handleChange'
], function (
    WebScene, SceneView, VectorTileLayer, FeatureLayer, esriConfig, Attribution,
    handleChange
  ) {

  function _init(container, store) {

    //esriConfig.request.corsEnabledServers.push('https://zurich.maps.arcgis.com/');

    // create vector tile layer with the Christmas style
    var christmasLayer = new VectorTileLayer({
      url: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer'
    });
    christmasLayer.loadStyle('christmas-style.json');

    // create webscene with the vector tile layer as basemap
    var webscene = new WebScene({
      basemap: {
        baseLayers: [christmasLayer]
      },
      ground: {}
    });

    // create view and add webscene
    var view = new SceneView({
      container: container,
      map: webscene,
      camera : {
        heading: 35.7,
        tilt: 77.4,
        position: {
          x: -1531838.33985668,
          y: 3759521.621593286,
          z: 753037.8103598615,
          spatialReference: {
            wkid: 102100
          }
        }
      },
      viewingMode: 'local',
      environment: {
        lighting: {
          directShadowsEnabled: true,
          ambientOcclusionEnabled: true
        }
      },
      popup: {
        dockOptions: {
          breakpoint: false
        }
      },
      // Set a custom color for the highlight
      highlightOptions: {
        color: '#ff635e',
        fillOpacity: 0
      },
      padding: {
        top: 200
      }
    });

    // clear the top-left corner - that's where the application menu is
    view.ui.empty('top-left');

    view.on('click', function (event) {

      view.hitTest(event).then(function (response) {

        var result = response.results[0];
        if (result && result.graphic) {
          return result.graphic;
        }

      }).then(function (graphic) {
        if (store.getState().onTour) {
          store.dispatch({
            type: 'TOUR STOPPED'
          });
        }
        store.dispatch({
          type: 'SELECT COUNTRY',
          selected: graphic
        });

      });
    });

    // stop the tour and deselect country if the user is interacting with the scene
    view.watch('interacting', function (newValue) {

      if (newValue) {
        var state = store.getState();
        if (state.onTour) {
          store.dispatch({
            type: 'TOUR STOPPED'
          });
        }
        if (state.selected) {
          store.dispatch({
            type: 'SELECT COUNTRY',
            selected: null
          });
        }
      }

    });

    // create and add the countries layer
    var options = ['Purple', 'Orange', 'Blue', 'Green', 'Turquoise'];
    var uniqueValueInfos = options.map(function(color, index) {
      return {
        value: index,
        symbol: {
          type: 'point-3d',
          symbolLayers: [
            {
              type: 'object',
              resource: {
                href: `https://zurich.maps.arcgis.com/sharing/rest/content/items/bdf60a763af049d2b5dea9eea34953b5/resources/styles/web/resource/${color}Present.json`
              },
              height: 100000,
              anchor: 'bottom'
            }
          ]
        }
      };
    });
    var graphics = store.getState().graphics;
    var fields = [
      {
        name: 'ObjectID',
        alias: 'ObjectID',
        type: 'oid'
      },{
        name: 'country',
        alias: 'country',
        type: 'string'
      },{
        name: 'description',
        alias: 'description',
        type: 'string'
      }
    ];
    var layer = new FeatureLayer({
      source: graphics,
      fields: fields,
      objectIdField: 'ObjectID',
      geometryType: 'point',
      title: 'cities',
      elevationInfo: {
        mode: 'relative-to-ground'
      },
      screenSizePerspectiveEnabled: false,
      renderer: {
        type: 'unique-value',
        valueExpression: '$feature.ObjectID % 5',
        uniqueValueInfos: uniqueValueInfos,
        visualVariables: [
          {
            type: 'rotation',
            valueExpression: 'Random()*360'
          }
        ]
      },
      outFields: ['*'],
      labelingInfo: [
        {
          labelExpressionInfo: {
            value: '{country}'
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
              size: 12
            }]
          }
        }],
      labelsVisible: true
    });

    webscene.add(layer);

    var highlight;

    function selectCountry(country) {

      //highlight the selected country
      view.whenLayerView(layer)
        .then(function(layerView) {
          highlight = layerView.highlight(country.attributes.ObjectID);
        });

      // animate camera to the selected country
      view.goTo({
        target: country.geometry,
        zoom: 5,
        tilt: 70
      }, {
        speedFactor: 0.9
      })
      // when animation finished, open popup with information
      .then(function(){
        var image = country.attributes.image ? `<div class='img-popup'><img src='./data/images/${country.attributes.image}' alt='image'><p>${country.attributes.caption}</p></div>` : '';
        var language = ((country.attributes.language) && (country.attributes.language !== 'English')) ? `<div>Merry Christmas in ${country.attributes.language} is '${country.attributes.wish}!'</div>` : '';
        var imageAttribution = country.attributes.attribution ? `<div class='copyright-popup'>Image copyright: ${country.attributes.attribution}</div>` : '';
        var textAttribution = `<div class='copyright-popup'>Text information © <a href='https://www.whychristmas.com/cultures/'>www.whychristmas.com</a></div>`;
        var content = image + `<div>${country.attributes.description}</div>` + language + textAttribution + imageAttribution;
        view.popup.open({
          content: content,
          location: country.geometry,
        });
      });
    }

    function deselectCountry(){
      view.popup.close();
      if (highlight) {
        highlight.remove();
      }
    }

    var handleSelection = handleChange(store.getState, 'selected');

    store.subscribe( handleSelection(function(newVal, oldVal, property) {
      if (oldVal) { deselectCountry(); }
      if (newVal) { selectCountry(newVal); }
      }
    ));

    var handleMedia = handleChange(store.getState, 'currentMedia');

    store.subscribe( handleMedia(function(newVal) {
      if (newVal === 'mobilePortrait') {
        view.popup.dockOptions.position = 'bottom-center';
        view.popup.dockEnabled = true;
      } else if (newVal === 'mobileLandscape') {
        view.popup.dockOptions.position = 'top-right';
        view.popup.dockEnabled = true;
        view.padding = {
          top: 0
        };
      } else {
        view.popup.dockEnabled = false;
        view.padding = {
          top: 200
        };
      }
    }));

  }

  return {
    init: _init
  };
});
