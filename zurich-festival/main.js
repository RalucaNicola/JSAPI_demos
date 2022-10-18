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
  reactiveUtils
) => {
  const dates = [];
  const properties = {};
  const graphics = [];
  let oldTime;
  let animationFrameTask = null;
  const duration = 1000;
  let tooltipVisible = false;
  const tooltip = document.getElementById("tooltip");
  const tooltipPeriod = {
    start: new Date("Mon Apr 08 2019 15:00:00 GMT+0200 (Central European Summer Time)"),
    end: new Date("Mon Apr 08 2019 18:30:00:00 GMT+0200 (Central European Summer Time)"),
  };
  let initialTime = new Date("Mon Apr 08 2019 12:00:00 GMT+0200 (Central European Summer Time)");

  const graphicsLayer = new GraphicsLayer({
    elevationInfo: {
      mode: "relative-to-scene",
    },
  });
  const labelsLayer = new GraphicsLayer({
    elevationInfo: {
      mode: "relative-to-scene",
    },
  });

  const routeLayer = new GeoJSONLayer({
    url: "parade-route.json",
    elevationInfo: {
      mode: "relative-to-ground",
      offset: 10,
    },
    renderer: {
      type: "simple",
      symbol: {
        type: "line-3d",
        symbolLayers: [
          {
            type: "line",
            material: {color: [252, 186, 3, 0.7]},
            size: 5,
          },
        ],
      },
    },
    visible: false,
  });
  const snowmanLayer = new GraphicsLayer({
    elevationInfo: {
      mode: "relative-to-ground",
    },
    copyright: `Snowman 3D model by <a href="https://sketchfab.com/3d-models/snowman-46c230958135402693822222dde11ed4">Leiona Chung</a>.`,
  });
  const snowman = new Graphic({
    geometry: new Point({
      latitude: 47.3656472,
      longitude: 8.54622866,
    }),
    symbol: {
      type: "point-3d",
      symbolLayers: [
        {
          type: "object",
          resource: {href: "./snowman.glb"},
          height: 20,
          heading: 200,
        },
      ],
    },
  });

  snowmanLayer.add(snowman);

  Papa.parse("./2019_04_08_zurich.csv", {
    download: true,
    complete: function (results) {
      for (let i = 1; i < results.data.length; i++) {
        const data = results.data[i];
        const timedate = data[2];
        const id = data[1];
        if (dates.indexOf(timedate) === -1) {
          dates.push(timedate);
        }
        const property = {
          date: new Date(timedate),
          pedestrian: parseInt(data[5]) + parseInt(data[6]),
          bike: parseInt(data[3]) + parseInt(data[4]),
        };
        if (!properties.hasOwnProperty(id)) {
          properties[id] = [property];
        } else {
          properties[id].push(property);
        }
      }

      fetch("./locations.json")
        .then(response => {
          return response.json();
        })
        .then(locations => {
          locations.features.forEach(feature => {
            if (properties.hasOwnProperty(feature.fk_zaehler)) {
              graphics.push(
                new Graphic({
                  geometry: null,
                  attributes: {
                    id: feature.fk_zaehler,
                    geometry: new Point({
                      x: feature.geometry.coordinates[0],
                      y: feature.geometry.coordinates[1],
                      spatialReference: {
                        wkid: 4326,
                      },
                    }),
                  },
                  symbol: {
                    type: "mesh-3d",
                    symbolLayers: [
                      {
                        type: "fill",
                        material: {color: [255, 255, 255, 1]},
                      },
                    ],
                  },
                })
              );
            }
          });
          graphicsLayer.graphics = graphics;
          createMap();
          createTimeline(dates.map(date => new Date(date)));
        });
    },
  });

  const formatNumber = number => {
    return new Intl.NumberFormat("en-US").format(number);
  };

  function createMap() {
    const view = new SceneView({
      container: "viewDiv",
      map: new WebScene({
        portalItem: {
          id: "abbb675475f940f284563767659d5a6e",
        },
      }),
      qualityProfile: "high",
    });
    view.when(() => {
      view.environment.lighting.directShadowsEnabled = true;
      view.environment.lighting.waterReflectionEnabled = true;
      view.environment.lighting.date = initialTime;
    });

    view.map.addMany([graphicsLayer, labelsLayer, routeLayer, snowmanLayer]);
    window.view = view;

    currentTimeContainer.innerHTML = `${format(initialTime.getHours())}:${format(initialTime.getMinutes())}`;
    reactiveUtils
      .whenOnce(() => !view.updating)
      .then(() => {
        startAnimation(initialTime, new Date(dates[0]));
      });

    document.getElementById("snowman").addEventListener("click", () => {
      view.goTo({
        position: [8.54674892, 47.3645512, 474.25209],
        heading: 335.27,
        tilt: 74.91,
      });
    });
  }

  const getGeometry = (origin, size, color) => {
    const geometry = Mesh.createCylinder(origin, {
      size: {height: size, width: 15, depth: 15},
      densificationFactor: 2,
    });
    geometry.components[0].material = new MeshMaterialMetallicRoughness({
      emissiveColor: [color.r, color.g, color.b],
    });
    const coordinateColors = [];
    const topColor = [30, 30, 30, 255];
    const baseColor = [255, 255, 255, 50];

    const vertexNo = geometry.vertexAttributes.position.length / 3;

    for (let i = 0; i < vertexNo / 2; i++) {
      coordinateColors.push(topColor);
    }

    for (let i = vertexNo / 2; i < vertexNo; i++) {
      coordinateColors.push(baseColor);
    }

    const colorVertices = Uint8Array.from(coordinateColors.flat());
    geometry.vertexAttributes.color = colorVertices;
    return geometry;
  };

  const getSizeFromValue = value => {
    const stops = [
      {value: 0, size: 150},
      {value: 600, size: 400},
    ];
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      if (value < stop.value) {
        if (i === 0) {
          return stop.size;
        }
        const prev = stops[i - 1];
        const weight = (value - prev.value) / (stop.value - prev.value);
        return Math.abs((stop.size - prev.size) * weight);
      }
    }
    return stops[stops.length - 1].size;
  };

  const getColorFromValue = value => {
    const stops = [
      {value: 0, color: new Color([0, 255, 176])},
      {value: 400, color: new Color([255, 94, 0])},
    ];
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];

      if (value < stop.value) {
        if (i === 0) {
          return stop.color;
        }

        const prev = stops[i - 1];

        const weight = (value - prev.value) / (stop.value - prev.value);
        return Color.blendColors(prev.color, stop.color, weight);
      }
    }
    return stops[stops.length - 1].color;
  };

  function startAnimation(newTime, oldTime) {
    let t = 0;

    const update = () => {
      let percentage = 1 - (duration - t) / duration;
      if (percentage > 1) {
        percentage = 1;
        stopAnimation();
      }
      labelsLayer.removeAll();
      graphicsLayer.graphics.forEach(graphic => {
        const oldValue = properties[graphic.attributes.id].filter(
          property => property.date.getTime() === oldTime.getTime()
        )[0];
        const newValue = properties[graphic.attributes.id].filter(
          property => property.date.getTime() === newTime.getTime()
        )[0];
        if (newValue && oldValue) {
          let pedestrianCount = oldValue["pedestrian"] + percentage * (newValue["pedestrian"] - oldValue["pedestrian"]);
          let currentSize = getSizeFromValue(pedestrianCount);
          let currentColor = getColorFromValue(pedestrianCount);
          graphic.geometry = getGeometry(graphic.attributes.geometry, currentSize, currentColor);
          if (pedestrianCount > 0) {
            const label = new Graphic({
              geometry: new Point({
                x: graphic.attributes.geometry.x,
                y: graphic.attributes.geometry.y,
                z: currentSize,
                spatialReference: {
                  wkid: 4326,
                },
              }),
              symbol: {
                type: "point-3d",
                symbolLayers: [
                  {
                    type: "text",
                    material: {color: [255, 255, 255]},
                    background: {
                      color: currentColor,
                    },
                    font: {
                      weight: "bold",
                    },
                    size: 9,
                    text: `${formatNumber(Math.floor(pedestrianCount))}`,
                  },
                ],
                verticalOffset: {
                  screenLength: 20,
                  maxWorldLength: 500,
                  minWorldLength: 5,
                },
                callout: {
                  type: "line",
                  size: 0.5,
                  color: currentColor,
                  border: {
                    color: [0, 0, 0, 0],
                  },
                },
              },
            });
            labelsLayer.add(label);
          }
        }
      });
    };
    animationFrameTask = scheduling.addFrameTask({
      update: ev => {
        t += ev?.deltaTime ?? 0;
        update(t);
      },
    });
  }

  function stopAnimation() {
    animationFrameTask.remove();
    animationFrameTask = null;
  }

  const currentTimeContainer = document.getElementById("currentTime");
  const format = number => {
    if (number < 10) {
      return `0${number}`;
    }
    return number;
  };

  function createTimeline(dates) {
    const start = dates[0];
    const end = dates[dates.length - 1];
    oldTime = initialTime;
    const timeSlider = new TimeSlider({
      container: "timeSliderDiv",
      mode: "instant",
      fullTimeExtent: {
        start,
        end,
      },
      timeExtent: {
        start: initialTime,
        end: initialTime,
      },
      stops: {dates},
      playRate: duration + 200,
    });
    timeSlider.watch("timeExtent", value => {
      const newTime = value.start;
      if (newTime.getTime() >= tooltipPeriod.start.getTime() && newTime.getTime() <= tooltipPeriod.end.getTime()) {
        tooltipVisible = true;
        routeLayer.visible = true;
        updateOverlay();
        tooltip.classList.remove("invisible");
      } else {
        tooltipVisible = false;
        routeLayer.visible = false;
        tooltip.classList.add("invisible");
      }
      if (animationFrameTask) {
        stopAnimation();
      }
      startAnimation(newTime, oldTime);
      view.environment.lighting.date = newTime;
      currentTimeContainer.innerHTML = `${format(newTime.getHours())}:${format(newTime.getMinutes())}`;
      oldTime = newTime;
    });
  }

  const tooltipPoint = new Point({
    x: 951024.6221827283,
    y: 6002757.655869749,
    z: 408.4010905241594,
    spatialReference: {
      wkid: 3857,
    },
  });

  function updateOverlay() {
    if (view.ready) {
      const screenPoint = view.toScreen(tooltipPoint);
      if (screenPoint) {
        tooltip.style.top = `${screenPoint.y - tooltip.clientHeight / 2}px`;
        tooltip.style.left = `${screenPoint.x - tooltip.clientWidth}px`;
      }
    }
    if (tooltipVisible) {
      requestAnimationFrame(updateOverlay);
    }
  }
});
