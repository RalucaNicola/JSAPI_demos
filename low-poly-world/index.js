require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/request",
  "esri/tasks/QueryTask",
  "esri/Graphic",
  "esri/geometry/Polygon",
  "esri/geometry/Mesh",
  "esri/geometry/support/MeshMaterialMetallicRoughness",
  "esri/geometry/support/MeshComponent",
  "esri/core/promiseUtils",
  "esri/layers/GraphicsLayer",
  "lib/poly2tri"
], function(
  Map,
  SceneView,
  esriRequest,
  QueryTask,
  Graphic,
  Polygon,
  Mesh,
  MeshMaterialMetallicRoughness,
  MeshComponent,
  promiseUtils,
  GraphicsLayer,
  poly2tri
) {

  const random = new Math.seedrandom("map-lowpoly");

  const meshLayer = new GraphicsLayer();

  const equalEarth = {
    wkid: 54035
  };

  const map = new Map({
    layers: [meshLayer],
    ground: {
      opacity: 0
    },
  });

  const view = new SceneView({
    container: "viewDiv",
    map: map,
    camera: {
      position: {
        x: 1536849.38227,
        y: 433810.41887,
        z: 34620859.616,
        spatialReference: 54035
      },
      heading: 0.00,
      tilt: 0.50
    },
    viewingMode: "local",
    alphaCompositingEnabled: true,
    qualityProfile: "high",
    environment: {
      background: {
        type: "color",
        color: [0, 0, 0, 0]
      },
      lighting: {
        directShadowsEnabled: true
      },
      starsEnabled: false,
      atmosphereEnabled: false
    },
    spatialReference: equalEarth,
    constraints: {
      tilt: {
        max: 20
      }
    },
  });

  window.view = view;

  const generalizedWorldUrl = "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/generalizedworldequalearth/FeatureServer/0";
  const queryTask = new QueryTask({
    url: generalizedWorldUrl
  });

  promiseUtils.eachAlways([
    queryTask.execute({where: "1=1", returnGeometry: true}),
    esriRequest("./data/randompointequalearth.json", {responseType: "json"})
  ])
  .then(function(results) {

    let steinerPoints = {};
    results[1].value.data.features.forEach(function(feature) {
      const fid = feature.properties.FID_1;
      if (steinerPoints[fid]) {
        steinerPoints[fid].push(feature.geometry.coordinates);
      } else {
        steinerPoints[fid] = [feature.geometry.coordinates]
      }
    });

    results[0].value.features.forEach(function(feature) {

      const fid = feature.attributes.FID_1;
      const innerPoints = null ? !steinerPoints[fid] : steinerPoints[fid];
      const tin = generateTIN(feature.geometry, innerPoints);

      // only for debugging
      //_displayTriangles(tin.triangles)

      const vertices = tin.vertices.map(function(vertex) {
        return [vertex.x, vertex.y, 200000 + random() * 700000]
      })

      const flatPosition = [].concat.apply([], vertices);

      const faces = tin.triangles.map(function(t) {
        const points = t.getPoints();
        return points.map(function(p) {
          return p.vertexId;
        });
      });
      const flatFaces = [].concat.apply([], faces);

      const meshComponent = new MeshComponent({
        faces: flatFaces,
        shading: "flat",
        material: new MeshMaterialMetallicRoughness({
          color: "#b0c930",
          metallic: 0.3,
          roughness: 0.8,
          doubleSided: true
        })
      });

      const mesh = new Mesh({
        components: [meshComponent],
        vertexAttributes: {
          position: flatPosition
        },
        spatialReference: equalEarth
      });

      const graphic = new Graphic({
        geometry: mesh,
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{ type: "fill" }]
        }
      });

      meshLayer.add(graphic);
    });
  });

  function generateTIN(polygon, innerPoints) {
    let vertices = [];
    let steinerPoints = null;

    if (innerPoints) {
      steinerPoints = innerPoints.map(function(coords) {
        vertexId = vertices.length;
        vertices.push({ x: coords[0], y: coords[1], vertexId });
        return { x: coords[0], y: coords[1], vertexId };
      });
    }

    const outerRing = polygon.rings[0].map(function(coords) {
      vertexId = vertices.length;
      vertices.push({ x: coords[0], y: coords[1], vertexId });
      return { x: coords[0], y: coords[1], vertexId };
    });
    // poly2tri takes as an input the polyline and not a polygon
    // so we remove the last coordinate which is the same as the first one
    outerRing.pop();
    vertices.pop();

    const sweepContext = new poly2tri.SweepContext(outerRing, { cloneArrays: true });
    if (steinerPoints) {
      sweepContext.addPoints(steinerPoints);
    }
    sweepContext.triangulate();

    const triangles = sweepContext.getTriangles();
    return {
      triangles,
      vertices
    };
  }

  // this is just for debugging whether the triangles get created correctly or not :)
  function _displayTriangles(triangles) {
    triangles.forEach(function(t) {
      points = t.getPoints().map(function(p) {
        return [p.x, p.y];
      });
      points.push(points[0]);
      const polygon = new Polygon({rings: [points], spatialReference: equalEarth});

      const graphic = new Graphic({
        geometry: polygon,
        symbol: {
          type: "polygon-3d",
          symbolLayers: [
            {
              type: "fill",
              material: {
                color: [0, 0, 0, 0]
              },
              outline: {
                color: "red",
                size: 1
              }
            }
          ]
        }
      });

      view.graphics.add(graphic);
    });
  }
});
