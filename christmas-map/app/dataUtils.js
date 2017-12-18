define(["esri/request", "esri/geometry/Point"], function(esriRequest, Point) {

  return {
    loadData: function(url) {
      return esriRequest(url, {
        responseType: "json"
      }).then(function(response){
        return response.data;
      });
    },

    convertToGraphics: function(data) {
      return data.map(function(feature, index) {
        return {
          geometry: new Point({
            longitude: feature.longitude,
            latitude: feature.latitude,
            spatialReference: {
              wkid: 102100
            }
          }),
          // select only the attributes you care about
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
        }
      });
    }

  }




});