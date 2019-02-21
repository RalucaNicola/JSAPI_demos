require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",
  "esri/renderers/SimpleRenderer",
  "esri/layers/support/LabelClass",
  "esri/symbols/LabelSymbol3D",
  "esri/symbols/TextSymbol3DLayer",
  "esri/symbols/PointSymbol3D",
  "esri/symbols/IconSymbol3DLayer",
  "esri/core/watchUtils",
  "esri/Camera",
  "esri/geometry/SpatialReference"
], function (WebScene, SceneView,
   FeatureLayer, SimpleRenderer,
   LabelClass, LabelSymbol3D, TextSymbol3DLayer,
   PointSymbol3D, IconSymbol3DLayer, watchUtils,
    Camera, SpatialReference) {

    var webscene = new WebScene({
        portalItem: {
            id: "2aaafe3b5c4a4fbea0f849278de26e89"
        }
    });

    var view = new SceneView({
        container: "viewDiv",
        map: webscene,
        qualityProfile: "high"
    });

    view.ui.empty("top-left");
    window.view = view;

    var contourFireIncidents = new FeatureLayer({
        url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/Con_Incidents_2016/FeatureServer/0",
        elevationInfo: {
            mode: "relative-to-ground",
            featureExpressionInfo: {
                expression: "$feature.Contour * 4"
            }
        },
        renderer: new SimpleRenderer({
            symbol: {
                type: "line-3d",
                symbolLayers: [{
                        type: "line",
                        size: 1
                    }]
            },
            visualVariables: [{
                    type: "color",
                    field: "Contour",
                    stops: [{
                            value: 25,
                            color: [255, 236, 198]
                        }, {
                            value: 200,
                            color: [255, 161, 89]
                        }, {
                            value: 400,
                            color: [255, 130, 89]
                        }]
                }]
        })
    });

    webscene.add(contourFireIncidents);
    var fireStations = new FeatureLayer({
        url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/KFD_Fire_Stations/FeatureServer/0",
        renderer: new SimpleRenderer({
            symbol: {
                type: "point-3d",
                symbolLayers: [{
                        type: "icon",
                        resource: {
                            primitive: "circle"
                        },
                        material: {
                            color: [255, 255, 255]
                        },
                        size: 8
                    }],
                verticalOffset: {
                    screenLength: 120,
                    maxWorldLength: 2000,
                    minWorldLength: 1000
                },
                callout: {
                    type: "line",
                    color: [255, 255, 255],
                    size: 2
                }
            }
        }),
        labelingInfo: [new LabelClass({
                labelExpressionInfo: { expression: "$feature.LABEL" },
                symbol: new LabelSymbol3D({
                    symbolLayers: [new TextSymbol3DLayer({
                            material: {
                                color: [255, 255, 255]
                            },
                            font: {
                                weight: "bold"
                            },
                            size: 11
                        })]
                })
            })]
    });
    webscene.add(fireStations);
    var fireIncidents = new FeatureLayer({
        url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/KFD_All_Responses/FeatureServer/1",
        elevationInfo: {
            mode: "on-the-ground"
        },
        renderer: new SimpleRenderer({
            symbol: new PointSymbol3D({
                symbolLayers: [new IconSymbol3DLayer({
                        resource: {
                            primitive: "circle"
                        },
                        material: {
                            color: [229, 93, 78, 0.5]
                        },
                        size: 3
                    })]
            })
        })
    });
    webscene.add(fireIncidents);
    view.whenLayerView(fireIncidents)
        .then(function (lyrView) {
        watchUtils.whenFalseOnce(lyrView, "updating", function () {
            var destination = new Camera({
                position: {
                    spatialReference: SpatialReference.WebMercator,
                    x: -13591420.549233317,
                    y: 5996962.059495949,
                    z: 6101
                },
                heading: 306,
                tilt: 56
            });
            view.goTo(destination, { speedFactor: 0.04 });
        });
    });
});
