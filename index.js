// require the module as normal
var bs = require("browser-sync").create('demos-server');

// .init starts the server
bs.init({
    server: "./world-population/"
});

// Now call methods on bs
bs.watch('./world-population/app/*').on('change', bs.reload);
