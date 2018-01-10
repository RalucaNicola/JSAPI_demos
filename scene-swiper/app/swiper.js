define([], function() {
  var swiper;
  function setTopViewSize() {
    document.getElementById("viewTop").style.width = document.getElementById("containerBottom").clientWidth + "px";
  }

  function changeSwipePosition(positionX) {
    swiper.style.left = positionX + "px";
  }

  function positionChanged(evt) {
    evt.preventDefault();
    if (evt.clientX && (evt.clientX < document.getElementById("containerBottom").clientWidth - 30) && (evt.clientX > 30)) {
      changeSwipePosition(evt.clientX);
      document.getElementById('containerTop').style.right = (document.getElementById("containerBottom").clientWidth - evt.clientX) + "px";
    }
  }

  function addDragEvent(swiper) {

    swiper.addEventListener('pointerdown', function(evt) {
      evt.preventDefault();
      document.addEventListener('pointermove', positionChanged);
    });

    swiper.addEventListener('pointerup', function(evt) {
      document.removeEventListener('pointermove', positionChanged);
    });

  }

  function initSwipeDiv() {

    // create swipe DOM element
    swiper = document.createElement("div");
    swiper.setAttribute("id", "swipe");
    swiper.setAttribute("touch-action", "none");
    // optional - attach an image to it, so users know they can drag
    var swipeImage = document.createElement("img");
    swipeImage.setAttribute("src", "./images/swipe-symbol.png");
    swipeImage.setAttribute("alt", "swipe symbol");
    swiper.appendChild(swipeImage);

    // attach swipe to the body
    document.body.appendChild(swiper);

    // add mouse events to mimic dragging the swipe
    addDragEvent(swiper);

  }

  return {
    init: function() {
      setTopViewSize();
      window.addEventListener('resize', function() {
        setTopViewSize();
        var containerTopSize = document.getElementById("containerTop").clientWidth;
        changeSwipePosition(containerTopSize);
      });
      initSwipeDiv();
    }
  }
});
