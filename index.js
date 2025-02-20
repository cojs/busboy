var debug = require('util').debuglog('co-busboy')
var Busboy = require('busboy')
var chan = require('chan')
var BlackHoleStream = require('black-hole-stream')
var inflate = require('inflation')

var getDescriptor = Object.getOwnPropertyDescriptor
var isArray = Array.isArray

module.exports = function (request, options) {
  var ch = chan()
  var parts = function (fn) {
    if (fn) return ch(fn)
    return new Promise(function (resolve, reject) {
      ch(function (err, res) {
        if (err) return reject(err)
        resolve(res)
      })
    })
  }

  // koa special sauce
  request = request.req || request

  options = options || {}
  options.headers = request.headers
  // options.checkField hook `function(name, val, fieldnameTruncated, valTruncated)`
  // options.checkFile hook `function(fieldname, fileStream, filename, encoding, mimetype)`
  var checkField = options.checkField
  var checkFile = options.checkFile
  var lastError

  var busboy = Busboy(options)

  request = inflate(request)
  request.on('close', cleanup)

  busboy
    .on('field', onField)
    .on('file', onFile)
    .on('close', cleanup)
    .on('error', onEnd)
    .on('finish', onEnd)

  busboy.on('partsLimit', function () {
    var err = new Error('Reach parts limit')
    err.code = 'Request_parts_limit'
    err.status = 413
    onError(err)
  })

  busboy.on('filesLimit', function () {
    var err = new Error('Reach files limit')
    err.code = 'Request_files_limit'
    err.status = 413
    onError(err)
  })

  busboy.on('fieldsLimit', function () {
    var err = new Error('Reach fields limit')
    err.code = 'Request_fields_limit'
    err.status = 413
    onError(err)
  })

  request.pipe(busboy)

  // i would just put everything in an array
  // but people will complain
  if (options.autoFields) {
    var field = parts.field = {} // object lookup
    var fields = parts.fields = [] // list lookup
  }

  return parts

  function onField(name, val, info) {
    var fieldnameTruncated = info.nameTruncated
    var valTruncated = info.valueTruncated
    if (checkField) {
      var err = checkField(name, val, fieldnameTruncated, valTruncated)
      if (err) {
        debug('onField error: %s', err)
        return onError(err)
      }
    }

    var args = [ name, val, fieldnameTruncated, valTruncated ]

    if (options.autoFields) {
      fields.push(args)

      // don't overwrite prototypes
      if (getDescriptor(Object.prototype, name)) return

      var prev = field[ name ]
      if (prev == null) return field[ name ] = val
      if (isArray(prev)) return prev.push(val)
      field[ name ] = [ prev, val ]
    } else {
      ch(args)
    }
  }

  function onFile(fieldname, file, info) {
    function onFileError(err) {
      debug('onFileError: %s', err)
      lastError = err
    }
    function onFileCleanup() {
      debug('onFileCleanup')
      file.removeListener('error', onFileError)
      file.removeListener('end', onFileCleanup)
      file.removeListener('close', onFileCleanup)
    }
    file.on('error', onFileError)
    file.on('end', onFileCleanup)
    file.on('close', onFileCleanup)

    var filename = info.filename
    var encoding = info.encoding
    var mimetype = info.mimeType
    if (checkFile) {
      var err = checkFile(fieldname, file, filename, encoding, mimetype)
      if (err) {
        // make sure request stream's data has been read
        var blackHoleStream = new BlackHoleStream()
        file.pipe(blackHoleStream)
        return onError(err)
      }
    }

    // opinionated, but 5 arguments is ridiculous
    file.fieldname = fieldname
    file.filename = filename
    file.transferEncoding = file.encoding = encoding
    file.mimeType = file.mime = mimetype
    ch(file)
  }

  function onError(err) {
    debug('onError: %s', err)
    lastError = err
  }

  function onEnd(err) {
    cleanup()
    debug('onEnd error: %s', err)
    busboy.removeListener('finish', onEnd)
    // remove error listener in next event loop, catch the 'Unexpected end of form' error in next tick
    setImmediate(function () {
      busboy.removeListener('error', onEnd)
    })
    // ignore Unexpected end of form
    if (!lastError && err && err.message !== 'Unexpected end of form') {
      lastError = err
      debug('set lastError')
    }
    ch(lastError)
  }

  function cleanup() {
    debug('cleanup')
    // keep finish listener to wait all data flushed
    // keep error listener to wait stream error
    request.removeListener('close', cleanup)
    busboy.removeListener('field', onField)
    busboy.removeListener('file', onFile)
    busboy.removeListener('close', cleanup)
  }
}
