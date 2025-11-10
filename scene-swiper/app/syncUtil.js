// small utility for synchronizing 2 views
// based on code from sample: https://developers.arcgis.com/javascript/latest/sample-code/sandbox/index.html?sample=views-synchronize

define(["esri/core/reactiveUtils"], function(reactiveUtils) {

  function _syncViews(view1, view2) {
    var viewpointWatchHandle;
    var interactWatcher;
    var scheduleId;

    function clear() {
      viewpointWatchHandle && viewpointWatchHandle.remove();
      viewStationaryHandle && viewStationaryHandle.remove();
      scheduleId && clearTimeout(scheduleId);
      viewpointWatchHandle = viewStationaryHandle = scheduleId = null;
    }

    interactWatcher = reactiveUtils.watch(() => view1.interacting || view1.animation, function(newValue) {
      if (!newValue) {
        return;
      }

      if (viewpointWatchHandle || scheduleId) {
        return;
      }

      scheduleId = setTimeout(function() {
        scheduleId = null;
        viewpointWatchHandle = reactiveUtils.watch(() => view1.viewpoint,
          function(newValue) {
            view2.viewpoint = newValue;
          });
      }, 0);

      viewStationaryHandle = reactiveUtils.when(() => view1.stationary,
        clear);

    });

  }

  return {
    syncViews: function(view1, view2) {
      _syncViews(view1, view2);
      _syncViews(view2, view1);
    }
  }
});
