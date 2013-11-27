var Busboy = require('busboy')

module.exports = function (request, options) {
  options = options || {}

  var busboy = new Busboy(request.headers)
  var fields = []
  var ended = false
  var error

  busboy
  .on('field', function () {
    fields.push([].slice.call(arguments))
  })
  .on('error', function (err) {
    error = err
  })
  .once('end', function () {
    ended = true
  })

  return {
    part: onPart,
    fields: fields
  }

  function* onPart() {
    if (ended)
      throw new Error('already ended')
    if (error) {
      ended = true
      throw error
    }

    yield nextPart
  }

  function nextPart(done) {
    busboy
    .on('file', onFile)
    .on('error', onError)

    function onFile(fieldname, file, filename, encoding, mimetype) {
      cleanup()
      // opinionated, but 5 arguments is ridiculous
      file.fieldname = fieldname
      file.filename = filename
      file.encoding = encoding
      file.mime = file.mimetype = mimetype
      done(null, file)
    }

    function onError(err) {
      cleanup()
      ended = true
      done(err)
    }

    function cleanup() {
      busboy.removeListener('file', onFile)
      busboy.removeListener('error', onError)
    }
  }
}