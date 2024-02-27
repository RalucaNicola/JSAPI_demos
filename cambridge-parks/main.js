require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/support/LabelClass"
], (
  WebScene,
  SceneView,
  LabelClass
) => {


  const view = new SceneView({
    container: "viewDiv",
    map: new WebScene({
      portalItem: {
        id: "800c3f6d5d424b33b6d13d8c53969115",
      },
    }),
    qualityProfile: "high",
    ui: {
      components: []
    }
  });

  view.ui.add(["zoom", "navigation-toggle", "compass"], "top-right")

  view.when(() => {
    const labelsLayer = view.map.findLayerById("18deadd7af0-layer-959")
    labelsLayer.labelsVisible = true;
    labelsLayer.labelingInfo = [
      new LabelClass({
        where: "Category = 'label'",
        labelExpressionInfo: { expression: "$feature.Name" },
        symbol: {
          type: "label-3d", // autocasts as new LabelSymbol3D()
          symbolLayers: [
            {
              type: "text", // autocasts as new TextSymbol3DLayer()
              material: { color: "#545454" },
              background: {
                color: [255, 255, 255, 0.8],
              },
              size: 10
            }
          ],
          // Labels need a small vertical offset that will be used by the callout
          verticalOffset: {
            screenLength: 20,
            maxWorldLength: 1000,
            minWorldLength: 0
          },
          // The callout has to have a defined type (currently only line is possible)
          // The size, the color and the border color can be customized
          callout: {
            type: "line", // autocasts as new LineCallout3D()
            size: 0.5,
            color: "#545454",
          }
        }
      })
    ]
  });


});
