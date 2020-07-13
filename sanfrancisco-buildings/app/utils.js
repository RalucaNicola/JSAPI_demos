define(["app/config", "esri/Color"], function (config, Color) {

  function calculateHeightBins() {
    const bins = [];
    const stops = config.heightVariable.stops;
    const binSize = config.heightVariable.binSize;
    for (let i = stops[stops.length - 1].value; i >= stops[0].value; i -= binSize) {
      const nextValue = i + binSize;
      let fieldName = `height_${i}_${nextValue}`;
      let label = `${i} - ${nextValue}m`;
      let statsField = `CASE WHEN (${config.heightField} < ${nextValue} AND ${config.heightField} >= ${i}) THEN 1 ELSE 0 END`;
      let whereClause = `${config.heightField} < ${nextValue} AND ${config.heightField} >= ${i}`;
      if (i - binSize < stops[0].value) {
        fieldName = `height_${i}`;
        label = `< ${i}m`;
        statsField = `CASE WHEN (${config.heightField} < ${i}) THEN 1 ELSE 0 END`;
        whereClause = `${config.heightField} < ${i}`;
      }
      if (i === stops[stops.length - 1].value) {
        fieldName = `height_${i}`;
        label = `> ${i}m`;
        statsField = `CASE WHEN (${config.heightField} > ${i}) THEN 1 ELSE 0 END`;
        whereClause = `${config.heightField} > ${i}`;
      }
      bins.push({
        value: i,
        color: getColorFromValue(i).toHex(),
        statsField: statsField,
        whereClause: whereClause,
        fieldName: fieldName,
        label: label
      })
    }
    return bins;
  }

  function getColorFromValue(value) {
    const stops = config.heightVariable.stops;
    let minStop = stops[0];
    let maxStop = stops[stops.length - 1];

    let minStopValue = minStop.value;
    let maxStopValue = maxStop.value;

    if (value < minStopValue) {
      return new Color(minStop.color);
    }

    if (value > maxStopValue) {
      return new Color(maxStop.color);
    }

    const exactMatches = stops.filter(function (stop) {
      return stop.value === value;
    });

    if (exactMatches.length > 0) {
      return new Color(exactMatches[0].color);
    }

    minStop = null;
    maxStop = null;
    stops.forEach(function (stop, i) {
      if (!minStop && !maxStop && stop.value >= value) {
        minStop = stops[i - 1];
        maxStop = stop;
      }
    });

    const weightedPosition = (value - minStop.value) / (maxStop.value - minStop.value);

    return Color.blendColors(new Color(minStop.color), new Color(maxStop.color), weightedPosition);
  }
  return {
    heightBins: calculateHeightBins()
  }
})
