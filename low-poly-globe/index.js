require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/request",
  "esri/rest/query",
  "esri/Graphic",
  "esri/geometry/SpatialReference",
  "esri/geometry/Polygon",
  "esri/geometry/Point",
  "esri/geometry/Mesh",
  "esri/geometry/support/MeshMaterialMetallicRoughness",
  "esri/geometry/support/MeshComponent",
  "esri/core/promiseUtils",
  "esri/layers/GraphicsLayer",
  "lib/poly2tri",
  "esri/Color"
], function (
  Map,
  SceneView,
  esriRequest,
  queryTask,
  Graphic,
  SpatialReference,
  Polygon,
  Point,
  Mesh,
  MeshMaterialMetallicRoughness,
  MeshComponent,
  promiseUtils,
  GraphicsLayer,
  poly2tri,
  Color
) {

  const random = new Math.seedrandom("lowpoly");
  const R = 6378137;
  const meshOceanLayer = new GraphicsLayer({
    opacity: 0.8
  });
  const meshLandLayer = new GraphicsLayer({
    elevationInfo: {
      mode: "absolute-height",
      offset: 0
    }
  });

  const location = new Point({
    x: 0, y: 90, z: -(R)
  });

  Mesh.createFromGLTF(
    location,
    "./assets/low_poly_sphere.glb"
  ).then((mesh) => {
    mesh.scale(R * 1.02);
    const globe = new Graphic({
      geometry: mesh,
      symbol: {
        type: "mesh-3d",
        symbolLayers: [{
          type: "fill",
          material: {
            color: [72, 247, 218]
          }
        }]
      }
    });
    meshOceanLayer.add(globe);
  });

  const map = new Map({
    layers: [meshOceanLayer, meshLandLayer],
    ground: {
      opacity: 1,
      surfaceColor: [60, 56, 171]
    },
  });

  const view = new SceneView({
    container: "viewDiv",
    map: map,
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
  });

  window.view = view;

  addLandData();

  async function addLandData() {
    const pointsResponse = await fetch("./assets/steinerPoints_simplified.json")
    const landPoints = await pointsResponse.json(); // 540 points

    const landResponse = await fetch("./assets/land_simplified.json");
    const land = await landResponse.json(); // 149 polygons

    let steinerPoints = {};

    for (let { properties, geometry } of landPoints.features) {
      const fid = properties.CID;

      if (!steinerPoints[fid]) {
        steinerPoints[fid] = []
      }

      steinerPoints[fid].push(geometry.coordinates);
    }

    for (let feature of land.features) {
      const fid = feature.properties.FID_1;

      const { geometry } = feature;

      const wallGeometry = await getExtrusionWallGeometry(geometry);

      const polyGraphic = new Graphic({
        geometry: wallGeometry,
        symbol: {
          type: "mesh-3d",
          symbolLayers: [
            {
              type: "fill"
            }
          ]
        }
      });
      meshLandLayer.add(polyGraphic);

      const innerPoints = steinerPoints[fid] || null;
      const tin = generateTIN(geometry, innerPoints);

      const vertices = tin.vertices.map(function (vertex) {
        return [vertex.x, vertex.y, vertex.z]
      });

      const colors = vertices.map(function (vertex) {
        const { r, g, b } = getColorFromValue(vertex[1]);
        return [r, g, b, 255];
      })

      const flatPosition = [].concat.apply([], vertices);
      const flatColors = [].concat.apply([], colors);

      const faces = tin.triangles.map(function (t) {
        const points = t.getPoints();
        return points.map((p) => {
          return p.vertexId;
        });
      });

      const flatFaces = [].concat.apply([], faces);

      const meshComponent = new MeshComponent({
        faces: flatFaces,
        shading: "flat",
        material: new MeshMaterialMetallicRoughness({
          metallic: 0,
          roughness: 1,
          doubleSided: false
        })
      });

      const mesh = new Mesh({
        components: [meshComponent],
        vertexAttributes: {
          position: flatPosition,
          color: flatColors
        },
        spatialReference: SpatialReference.WebMercator
      });

      const graphic = new Graphic({
        geometry: mesh,
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill"
          }]
        }
      });

      meshLandLayer.add(graphic);
    }

  }

  function getColorFromValue(value) {
    const stops = [
      { value: -Math.pow(10, 7), color: new Color([255, 255, 255]) },
      { value: -5 * Math.pow(10, 6), color: new Color([186, 214, 75]) },
      { value: 0, color: new Color([248, 250, 182]) },
      { value: 5 * Math.pow(10, 6), color: new Color([186, 214, 75]) },
      { value: Math.pow(10, 7), color: new Color([255, 255, 255]) }
    ];
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];

      if (value < stop.value) {
        if (i === 0) {
          return stop.color;
        }

        const prev = stops[i - 1];

        const weight = (value - prev.value) / (stop.value - prev.value);
        return Color.blendColors(prev.color, stop.color, weight);
      }
    }
    return stops[stops.length - 1].color;
  }

  function getExtrusionWallGeometry(polygon) {
    const vertices = polygon.coordinates[0].map((coords) => {
      return [coords[0], coords[1], 250000];
    });
    const faces = [];

    const length = vertices.length;

    for (let i = 0; i < length; i++) {
      const vIdx1 = i;
      const vIdx2 = (i + 1) % vertices.length;

      const vIdx3 = length + i;
      const vIdx4 = length + ((i + 1) % vertices.length);

      const bottomVertex = [].concat.apply([], vertices[vIdx1]);
      bottomVertex[2] = 0;
      //colors.push([113, 52, 235, 255]);
      vertices.push(bottomVertex);
      if (i !== length - 1) {
        faces.push(vIdx2, vIdx3, vIdx1, vIdx4, vIdx3, vIdx2);
      }
    }
    const flatPositions = [].concat.apply([], vertices);
    //const flatColors = [].concat.apply([], colors);

    const mesh = new Mesh({
      vertexAttributes: {
        position: flatPositions,
        //color: flatColors
      },
      components: [
        {
          faces: faces,
          material: {
            color: [117, 48, 255, 255],
            metallic: 0.8,
            doubleSided: true
          }
        }
      ],
      spatialReference: { wkid: 3857 }
      // specify a spatial reference if the position of the vertices is not in WGS84
    });

    return mesh;
  }

  function generateTIN(polygon, innerPoints) {
    let vertices = [];
    let steinerPoints = null;

    if (innerPoints) {
      steinerPoints = innerPoints.map((coords) => {

        const vertexId = vertices.length;
        const vertex = {
          x: coords[0],
          y: coords[1],
          // coords[2] stores the real height value of the point
          //z: 100000 + coords[2] * exaggeration * random(),
          z: 250000 + 150000 * random(),
          vertexId
        }

        vertices.push(vertex);

        return vertex;
      });
    }

    const outerRing = polygon.coordinates[0].map((coords) => {

      const vertexId = vertices.length;
      const vertex = {
        x: coords[0],
        y: coords[1],
        z: 250000,
        vertexId
      }

      vertices.push(vertex);

      return vertex;
    });

    // poly2tri takes as an input the polyline and not a polygon
    // so we remove the last coordinate which is the same as the first one
    outerRing.pop();
    vertices.pop();

    const sweepContext = new poly2tri.SweepContext(outerRing, {
      cloneArrays: true
    });

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

});
