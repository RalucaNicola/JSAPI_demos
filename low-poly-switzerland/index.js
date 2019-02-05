
require([
  "esri/Map",
  "esri/Color",
  "esri/views/SceneView",
  "esri/request",
  "esri/Graphic",
  "esri/geometry/Polygon",
  "esri/geometry/Point",
  "esri/geometry/Multipoint",
  "esri/geometry/Mesh",
  "esri/geometry/support/MeshComponent",
  "esri/core/promiseUtils",
  "esri/layers/ElevationLayer",
  "lib/poly2tri"
],
  function (
    Map, Color, SceneView, esriRequest, Graphic, Polygon, Point, Multipoint, Mesh, MeshComponent, promiseUtils, ElevationLayer, poly2tri
  ) {

    // create elevation layer for sampling height info
    const elevationLayer = new ElevationLayer({
      url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
    });

    var map = new Map({
      basemap: null,
      ground: {
        layers: [elevationLayer],
        surfaceColor: "white"
      }
    });

    var view = new SceneView({
      container: "viewDiv",
      map: map,
      camera: {
        position: [
          9.64253573,
          44.70741235,
          180278.75440
        ],
        heading: 336.18,
        tilt: 47.75
      },
      environment: {
        lighting: {
          directShadowsEnabled: true
        }
      }
    });

    window.view = view;

    const urls = [
      "./data/country.json",
      "./data/steinerPoints.json",
      "./data/pois.json"
    ];

    const exaggerationFactor = 5;

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
      // extract points of interest and connect them to 3D models
      if (response[2].value) {
        pois = response[2].value.data.features;
        generatePOIGraphics(pois);
      }
      let polygon = null;
      if (features[0].geometry.type === "Polygon") {
        polygon = features[0].geometry;
      }

      if (polygon && innerPoints) {
        const tin = generateTIN(polygon, innerPoints);

        //only for debugging
        //_displayTriangles(tin.triangles);

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
                symbolLayers: [{ type: "fill" }]
              }
            });

            view.graphics.add(graphic);

          })
          .catch(console.error);
      } else {
        console.log("Incorrect input: not a polygon");
      }
    })
      .catch(console.error);

    function getColorFromHeight(height) {

      let color;
      if (height < 1500) {
        const startColor = new Color('#CAD550');
        const endColor = new Color("#efb26e");
        color = Color.blendColors(startColor, endColor, Math.abs(height - 300) / 1500);
      } else {
        const startColor = new Color("#efb26e");
        const endColor = new Color('#ffffff');
        color = Color.blendColors(startColor, endColor, Math.abs(height - 1500) / 2000);
      }

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

      return elevationLayer.when(function () {
        return elevationLayer.queryElevation(multipoint/* , {demResolution: "finest-contiguous"} */)
          .then(function (result) {
            return result.geometry.points.map(function (p) {
              return [p[0], p[1], p[2] * exaggerationFactor];
            });
          })
          .catch(console.error);
      })
        .catch(console.error);
    }

    function generatePOIGraphics(pois) {

      const points = pois.map(function (p) {
        return p.geometry.coordinates;
      });
      const multipoint = new Multipoint({ points });
      elevationLayer.queryElevation(multipoint)
        .then(function (result) {
          const pointsWithZValues = result.geometry.points;
          pois.forEach(function (poi, index) {
            const symbol = getSymbol(poi.properties.type);
            point = pointsWithZValues[index];
            zValue = poi.properties.type === "balloon" ? 30000 : point[2] * exaggerationFactor;
            const graphic = new Graphic({
              geometry: new Point({
                longitude: point[0],
                latitude: point[1],
                z: zValue
              }),
              symbol
            });

            view.graphics.add(graphic);

            if (poi.properties.name) {
              addLabel(poi, zValue);
            }
          })
        })
        .catch(console.error);
    }

    function getSymbol(type) {
      switch (type) {
        // credit this guy: https://sketchfab.com/models/58cd53de211e4a97b6172c43b82aafca
        case "palm-tree":
          return {
            type: "point-3d",
            symbolLayers: [
              {
                type: "object",
                resource: {
                  href: "./3d-models/palm-tree/scene.gltf"
                },
                height: 10000,
                anchor: "bottom"
              }
            ]
          };
        case "tree":
          return {
            type: "point-3d",
            symbolLayers: [{
              type: "object",
              resource: {
                // The tree model was imported to Pro and published as a WebStyle
                // See details on how to do this here: http://pro.arcgis.com/en/pro-app/help/sharing/overview/share-a-web-style.htm
                href: "https://jsapi.maps.arcgis.com/sharing/rest/content/items/4418035fa87d44f490d5bf27a579e118/resources/styles/web/resource/tree.json"
              },
              height: 5000,
              heading: Math.random() * 360,
              anchor: "bottom"
            }]
          };
        case "big-city":
          return {
            type: "point-3d",
            symbolLayers: [
              {
                type: "object",
                resource: {
                  href: "./3d-models/House10.json"
                },
                height: 15000,
                anchor: "bottom"
              }
            ]
          };
        case "medium-city":
          return {
            type: "point-3d",
            symbolLayers: [
              {
                type: "object",
                resource: {
                  href: "./3d-models/House16.json"
                },
                height: 10000,
                anchor: "bottom"
              }
            ]
          };
        case "small-city":
          return {
            type: "point-3d",
            symbolLayers: [
              {
                type: "object",
                resource: {
                  href: "./3d-models/House12.json"
                },
                height: 4000,
                anchor: "bottom"
              }
            ]
          };
        // https://sketchfab.com/models/aab2c93ec4b742d999417fae2f0194e2
        case "balloon":
          return {
            type: "point-3d",
            symbolLayers: [
              {
                type: "object",
                resource: {
                  href: "./3d-models/balloon/scene.gltf"
                },
                height: 15000,
                anchor: "bottom"
              }
            ]
          };
        // https://sketchfab.com/models/0dd5290dd6fe472ba1ded81d27adcd96
        case "cow":
          return {
            type: "point-3d",
            symbolLayers: [
              {
                type: "object",
                resource: {
                  href: "./3d-models/cow/scene.gltf"
                },
                height: 10000,
                anchor: "bottom"
              }
            ]
          };
      }
    }

    function addLabel(poi, zValue) {
      let callout = null;
      if (poi.properties.type === "small-city") {
        callout = {
          type: "line", // autocasts as new LineCallout3D()
          size: 0.5,
          color: [74, 29, 109],
          border: {
            color: [255, 255, 255, 0.7]
          }
        }
      }
      var graphic = new Graphic({
        symbol: {
          type: "point-3d", // autocasts as new PointSymbol3D()
          symbolLayers: [{
            type: "text", // autocasts as new TextSymbol3DLayer()
            material: {
              color: [74, 29, 109]
            },
            halo: {
              color: [255, 255, 255, 0.7],
              size: 1
            },
            text: poi.properties.name,
            size: 10
          }],
          // Labels need a small vertical offset that will be used by the callout
          verticalOffset: {
            screenLength: 150,
            maxWorldLength: 15000,
            minWorldLength: 15000
          },
          // The callout has to have a defined type (currently only line is possible)
          // The size, the color and the border color can be customized
          callout: callout
        },
        geometry: new Point({
          longitude: poi.geometry.coordinates[0],
          latitude: poi.geometry.coordinates[1],
          z: zValue,
          spatialReference: {
            wkid: 4326
          }
        })
      });

      view.graphics.add(graphic);
    }

    // this is just for debugging whether the triangles get created correctly or not :)
    function _displayTriangles(triangles) {
      triangles.forEach(function (t) {
        points = t.getPoints().map(function (p) {
          return [p.x, p.y];
        });
        points.push(points[0]);
        const polygon = new Polygon([points]);

        const graphic = new Graphic({
          geometry: polygon,
          symbol: {
            type: "polygon-3d",
            symbolLayers: [{
              type: "fill",
              material: {
                color: [0, 0, 0, 0]
              },
              outline: {
                color: "red",
                size: 4
              }
            }]
          }
        });

        view.graphics.add(graphic);
      })
    }

  });