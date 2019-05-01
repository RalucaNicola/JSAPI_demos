require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/geometry/Point"
], function (WebScene, SceneView, Point) {

  const webscene = new WebScene({
    portalItem: {
      id: "1dbcd382b2d847feb77131dd8aeeae8d"
    }
  });

  const view = new SceneView({
    container: "viewDiv",
    map: webscene,
    alphaCompositingEnabled: true,
    qualityProfile: "high",
    ui: {
      components: []
    }
  });

  window.view = view;

  const center = new Point({
    spatialReference: {
      wkid: 102100
    },
    x: -13045182.321891023,
    y: 4036862.056950253,
    z: 413.5498616974801
  });

  function rotate(now) {
    if (!view.interacting) {
      const heading = view.camera.heading;
      view.goTo({heading: heading + 0.5, center}, {animate: false});
    } else {
      isRotating = false;
    }
  }

  view.when(function () {

    const container = document.querySelector("#viewDiv canvas");

    let buildingLayer = webscene.layers.filter(function(layer) {
      return layer.title === "Esri Admin Building";
    }).getItemAt(0);

    buildingLayer.when(function() {
      buildingLayer.allSublayers.forEach(function(layer) {
        layer.renderer = {
          type: "simple",
          symbol: {
            type: "mesh-3d",
            symbolLayers:[{
              type: "fill",
              material: {
                color: [255, 255, 255, 0],
                //colorMixMode: "replace"
              },
              edges: {
                type: "solid",
                color: [255, 255, 255],
                size: 1
              }
            }]
          }
        }
      });
    });

    webscene.ground.opacity = 0;
    view.environment = {
      background: {
        type: "color",
        color: [0, 0, 0, 0]
      },
      starsEnabled: false,
      atmosphereEnabled: false,
      lighting: {
        directShadowsEnabled: false
      }
    };

    const bins = 16;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        analyser.fftSize = bins * 2;
        analyser.minDecibels = -60;
        analyser.maxDecibels = -20;
        analyser.smoothingTimeConstant = 0.8;

        const dataArray = new Uint8Array(bins);

        function glow() {

          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce(function (accumulator, currentValue) { return accumulator + currentValue }, 0) / bins;
          buildingLayer.opacity = Math.min(1, dataArray[0] / 256 + 0.3);
          const hue = 50 + avg * 2 % 310;
          container.style.filter = "drop-shadow(0 0 5px hsl(" + hue + ",100%,50%)";

          requestAnimationFrame(function() {
            glow();
            if (isRotating) {
              rotate();
            }
          });
        }
        requestAnimationFrame(glow);
      });

  })
    .catch(console.error);

  let musicPlaying = false;
  let isRotating = false;
  let playButton = document.getElementById("play");
  playButton.addEventListener("click", function() {
    if (musicPlaying) {
      document.getElementById("music").pause();
      playButton.innerHTML = "Rock the house";
      musicPlaying = false;
    }
    else {
      document.getElementById("music").play();
      isRotating = true;
      playButton.innerHTML = "Stop the music...";
      musicPlaying = true;
    }
  })
});
