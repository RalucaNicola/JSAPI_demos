// require the module as normal
var bs = require("browser-sync").create('demos-server');

// .init starts the server
bs.init({
    server: "./cities-globe/"
});

// Now call methods on bs
bs.watch('./cities-globe/app/*').on('change', bs.reload);
