define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DataComponent {
        constructor(settings, state) {
            this.fields = settings.fields;
            this.state = state;
        }
        init(data) {
            this.buildingData = crossfilter(data);
            // build construction year dimension
            let yearDimension = this.buildingData.dimension((d) => { return d[this.fields.year]; });
            // remove all null, undefined, empty string or 0 values from yearDimension
            yearDimension.filterFunction((d) => { return d; });
            // generate values for construction year histogram
            let yearHist = yearDimension.group().reduceCount();
            this.yearProperties = {
                dimension: yearDimension,
                histogram: yearHist,
                minYear: yearDimension.bottom(1)[0][this.fields.year],
                maxYear: yearDimension.top(1)[0][this.fields.year]
            };
            // build height dimension
            let heightDimension = this.buildingData.dimension((d) => { return d[this.fields.height]; });
            // remove all null, undefined, empty string or 0 values from heightDimension
            heightDimension.filterFunction((d) => { return d; });
            // generate values for construction height histogram
            let heightHist = heightDimension.group().reduceCount();
            this.heightProperties = {
                dimension: heightDimension,
                histogram: heightHist,
                minHeight: heightDimension.bottom(1)[0][this.fields.height],
                maxHeight: heightDimension.top(1)[0][this.fields.height]
            };
        }
        getYearProperties() {
            return this.yearProperties;
        }
        getHeightProperties() {
            return this.heightProperties;
        }
    }
    exports.DataComponent = DataComponent;
});
