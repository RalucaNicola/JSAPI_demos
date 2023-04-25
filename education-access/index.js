require(["esri/WebScene", "esri/views/SceneView", "esri/Color", "esri/widgets/Home"], (
  WebScene,
  SceneView,
  Color,
  Home
) => {
  function createHistogram(data, container) {

    const selectedColor = `rgb(190 124 200)`;

    // Create container
    const width = 500;
    const height = 300;
    const marginLeft = marginRight = marginTop = 30;
    const marginBottom = 40;
    const svg = container.append("svg");
    svg.attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
    const yLabel = "↑ Number of countries";
    const xLabel = "Expected school years →";
    const insetLeft = 0.5; // inset left edge of bar
    const insetRight = 0.5; // inset right edge of bar


    // Construct scales and axes

    // Generate bins
    const X1990 = d3.map(data, d => +d.education1990).filter(d => d !== 0);
    const X2020 = d3.map(data, d => +d.education2020).filter(d => d !== 0);
    const bins1990 = d3.bin().thresholds(20).value(d => X1990[d])(d3.range(X1990.length));
    const bins2020 = d3.bin().thresholds(20).value(d => X2020[d])(d3.range(X2020.length));
    const Y1990 = Array.from(bins1990, I => d3.sum(I, i => d3.map(X1990, () => 1)[i]));
    const Y2020 = Array.from(bins2020, I => d3.sum(I, i => d3.map(X2020, () => 1)[i]));

    const yScale = d3.scaleLinear([0, d3.max(Y1990.concat(Y2020))], [height - marginBottom, marginTop]);
    const yAxis = d3.axisLeft(yScale).ticks(height / 40);

    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(yLabel));

    xDomain = [bins1990[0].x0, bins2020[bins2020.length - 1].x1];
    const xScale = d3.scaleLinear(xDomain, [marginLeft, width - marginRight]);
    const xAxis = d3.axisBottom(xScale).ticks(width / 40).tickSizeOuter(0);
    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis)
      .call(g => g.append("text")
        .attr("x", width)
        .attr("y", 35)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text(xLabel));

    svg.append("g")
      .attr("class", 'g1990')
      .attr("fill", selectedColor)
      .selectAll("rect")
      .data(bins1990)
      .join("rect")
      .attr("x", d => xScale(d.x0) + insetLeft)
      .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - insetLeft - insetRight))
      .attr("y", (d, i) => yScale(Y1990[i]))
      .attr("height", (d, i) => yScale(0) - yScale(Y1990[i]))
      .style("opacity", 0.2);

    svg.append("g")
      .attr("class", 'g2020')
      .attr("fill", selectedColor)
      .selectAll("rect")
      .data(bins2020)
      .join("rect")
      .attr("x", d => xScale(d.x0) + insetLeft)
      .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - insetLeft - insetRight))
      .attr("y", (d, i) => yScale(Y2020[i]))
      .attr("height", (d, i) => yScale(0) - yScale(Y2020[i]))
      .style("opacity", 0.9);
    const button2020 = document.getElementById("select2020");
    const button1990 = document.getElementById("select1990");
    button2020.addEventListener("click", (event) => {
      svg.select(".g2020")
        .selectAll("rect")
        .transition().duration(500)
        .style("opacity", 0.9);
      svg.select(".g1990")
        .selectAll("rect")
        .transition().duration(500)
        .style("opacity", 0.2);
      button2020.classList.toggle('selected');
      button1990.classList.toggle('selected');
    });
    button1990.addEventListener("click", () => {
      svg.select(".g1990")
        .selectAll("rect")
        .transition().duration(500)
        .style("opacity", 0.9);
      svg.select(".g2020")
        .selectAll("rect")
        .transition().duration(500)
        .style("opacity", 0.2);
      button1990.classList.toggle('selected');
      button2020.classList.toggle('selected');

    });
  }


  const legendWidth = 20;
  document.getElementById("legend").innerHTML = getStaticLegend();
  const histogramContainer = d3.select("#histogram");
  d3.csv("./years-of-schooling-histogram.csv")
    .then(data => {
      createHistogram(data, histogramContainer);
    });

  const viewContainer = document.getElementById("viewDiv");
  const tooltip = document.getElementById("tooltipDiv");

  const map = new WebScene({
    portalItem: {
      id: "9293d6a32db14388ab6ebc488a48b9c4",
    },
  });

  const view = new SceneView({
    container: "viewDiv",
    map: map,
    viewingMode: "local",
    highlightOptions: {
      color: "white",
      fillOpacity: 0,
    },
    qualityProfile: "high",
    ui: {
      components: ["zoom", "compass"],
    },
    constraints: {
      tilt: {
        max: 75,
      },
    },
    navigation: {
      mouseWheelZoomEnabled: false,
      browserTouchPanEnabled: false,
    },
  });

  const warningContainer = document.getElementById("warning");

  view.on("mouse-wheel", () => {
    warnUser("To zoom in please double click the map or use zoom in/out buttons.");
  });

  function warnUser(text) {
    warningContainer.innerHTML = text;
    if (warningContainer.classList.contains("hide")) {
      warningContainer.classList.replace("hide", "show");
      setTimeout(() => {
        warningContainer.classList.replace("show", "hide");
      }, 2500);
    }
  }

  const homeWidget = new Home({
    view: view,
    iconClass: "esri-icon-maps",
  });

  view.ui.add(homeWidget, "top-left");

  const uniqueValueInfos = [];
  let layer = null;
  let layerView = null;
  let hoverHighlightHandle = null;
  let selectHighlightHandle = null;
  view.when(() => {
    layer = view.map.layers.find(layer => layer.title === "MoriartyCountriesEducationPoint");
    view.whenLayerView(layer).then(lyrView => {
      layerView = lyrView;
    });
    layer.queryFeatures({ where: "1=1", outFields: "*" }).then(result => {
      result.features.forEach(feature => {
        const attr = feature.attributes;
        const data = [];
        for (let i = 2021; i >= 1990; i--) {
          data.push(attr[`F${i}`]);
        }
        const symbol = {
          type: "point-3d",
          symbolLayers: [
            {
              type: "icon",
              anchor: "bottom",
              size: 100,
              resource: { href: getSymbol(data) },
              material: {
                color: [255, 255, 255, 0.85],
              },
            },
          ],
        };
        uniqueValueInfos.push({
          value: attr.Code,
          symbol,
          data,
        });
      });
      layer.renderer = {
        type: "unique-value",
        field: "Code",
        uniqueValueInfos,
      };
    });
    view.on("pointer-move", evt => {
      if (!view.interacting) {
        view.hitTest(evt, { include: [layer] }).then(result => {
          if (result.results.length > 0) {
            viewContainer.style.cursor = "pointer";
            hoverHighlight(result.results[0].graphic, "hover");
          } else {
            viewContainer.style.cursor = "default";
            hoverHighlight(null, "hover");
          }
        });
      }
    });

    view.on("click", evt => {
      view.hitTest(evt, { include: [layer] }).then(result => {
        if (result.results.length > 0) {
          selectFeature(result.results[0].graphic);
        } else {
          showTooltip(null);
          selectHighlight(null);
        }
      });
    });
  });

  document.querySelectorAll(".zoomTo").forEach(element => {
    element.addEventListener("click", () => {
      selectByCode(element.dataset.code);
    });
  });

  function selectByCode(code) {
    console.log(code);
    layer
      .queryFeatures({ where: `Code='${code}'`, returnGeometry: true, outFields: ["Code", "Name", "OBJECTID_1"] })
      .then(result => {
        if (result.features.length > 0) {
          selectFeature(result.features[0]);
        }
      });
  }

  function selectFeature(graphic) {
    showTooltip(graphic);
    selectHighlight(graphic);
    view.goTo({ target: graphic, zoom: 5 });
  }

  function selectHighlight(graphic) {
    if (layerView) {
      if (selectHighlightHandle) {
        selectHighlightHandle.remove();
        selectHighlightHandle = null;
      }
      if (graphic) {
        selectHighlightHandle = layerView.highlight(graphic);
      }
    }
  }

  function hoverHighlight(graphic) {
    if (layerView) {
      if (hoverHighlightHandle) {
        hoverHighlightHandle.remove();
        hoverHighlightHandle = null;
      }
      if (graphic) {
        hoverHighlightHandle = layerView.highlight(graphic);
      }
    }
  }

  function getLegend(data) {
    let dataBars = "";
    const legendWidth = 60;
    data.forEach((value, index) => {
      const year = 2021 - index;
      const length = value ? (value * legendWidth) / 20 : 10;
      const color = value ? getColorFromValue(value) : "#ccc";
      dataBars += `<div class='bar'><div class='year'>${year}</div><div style="width: ${length}px; border-bottom: 3px solid ${color}"></div><div>${value ? value.toFixed(1) : "no data"
        }</div></div>`;
    });
    return `<div class='dataContainer'>${dataBars}</div>`;
  }

  function getStaticLegend() {
    const data = [];
    for (let i = 2021, j = 25; i >= 1990; i--, j--) {
      const value = [i, 1 + ((i - 1990) * 24) / 31];
      data.push(value);
    }
    let dataBars = "";
    data.forEach(d => {
      const value = d[1];
      const length = value ? (value * legendWidth) / 20 : 10;
      const color = value ? getColorFromValue(value) : "#ccc";
      dataBars += `<div class='bar' style="width: ${length}px; background-color: ${color}"></div>`;
    });

    return `<div class='years'><p>2021</p><p>1990</p></div>
    <div class='axis'></div><div class='dataContainer' style="width: ${legendWidth + 10
      }px">${dataBars}</div><div class='numberContainer'><div class='numberPointers'></div><div class='numberText'><p>23 years</p><p>2 years</p></div></div>`;
  }

  function closeTooltip() {
    showTooltip(null);
    selectHighlight(null);
  }

  function showTooltip(entity) {
    if (entity) {
      const { Code, Name } = entity.attributes;
      tooltip.style.display = "inherit";
      const uvi = uniqueValueInfos.find(uvi => uvi.value === Code);
      const legend = getLegend(uvi.data);
      tooltip.innerHTML = `<div class='tooltipHeader'><h2 class='tooltipTitle'>${Name}</h2><p class='tooltipSubtitle'>Number of expected school years</p></div><div class='dynamicLegend'>${legend}</div>`;
      const closeBtn = document.createElement("button");
      closeBtn.addEventListener("click", closeTooltip);
      closeBtn.innerHTML = `<img src='../assets/close.svg'/>`;
      closeBtn.classList.add("close");
      tooltip.appendChild(closeBtn);
    } else {
      tooltip.style.display = "none";
      tooltip.innerHTML = ``;
    }
  }

  function getColorFromValue(value) {
    // Esri color ramps - Perfect Pigtails
    // #0060a6,#2782c4,#a889b8,#d78e9a,#ffa18e,#ffcabf
    const stops = [
      { value: 3, color: new Color("#ffcabf") },
      { value: 6, color: new Color("#ffa18e") },
      { value: 9, color: new Color("#d78e9a") },
      { value: 12, color: new Color("#a889b8") },
      { value: 15, color: new Color("#2782c4") },
      { value: 25, color: new Color("#0060a6") },
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

    return stops[stops.length - 1].color.toHex();
  }

  function getSymbol(data) {
    const canvas = document.createElement("canvas");
    const size = 10;
    const width = size * 5;
    canvas.setAttribute("width", `${width}px`);
    canvas.setAttribute("height", `${data.length * size}px`);
    const ctx = canvas.getContext("2d");
    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      ctx.fillStyle = value ? getColorFromValue(value) : "#ccc";
      const length = value ? (value * width) / 25 : 10;
      ctx.fillRect(width / 2 - length / 2, i * size, length, size - 2);
    }
    return canvas.toDataURL("image/png");
  }
});
