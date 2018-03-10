define(["nouislider"], function(nouislider) {

  return {
    createSlider: function(min, max) {
      var heightSlider = document.getElementById("height-chart");

      nouislider.create(heightSlider, {
        start: [min, max],
        range: {
          'min': min,
          'max': max
        },
        step: 10,
        connect: true,
        orientation: 'vertical',
        direction: 'rtl',
        tooltips: true,
        pips: {
          mode: 'range',
          density: 10
        }
      });

      return heightSlider.noUiSlider;
    }
  }

})
