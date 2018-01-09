define([], function() {

  function setTopViewSize() {
    document.getElementById("viewTop").style.width = `${document.getElementById("containerBottom").clientWidth}px`;
  }

  return {
    init: function() {
      setTopViewSize();
      window.addEventListener('resize', setTopViewSize);
    }
  }
});
