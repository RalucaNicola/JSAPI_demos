define(["require", "exports", "./State", "./SceneComponent", "./YearChartComponent", "./HeightSliderComponent", "./DataComponent"], function (require, exports, State_1, SceneComponent_1, YearChartComponent_1, HeightSliderComponent_1, DataComponent_1) {
    "use strict";
    class Application {
        constructor(settings) {
            this.settings = settings;
            this.state = new State_1.State();
        }
        init() {
            let app = this;
            let state = this.state;
            let scene = new SceneComponent_1.SceneComponent(this.settings, state);
            let dataComponent = new DataComponent_1.DataComponent(this.settings, state);
            scene.getFootprintData()
                .then((features) => {
                console.log(features);
                dataComponent.init(features);
                new YearChartComponent_1.YearChartComponent('#year-chart', app, dataComponent);
                new HeightSliderComponent_1.HeightSliderComponent('height-chart', app, dataComponent);
            })
                .otherwise((err) => {
                console.log(err);
            });
        }
        handleAction(action, data) {
            this.state.setState(action, data);
        }
    }
    return Application;
});
