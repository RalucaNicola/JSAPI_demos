require([
  "esri/WebScene",
  "esri/views/SceneView",
  "app/swiper",
  "app/syncUtil"
], function (WebScene, SceneView, swiper, syncUtil) {

  swiper.init();

  var webscene = new WebScene({
   portalItem: {
     id: "19dcff93eeb64f208d09d328656dd492"
   }
  });

  var viewTop = new SceneView({
    container: "viewTop",
    map: webscene,
    environment: {
      lighting: {
        directShadowsEnabled: true,
        ambientOcclusionEnabled: false
      }
    }
  });

  var viewBottom = new SceneView({
    container: "viewBottom",
    map: webscene,
    environment: {
      lighting: {
        directShadowsEnabled: true,
        ambientOcclusionEnabled: false
      }
    }
  });

  // Clear the top-left corner to make place for the title
  viewTop.ui.empty("top-left");

  syncUtil.syncViews(viewTop, viewBottom);

});
