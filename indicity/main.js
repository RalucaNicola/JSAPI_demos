require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/widgets/Legend",
  "esri/renderers/smartMapping/statistics/summaryStatistics",
  "utils",
  "dojo/domReady!"
], function (
  WebScene,
  SceneView,
  Legend,
  summaryStatistics,
  utils
) {

    const webscene = new WebScene({
      portalItem: {
        id: "804f91d0219c40f3a6049e6f946e9859"
      }
    });

    const view = new SceneView({
      map: webscene,
      container: "viewDiv"
    });

    view.ui.empty("top-left");

    const legend = new Legend({
      view: view,
      container: "legend"
    });

    view.when(function () {

      const buildingsLayer = webscene.layers.filter(function (layer) {
        return (layer.title === "NYC Enriched SampleData");
      }).getItemAt(0);

      buildingsLayer.title = "Construction year";

      summaryStatistics({
        layer: buildingsLayer,
        field: "HEIGHTROOF"
      })
        .then((result) => {
          const min = parseInt(result.min);
          const max = parseInt(result.max + 1);
          const countTotal = result.count;

          const slider = utils.createSlider(min, max);

          slider.on("update", function (values) {

            buildingsLayer.definitionExpression =
              `HEIGHTROOF >= ${values[0]} AND HEIGHTROOF <= ${values[1]}`;

            buildingsLayer.queryFeatureCount().then(function (countFilter) {
              document.getElementById("counts").innerHTML = `<span id="countFilter">${countFilter}</span>/
              <span id="countTotal">${countTotal}</span>`;
            });
          });
        })
        .otherwise((err) => {
          console.log(err);
        });

      function getTitle(result) {
        const graphic = result.graphic;
        if (graphic.attributes.NAME && graphic.attributes.NAME !== " ") {
          return graphic.attributes.NAME;
        } else {
          return "Building";
        }
      }

      buildingsLayer.popupTemplate = {
        title: getTitle,
        content: `The building was built in {CNSTRCT_YR}
      and is {HEIGHTROOF} feet tall.`
      };

      function startTour(slideId) {

        const slides = view.map.presentation.slides;
        const slide = slides.getItemAt(slideId);
        const title = document.getElementById("title");
        title.innerHTML = slide.title.text;

        slide.applyTo(view, {
          duration: 4000
        })
          .then(function () {
            window.setTimeout(function () {
              slideId++;
              if (slideId < slides.length) {
                startTour(slideId);
              } else {
                view.environment = webscene.initialViewProperties.environment;
                view.goTo(webscene.initialViewProperties.viewpoint);
                title.innerHTML = "";
              }
            }, 5000);
          });
      }

      document.getElementById("start-tour").addEventListener("click", function () {
        if (view.map.presentation.slides.length > 0) {
          startTour(0);
        }
      });
    });
  });