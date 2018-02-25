define(["require", "exports", "nouislider"], function (require, exports, nouislider) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HeightSliderComponent {
        constructor(container, app, dataComponent) {
            let heightProp = dataComponent.getHeightProperties();
            const min = parseInt(heightProp.minHeight);
            const max = parseInt(heightProp.maxHeight);
            let heightSlider = document.getElementById(container);
            nouislider.create(heightSlider, {
                start: [min, max],
                range: {
                    'min': min,
                    'max': max
                },
                step: 5,
                connect: true,
                orientation: 'vertical',
                direction: 'rtl',
                tooltips: true,
                pips: {
                    mode: 'range',
                    density: 10
                }
            });
            heightSlider.noUiSlider.on('update', function (values) {
                let intValues = values.map((value) => parseInt(value));
                app.handleAction('heightChanged', intValues);
            });
        }
    }
    exports.HeightSliderComponent = HeightSliderComponent;
});
