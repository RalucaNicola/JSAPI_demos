define(["esri/geometry", "esri/geometry/support/meshUtils", "./layout", "esri/geometry/Mesh"], function(
  geometry,
  meshUtils,
  layout,
  Mesh
) {
  const Polygon = geometry.Polygon;

  function fromString(font, s, origin, options) {
    const characters = layout.toPaths(font, s, options && options.size, options && options.alignment);
    const meshes = [];

    for (const character of characters) {
      const { polygon, mesh } = glyphPathsToMesh(character, origin);

      meshes.push(mesh);
      meshes.push(...extrude(mesh, polygon, 5000));
    }

    return meshUtils.merge(meshes);
  }

  function extrude(mesh, polygon, s) {
    const oppositeFaceMesh = extrudeCreateOppositeFaces(mesh, s);
    const bridge = extrudeCreateBridgeFaces(mesh, polygon, s);

    return [oppositeFaceMesh, bridge];
  }

  function extrudeCreateBridgeFaces(mesh, polygon, s) {
    const numVertices = polygon.rings.reduce((a, b) => a + b.length, 0);

    if (numVertices === 0) {
      return new Mesh({ spatialReference: mesh.spatialReference });
    }

    const position = new Float64Array(numVertices * 2 * 3);
    const faces = new Uint32Array((numVertices - polygon.rings.length) * 2 * 3);

    let positionIndex = 0;
    let faceIndex = 0;
    let vertexIndex = 0;

    for (const ring of polygon.rings) {
      for (let i = 0; i < ring.length; i++) {
        const vertex = ring[i];

        position[positionIndex++] = vertex[0];
        position[positionIndex++] = vertex[1];
        position[positionIndex++] = vertex[2];

        position[positionIndex++] = vertex[0];
        position[positionIndex++] = vertex[1];
        position[positionIndex++] = vertex[2] + s;

        if (i !== ring.length - 1) {
          faces[faceIndex++] = vertexIndex;
          faces[faceIndex++] = vertexIndex + 1;
          faces[faceIndex++] = vertexIndex + 2;

          faces[faceIndex++] = vertexIndex + 1;
          faces[faceIndex++] = vertexIndex + 3;
          faces[faceIndex++] = vertexIndex + 2;
        }

        vertexIndex += 2;
      }
    }

    return new Mesh({
      vertexAttributes: {
        position
      },

      components: [
        {
          faces
        }
      ],

      spatialReference: mesh.spatialReference
    });
  }

  function extrudeCreateOppositeFaces(mesh, s) {
    const position = mesh.vertexAttributes.position;
    const extrudedPosition = new Float64Array(position.length);

    for (let i = 0; i < position.length; i += 3) {
      extrudedPosition[i + 0] = position[i + 0];
      extrudedPosition[i + 1] = position[i + 1];
      extrudedPosition[i + 2] = position[i + 2] + s;
    }

    const components = mesh.components.map(component => component.clone());

    return new Mesh({
      vertexAttributes: {
        position: extrudedPosition
      },

      components,

      spatialReference: mesh.spatialReference
    });
  }

  function glyphPathsToMesh(glyph, origin) {
    // georeference
    const rings = glyph.paths.map(path => glyphPathToRing(path, origin));

    const polygon = new Polygon({
      rings: rings,
      spatialReference: origin.spatialReference
    });

    const mesh = Mesh.createFromPolygon(polygon);

    return { polygon, mesh };
  }

  function glyphPathToRing(path, origin) {
    path = new Float64Array(path);
    const attributes = meshUtils.georeference({ position: path }, origin);

    const ring = [];
    const position = attributes.position;

    for (let i = 0; i < position.length; i += 3) {
      ring.push([position[i + 0], position[i + 1], position[i + 2]]);
    }

    return ring;
  }

  return {
    fromString
  };
});
