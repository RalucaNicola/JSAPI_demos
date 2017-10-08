require([
  "esri/WebScene",
  "esri/views/SceneView",

  "esri/layers/FeatureLayer",
  "esri/layers/VectorTileLayer",
  "esri/layers/GraphicsLayer",

  "esri/geometry/Polyline",
  "esri/geometry/Multipoint",
  "esri/geometry/geometryEngine",

  "esri/Graphic",

  "esri/request",
  "esri/config",
  "dojo/promise/all",
  "dojo/domReady!"
], function (WebScene, SceneView,
  FeatureLayer, VectorTileLayer, GraphicsLayer,
  Polyline, Multipoint, geometryEngine,
  Graphic,
  request, esriConfig, all) {

  // Scene related matters

  let novaBaseLayer = new VectorTileLayer({
    url: "https://basemaps.arcgis.com/b2/arcgis/rest/services/World_Basemap/VectorTileServer"
  });
  novaBaseLayer.loadStyle("nova.json");

  let locations = new FeatureLayer({
    url: 'https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/JamesBondLocations/FeatureServer',
    outFields: ['*'],
    renderer: {
      type: 'simple',
      symbol: {
        type: 'point-3d',
        symbolLayers: [{
          type: 'icon',
          resource: {
            primitive: 'circle'
          },
          size: 10,
          outline: {
            color: [255, 255, 255, 0.2],
            size: 8
          }
        }]
      },
      visualVariables: [{
        type: 'color',
        field: 'locationId',
        stops: [{
          value: 0,
          color: [66, 220, 244, 0.6]
        }, {
          value: 25,
          color: [65, 244, 205, 0.6]
        }]
      }]
    },
    screenSizePerspectiveEnabled: false,
    labelingInfo: [{
      // When using callouts on labels, "above-center" is the only allowed position
      labelPlacement: "above-center",
      labelExpressionInfo: {
        value: "{Location}"
      },
      symbol: {
        type: "label-3d", // autocasts as new LabelSymbol3D()
        symbolLayers: [{
          type: "text", // autocasts as new TextSymbol3DLayer()
          material: {
            color: "white"
          },
          font: {
            family: 'monospace'
          },
          size: 8
        }],
        verticalOffset: {
          screenLength: 150,
          maxWorldLength: 100000,
          minWorldLength: 5000
        },
        callout: {
          type: "line", // autocasts as new LineCallout3D()
          size: 0.5,
          color: [255, 255, 255, 0.7]
        }
      }
    }],
    labelsVisible: true
  });

  let animatedLines = new GraphicsLayer();

  let webscene = new WebScene({
    basemap: {
      baseLayers: [novaBaseLayer]
    },
    layers: [locations, animatedLines]
  });

  let view = new SceneView({
    map: webscene,
    container: "view",
    ui: {
      components: ["attribution"]
    },
    environment: {
      atmosphereEnabled: false,
      starsEnabled: false
    },
    viewingMode: 'local'
  });

  function filterLocationsInScene(id) {
    locations.definitionExpression = 'MovieId = ' + id;
    animatedLines.removeAll();
    let query = locations.createQuery();
    query.outFields = ['*'];
    query.returnGeometry = true;
    locations.queryFeatures(query)
      .then(function(result) {
        result.features.sort((a, b) => {
          if (Number(a.attributes.LocationId) < Number(b.attributes.LocationId)) {
            return -1;
          }
          else return 1;

        });
        let features = result.features;
        updateInfoSelectedPanel(features);
        view.goTo({target: features, tilt: 60}, {duration: 2000})
          .then(function() {
            startMovieLocationAnimation(0, features);
          });
      })
      .otherwise((err) => {console.log(err);})
  }

  function getColor(i, total) {
    return [66, 220, 224, i / total]
  }

  function animateLine(i, paths, index, features) {
    if (i < paths.length) {

      let polyline = new Polyline({
        paths: paths.slice(i, i + 2),
        spatialReference: {
          wkid: 3857
        }
      });

      let lineSymbol = {
        type: 'simple-line',
        color: getColor(i, paths.length),
        width: 2
      };

      let lineGraphic = new Graphic({
        geometry: polyline,
        symbol: lineSymbol
      });

      animatedLines.add(lineGraphic);

      window.setTimeout(function () {
        animateLine(i + 1, paths, index, features);
      }, 10);
    }
    else {
      startMovieLocationAnimation(index + 1, features);
    }
  }

  function startMovieLocationAnimation(index, features) {
    if (index < features.length) {
      let initialLine = new Polyline({
        paths: [
          [features[index].geometry.x, features[index].geometry.y, 0],
          [features[index + 1].geometry.x, features[index + 1].geometry.y, 0]
        ],
        spatialReference: {
          wkid: 3857
        }
      });

      let densifiedPolyline = geometryEngine.densify(initialLine, 30000, 'meters');

      let paths = densifiedPolyline.paths[0];

      for (let i = 0; i < paths.length; i++) {
        let path = paths[i];
        path[2] = -50000 * i * i / paths.length + i * 50000;
        paths[i] = path;
      }

      animateLine(0, paths, index, features);

    }
    else {
      view.goTo(features, {duration: 2000});
    }
  }

  window.view = view;

  // UI issues

  request('movie-list.json').then((results) => {
    initTimeline(results.data.movies);
  });

  function initTimeline(movieList) {
    movieList.forEach(function(movie, index) {
      let movieItem = createMovieItem(movie, index);
      document.querySelector('.timeline .container').appendChild(movieItem);
      handleEventsOnMouseOver(movieItem);
      handleEventsOnClick(movieItem);
    });
  }

  function createMovieItem(movie, index) {

    let template = document.createElement('template');
    template.innerHTML = `<div class='movie-item' data-title='${movie.title}'
      data-id=${index} data-year=${movie.year} data-actor='${movie.actor}'
      data-director='${movie.director}'><p>${movie.year}</p></div>`;

    return template.content.firstChild;
  }

  function updateTooltipContent(data) {
    document.querySelector('.tooltip').innerHTML = `<h1>${data.title}</h1>
      <p>${data.year}</p><p>${data.actor}</p><p>${data.director}</p>`;
  }

  function displayTooltip(positionX) {
    let tooltipElement = document.querySelector('.tooltip');
    tooltipElement.classList.add('visible');
    tooltipElement.style.left = positionX + 5 + 'px';
  }

  function handleEventsOnMouseOver(movieItem) {
    movieItem.addEventListener('mouseover', function(evt) {
      let data = evt.target.dataset;
      updateTooltipContent(data);
      displayTooltip(evt.target.offsetLeft);
      evt.stopPropagation();
    });

    movieItem.addEventListener('mouseout', function(evt) {
      document.querySelector('.tooltip').classList.remove('visible');
      evt.stopPropagation();
    });
  }

  function animateTitle(title) {
    let titleElement = document.querySelector('.info-selected h1');
    titleElement.classList.add('animate');
    titleElement.innerHTML = title;
    setTimeout(function() {
      titleElement.classList.remove('animate');
    }, 1000);
  }

  function updateInfoSelectedPanel(features) {
    let container = document.querySelector('.info-selected .description');
    container.innerHTML = features ?
      `<p> James Bond travels to: </p> <ul>
      ${features.map( feature => `<li>${feature.attributes.Location}</li>`).join(' ')}` :
      `<p> By 2017, James Bond's top 5 locations are:</p>
      <p> London, Belgrad, ...</p>`
  }

  function eraseInfoSelectedPanel() {
    let container = document.querySelector('.info-selected .description');
    container.innerHTML = '';
  }

  function unselectMovieItem() {
    let item = document.querySelector('.selected');
    if (item) {
      item.classList.remove('selected');
    }
  }

  function handleEventsOnClick(movieItem) {

    movieItem.addEventListener('click', function(evt) {
      unselectMovieItem();
      movieItem.classList.add('selected');
      animateTitle(movieItem.dataset.title);
      eraseInfoSelectedPanel();
      filterLocationsInScene(movieItem.dataset.id);
    });
  }



    // read data for all the movies
    // - create menu
    // - add event listeners for menu:
    // - on click:
    //    - filter locations to all those until that year
    //    - get the locations for that movie
    //    - zoom to them
    //    - start animation: from initial point to final point
    // - create view
    // - load movie locations as GraphicsLayer/FeatureLayer


});