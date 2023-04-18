require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/geometry/Point",
  "esri/geometry/Polyline",
  "esri/core/reactiveUtils",
  "esri/core/promiseUtils",
  "esri/Graphic",
  "esri/Color",
  "esri/widgets/HistogramRangeSlider"
], (
  WebScene,
  SceneView,
  Point,
  Polyline,
  reactiveUtils,
  promiseUtils,
  Graphic,
  Color,
  HistogramRangeSlider
) => {

  const legendContainer = document.getElementById("legend");
  const histograms = [];
  const min = 363;
  const max = 424;

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

  // const getColorFromValue = ({ value, colorStops }) => {

  //   const stops = colorStops.toArray().map(({ color, position }) => {
  //     return {
  //       value: min + position * (max - min),
  //       color: new Color(color)
  //     }
  //   })
  //   for (let i = 0; i < stops.length; i++) {
  //     const stop = stops[i];

  //     if (value < stop.value) {
  //       if (i === 0) {
  //         return stop.color;
  //       }

  //       const prev = stops[i - 1];

  //       const weight = (value - prev.value) / (stop.value - prev.value);
  //       return Color.blendColors(prev.color, stop.color, weight);
  //     }
  //   }

  //   return stops[stops.length - 1].color;
  // }


  const fetchStatistics = fetch("./statistics.json")
    .then(response => response.json());

  promiseUtils.eachAlways([fetchStatistics, view.when()])
    .then((response) => {
      window.view = view;
      view.map.ground.navigationConstraint = { type: "stay-above" };
      const voxelLayer = view.map.findLayerById("1877517417e-layer-0");
      const statistics = response[0].value;

      reactiveUtils.watch(
        () => voxelLayer.loaded,
        (loaded) => {
          if (loaded) {
            const style = voxelLayer.getVariableStyle(0);
            let { colorStops } = style.transferFunction;
            style.transferFunction.stretchRange = [min, max];
            const displayHistogram = (year) => {
              for (histogram of histograms) {
                if (histogram.year === parseInt(year)) {
                  histogram.container.style.display = 'revert';
                  voxelLayer.getVariableStyle(0).transferFunction.rangeFilter = { enabled: true, range: histogram.graphic.values };
                } else {
                  histogram.container.style.display = 'none';
                }
              }
            }

            document.getElementById("yearToggle").addEventListener("calciteSegmentedControlChange", (event) => {
              const year = event.target.value;
              view.timeExtent = {
                start: new Date(`${year}-01-01 00:00:00+0000`),
                end: new Date(`${year}-01-01 12:00:00+0000`)
              }
              displayHistogram(year);
            });

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
                values: [mean + 2 * std, max],
                average: mean,
                precision: 2,
                labelFormatFunction: (value, type) => {
                  if (type !== 'min' && type !== 'max') {
                    return value;
                  }
                },
                rangeType: "between",
                excludedBarColor: new Color([10, 10, 10]),
                includedBarColor: "#009af2",
                dataLineCreatedFunction: (label, line) => {
                  line.classList.add("dataLine");
                },
                // barCreatedFunction: (index, element) => {
                //   const bin = bins[index];
                //   const midValue =
                //     (bin.maxValue - bin.minValue) / 2 + bin.minValue;
                //   const color = getColorFromValue({ value: midValue, colorStops });
                //   element.setAttribute("fill", color.toHex());
                // }
              });

              histogram.on(["thumb-change", "thumb-drag"], (event) => {
                const { index, value } = event;
                const { rangeFilter } = voxelLayer.getVariableStyle(0).transferFunction;
                const newRange = [
                  index === 0 ? value : rangeFilter.range[0],
                  index === 1 ? value : rangeFilter.range[1]
                ];
                voxelLayer.getVariableStyle(0).transferFunction.rangeFilter = { enabled: true, range: newRange };
              });

              histograms.push({ year, container, graphic: histogram });
            }
            displayHistogram(2005);

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


  // add graphic for showing where the troposphere starts and ends
  const opacity = 0.4;
  const indicatorSymbol = {
    type: 'line-3d',
    symbolLayers: [
      {
        type: 'line',
        material: { color: [255, 255, 255, opacity] },
        size: 0.75,
        marker: {
          type: 'style',
          style: 'arrow',
          placement: 'end',
          color: [255, 255, 255, opacity]
        }
      }
    ]
  };

  const getLabelGraphic = (height) => {
    const pointGeometry = new Point({
      x: 0,
      y: -90,
      z: height / 2
    });
    return new Graphic({
      geometry: pointGeometry,
      symbol: {
        type: 'point-3d',
        symbolLayers: [
          {
            type: 'text',
            text: 'Troposphere (20km)',
            material: { color: [255, 255, 255, opacity] },
            verticalAlignment: 'middle',
            font: {
              size: 9,
              family: `"Avenir Next", Avenir, "Helvetica Neue", sans-serif`,
              weight: 'bold'
            }
          }
        ]
      }
    });
  };

  const getIndicatorDown = (height, margin) => {
    const lineGeometry = new Polyline({
      paths: [
        [0, -90, height / 2 - margin],
        [0, -90, 0]
      ]
    });
    return new Graphic({
      geometry: lineGeometry,
      symbol: indicatorSymbol
    });
  };

  const getIndicatorUp = (height, margin) => {
    const lineGeometry = new Polyline({
      paths: [
        [0, -90, height / 2 + margin],
        [0, -90, height]
      ]
    });
    return new Graphic({
      geometry: lineGeometry,
      symbol: indicatorSymbol
    });
  };

  const getBoundingBox = (height) => {
    const lineGeometry = new Polyline({
      paths: [
        [-180, 90, height],
        [180, 90, height],
        [180, -90, height],
        [-180, -90, height],
        [-180, 90, height]
      ]
    });
    return new Graphic({
      geometry: lineGeometry,
      symbol: {
        type: 'line-3d',
        symbolLayers: [
          {
            type: 'line',
            material: { color: [255, 255, 255, opacity] },
            size: 0.75,
            pattern: {
              type: 'style',
              style: 'dash'
            }
          }
        ]
      }
    });
  };
  const addVerticalScale = () => {
    const exaggeration = 200;
    const height = 20000 * exaggeration;
    const margin = 2000 * exaggeration;
    const labelGraphic = getLabelGraphic(height);
    const boundingBox = getBoundingBox(height);
    const indicatorDown = getIndicatorDown(height, margin);
    const indicatorUp = getIndicatorUp(height, margin);
    view.graphics.addMany([labelGraphic, boundingBox, indicatorDown, indicatorUp]);
  }

  addVerticalScale();

});
