require([
  "esri/WebScene",
  "esri/layers/SceneLayer",
  "esri/views/SceneView",
  "esri/core/has",
  "dojo/domReady!"
], function (
  WebScene,
  SceneLayer,
  SceneView,
  has
) {
  has.add("enable-feature:alo10771/OIT", 1, true, true)
    const webscene = new WebScene({
      portalItem: {
        id: "e9a4025b24f4461aaf86f6d9b244a6be"
      }
    });

    const view = new SceneView({
      map: webscene,
      container: "viewDiv",
      qualityProfile: "high",
      environment: {
        lighting: {
          directShadowsEnabled: true,
          ambientOcclusionEnabled: true
        },
        atmosphereEnabled: true,
        atmosphere: {
          quality: "high"
        }
      }
    });

    window.view = view;

    const buildingsLayer = new SceneLayer({
      portalItem: {
        id: "2d913b3b8caf4f3d87be84ff19d77ac7"
      },
      renderer: {
        type: "simple",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: {
              color: [255, 255, 255, 0.6]
            },
            edges: {
              type: "solid",
              color: [0, 0, 0, 0.65],
              size: 0.3
            }
          }]
        }
      },
      popupEnabled: false
    });

    webscene.add(buildingsLayer);

    const projectLayer = new SceneLayer({
      portalItem: {
        id: "c0c27d0907b94fc29fe86b61cd72c62f"
      },
      renderer: {
        type: "simple",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: {
              color: [255, 211, 117, 0.7]
            },
            edges: {
              type: "sketch",
              size: 2,
              color: [50, 50, 50, 0.9],
              extensionLength: 10
            }
          }]
        }
      }
    });

    webscene.add(projectLayer);
  });
