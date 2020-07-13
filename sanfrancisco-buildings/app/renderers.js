define([
  "app/config"
], function (
  config
) {

  return {
    applyYearRenderer: function (layer) {

      classBreakInfos = config.yearClasses.map(function (element) {
        return {
          minValue: element.minYear,
          maxValue: element.maxYear,
          symbol: {
            type: "mesh-3d",
            symbolLayers: [{
              type: "fill",
              material: {
                color: element.color,
                colorMixMode: "replace"
              },
            }]
          }
        }
      })

      layer.renderer = {
        type: "class-breaks",
        field: config.yearField,
        defaultSymbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: {
              color: config.noDataColor,
              colorMixMode: "replace"
            },
          }]
        },
        classBreakInfos: classBreakInfos
      }
    },

    applyHeightRenderer: function (layer) {
      layer.renderer = {
        type: "simple",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: { color: config.noDataColor, colorMixMode: "replace" },
          }]
        },
        visualVariables: [{
          type: "color",
          field: config.heightField,
          legendOptions: {
            title: "Height of the buildings"
          },
          stops: config.heightVariable.stops
        }]
      }
    },

    applyUsageRenderer: function (layer) {

      const uniqueValueInfos = config.usageValues.map(function (element) {
        return {
          value: element.value,
          symbol: {
            type: "mesh-3d",
            symbolLayers: [{
              type: "fill",
              material: { color: element.color, colorMixMode: "replace" }
            }]
          },
          label: element.label
        }
      });

      layer.renderer = {
        type: "unique-value",
        field: config.usageField,
        defaultSymbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: { color: config.otherColor, colorMixMode: "replace" },
          }]
        },
        uniqueValueInfos: uniqueValueInfos
      }
    },
    applyOriginalTexture: function (layer) {
      layer.renderer = {
        type: "simple",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: null
          }]
        }
      }
    }
  }

});
