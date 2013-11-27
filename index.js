var Busboy = require('busboy')

module.exports = function (request, options) {
  // koa special sauce
  request = request.req || request
  options = options || {}
  options.headers = request.headers

  var busboy = new Busboy(options)
  var fields = []
  var ended = false
  var error

  // not sure if busboy already handles this
  request.on('close', busboyCleanup)

  busboy
  .on('field', onField)
  .on('error', onBusboyError)
  .on('end', onBusboyEnd)

  request.pipe(busboy)

  return {
    part: onPart,
    fields: fields
  }

  function onField() {
    fields.push([].slice.call(arguments))
  }

  function onBusboyError(err) {
    error = err
  }

  function onBusboyEnd() {
    ended = true
    busboyCleanup()
  }

  function busboyCleanup() {
    // totally unnecessary but i'm a stickler for cleaning up
    request.removeListener('close', busboyCleanup)
    busboy.removeListener('field', onField)
    busboy.removeListener('error', onBusboyError)
    busboy.removeListener('end', onBusboyEnd)
  }

  function* onPart() {
    if (ended)
      return
    if (error) {
      busboyCleanup()
      throw error
    }

    yield nextPart
  }

  function nextPart(done) {
    busboy
    .on('file', onFile)
    .on('error', onEnd)
    .on('end', onEnd)

    function onFile(fieldname, file, filename, encoding, mimetype) {
      cleanup()
      // opinionated, but 5 arguments is ridiculous
      file.fieldname = fieldname
      file.filename = filename
      file.encoding = encoding
      file.mime = file.mimetype = mimetype
      done(null, file)
    }

    function onEnd(err) {
      cleanup()
      done(err)
    }

    function cleanup() {
      busboy.removeListener('file', onFile)
      busboy.removeListener('error', onEnd)
      busboy.removeListener('end', onEnd)
    }
  }
}