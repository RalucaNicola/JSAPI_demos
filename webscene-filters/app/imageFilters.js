define([], function () {

  return {

    sepia(imageData) {
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const i = (y * 4) * imageData.width + x * 4;
          const red = imageData.data[i];
          const green = imageData.data[i + 1];
          const blue = imageData.data[i + 2];
          imageData.data[i] = (red * .393) + (green * .769) + (blue * .189);
          imageData.data[i + 1] = (red * .349) + (green * .686) + (blue * .168);
          imageData.data[i + 2] = (red * .272) + (green * .534) + (blue * .131);
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
      size = 3;
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
      img.onload = function() {
        const canvas = document.createElement("canvas");
        canvas.width =this.width;
        canvas.height =this.height;

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
    }
  }

});