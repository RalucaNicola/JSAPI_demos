require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/geometry/Point",
  "esri/core/reactiveUtils",
  "esri/widgets/Slider"
], (
  WebScene,
  SceneView,
  Point,
  reactiveUtils,
  Slider
) => {

  const legendContainer = document.getElementById("legend");

  const view = new SceneView({
    container: "viewDiv",
    map: new WebScene({
      portalItem: {
        id: "4c59fa4edc754f5db710343867f88fc8",
      },
    }),
    qualityProfile: "high",
    ui: {
      components: []
    }
  });

  view.when(async () => {
    window.view = view;
    view.map.ground.navigationConstraint = { type: "stay-above" };
    const voxelLayer = view.map.findLayerById("18750f45f4a-layer-85");
    const fireLayer = view.map.findLayerById("1875197e292-layer-86");
    document.getElementById("coToggle").addEventListener("click", (event) => {
      voxelLayer.visible = event.target.checked;
    });
    document.getElementById("fireToggle").addEventListener("click", (event) => {
      fireLayer.visible = event.target.checked;
    });
    reactiveUtils.watch(
      () => voxelLayer.loaded,
      () => {
        const style = voxelLayer.getVariableStyle(0);
        let { stretchRange, colorStops } = style.transferFunction;
        const min = stretchRange[0];
        const max = stretchRange[1];

        const slider = new Slider({
          min, max, values: [min], container: "sliderDiv", visibleElements: {
            labels: true
          }, steps: 1
        });
        slider.on(["thumb-change", "thumb-drag"], (event) => {
          const { index, value } = event;
          const { stretchRange } = voxelLayer.getVariableStyle(0).transferFunction;
          const newRange = [
            index === 0 ? value : stretchRange[0],
            index === 1 ? value : stretchRange[1]
          ];
          voxelLayer.getVariableStyle(0).transferFunction.stretchRange = newRange;
        });

        renderLegend({ min, max, colorStops });


      }, { once: true, initial: true })
  })

  const createGradient = (colorStops) => {
    const gradientColors = colorStops.map((c) => {
      const { r, g, b, a } = c.color;
      return `rgba(${r} ${g} ${b} / ${a * 100}%) ${c.position * 100}%`;
    });
    return `linear-gradient(90deg, ${gradientColors.join(', ')})`;
  };

  const renderLegend = ({ min, max, colorStops }) => {
    legendContainer.innerHTML = `
      <div class="labels">
        <div>&gt;${parseInt(min)}</div>
        <div>&lt;${parseInt(max)}</div>
      </div>
      <div class="gradientContainer">
        <div style="background: ${createGradient(colorStops)};height:20px"></div>
      </div>
    `;
  }

  const symbols = [];

  function updateOverlay() {
    symbols.forEach(symbol => {
      const screenPoint = view.toScreen(symbol.mapPoint);
      if (screenPoint) {
        symbol.classList.remove("hidden");
        symbol.style.top = `${screenPoint.y - symbol.clientHeight / 2}px`;
        symbol.style.left = `${screenPoint.x - symbol.clientWidth}px`;
      }
    })
    requestAnimationFrame(updateOverlay);
  }
  reactiveUtils.watch(
    () => view.ready,
    (ready) => {
      if (ready) {
        updateOverlay();
      }
    }
  )

  fetch("./locations.json")
    .then(response => {
      return response.json();
    })
    .then(locations => {
      locations.features.forEach(feature => {
        const symbol = document.createElement("div");
        symbol.classList.add("symbol", "hidden");
        symbol.innerHTML = feature.id;
        const [longitude, latitude] = feature.geometry.coordinates;
        symbol.mapPoint = new Point({
          longitude,
          latitude,
          spatialReference: {
            wkid: 4326
          }
        });
        const descriptionContainer = document.getElementById(`symbol-${feature.id}`);
        document.body.appendChild(symbol);
        symbol.addEventListener("click", () => {
          descriptionContainer.scrollIntoView({ behavior: "smooth" });
          descriptionContainer.classList.add("highlight");
          setTimeout(() => {
            descriptionContainer.classList.remove("highlight");
          }, 1000);
        })
        symbols.push(symbol);
      })
    });
});
