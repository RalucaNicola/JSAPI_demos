// this is a simplified version of https://github.com/jprichardson/redux-watch
// Copyright (c) JP Richardson

define([], function () {

  function compare(a, b) {
    return a === b;
  }

  return function (getState, property) {
    var currentValue = getState()[property];
    return function w(fn) {
      return function () {
        var newValue = getState()[property];
        if (!compare(currentValue, newValue)) {
          var oldValue = currentValue;
          currentValue = newValue;
          fn(newValue, oldValue, property);
        }
      };
    };
  };

});