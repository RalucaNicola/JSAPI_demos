require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/GraphicsLayer",
  "esri/layers/GeoJSONLayer",
  "esri/Graphic",
  "esri/core/scheduling",
  "esri/Color",
  "esri/widgets/TimeSlider",
  "esri/geometry/Point",
  "esri/geometry/Mesh",
  "esri/geometry/support/MeshMaterialMetallicRoughness",
  "esri/core/reactiveUtils",
  "esri/widgets/Slider"
], (
  WebScene,
  SceneView,
  GraphicsLayer,
  GeoJSONLayer,
  Graphic,
  scheduling,
  Color,
  TimeSlider,
  Point,
  Mesh,
  MeshMaterialMetallicRoughness,
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
      const { index, state, value } = event;
      // if (state === "stop") {
      const { stretchRange } = voxelLayer.getVariableStyle(0).transferFunction;
      const newRange = [
        index === 0 ? value : stretchRange[0],
        index === 1 ? value : stretchRange[1]
      ];
      voxelLayer.getVariableStyle(0).transferFunction.stretchRange = newRange;
      //}
    });

    renderLegend({ min, max, colorStops });

    document.getElementById("coToggle").addEventListener("click", (event) => {
      voxelLayer.visible = event.target.checked;
    })
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
    if (view.ready) {
      symbols.forEach(symbol => {
        const screenPoint = view.toScreen(symbol.mapPoint);
        if (screenPoint) {
          symbol.style.top = `${screenPoint.y - symbol.clientHeight / 2}px`;
          symbol.style.left = `${screenPoint.x - symbol.clientWidth}px`;
        }
      })
    }
    requestAnimationFrame(updateOverlay);
  }
  reactiveUtils.watch(
    () => view.ready,
    (updating) => {
      if (updating) {
        updateOverlay();
      }
    },
    { initial: true }
  )

  fetch("./locations.json")
    .then(response => {
      return response.json();
    })
    .then(locations => {
      locations.features.forEach(feature => {
        const symbol = document.createElement("div");
        symbol.classList.add("symbol");
        symbol.innerHTML = feature.id;
        console.log(feature);
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

      updateOverlay(symbols);
    });
});
