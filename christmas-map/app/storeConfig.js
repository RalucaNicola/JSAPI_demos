define(['redux'], function(Redux){

  return {
    initStore: function() {
      var reducer = function(state, action) {

        if (typeof state === 'undefined') {
          return { selected: null, onTour: false, lastAction: null};
        }

        switch (action.type) {
          case 'SELECT COUNTRY':
            return {
              ...state,
              selectionChanged: true,
              selected : action.selected
            }
            break;
          case 'TOUR STARTED':
            return {
              ...state,
              selectionChanged: false,
              onTour: true
            }
            break;
          case 'TOUR STOPPED':
            return {
              ...state,
              selectionChanged: false,
              onTour: false
            }
            break;
          default:
            return state;
        }
      }

      return Redux.createStore(reducer);
    }
  }


});