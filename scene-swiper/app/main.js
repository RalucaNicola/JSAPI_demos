require([
  "esri/WebScene",
  "esri/views/SceneView",
  "app/swiper",
  "app/syncUtil"
], function (WebScene, SceneView, swiper, syncUtil) {

  swiper.init();

  var websceneTop = new WebScene({
   portalItem: {
     id: "542a491cf6404c8fa7c5feb1fa1c4a9c"
   }
  });

  var websceneBottom = new WebScene({
    portalItem: {
      id: "54e49fb8f0d94642ab199599cc549478"
    }
  });

  var viewTop = new SceneView({
    container: "viewTop",
    map: websceneTop,
    environment: {
      lighting: {
        directShadowsEnabled: true,
        ambientOcclusionEnabled: false
      }
    }
  });

  var viewBottom = new SceneView({
    container: "viewBottom",
    map: websceneBottom,
    environment: {
      lighting: {
        directShadowsEnabled: true,
        ambientOcclusionEnabled: false
      }
    }
  });

  // Clear the top-left corner to make place for the title
  viewTop.ui.empty("top-left");
  viewBottom.ui.empty("top-left");

  // synchronize the two views
  syncUtil.syncViews(viewTop, viewBottom);

});
