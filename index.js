// require the module as normal
var bs = require("browser-sync").create('demos-server');

// .init starts the server
bs.init({
    server: "./scene-swiper"
});

// Now call methods on bs
bs.watch('./scene-swiper/app/*').on('change', bs.reload);
