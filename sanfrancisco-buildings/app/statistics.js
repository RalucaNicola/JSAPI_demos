define(["app/config", "app/utils"], function (config, appUtils) {

  function generateHeightStatistics() {
    const heightBins = appUtils.heightBins;
    return heightBins.map(function (element) {
      return {
        onStatisticField:
          element.statsField,
        outStatisticFieldName: element.fieldName,
        statisticType: "sum"
      }
    })
  }
  const heightStatDefinitions = generateHeightStatistics();

  function generateYearStatistics() {
    return config.yearClasses.map(function (element) {
      const min = element.minYear;
      const max = element.maxYear;

      return {
        onStatisticField:
          `CASE WHEN (${config.yearField} >= ${min} AND ${config.yearField} < ${max}) THEN 1 ELSE 0 END`,
        outStatisticFieldName: `year_${min}_${max}`,
        statisticType: "sum"
      }
    });
  }
  const yearStatDefinitions = generateYearStatistics();

  function generateUsageStatistics() {
    const types = [];
    const usageStats = config.usageValues.map(function (element) {
      types.push(element.value);
      return {
        onStatisticField:
          `CASE WHEN ${config.usageField} = '${element.value}' THEN 1 ELSE 0 END`,
        outStatisticFieldName: `usage_${element.value}`,
        statisticType: "sum"
      }
    });

    const otherStats = {
      onStatisticField:
        `CASE WHEN ${config.usageField} IN ('${types.join("', '")}') THEN 0 ELSE 1 END`,
      outStatisticFieldName: "usage_other",
      statisticType: "sum"
    }
    usageStats.push(otherStats);
    return usageStats;
  }

  const usageStatDefinitions = generateUsageStatistics();

  return {
    heightStatDefinitions,
    yearStatDefinitions,
    usageStatDefinitions,
    totalStatDefinitions: heightStatDefinitions.concat(yearStatDefinitions).concat(usageStatDefinitions)
  };
});
