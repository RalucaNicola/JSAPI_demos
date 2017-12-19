define(['redux'], function(Redux){

  return {
    initStore: function(graphics) {
      var reducer = function(state, action) {

        if (typeof state === 'undefined') {
          return {
            selected: null,
            timeout: null,
            onTour: false,
            graphics: graphics,
            currentMedia: null
          };
        }

        switch (action.type) {
          case 'SELECT COUNTRY':
            return {
              ...state,
              selected : action.selected,
              timeout: action.timeout || null
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
          case 'MEDIA CHANGED':
            return {
              ...state,
              currentMedia: action.currentMedia
            }
          default:
            return state;
        }
      }

      return Redux.createStore(reducer);
    }
  }


});