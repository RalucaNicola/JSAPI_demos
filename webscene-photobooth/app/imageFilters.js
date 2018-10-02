define([], function () {

  return {

    sepia(imageData) {
      const width = imageData.width, height = imageData.height;
      const inputData = imageData.data;
      let amount = 10;
      amount *= 255 / 100;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = (y * width + x) * 4;
          const luma = inputData[pixel] * 0.3 + inputData[pixel + 1] * 0.59 + inputData[pixel + 2] * 0.11;
          let r, g, b;
          r = g = b = luma;
          r += 20;
          g += 10;
          b -= amount;

          inputData[pixel] = r;
          inputData[pixel + 1] = g;
          inputData[pixel + 2] = b;
        }
      }
      return imageData;
    },

    desaturate(imageData) {
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const i = (y * 4) * imageData.width + x * 4;
          const red = imageData.data[i];
          const green = imageData.data[i + 1];
          const blue = imageData.data[i + 2];
          const avg = (Math.max(red, green, blue) + Math.min(red, green, blue)) / 2;
          imageData.data[i] = avg;
          imageData.data[i + 1] = avg;
          imageData.data[i + 2] = avg;
        }
      }
      return imageData;
    },

    oil(imageData) {

      const width = imageData.width, height = imageData.height;
      let outputData = [];
      range = 1;
      const rHistogram = [];
      const gHistogram = [];
      const bHistogram = [];
      const rTotal = [];
      const gTotal = [];
      const bTotal = [];
      const levels = 256;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let pixel = (y * width + x) * 4;
          for (let i = 0; i < levels; i++) {
            rHistogram[i] = gHistogram[i] = bHistogram[i] = rTotal[i] = gTotal[i] = bTotal[i] = 0;
          }
          for (let row = -range; row <= range; row++) {
            let iy = y + row;
            let ioffset;
            if (0 <= iy && iy < height) {
              ioffset = iy * width;
              for (let col = -range; col <= range; col++) {
                let ix = x + col;
                if (0 <= ix && ix < width) {
                  let r = imageData.data[(ioffset + ix) * 4]
                  let g = imageData.data[(ioffset + ix) * 4 + 1]
                  let b = imageData.data[(ioffset + ix) * 4 + 2]
                  let ri = r * levels / 256;
                  let gi = g * levels / 256;
                  let bi = b * levels / 256;
                  rTotal[ri] += r;
                  gTotal[gi] += g;
                  bTotal[bi] += b;
                  rHistogram[ri]++;
                  gHistogram[gi]++;
                  bHistogram[bi]++;
                }
              }
            }
          }
          let r = 0, g = 0, b = 0;
          for (let i = 1; i < levels; i++) {
            if (rHistogram[i] > rHistogram[r]) {
              r = i;
            }
            if (gHistogram[i] > gHistogram[g]) {
              g = i;
            }
            if (bHistogram[i] > bHistogram[b]) {
              b = i;
            }
          }
          r = rTotal[r] / rHistogram[r];
          g = gTotal[g] / gHistogram[g];
          b = bTotal[b] / bHistogram[b];
          outputData[pixel] = r;
          outputData[pixel + 1] = g;
          outputData[pixel + 2] = b;
          outputData[pixel + 3] = imageData.data[pixel + 3];
        }
      }
      for (let k = 0; k < outputData.length; k++) {
        imageData.data[k] = outputData[k];
      }

      return imageData;
    },

    pixel(imageData) {
      var width = imageData.width, height = imageData.height;
      size = 4;
      for (var y = 0; y < height; y += size) {
        for (var x = 0; x < width; x += size) {
          var pixel = (y * width + x) * 4;
          var w = Math.min(size, width - x);
          var h = Math.min(size, height - y);
          var t = w * h;
          var r = 0, g = 0, b = 0;
          for (var by = y; by < y + h; by++) {
            for (var bx = x; bx < x + w; bx++) {
              var bPixel = (by * width + bx) * 4;
              r += imageData.data[bPixel];
              g += imageData.data[bPixel + 1];
              b += imageData.data[bPixel + 2];
            }
          }
          for (var by = y; by < y + h; by++) {
            for (var bx = x; bx < x + w; bx++) {
              var bPixel = (by * width + bx) * 4;
              imageData.data[bPixel] = r / t;
              imageData.data[bPixel + 1] = g / t;
              imageData.data[bPixel + 2] = b / t;
            }
          }
        }
      }

      return imageData;

    },

    stars(imageData) {
      var img = new Image();
      img.src = './assets/bokeh-stars.png';
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(this, 0, 0);

        starsImageData = ctx.getImageData(0, 0, this.width, this.height);

        for (let y = 0; y < imageData.height; y++) {
          for (let x = 0; x < imageData.width; x++) {
            const i = (y * 4) * imageData.width + x * 4;
            imageData.data[i] += starsImageData.data[i];
            imageData.data[i + 1] += starsImageData.data[i + 1];
            imageData.data[i + 2] += starsImageData.data[i + 2];
          }
        }

        console.log(imageData);
      };
    },

    edges(imageData) {
      var width = imageData.width, height = imageData.height;
      var outputData = [];
      var matrixH = [-1, -2, -1,
        0, 0, 0,
        1, 2, 1];
      var matrixV = [-1, 0, 1,
      -2, 0, 2,
      -1, 0, 1];
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          var pixel = (y * width + x) * 4;
          var rh = 0; gh = 0; bh = 0;
          var rv = 0; gv = 0; bv = 0;
          for (var row = -1; row <= 1; row++) {
            var iy = y + row;
            var ioffset;
            if (iy >= 0 && iy < height) {
              ioffset = iy * width * 4;
            } else {
              ioffset = y * width * 4;
            }
            var moffset = 3 * (row + 1) + 1;
            for (var col = -1; col <= 1; col++) {
              var ix = x + col;
              if (!(ix >= 0 && ix < width)) {
                ix = x;
              }
              ix *= 4;
              var r = imageData.data[ioffset + ix];
              var g = imageData.data[ioffset + ix + 1];
              var b = imageData.data[ioffset + ix + 2];
              var h = matrixH[moffset + col];
              var v = matrixV[moffset + col];
              rh += parseInt(h * r);
              bh += parseInt(h * g);
              gh += parseInt(h * b);
              rv += parseInt(v * r);
              gv += parseInt(v * g);
              bv += parseInt(v * b);
            }
          }
          r = parseInt(Math.sqrt(rh * rh + rv * rv) / 1.8);
          g = parseInt(Math.sqrt(gh * gh + gv * gv) / 1.8);
          b = parseInt(Math.sqrt(bh * bh + bv * bv) / 1.8);

          outputData[pixel] = r;
          outputData[pixel + 1] = g;
          outputData[pixel + 2] = b;
          outputData[pixel + 3] = imageData.data[pixel + 3];
        }
      }
      for (var k = 0; k < outputData.length; k++) {
        imageData.data[k] = outputData[k];
      }
      return imageData;
    },

    solarize(imageData) {

      const width = imageData.width, height = imageData.height;
      const inputData = imageData.data;
      const table = [];
      for (let i = 0; i < 256; i++) {
        const val = (i / 255 > 0.5) ? 2 * (i / 255 - 0.5) : 2 * (0.5 - i / 255)
        table[i] = parseInt(255 * val);
      }

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let pixel = (y * width + x) * 4;
          for (let i = 0; i < 3; i++) {
            inputData[pixel + i] = table[inputData[pixel + i]];
          }
        }
      }

      return imageData;
    },

    diffuse(imageData) {
      const width = imageData.width, height = imageData.height;
      const inputData = imageData.data;
      const scale = 2;
      const sinTable = [];
      const cosTable = [];
      for (let i = 0; i < 256; i++) {
        const angle = Math.PI * 2 * i / 256;
        sinTable[i] = scale * Math.sin(angle);
        cosTable[i] = scale * Math.cos(angle);
      }
      transInverse = function (x, y, out) {
        const angle = parseInt(Math.random() * 255);
        const distance = Math.random();
        out[0] = x + distance * sinTable[angle];
        out[1] = y + distance * cosTable[angle];
      }

      const out = [];
      const outputData = [];
      for (let j = 0; j < inputData.length; j++) {
        outputData[j] = inputData[j];
      }
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = (y * width + x) * 4;
          transInverse(x, y, out);
          var srcX = Math.floor(out[0]);
          var srcY = Math.floor(out[1]);
          var xWeight = out[0] - srcX;
          var yWeight = out[1] - srcY;
          var nw, ne, sw, se;
          if (srcX >= 0 && srcX < width - 1 && srcY >= 0 && srcY < height - 1) {
            const i = (width * srcY + srcX) * 4;
            nw = [inputData[i], inputData[i + 1], inputData[i + 2], inputData[i + 3]];
            ne = [inputData[i + 4], inputData[i + 5], inputData[i + 6], inputData[i + 7]];
            sw = [inputData[i + width * 4], inputData[i + width * 4 + 1], inputData[i + width * 4 + 2], inputData[i + width * 4 + 3]];
            se = [inputData[i + (width + 1) * 4], inputData[i + (width + 1) * 4 + 1], inputData[i + (width + 1) * 4 + 2], inputData[i + (width + 1) * 4 + 3]];

          } else {
            nw = getPixel(inputData, srcX, srcY, width, height);
            ne = getPixel(inputData, srcX + 1, srcY, width, height);
            sw = getPixel(inputData, srcX, srcY + 1, width, height);
            se = getPixel(inputData, srcX + 1, srcY + 1, width, height);
          }
          var rgba = bilinearInterpolate(xWeight, yWeight, nw, ne, sw, se);
          outputData[pixel] = rgba[0];
          outputData[pixel + 1] = rgba[1];
          outputData[pixel + 2] = rgba[2];
          outputData[pixel + 3] = rgba[3];
        }
      }
      for (var k = 0; k < outputData.length; k++) {
        inputData[k] = outputData[k];
      }

      return imageData;
    }
  }

});

