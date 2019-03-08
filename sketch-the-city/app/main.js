require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/request"
], function(WebScene, SceneView, esriRequest) {

  let mode = "light";
  let webscene;

  const intro = document.getElementById("intro");
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");

  // function to retrieve query parameters (in this case only id)
  function getIdParam() {
    const queryParams = document.location.search.substr(1);
    const result = {};

    queryParams.split("&").forEach(function(part) {
      var item = part.split("=");
      result[item[0]] = decodeURIComponent(item[1]);
    });

    return result.id;
  }

  const id = getIdParam();

  // function to set an id once a scene was selected
  function setId(id) {
    window.history.pushState("", "", window.location.pathname + "?id=" + id);
  }

  // if user loaded scene by setting an id in the url, load that scene
  if (id) {
    setScene(id);
  // else display the intro text
  } else {
    intro.classList.remove("hide");
  }

  // load the cities from the json file
  esriRequest('./cities.json', {
      responseType: "json"
    })
    // when loaded successfully use the data to create the menu of cities at the top
    .then(function(response) {

      const cities = response.data.cities;
      const cityContainer = document.getElementById("cities");

      // generate the menu using plain old vanilla JS DOM API
      for (let i = 0; i < cities.length; i++) {
        const city = cities[i];
        const button = document.createElement("button");
        button.innerHTML = city.title;
        button.addEventListener("click", function() {
          setScene(city.id);
          setId(city.id);
          if (city.attribution) {
            document.getElementById("attribution").innerHTML = city.attribution + '. Made with <a href="" target="_blank">ArcGIS API for JavaScript</a>';
          }
        }.bind(city));
        cityContainer.appendChild(button);
      }
    })
    // if something went wrong with the loading show an error in the console
    .catch(function(err) {
      console.log(err);
    });

  function setSketchRenderer(layer) {

    const outlineColor = mode === "dark" ? [255, 255, 255, 0.8] : [0, 0, 0, 0.8];
    const fillColor = mode === "dark" ? [10, 10, 10, 0.1] : [255, 255, 255, 0.1];
    const size = mode === "dark" ? 2 : 1;

    const sketchEdges = {
      type: "sketch",
      color: outlineColor,
      size: size,
      extensionLength: 2
    };

    // this renderers all the layers with semi-transparent white faces
    // and displays the geometry with sketch edges
    const renderer = {
      type: "simple", // autocasts as new SimpleRenderer()
      symbol: {
        type: "mesh-3d",
        symbolLayers: [{
          type: "fill",
          material: {
            color: fillColor,
            colorMixMode: "replace"
          },
          edges: sketchEdges
        }]
      }
    };
    layer.renderer = renderer;

  }

  // when the webscene has slides, they are added in a list at the bottom
  function createPresentation(slides) {

    const slideContainer = document.getElementById("slides");

    if (slides.length) {

      // create list using plain old vanilla JS
      const slideList = document.createElement("ul");
      slideContainer.appendChild(slideList);
      slides.forEach(function(slide) {

        let slideElement = document.createElement("li");
        slideElement.id = slide.id;
        slideElement.classList.add("slide");
        let title = document.createElement("div");
        title.innerHTML = slide.title.text;
        slideElement.appendChild(title);

        slideElement.addEventListener("click", function() {
          // the slide is only used to zoom to a viewpoint (more like a bookmark)
          // because we don't want to modify the view in any other way
          // this also means that layers won't change their visibility with the slide, so make all layers visible from the beginning
          view.goTo(slide.viewpoint);
        }.bind(slide));

        slideList.appendChild(slideElement);
      });
    }

  }

  function setScene(id) {

    document.getElementById("slides").innerHTML = "";
    document.getElementById("attribution").innerHTML = 'Made with <a href="" target="_blank">ArcGIS API for JavaScript</a>.';

    if (!intro.classList.contains("hide")) {
      intro.classList.add("hide");
    }
    if (!error.classList.contains("hide")) {
      error.classList.add("hide");
    }
    loading.classList.remove("hide");

    // create an empty webscene
    webscene = new WebScene({
      ground: {
        opacity: 0
      },
      basemap: null
    });

    // create a view with a transparent background
    const view = new SceneView({
      container: "viewDiv",
      map: webscene,
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
        components: ["attribution"]
      }
    });

    // load the webscene with the city
    const origWebscene = new WebScene({
      portalItem: {
        id: id
      }
    });

    // once all resources are loaded...
    origWebscene.loadAll().then(function () {

      // select the 3D object scene layers only
      const sceneLayers = origWebscene.allLayers.filter(function (layer) {
        return (layer.type === "scene" && layer.geometryType === "mesh");
      });

      // apply the sketch renderer and disable popup
      sceneLayers.forEach(function (layer) {
          setSketchRenderer(layer);
          layer.popupEnabled = false;
      });

      // add these layers to the empty webscene
      webscene.addMany(sceneLayers);

      // go to initial viewpoint in the scene
      view.goTo(origWebscene.initialViewProperties.viewpoint)
        .then(function () {
          loading.classList.add("hide");
        })
        .catch(function (err) {
          console.log(err);
        });

      // generate the presentation
      webscene.presentation = origWebscene.presentation.clone();
      createPresentation(webscene.presentation.slides);
    })
    .catch(function () {
      loading.classList.add("hide");
      error.classList.remove("hide");
    });

    window.view = view;
  }

  // when changing the visualization mode swap the css files and change renderer
  document.getElementById("mode").addEventListener("click", function(evt) {

    if (mode === "light") {
      mode = "dark";
      evt.target.innerHTML = "Pencil";
      document.getElementById("customCSS").href = "./styles/dark.css";
    } else {
      mode = "light";
      evt.target.innerHTML = "Chalk";
      document.getElementById("customCSS").href = "./styles/light.css";
    }
    if (webscene) {
      webscene.layers.forEach(function(layer) {
        setSketchRenderer(layer);
      });
    }
  });
});
