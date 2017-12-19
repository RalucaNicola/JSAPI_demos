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
            return Object.assign(state, {
              selected : action.selected,
              timeout: action.timeout || null
            });
          case 'TOUR STARTED':
            return Object.assign(state, {
              onTour: true
            });
          case 'TOUR STOPPED':
            return Object.assign(state, {
              onTour: false
            });
          case 'MEDIA CHANGED':
            return Object.assign(state, {
              currentMedia: action.currentMedia
            });
          default:
            return state;
        }
      };

      return Redux.createStore(reducer);
    }
  };
});