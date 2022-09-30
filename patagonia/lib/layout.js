define([
], function(
) {
  function toPaths(font, s, size, alignment) {
    const run = font.layout(s);
    const characters = [];

    if (size == null) {
      size = 10;
    }

    const scale = 1 / font.unitsPerEm * size;
    const offset = calculateOffset(run, alignment, scale);

    for (const glyph of run.glyphs) {
      const paths = glyphToPolygon(font, glyph, size);

      applyOffset(paths, offset);

      characters.push({ paths });

      offset.x += glyph.advanceWidth * scale;
    }

    return characters;
  }

  function calculateOffset(run, alignment, scale) {
    alignment = alignmentWithDefaults(alignment);

    return {
      x: calculateXOffset(run, alignment) * scale,
      y: calculateYOffset(run, alignment) * scale
    };
  }

  function calculateXOffset(run, alignment) {
    switch (alignment.x) {
      case "left":
        return 0;
      case "center":
        return -run.advanceWidth / 2;
      case "right":
        return -run.advanceWidth;

      default:
        return 0;
    }
  }

  function calculateYOffset(run, alignment) {
    switch (alignment.x) {
      case "top":
        return -run.bbox.maxY;
      case "middle":
        return -(run.bbox.minY + (run.bbox.maxY - run.bbox.minY) / 2);
      case "bottom":
        return -run.bbox.minY;
      case "baseline":
        return 0;
      default:
        return 0;
    }
  }

  function alignmentWithDefaults(alignment) {
    if (alignment == null) {
      alignment = {};
    }
    else {
      alignment = { x: alignment.x, y: alignment.y };
    }

    alignment.x = alignment.x || "left";
    alignment.y = alignment.y || "baseline";

    return alignment;
  }

  function applyOffset(paths, offset) {
    for (let p = 0; p < paths.length; p++) {
      const path = paths[p];

      for (let k = 0; k < path.length; k += 3) {
        path[k] += offset.x;
      }
    }
  }

  function glyphToPolygon(font, glyph, size) {
    const commands = glyph.path.commands;

    const context = {
      scale: 1 / font.unitsPerEm * size,
      pen: { x: 0, y: 0},
      closedPaths: [],
      currentPath: null
    };

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      switch (command.command) {
        case "moveTo":
          applyMoveTo(context, command.args);
          break;
        case "quadraticCurveTo":
          applyQuadraticCurve(context, command.args);
          break;
        case "lineTo":
          applyLineTo(context, command.args);
          break;
        case "closePath":
          applyClosePath(context, command.args);
          break;
      }
    }

    applyClosePath(context);
    return context.closedPaths;
  }

  function applyMoveTo(context, args) {
    if (context.currentPath) {
      applyClosePath(context);
    }

    setPen(context, args[0] * context.scale, args[1] * context.scale);
  }

  function openPath(context) {
    if (!context.currentPath) {
      context.currentPath = [];
    }
  }

  function setPen(context, x, y) {
    context.pen.x = x;
    context.pen.y = y;
  }

  function addPenToPath(context) {
    const lastX = context.currentPath[context.currentPath.length - 3];
    const lastY = context.currentPath[context.currentPath.length - 2];

    if (lastX !== context.pen.x || lastY !== context.pen.y) {
      context.currentPath.push(context.pen.x, context.pen.y, 0);
    }
  }

  function applyLineTo(context, args) {
    openPath(context);

    addPenToPath(context);
    setPen(context, args[0] * context.scale, args[1] * context.scale);
  }

  function applyQuadraticCurve(context, args) {
    openPath(context);

    // Evaluate quadratic curve along 0 to 1
    const N = 5;
    const p0 = context.pen;

    const p1x = args[0] * context.scale;
    const p1y = args[1] * context.scale;

    const p2x = args[2] * context.scale;
    const p2y = args[3] * context.scale;

    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);

      const omt = 1 - t;
      const a1 = omt * omt;
      const a2 = 2 * t * omt;
      const a3 = t * t;

      const x = a1 * p0.x + a2 * p1x + a3 * p2x;
      const y = a1 * p0.y + a2 * p1y + a3 * p2y;

      setPen(context, x, y);
      addPenToPath(context);
    }
  }

  function applyClosePath(context) {
    if (context.currentPath) {
      addPenToPath(context);

      setPen(context, context.currentPath[0], context.currentPath[1]);
      addPenToPath(context);

      context.closedPaths.push(context.currentPath);
      context.currentPath = null;
    }
  }

  return {
    toPaths: toPaths
  };
});
