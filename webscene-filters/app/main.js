require([
  "esri/WebScene",
  "esri/views/SceneView"
], function(WebScene, SceneView) {

  const params = (new URL(document.location)).searchParams;
  const websceneId = params.get("webscene");

  // load webscene from ArcGIS Online
  const webscene = new WebScene({
    portalItem: {
      id: websceneId || "f19c17eb035a471fb7c6cded65eab9f0"
    }
  });

  const view = new SceneView({
    map: webscene,
    container: "scene-view",
  });

  view.ui.add("screenshot-btn", "bottom-left");

  view.when(function() {
    document.getElementById("image-title").innerHTML = webscene.portalItem.title;
  });

  const screenshotButton = document.getElementById("screenshot-btn");
  screenshotButton.addEventListener("click", function() {
    view.takeScreenshot({ width: 350, height: 300 })
      .then(function(screenshot) {
        createImage(screenshot);
      })
      .catch(function(err) {
        console.log(err);
      });
  });

  function createImage(screenshot) {
    document.getElementById("image-container").innerHTML = "<img src='" + screenshot.dataUrl + "'>";
  }

});