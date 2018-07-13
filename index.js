// require the module as normal
var bs = require("browser-sync").create('demos-server');

// .init starts the server
bs.init({
    server: "./world-population-2020/"
});

// Now call methods on bs
bs.watch('./world-population-2020/app/*').on('change', bs.reload);
