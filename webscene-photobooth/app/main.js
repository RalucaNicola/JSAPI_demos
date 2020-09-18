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
  view.ui.add("attribution-div", "bottom-right");

  view.when(function() {
    document.getElementById("image-title").innerHTML = webscene.portalItem.title;
  });

  let imageFilterComponent = new ImageFilterComponent("filters");
  imageFilterComponent.onFilterChange(function(dataUrl, filterType) {
    document.getElementById("image-container").innerHTML = "<img src='" + dataUrl + "'>";
    document.getElementById("download-btn").onclick = function() {
      const info = "-" + filterType.toLowerCase();
      if (filterType === "-none") {
        info = "";
      }
      downloadImage(webscene.portalItem.title + info  + ".png", dataUrl);
    }
  });

  const screenshotButton = document.getElementById("screenshot-btn");
  screenshotButton.addEventListener("click", function() {
    view.takeScreenshot({ width: 350, height: 300 })
      .then(function(screenshot) {
        document.getElementById("image-container").innerHTML = "<img src='" + screenshot.dataUrl + "'>";
        document.getElementById("download-btn").classList.remove("hide");
        imageFilterComponent.applyImage(screenshot.data);
      })
      .catch(function(err) {
        console.log(err);
      });
  });

});

function downloadImage(filename, dataUrl) {

  // the download is handled differently in Microsoft browsers
  // because the download attribute for <a> elements is not supported
  if (!window.navigator.msSaveOrOpenBlob) {

    // in browsers that support the download attribute
    // a link is created and a programmatic click will trigger the download
    const element = document.createElement("a");
    element.setAttribute("href", dataUrl);
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  else {
    // for MS browsers convert dataUrl to Blob
    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0]
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], {type: mimeString});

    // download file
    window.navigator.msSaveOrOpenBlob(blob, filename);
  }

}
