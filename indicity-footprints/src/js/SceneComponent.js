define(["require", "exports", "esri/WebScene", "esri/views/SceneView", "esri/layers/FeatureLayer", "esri/tasks/support/Query", "esri/renderers/SimpleRenderer", "esri/symbols/PolygonSymbol3D", "esri/symbols/ExtrudeSymbol3DLayer"], function (require, exports, WebScene, SceneView, FeatureLayer, Query, SimpleRenderer, PolygonSymbol3D, ExtrudeSymbol3DLayer) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SceneComponent {
        constructor(settings, state) {
            this.heightDefExp = '';
            this.yearDefExp = '';
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
            state.addSubscriber('heightChanged', (value) => { this.updateHeight(value); });
            state.addSubscriber('yearChanged', (value) => { this.updateYear(value); });
        }
        pagedQuery(store) {
            const query = new Query({
                outFields: [this.fields.height, this.fields.year],
                where: "1=1",
            });
            return this.layer.queryFeatures(query)
                .then((result) => {
                console.log(result);
                store = store.concat(result.features.map((feature) => {
                    return feature.attributes;
                }));
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
        getFootprintData() {
            let store = [];
            return this.pagedQuery(store);
        }
        updateHeight(data) {
            this.heightDefExp = `${this.fields.height} > ${data[0]} AND ${this.fields.height} < ${data[1]}`;
            this.setFilter();
        }
        updateYear(data) {
            if (data === undefined) {
                this.yearDefExp = '';
            }
            else {
                this.yearDefExp = `${this.fields.year} > ${data[0]} AND ${this.fields.year} < ${data[1]}`;
            }
            this.setFilter();
        }
        setFilter() {
            let connector = (this.heightDefExp && this.yearDefExp) ? ' AND ' : '';
            this.layer.definitionExpression = this.heightDefExp + connector + this.yearDefExp;
            console.log("Scene should update: ", this.layer.definitionExpression);
        }
    }
    exports.SceneComponent = SceneComponent;
});
