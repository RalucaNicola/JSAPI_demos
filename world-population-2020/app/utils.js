define(["nouislider"], function(nouislider) {

  return {
    createSlider: function(min, max) {
      var populationSlider = document.getElementById("populationSlider");

      nouislider.create(populationSlider, {
        start: [min, max],
        range: {
          'min': min,
          'max': max
        },
        connect: true,
        orientation: 'horizontal',
        tooltips: true,
        format: {
          to: function(value) {
            return parseInt(Math.exp(value)).toLocaleString() + " pers/unit";
          },
          from: function (value) {
            return value;
          }
        }
      });

      return populationSlider.noUiSlider;
    }
  }

})
