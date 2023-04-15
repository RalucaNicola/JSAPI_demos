require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/geometry/Point",
  "esri/core/reactiveUtils",
  "esri/widgets/Slider",
  "esri/widgets/Histogram"
], (
  WebScene,
  SceneView,
  Point,
  reactiveUtils,
  Slider,
  Histogram
) => {

  const legendContainer = document.getElementById("legend");
  const histograms = [];

  const displayHistogram = (year) => {
    for (histogram of histograms) {
      if (histogram.year === parseInt(year)) {
        histogram.container.style.display = 'revert';
      } else {
        histogram.container.style.display = 'none';
      }
    }
  }


  const view = new SceneView({
    container: "viewDiv",
    map: new WebScene({
      portalItem: {
        id: "80f81c5728664c078011c328bd4735a4",
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
    const voxelLayer = view.map.findLayerById("1877517417e-layer-0");
    document.getElementById("yearToggle").addEventListener("calciteSegmentedControlChange", (event) => {
      const year = event.target.value;
      view.timeExtent = {
        start: new Date(`${year}-01-01 00:00:00+0000`),
        end: new Date(`${year}-01-01 12:00:00+0000`)
      }
      displayHistogram(year);
    });
    reactiveUtils.watch(
      () => voxelLayer.loaded,
      (loaded) => {
        if (loaded) {
          const style = voxelLayer.getVariableStyle(0);
          let { stretchRange, colorStops } = style.transferFunction;
          const min = 360;
          const value = stretchRange[0];
          const max = 450;
          voxelLayer.getVariableStyle(0).transferFunction.rangeFilter = { enabled: true, range: [value, max] };
          voxelLayer.getVariableStyle(0).transferFunction.stretchRange = [min, max];
          const slider = new Slider({
            min, max, values: [value], container: "sliderDiv", visibleElements: {
              labels: true
            }, steps: 1
          });

          slider.on(["thumb-change", "thumb-drag"], (event) => {
            const { index, value } = event;
            //renderLegend({ min, max, colorStops, value });
            const { rangeFilter } = voxelLayer.getVariableStyle(0).transferFunction;
            const newRange = [
              index === 0 ? value : rangeFilter.range[0],
              index === 1 ? value : rangeFilter.range[1]
            ];
            voxelLayer.getVariableStyle(0).transferFunction.rangeFilter = { enabled: true, range: newRange };
          });

          renderLegend({ min, max, colorStops, value });

          // const resizeObserver = new ResizeObserver(() => {
          //   renderLegend({ min, max, colorStops, value: slider.values[0] });
          // });
          // resizeObserver.observe(sliderContainer);
        }

      }, { once: true, initial: true })
  });

  const createGradient = (colorStops) => {
    const gradientColors = colorStops.map((c, i) => {
      let { r, g, b, a } = c.color;
      if (i === 0) {
        a = 0.3;
      }
      return `rgba(${r} ${g} ${b} / ${a * 100}%) ${c.position * 100}%`;
    });
    return `linear-gradient(90deg, ${gradientColors.join(', ')})`;
  };

  const renderLegend = ({ min, max, value, colorStops }) => {
    //const thumbPosition = (sliderContainer.clientWidth - 60) * (value - min) / (max - min);
    legendContainer.innerHTML = `
      <div class="gradientContainer">
        <div class="transparent"></div>
        <div style="background: ${createGradient(colorStops)}; left: 0px" class="legendColor"></div>
      </div>
      <div class="labels">
        <div>&gt;${parseInt(min)} ppmv</div>
        <div>&lt;${parseInt(max)} ppmv</div>
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

  fetch("./statistics.json")
    .then(response => response.json())
    .then(statistics => {
      for (statistic of statistics) {
        const bins = [];
        console.log(statistic);
        const { year, values, counts } = statistic;
        for (let i = 0; i < values.length - 1; i++) {
          bins.push({
            minValue: values[i],
            maxValue: values[i + 1],
            count: counts[i]
          })
        }
        const container = document.createElement("div");
        document.getElementById("histogram").appendChild(container);
        const histogram = new Histogram({
          container,
          bins,
          min: values[0],
          max: values[values.length - 1]
        });

        container.style.display = year === 2005 ? 'inherit' : 'none';

        histograms.push({ year, container })
      }
    })
});
