define(['redux'], function(Redux){

  return {
    initStore: function() {
      var reducer = function(state, action) {

        if (typeof state === 'undefined') {
          return { selected: null, onTour: false };
        }

        switch (action.type) {
          case 'SELECT COUNTRY':
            return {
              ...state,
              selected : action.selected
            }
            break;
          case 'TOUR STARTED':
            return {
              ...state,
              onTour: true
            }
            break;
          case 'TOUR STOPPED':
            return {
              ...state,
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