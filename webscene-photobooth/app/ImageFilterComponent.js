define([
  "esri/core/Accessor",
  "app/imageFilters"
], function(Accessor, imageFilters) {

  const filters = ["NONE", "SEPIA", "GRAY",  "PIXEL", "EDGES", "SOLARIZE", "DIFFUSE"];

  let ImageFilterComponent = Accessor.createSubclass({

    properties: {
      __activeFilter: null
    },

    constructor: function(containerId) {
      this.__container = document.getElementById(containerId);
      this.__container.classList.add('image-filters-container');
      this.__buttons = {};
      this.__images = {};

      for (let i = 0; i < filters.length; i++) {
        let btn = this.__createButton(filters[i]);
        this.__buttons[filters[i]] = btn;
        this.__container.appendChild(btn);
      }

    },

    onFilterChange(callback) {
      this.watch("__activeFilter", function(value) {
        callback(this.__images[value], value);
      }.bind(this));
    },

    applyImage(imageData) {

      this.__activeFilter = "NONE";

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = imageData.height;
      canvas.width = imageData.width;
      for (let i = 0; i < filters.length; i++) {
        const inputData = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
        const filteredImageData = this.__getFilteredImage(filters[i], inputData);
        context.putImageData(filteredImageData, 0, 0);
        this.__buttons[filters[i]].style.backgroundImage = "url(" + canvas.toDataURL() + ")";
        this.__images[filters[i]] = canvas.toDataURL();
      }
    },

    __getFilteredImage(filter, imageData) {
      switch (filter) {
        case "GRAY":
          return imageFilters.desaturate(imageData);
        case "SEPIA":
          return imageFilters.sepia(imageData);
        case "OIL":
          return imageFilters.oil(imageData);
        case "PIXEL":
          return imageFilters.pixel(imageData);
        case "STARS":
          return imageFilters.stars(imageData);
        case "EDGES":
          return imageFilters.edges(imageData);
        case "SOLARIZE":
          return imageFilters.solarize(imageData);
        case "DIFFUSE":
          return imageFilters.diffuse(imageData);
        default:
          return imageData;
        }
    },

    __createButton(filter) {
      let btn = document.createElement("button");
      btn.classList.add('filter-btn');
      btn.classList.add('initial');
      btn.addEventListener("click", () => {
        this.__activeFilter = filter;
      });
      let title = document.createElement("span");
      let titleText = filter.toLowerCase();
      title.innerHTML = titleText.charAt(0).toUpperCase() + titleText.substr(1);
      btn.appendChild(title);
      return btn;
    }
  });

  return ImageFilterComponent;

});