define([], function() {

  var mqMobilePortrait = window.matchMedia('(max-width: 419px)');
  var mqMobileLandscape = window.matchMedia('(min-width: 420px) and (max-width: 1023px)');
  var mqDesktop = window.matchMedia('(min-width: 1024px)');

  function handleWidthChange() {
    console.log(_getCurrentMedia());
  }

  function _getCurrentMedia() {
    if (mqMobilePortrait.matches) {
      return 'mobilePortrait';
    } else if (mqMobileLandscape.matches) {
      return 'mobileLandscape';
    } else {
      return 'desktop';
    }
  }

  return {
    addListener: function(fn) {
      mqMobileLandscape.addListener(fn);
      fn(mqMobileLandscape);
    },

    getCurrentMedia: _getCurrentMedia
  }
})