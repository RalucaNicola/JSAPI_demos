// require the module as normal
var bs = require("browser-sync").create('demos-server');

// .init starts the server
bs.init({
    server: "./"
});

// Now call methods on bs
bs.watch('./*').on('change', bs.reload);
