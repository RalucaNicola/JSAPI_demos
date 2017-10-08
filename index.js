// require the module as normal
var bs = require("browser-sync").create('demos-server');

// .init starts the server
bs.init({
    server: "./bond-james-bond"
});

var bs = require("browser-sync").get('demos-server');

// Now call methods on bs
bs.watch('./bond-james-bond/*').on('change', bs.reload);