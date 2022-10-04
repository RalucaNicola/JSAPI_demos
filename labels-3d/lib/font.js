define(["esri/request", "./fontkit"], function(request, fontkit) {
  const Buffer = fontkit.Buffer;
  const createFont = fontkit.fontkit.create;

  function create(fontfile) {
    return request(fontfile, { responseType: "array-buffer" })
      .then(response => {
        const buffer = Buffer.from(response.data);
        const font = createFont(buffer);

        return font;
      })
      .catch(err => {
        console.error(err);
      });
  }

  return { create: create };
});
