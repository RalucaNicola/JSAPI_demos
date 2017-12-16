define([], function() {
  return {
    init: function(id, store) {
      var container = document.getElementById(id);

      container.addEventListener('click', function() {
        var state = store.getState();
        if (state.onTour) {
        store.dispatch({type: 'TOUR STOPPED'});
        container.innerHTML = 'Take a tour';
        }
        else {
          store.dispatch({type: 'TOUR STARTED'});
          container.innerHTML = 'Pause tour';
        }
      }.bind(this));
    }

  }
})