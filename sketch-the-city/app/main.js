require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/request"
], function (WebScene, SceneView, esriRequest) {

  let mode = "light";
  let webscene;

  const intro = document.getElementById("intro");
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");

  const params = (new URL(document.location)).searchParams;
  const id = params.get("id");

  function setId(id) {
    window.history.pushState("", "", window.location.pathname + "?id=" + id);
  }

  if (id) {
    setScene(id);
  } else {
    intro.classList.remove("hide");
  }

  esriRequest('./cities.json', {
    responseType: "json"
  })
    .then(function (response) {

      const cities = response.data.cities;
      const cityContainer = document.getElementById("cities");

      for (let city of cities) {
        const button = document.createElement("button");
        button.innerHTML = city.title;
        button.addEventListener("click", function (evt) {
          setScene(city.id);
        }.bind(city));
        cityContainer.appendChild(button);
      }
    })
    .catch(err => console.err());

  function setRenderer(layer) {

    const outlineColor = mode === "dark" ? [255, 255, 255, 0.8] : [0, 0, 0, 0.8];
    const fillColor = mode === "dark" ? [10, 10, 10, 0.1] : [255, 255, 255, 0.1];

    if (layer.type === "scene") {
      const sketchEdges = {
        type: "sketch",
        color: outlineColor,
        size: 2,
        extensionLength: 0
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
  }

  function setScene(id) {

    if (!intro.classList.contains("hide")) {
      intro.classList.add("hide");
    }
    if (!error.classList.contains("hide")) {
      error.classList.add("hide");
    }
    loading.classList.remove("hide");

    webscene = new WebScene({
      ground: {
        opacity: 0
      },
      basemap: null
    });

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

    const origWebscene = new WebScene({
      portalItem: {
        id: id
      }
    });

    origWebscene.load().then(function () {

      console.log(origWebscene.allLayers);

      origWebscene.allLayers.forEach(function (layer) {
        if (layer && layer.type === "scene") {
          setRenderer(layer);
          layer.popupEnabled = false;
          webscene.add(layer);
        }
      });

      view.goTo(origWebscene.initialViewProperties.viewpoint)
      .then(function() {
        loading.classList.add("hide");
      });

      setId(id);
    })
    .catch(function(err) {
      loading.classList.add("hide");
      error.classList.remove("hide");
    });

    window.view = view;
  }

  document.getElementById("mode").addEventListener("click", function (evt) {
    console.log("hello");
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
      webscene.layers.forEach(function (layer) {
        setRenderer(layer);
      });
    }
  });
});