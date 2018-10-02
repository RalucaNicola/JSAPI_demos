require([
  "esri/WebScene",
  "esri/views/SceneView",
  "app/ImageFilterComponent"
], function(WebScene, SceneView, ImageFilterComponent) {

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

  view.ui.empty("top-left");
  view.ui.add("screenshot-btn", "bottom-left");
  view.ui.add("attribution", "bottom-right");

  view.when(function() {
    document.getElementById("image-title").innerHTML = webscene.portalItem.title;
  });

  let imageFilterComponent = new ImageFilterComponent("filters");
  imageFilterComponent.onFilterChange(function(dataUrl) {
    document.getElementById("image-container").innerHTML = "<img src='" + dataUrl + "'>";
  });

  const screenshotButton = document.getElementById("screenshot-btn");
  screenshotButton.addEventListener("click", function() {
    view.takeScreenshot({ width: 350, height: 300 })
      .then(function(screenshot) {
        document.getElementById("image-container").innerHTML = "<img src='" + screenshot.dataUrl + "'>";
        document.querySelector("meta[property='og:image']").content = screenshot.dataUrl;
        imageFilterComponent.applyImage(screenshot.data);
      })
      .catch(function(err) {
        console.log(err);
      });
  });

});