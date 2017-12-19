define(["esri/request", "esri/geometry/Point"], function(esriRequest, Point) {

  return {

    loadData: function(url) {
      return esriRequest(url).then(function(response){
        return response.data;
      });
    },

    convertToGraphics: function(data) {

      // convert data into graphics to use it as a source in a FeatureLayer
      var graphics = data.map(function(feature, index) {
        return {
          geometry: new Point({
            longitude: feature.longitude,
            latitude: feature.latitude,
            spatialReference: {
              wkid: 102100
            }
          }),
          attributes: {
            ObjectID: index,
            description: feature.description,
            country: feature.name,
            language: feature.language,
            wish: feature.wish,
            image: feature.image || "",
            caption: feature.caption || "",
            attribution: feature.attribution || ""
          }
        };
      });

      return graphics;
    }
  };
});
