
require([
  "esri/Map",
  "esri/Color",
  "esri/views/SceneView",
  "esri/request",
  "esri/Graphic",
  "esri/geometry/Multipoint",
  "esri/geometry/Point",
  "esri/geometry/Mesh",
  "esri/geometry/support/MeshComponent",
  "esri/geometry/SpatialReference",
  "esri/core/promiseUtils",
  "esri/layers/ElevationLayer",
  "lib/poly2tri",
  "lib/font",
  "lib/fontmesh"
],
  function (
    Map, Color, SceneView, esriRequest, Graphic, Multipoint, Point, Mesh, MeshComponent,
    SpatialReference, promiseUtils, ElevationLayer, poly2tri, font, fontmesh
  ) {

    // create elevation layer for sampling height info
    const elevationLayer = new ElevationLayer({
      url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
    });

    const map = new Map({
      basemap: null,
      ground: {
        opacity: 1,
        surfaceColor: [255, 255, 255]
      },
    });

    const view = new SceneView({
      container: "viewDiv",
      map: map,
      camera: {
        position: [
          12.22138882,
          44.54141788,
          219169.06162
        ],
        heading: 313.30,
        tilt: 62.01
      },
      qualityProfile: "high",
      environment: {
        background: {
          type: "color",
          color: [255, 255, 255]
        },
        lighting: {
          directShadowsEnabled: true,
          ambientOcclusionEnabled: true
        },
        starsEnabled: false,
        atmosphereEnabled: false
      },
      spatialReference: SpatialReference.WebMercator
    });

    window.view = view;

    const urls = [
      "./data/switzerland-simplified.json",
      "./data/steinerPoints.json"
    ];

    const exaggerationFactor = 4;

    function getData(urls) {
      const requests = [];
      urls.forEach(function (url) {
        const request = esriRequest(url, {
          responseType: "json"
        });
        requests.push(request);
      });
      return promiseUtils.eachAlways(requests);
    }

    getData(urls).then(function (response) {
      let features;
      let innerPoints;
      // extract polygon
      if (response[0].value) {
        features = response[0].value.data.features;
      }
      // extract inner points used for triangulation
      if (response[1].value) {
        innerPoints = response[1].value.data.features;
      }

      let polygon = null;
      if (features[0].geometry.type === "Polygon") {
        polygon = features[0].geometry;
      }

      if (polygon && innerPoints) {
        const tin = generateTIN(polygon, innerPoints);

        enhanceVerticesWithZValues(tin.vertices, exaggerationFactor)
          .then(function (vertices) {
            const flatPosition = [].concat.apply([], vertices);

            const color = vertices.map(function (vertex) {
              return getColorFromHeight(vertex[2] / exaggerationFactor);
            });
            const flatColor = [].concat.apply([], color);

            const faces = tin.triangles.map(function (t) {
              const points = t.getPoints();
              return points.map(function (p) {
                return p.vertexId;
              })
            });
            const flatFaces = [].concat.apply([], faces);

            const meshComponent = new MeshComponent({
              faces: flatFaces,
              shading: "flat"
            });

            const mesh = new Mesh({
              components: [meshComponent],
              vertexAttributes: {
                position: flatPosition,
                color: flatColor
              }
            });

            const graphic = new Graphic({
              geometry: mesh,
              symbol: {
                type: "mesh-3d",
                symbolLayers: [{ type: "fill"}]
              }
            });

            view.graphics.add(graphic);

          })
          .catch(console.error);
      } else {
        console.log("Incorrect input: not a polygon");
      }

      generateWall(polygon);
    })
      .catch(console.error);

    function generateWall(polygon) {

      const contour = [];
      const wallFaces = [];
      polygon.coordinates[0].forEach(function (coords) {
        contour.push({ x: coords[0], y: coords[1] });
      });

      enhanceVerticesWithZValues(contour, exaggerationFactor)
        .then(function(result) {
          const vertices = result;

          for (let i = 0; i < contour.length - 1; i++) {
            const vIdx1 = i;
            const vIdx2 = i + 1;

            const vIdx3 = contour.length + i;
            const vIdx4 = contour.length + i + 1;


            if (i === 0) {
              vertices.push([contour[vIdx1].x, contour[vIdx1].y, -100]);
            }
            vertices.push([contour[vIdx2].x, contour[vIdx2].y, -100]);
            wallFaces.push(vIdx1, vIdx2, vIdx3, vIdx3, vIdx4, vIdx2);

          }
          const meshComponent = new MeshComponent({
            faces: wallFaces,
            shading: "flat"
          });

          const mesh = new Mesh({
            components: [meshComponent],
            vertexAttributes: {
              position: [].concat.apply([], vertices)
            }
          });

          const graphic = new Graphic({
            geometry: mesh,
            symbol: {
              type: "mesh-3d",
              symbolLayers: [{ type: "fill", material: {color: [255, 255, 255, 0.8]} }]
            }
          });

          view.graphics.add(graphic);
        })


    }

    function getColorFromHeight(value) {

      // The color ramp used for interpolation.
      // Colors are set based on the elevation values, for example
      // the color white is used for 1900m and higher.
      const stops = [
        { value: 1000, color: new Color('#CAD550') },
        { value: 1300, color: new Color('#efb26e') },
        { value: 3000, color: new Color('#ffffff') }
      ];
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];

        if (value < stop.value) {
          if (i === 0) {
            const color = stop.color;
            return [color.r, color.g, color.b, 255]
          }

          const prev = stops[i - 1];

          const weight = (value - prev.value) / (stop.value - prev.value);
          const color = Color.blendColors(prev.color, stop.color, weight);
          return [color.r, color.g, color.b, 255];
        }
      }

      const color = stops[stops.length - 1].color;
      return [color.r, color.g, color.b, 255];
    }

    function generateTIN(polygon, innerPoints) {

      let vertices = [];

      const steinerPoints = innerPoints.map(function (point) {
        const coords = point.geometry.coordinates;
        vertexId = vertices.length;
        vertices.push({ x: coords[0], y: coords[1], vertexId });
        return { x: coords[0], y: coords[1], vertexId };
      });

      const rings = polygon.coordinates.map(function (ring) {
        const ringCoords = ring.map(function (coords) {
          vertexId = vertices.length;
          vertices.push({ x: coords[0], y: coords[1], vertexId });
          return { x: coords[0], y: coords[1], vertexId };
        });
        // poly2tri takes as an input the polyline and not a polygon
        // so we remove the last coordinate which is the same as the first one
        ringCoords.pop();
        return ringCoords;
      });

      const outerRing = rings.shift();

      const sweepContext = new poly2tri.SweepContext(outerRing, { cloneArrays: true });
      sweepContext.addPoints(steinerPoints);
      sweepContext.triangulate();

      const triangles = sweepContext.getTriangles();
      return {
        triangles,
        vertices
      };
    }

    function enhanceVerticesWithZValues(vertices, exaggerationFactor) {

      const points = vertices.map(function (v) {
        return [v.x, v.y];
      });

      const multipoint = new Multipoint({ points });

      return elevationLayer.queryElevation(multipoint)
        .then(function (result) {
          return result.geometry.points.map(function (p) {
            return [p[0], p[1], p[2] * exaggerationFactor];
          });
        })
        .catch(console.error);
    }

    let graphic = null;

    font
    .create("./assets/Anton-Regular.ttf")
    .then(font => {
      const origin = new Point({
        latitude: 47.920832,
        longitude: 7.930602,
        z: -500,
        spatialReference: { wkid: 4326 }
      });
      const text = "S W I T Z E R L A N D";

      const fullMesh = fontmesh.fromString(font, text, origin, { size: 20000, alignment: { x: "center" } });

      function makeGraphic(s, vangle) {
        if (vangle == null) {
          vangle = 90;
        }

        if (graphic) {
          view.graphics.remove(graphic);
        }

        const mesh =
          s === text ? fullMesh : fontmesh.fromString(font, s, origin, { size: 20000, alignment: { x: "center" } });

        // Rotate so it stands up
        mesh.rotate(vangle, 0, 10, { origin });

        graphic = new Graphic({
          geometry: mesh,
          symbol: {
            type: "mesh-3d",
            symbolLayers: [
              {
                type: "fill",
                material: { color: "#eee" }
              }
            ]
          }
        });

        view.graphics.add(graphic);
      }

      makeGraphic(text);
    })
    .catch(err => {
      console.error(err);
    });

  });
