define([
  "esri/core/Accessor",
  "app/imageFilters"
], function(Accessor, imageFilters) {

  const filters = ["NONE", "OIL", "SEPIA", "DESATURATE",  "PIXEL"];

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
        callback(this.__images[value]);
      }.bind(this));
    },

    applyImage(screenshot) {

      this.__activeFilter = "NONE";

      for (let i = 0; i < filters.length; i++) {
        const imageData = screenshot.data;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = imageData.height;
        canvas.width = imageData.width;
        let clonedImageData = Object.assign(imageData, {});
        const filteredImageData = this.__getFilteredImage(filters[i], clonedImageData);
        context.putImageData(filteredImageData, 0, 0);
        this.__buttons[filters[i]].style.backgroundImage = "url(" + canvas.toDataURL() + ")";
        this.__images[filters[i]] = canvas.toDataURL();
      }

    },

    __getFilteredImage(filter, imageData) {
      let filteredImageData = imageData;
      switch (filter) {
        case "DESATURATE":
          filteredImageData = imageFilters.desaturate(imageData);
          break;
        case "SEPIA":
          filteredImageData = imageFilters.sepia(imageData);
          break;
        case "OIL":
        filteredImageData = imageFilters.oil(imageData);
          break;
        case "PIXEL":
          filteredImageData = imageFilters.pixel(imageData);
          break;
        }
        return filteredImageData;
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
  })

  return ImageFilterComponent;

});