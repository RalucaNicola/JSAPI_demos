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
        console.log(newVal, oldVal);
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

      function startTour() {
        // todo: functionality to start the tour
      }

      function stopTour() {
        // todo: functionality to stop the tour
      }
    }

  }
})