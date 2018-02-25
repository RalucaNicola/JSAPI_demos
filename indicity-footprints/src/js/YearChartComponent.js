define(["require", "exports", "dc", "d3"], function (require, exports, dc, d3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class YearChartComponent {
        constructor(container, app, dataComponent) {
            let yearChart = dc.barChart(container)
                .height(150)
                .width(400)
                .xUnits(() => 100);
            let yearProp = dataComponent.getYearProperties();
            yearChart
                .dimension(yearProp.dimension)
                .group(yearProp.histogram)
                .x(d3.scale.linear().domain([yearProp.minYear, yearProp.maxYear]))
                .elasticY(true)
                .controlsUseVisibility(true);
            yearChart.xAxis().ticks(5);
            yearChart.yAxis().ticks(3);
            yearChart.render();
            yearChart.on('preRedraw', (evt) => {
                app.handleAction('yearChanged', evt.filters()[0]);
            });
            app.state.addSubscriber('heightChanged', (value) => { this.updateHeight(value); });
            this.yearChart = yearChart;
            this.heightDimension = dataComponent.getHeightProperties().dimension;
        }
        updateHeight(value) {
            this.heightDimension.filter((d) => {
                return (d > value[0] && d < value[1]);
            });
            this.yearChart.redraw();
        }
    }
    exports.YearChartComponent = YearChartComponent;
});
