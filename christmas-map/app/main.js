define(['app/store', 'app/scene', 'app/tour'], function(store, scene, tour) {

  return {
    init: function() {

      var st = store.init();
      scene.init(st);
      tour.init('tour', st);
    }
  }
})