function getPixel(pixels, x, y, width, height) {
  const pix = (y * width + x) * 4;
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return [pixels[((clampPixel(y, 0, height - 1) * width) + clampPixel(x, 0, width - 1)) * 4],
    pixels[((clampPixel(y, 0, height - 1) * width) + clampPixel(x, 0, width - 1)) * 4 + 1],
    pixels[((clampPixel(y, 0, height - 1) * width) + clampPixel(x, 0, width - 1)) * 4 + 2],
    pixels[((clampPixel(y, 0, height - 1) * width) + clampPixel(x, 0, width - 1)) * 4 + 3]];
  }
  return [pixels[pix], pixels[pix + 1], pixels[pix + 2], pixels[pix + 3]]
}

function clampPixel(x, a, b) {
  return (x < a) ? a : (x > b) ? b : x;
}

function bilinearInterpolate(x, y, nw, ne, sw, se) {

  let m0, m1;
  const r0 = nw[0]; const g0 = nw[1]; const b0 = nw[2]; const a0 = nw[3];
  const r1 = ne[0]; const g1 = ne[1]; const b1 = ne[2]; const a1 = ne[3];
  const r2 = sw[0]; const g2 = sw[1]; const b2 = sw[2]; const a2 = sw[3];
  const r3 = se[0]; const g3 = se[1]; const b3 = se[2]; const a3 = se[3];
  const cx = 1.0 - x; const cy = 1.0 - y;

  m0 = cx * a0 + x * a1;
  m1 = cx * a2 + x * a3;
  const a = cy * m0 + y * m1;

  m0 = cx * r0 + x * r1;
  m1 = cx * r2 + x * r3;
  const r = cy * m0 + y * m1;

  m0 = cx * g0 + x * g1;
  m1 = cx * g2 + x * g3;
  const g = cy * m0 + y * m1;

  m0 = cx * b0 + x * b1;
  m1 = cx * b2 + x * b3;
  const b = cy * m0 + y * m1;
  return [r, g, b, a];
}
