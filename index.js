var Busboy = require('busboy')
var chan = require('chan')

var getDescriptor = Object.getOwnPropertyDescriptor
var isArray = Array.isArray;
var slice = [].slice

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
  .on('close', cleanup)
  .on('error', onEnd)
  .on('finish', onEnd)

  request.pipe(busboy)

  // i would just put everything in an array
  // but people will complain
  if (options.autoFields) {
    var field = ch.field = {} // object lookup
    var fields = ch.fields = [] // list lookup
  }

  return ch

  function onField(name, val) {
    var args = slice.call(arguments)

    if (options.autoFields) {
      fields.push(args)
      
      // don't overwrite prototypes
      if (getDescriptor(Object.prototype, name)) return
      
      var prev = field[name]
      if (!prev) return field[name] = val
      if (Array.isArray(prev)) return prev.push(val)
      field[name] = [prev, val]
    } else {
      ch(args)
    }
  }

  function onFile(fieldname, file, filename, encoding, mimetype) {
    // opinionated, but 5 arguments is ridiculous
    file.fieldname = fieldname
    file.filename = filename
    file.transferEncoding = file.encoding = encoding
    file.mimeType = file.mime = mimetype
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
    busboy.removeListener('close', cleanup)
    busboy.removeListener('error', onEnd)
    busboy.removeListener('finish', onEnd)
  }
}