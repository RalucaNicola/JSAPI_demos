// require the module as normal
var bs = require("browser-sync").create('demos-server');

// .init starts the server
bs.init({
    server: "./art-galleries-nyc"
});

var bs = require("browser-sync").get('demos-server');

// Now call methods on bs
bs.watch('./art-galleries-nyc/*').on('change', bs.reload);