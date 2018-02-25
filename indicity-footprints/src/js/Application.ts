
import {State} from './State';
import {SceneComponent} from './SceneComponent';
import {YearChartComponent} from './YearChartComponent';
import {HeightSliderComponent} from './HeightSliderComponent';
import {Settings} from './types';
import {DataComponent} from './DataComponent';

class Application {

  public state: State;
  public settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
    this.state = new State();
  }

  init() {
    let app = this;
    let state = this.state;

    let scene = new SceneComponent(this.settings, state);
    let dataComponent = new DataComponent(this.settings, state);

    scene.getFootprintData()
      .then((features) => {
        console.log(features);
        dataComponent.init(features);
        new YearChartComponent('#year-chart', app, dataComponent);
        new HeightSliderComponent('height-chart', app, dataComponent);
      })
      .otherwise((err) => {
        console.log(err);
      });

  }

  handleAction(action, data) {
    this.state.setState(action, data);
  }
}

export = Application;

