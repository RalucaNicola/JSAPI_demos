define([], function() {
  var swiper;
  function setTopViewSize() {
    document.getElementById("viewTop").style.width = document.getElementById("containerBottom").clientWidth + "px";
  }

  function changeSwipePosition(evt) {
    evt.preventDefault();
    if (evt.clientX && (evt.clientX < document.getElementById("containerBottom").clientWidth - 30) && (evt.clientX > 30)) {
      swiper.style.left = evt.clientX + "px";
      document.getElementById('containerTop').style.right = (document.getElementById("containerBottom").clientWidth - evt.clientX) + "px";
    }
  }

  function addDragEvent(swiper) {

    swiper.addEventListener('mousedown', function(evt) {
      evt.preventDefault();
      document.addEventListener('mousemove', changeSwipePosition);
    });

    swiper.addEventListener('mouseup', function(evt) {
      document.removeEventListener('mousemove', changeSwipePosition);
    });

  }

  function initSwipeDiv() {

    // create swipe DOM element
    swiper = document.createElement("div");
    swiper.setAttribute("id", "swipe");
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
      window.addEventListener('resize', setTopViewSize);
      initSwipeDiv();
    }
  }
});
