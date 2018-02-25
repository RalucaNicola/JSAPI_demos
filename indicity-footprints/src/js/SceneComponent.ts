import WebScene = require("esri/WebScene");
import SceneView = require("esri/views/SceneView");
import FeatureLayer = require("esri/layers/FeatureLayer");
import Query = require("esri/tasks/support/Query");
import SimpleRenderer = require("esri/renderers/SimpleRenderer");
import PolygonSymbol3D = require("esri/symbols/PolygonSymbol3D");
import ExtrudeSymbol3DLayer = require("esri/symbols/ExtrudeSymbol3DLayer");
import { Settings } from "./types";
import { State } from './State';

export class SceneComponent {

  private webscene: WebScene;
  private layer: FeatureLayer;
  private fields: any;
  private heightDefExp: string = '';
  private yearDefExp: string = '';

  constructor(settings: Settings, state: State) {

    const webscene = new WebScene({
      portalItem: {
        id: settings.scenePortalItem
      }
    });

    const view = new SceneView({
      map: webscene,
      container: "view"
    });

    view.ui.empty("top-left");

    const layer = new FeatureLayer({
      portalItem: {
        id: settings.footprintPortalItem
      },
      renderer: new SimpleRenderer({
        symbol: new PolygonSymbol3D({
          symbolLayers: [new ExtrudeSymbol3DLayer({
            material: {
              color: "#FFFFFF"
            },
            /* edges: {
              type: "solid",
              color: "gray"
            } */
          })]
        }),
        visualVariables: [{
          type: "size",
          field: settings.fields.height,
          valueUnit: "meters" // Converts and extrudes all data values in feet
        }]
      })
    });

    webscene.add(layer);

    this.webscene = webscene;
    this.layer = layer;
    this.fields = settings.fields;

    state.addSubscriber('heightChanged', (value) => { this.updateHeight(value) });
    state.addSubscriber('yearChanged', (value) => { this.updateYear(value) });
  }

  private pagedQuery(store): IPromise {

    const query = new Query({
      outFields: [this.fields.height, this.fields.year],
      where: "1=1",
      /* start: store.length,
      num: 2000 */
    });

    return this.layer.queryFeatures(query)
      .then((result) => {
        console.log(result);
        store = store.concat(result.features.map((feature) => {
          return feature.attributes;
        }))
        return store;
        /* if (store.length < 15000) {
          return this.pagedQuery(store);
        }
        else {
          return store;
        } */
      })
      .otherwise((err) => {
        console.log(err);
      });
  }

  public getFootprintData() {

    let store = [];
    return this.pagedQuery(store);
  }

  private updateHeight(data): void {
    this.heightDefExp = `${this.fields.height} > ${data[0]} AND ${this.fields.height} < ${data[1]}`;
    this.setFilter();
  }

  private updateYear(data): void {
    if (data === undefined) {
      this.yearDefExp = '';
    }
    else {
      this.yearDefExp = `${this.fields.year} > ${data[0]} AND ${this.fields.year} < ${data[1]}`;
    }
    this.setFilter();
  }

  private setFilter(): void {
    let connector = (this.heightDefExp && this.yearDefExp) ? ' AND ' : '';
    this.layer.definitionExpression = this.heightDefExp + connector + this.yearDefExp;

    console.log("Scene should update: ", this.layer.definitionExpression);
  }


}
