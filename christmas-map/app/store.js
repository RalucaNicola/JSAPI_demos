define(['redux'], function(Redux){

  return {
    init: function() {
      var stateManager = function(state = { selected: null, onTour: false, lastAction: null}, action) {
        switch (action.type) {
          case 'SELECT COUNTRY':
            return {
              ...state,
              lastAction: action.type,
              selected : action.selected
            }
            break;
          case 'TOUR STARTED':
            return {
              ...state,
              lastAction: action.type,
              onTour: true
            }
            break;
          case 'TOUR STOPPED':
            return {
              ...state,
              lastAction: action.type,
              onTour: false
            }
            break;
        }
      }

      return Redux.createStore(stateManager);
    }
  }


});