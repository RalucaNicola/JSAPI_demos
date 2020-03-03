define(["app/config", "app/utils", "app/statistics"], function (config, appUtils, statistics) {
  Chart.defaults.global.defaultFontFamily = `"Avenir Next W00","Helvetica Neue",Helvetica,Arial,sans-serif`;
  Chart.defaults.global.defaultFontSize = 12;
  function createYearChart() {
    const yearCanvas = document.getElementById("yearChart");
    const yearChart = new Chart(yearCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: config.yearClasses.map(function (element) { return element.label }),
        datasets: [
          {
            label: "Buildings built",
            backgroundColor: config.yearClasses.map(function (element) { return element.color }),
            stack: "Stack 0",
            data: [0, 0, 0, 0, 0, 0]
          }
        ]
      },
      options: {
        responsive: false,
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Construction year"
        },
        scales: {
          xAxes: [
            {
              stacked: true
            }
          ],
          yAxes: [
            {
              stacked: true,
              ticks: {
                beginAtZero: true,
                precision: 0
              }
            }
          ]
        }
      }
    });
    return yearChart;
  }
  function createHeightChart() {
    const heightCanvas = document.getElementById("heightChart");
    const heightBins = appUtils.heightBins;
    return new Chart(heightCanvas.getContext("2d"), {
      type: "horizontalBar",
      data: {
        labels: heightBins.map(function (element) { return element.label }),
        datasets: [
          {
            label: "Buildings with this height",
            backgroundColor: heightBins.map(function (element) { return element.color }),
            stack: "Stack 0",
            data: [0, 0, 0, 0, 0, 0, 0, 0]
          }
        ]
      },
      options: {
        responsive: false,
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Building height"
        },
        scales: {
          xAxes: [
            {
              stacked: true,
              ticks: {
                beginAtZero: true,
                precision: 0
              }
            }
          ],
          yAxes: [
            {
              stacked: true
            }
          ]
        }
      }
    });
  }

  function createUsageChart() {

    const labels = config.usageValues.map(function (element) {
      return element.label;
    })
    labels.push("Other");

    const backgroundColor = config.usageValues.map(function (element) {
      return element.color;
    });
    backgroundColor.push(config.otherColor);

    const usageCanvas = document.getElementById("usageChart");
    const usageChart = new Chart(usageCanvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            backgroundColor: backgroundColor,
            borderWidth: 0,
            data: [0, 0, 0, 0, 0]
          }
        ]
      },
      options: {
        responsive: false,
        cutoutPercentage: 35,
        legend: {
          position: "bottom"
        },
        title: {
          display: true,
          text: "Building usage"
        }
      }
    });
    return usageChart;
  }

  const yearChart = createYearChart();
  const heightChart = createHeightChart();
  const usageChart = createUsageChart();
  return {
    yearChart,
    heightChart,
    usageChart,
    updateCharts(result) {
      const allStats = result.features[0].attributes;

      const yearValues = statistics.yearStatDefinitions.map(function (element) {
        return allStats[element.outStatisticFieldName]
      });
      yearChart.data.datasets[0].data = yearValues;
      yearChart.update();

      const heightValues = statistics.heightStatDefinitions.map(function (element) {
        return allStats[element.outStatisticFieldName]
      });
      heightChart.data.datasets[0].data = heightValues;
      heightChart.update();

      const usageValues = statistics.usageStatDefinitions.map(function (element) {
        return allStats[element.outStatisticFieldName]
      });
      usageChart.data.datasets[0].data = usageValues;
      usageChart.update();
    }
  }
});
