define(["esri/widgets/TimeSlider"], function (TimeSlider) {

  return {
    createTimeSlider: function (view, config) {
      const start = new Date(config.timeline.minYear, 0, 1);
      const end = new Date(config.timeline.maxYear, 0, 1);
      const timeSlider = new TimeSlider({
        container: "timeContainer",
        view: view,
        mode: "cumulative-from-start",
        fullTimeExtent: {
          start: start,
          end: end
        },
        values: [end],
        playRate: 2000,
        stops: {
          interval: {
            value: config.timeline.bin,
            unit: "years"
          },
          timeExtent: { start, end }
        }
      });
      return timeSlider;
    }
  }
});
