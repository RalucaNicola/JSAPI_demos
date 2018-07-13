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
        step: 10,
        connect: true,
        orientation: 'horizontal',
        tooltips: true
      });

      return populationSlider.noUiSlider;
    }
  }

})
