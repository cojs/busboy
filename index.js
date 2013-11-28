var Busboy = require('busboy')
var chan = require('chan')

module.exports = function (request, options) {
  var ch = chan()

  // koa special sauce
  request = request.req || request
  options = options || {}
  options.headers = request.headers

  var busboy = new Busboy(options)

  request.on('close', cleanup)

  busboy
  .on('field', onField)
  .on('file', onFile)
  .on('error', onEnd)
  .on('end', onEnd)

  request.pipe(busboy)

  return ch

  function onField() {
    ch(arguments)
  }

  function onFile(fieldname, file, filename, encoding, mimetype) {
    // opinionated, but 5 arguments is ridiculous
    file.fieldname = fieldname
    file.filename = filename
    file.encoding = encoding
    file.mime = file.mimetype = mimetype
    ch(file)
  }

  function onEnd(err) {
    cleanup()
    ch(err)
  }

  function cleanup() {
    request.removeListener('close', cleanup)
    busboy.removeListener('field', onField)
    busboy.removeListener('file', onFile)
    busboy.removeListener('error', onEnd)
    busboy.removeListener('end', onEnd)
  }
}