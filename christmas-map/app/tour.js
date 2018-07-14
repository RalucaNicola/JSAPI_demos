define(['app/handleChange'], function (handleChange) {

  return {
    init: function (id, store) {

      var container = document.getElementById(id);

      container.addEventListener('click', function () {
        var state = store.getState();
        if (state.onTour) {
          store.dispatch({ type: 'TOUR STOPPED' });
        }
        else {
          store.dispatch({ type: 'TOUR STARTED' });
        }
      }.bind(this));


      var handleTour = handleChange(store.getState, 'onTour');

      store.subscribe(handleTour(function (newVal, oldVal, property) {
        if (newVal) {
          container.innerHTML = 'Pause tour';
          startTour();
        }
        if (oldVal) {
          container.innerHTML = 'Take a tour';
          stopTour();
        }
      }
      ));

      function goToFeature(graphic) {
        var timeout = window.setTimeout(function() {
          var state = store.getState();
          goToFeature(state.graphics[graphic.attributes.ObjectID + 1]);
        }.bind(this), 15000);
        store.dispatch({
          type: 'SELECT COUNTRY',
          selected: graphic,
          timeout: timeout
        });
      }

      function startTour() {
        var state = store.getState();
        var currentId = state.selected ? state.selected.attributes.ObjectID + 1 : 0;
        goToFeature(state.graphics[currentId]);
      }

      function stopTour() {
        var state = store.getState();
        clearTimeout(state.timeout);
      }
    }

  };
});