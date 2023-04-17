require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/geometry/Point",
  "esri/core/reactiveUtils",
  "esri/core/promiseUtils",
  "esri/widgets/Slider",
  "esri/widgets/HistogramRangeSlider"
], (
  WebScene,
  SceneView,
  Point,
  reactiveUtils,
  promiseUtils,
  Slider,
  HistogramRangeSlider
) => {

  const legendContainer = document.getElementById("legend");
  const histograms = [];
  const min = 363;
  const max = 424;
  const range = [390, max];

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

  const createGradient = (colorStops) => {
    const gradientColors = colorStops.map((c, i) => {
      let { r, g, b } = c.color;
      return `rgba(${r} ${g} ${b} / 60%) ${c.position * 100}%`;
    });
    return `linear-gradient(90deg, ${gradientColors.join(', ')})`;
  };

  const renderLegend = (colorStops) => {
    legendContainer.innerHTML = `
      <div class="gradientContainer">
        <div class="transparent"></div>
        <div style="background: ${createGradient(colorStops)}; left: 0px" class="legendColor"></div>
      </div>
      <div class="labels">
        <div>${parseInt(min)} ppm</div>
        <div>${parseInt(max)} ppm</div>
      </div>
      
    `;
  }

  const displayHistogram = (year) => {
    for (histogram of histograms) {
      if (histogram.year === parseInt(year)) {
        histogram.container.style.display = 'revert';
      } else {
        histogram.container.style.display = 'none';
      }
    }
  }

  const fetchStatistics = fetch("./statistics.json")
    .then(response => response.json());

  promiseUtils.eachAlways([fetchStatistics, view.when()])
    .then((response) => {
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

      const statistics = response[0].value;

      reactiveUtils.watch(
        () => voxelLayer.loaded,
        (loaded) => {
          if (loaded) {
            const style = voxelLayer.getVariableStyle(0);
            let { colorStops } = style.transferFunction;
            style.transferFunction.rangeFilter = { enabled: true, range };
            style.transferFunction.stretchRange = [min, max];

            for (statistic of statistics) {
              const bins = [];
              const { year, values, counts, mean, std } = statistic;
              for (let i = 0; i < values.length - 1; i++) {
                bins.push({
                  minValue: values[i],
                  maxValue: values[i + 1],
                  count: counts[i]
                })
              }
              const container = document.createElement("div");
              document.getElementById("histogram").appendChild(container);
              const histogram = new HistogramRangeSlider({
                container,
                bins,
                min,
                max,
                values: range,
                average: mean,
                precision: 2,
                labelFormatFunction: (value, type) => {
                  if (type !== 'min' && type !== 'max') {
                    return value;
                  }
                },
                rangeType: "between",
                includedBarColor: "#ddd",
                excludedBarColor: "#888"
              });

              histograms.push({ year, container, graphic: histogram });
            }
            displayHistogram(2005);

            histograms.forEach(histogram => {
              histogram.graphic.on(["thumb-change", "thumb-drag"], (event) => {
                const { index, value } = event;
                const { rangeFilter } = voxelLayer.getVariableStyle(0).transferFunction;
                const newRange = [
                  index === 0 ? value : rangeFilter.range[0],
                  index === 1 ? value : rangeFilter.range[1]
                ];
                voxelLayer.getVariableStyle(0).transferFunction.rangeFilter = { enabled: true, range: newRange };
                histograms.forEach(histogram => {
                  histogram.graphic.values = newRange;
                })
              });
            })

            renderLegend(colorStops);
          }
        }, { once: true, initial: true })
    })
    .catch(console.error);


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
