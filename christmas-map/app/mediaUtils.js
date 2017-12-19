define([], function() {

  var mqMobilePortrait = window.matchMedia('(max-width: 419px)');
  var mqMobileLandscape = window.matchMedia('(min-width: 420px) and (max-width: 1023px)');

  return {
    addListener: function(fn) {
      mqMobileLandscape.addListener(fn);
      fn(mqMobileLandscape);
    },

    getCurrentMedia: function() {
      if (mqMobilePortrait.matches) {
        return 'mobilePortrait';
      } else if (mqMobileLandscape.matches) {
        return 'mobileLandscape';
      } else {
        return 'desktop';
      }
    }
  };
});