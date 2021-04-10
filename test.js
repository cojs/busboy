var co = require('co')
var Stream = require('stream')
var assert = require('assert')
var path = require('path')
var fs = require('fs')
var formstream = require('formstream')
const zlib = require('zlib');
var busboy = require('./')

describe('Co Busboy', function () {
  it('should work without autofields', function () {
    return co(function*(){
      var parts = busboy(request())
      var part
      var fields = 0
      var streams = 0
      while (part = yield parts) {
        if (part.length) {
          assert.equal(part.length, 4)
          fields++
        } else {
          streams++
          part.resume()
        }
      }
      assert.equal(fields, 6)
      assert.equal(streams, 3)
    })
  })

  it('should work without autofields on gziped content', function () {
    return co(function*(){
      var parts = busboy(gziped())
      var part
      var fields = 0
      var streams = 0
      while (part = yield parts) {
        if (part.length) {
          assert.equal(part.length, 4)
          fields++
        } else {
          streams++
          part.resume()
        }
      }
      assert.equal(fields, 6)
      assert.equal(streams, 3)
    })
  })

  it('should work with autofields', function () {
    return co(function*(){
      var parts = busboy(request(), {
        autoFields: true
      })
      var part
      var fields = 0
      var streams = 0
      while (part = yield parts) {
        if (part.length) {
          fields++
        } else {
          streams++
          part.resume()
        }
      }
      assert.equal(fields, 0)
      assert.equal(streams, 3)
      assert.equal(parts.fields.length, 6)
      assert.equal(Object.keys(parts.field).length, 3)
    })
  })

  it('should work with autofields on gziped content', function () {
    return co(function*(){
      var parts = busboy(gziped(), {
        autoFields: true
      })
      var part
      var fields = 0
      var streams = 0
      while (part = yield parts) {
        if (part.length) {
          fields++
        } else {
          streams++
          part.resume()
        }
      }
      assert.equal(fields, 0)
      assert.equal(streams, 3)
      assert.equal(parts.fields.length, 6)
      assert.equal(Object.keys(parts.field).length, 3)
    })
  })

  it('should work with autofields and arrays', function () {
    return co(function*(){
      var parts = busboy(request(), {
        autoFields: true
      })
      var part
      while (part = yield parts) {
        part.resume()
      }
      assert.equal(Object.keys(parts.field).length, 3)
      assert.equal(parts.field['file_name_0'].length, 3)
      assert.deepEqual(parts.field['file_name_0'], [ 'super alpha file', 'super beta file', 'super gamma file' ])
    })
  })

  it('should work with delays', function () {
    return co(function*(){
      var parts = busboy(request(), {
        autoFields: true
      })
      var part
      var streams = 0
      while (part = yield parts) {
        streams++
        part.resume()
        yield wait(10)
      }
      assert.equal(streams, 3)
    })
  })

  it('should not overwrite prototypes', function () {
    return co(function*(){
      var parts = busboy(request(), {
        autoFields: true
      })
      var part
      while (part = yield parts) {
        if (!part.length) part.resume()
      }
      assert.equal(parts.field.hasOwnProperty, Object.prototype.hasOwnProperty)
    })
  })

  it('should throw error when the files limit is reached', function () {
    return co(function*(){
      var parts = busboy(request(), {
        limits: {
          files: 1
        }
      })
      var part
      var error
      try {
        while (part = yield parts) {
          if (!part.length) part.resume()
        }
      } catch (e) {
        error = e
      }

      assert.equal(error.status, 413)
      assert.equal(error.code, 'Request_files_limit')
      assert.equal(error.message, 'Reach files limit')
    })
  })

  it('should throw error when the fields limit is reached', function () {
    return co(function*(){
      var parts = busboy(request(), {
        limits: {
          fields: 1
        }
      })
      var part
      var error
      try {
        while (part = yield parts) {
          if (!part.length) part.resume()
        }
      } catch (e) {
        error = e
      }

      assert.equal(error.status, 413)
      assert.equal(error.code, 'Request_fields_limit')
      assert.equal(error.message, 'Reach fields limit')
    })
  })

  it('should throw error when the parts limit is reached', function () {
    return co(function*(){
      var parts = busboy(request(), {
        limits: {
          parts: 1
        }
      })
      var part
      var error
      try {
        while (part = yield parts) {
          if (!part.length) part.resume()
        }
      } catch (e) {
        error = e
      }

      assert.equal(error.status, 413)
      assert.equal(error.code, 'Request_parts_limit')
      assert.equal(error.message, 'Reach parts limit')
    })
  })

  it('should use options.checkField do csrf check', function () {
    return co(function*(){
      var parts = busboy(request(), {
        checkField: function (name, value) {
          if (name === '_csrf' && value !== 'pass') {
            return new Error('invalid csrf token')
          }
        }
      })
      var part
      var fields = 0
      try {
        while (part = yield parts) {
          if (part.length) {
            assert.equal(part.length, 4)
          } else {
            part.resume()
          }
        }
        throw new Error('should not run this')
      } catch (err) {
        assert.equal(err.message, 'invalid csrf token')
      }
    })
  })

  it('should use options.checkFile do filename extension check', function () {
    return co(function*(){
      var parts = busboy(request(), {
        checkFile: function (fieldname, filestream, filename) {
          if (path.extname(filename) !== '.dat') {
            return new Error('invalid filename extension')
          }
        }
      })
      var part
      var fields = 0
      try {
        while (part = yield parts) {
          if (part.length) {
            assert.equal(part.length, 4)
          } else {
            part.resume()
          }
        }
        throw new Error('should not run this')
      } catch (err) {
        assert.equal(err.message, 'invalid filename extension')
      }
    })
  })

  describe('checkFile()', function() {
    var logfile = path.join(__dirname, 'test.log')
    before(function() {
      fs.writeFileSync(logfile, new Buffer(1024 * 1024 * 10))
    })

    after(function() {
      fs.unlinkSync(logfile)
    })

    it('should checkFile fail', function() {
      const form = formstream()

      form.field('foo1', 'fengmk2').field('love', 'chair1')
      form.file('file', logfile)
      form.field('foo2', 'fengmk2').field('love', 'chair2')
      form.headers = form.headers()
      form.headers['content-type'] = form.headers['Content-Type']

      return co(function*(){
        var parts = busboy(form, {
          checkFile: function (fieldname, fileStream, filename) {
            var extname = filename && path.extname(filename)
            if (!extname || ['.jpg', '.png'].indexOf(extname.toLowerCase()) === -1) {
              var err = new Error('Invalid filename extension: ' + extname)
              err.status = 400
              return err
            }
          }
        })

        var part
        var fileCount = 0
        var fieldCount = 0
        var err
        while (true) {
          try {
            part = yield parts
            if (!part) {
              break
            }
          } catch (e) {
            err = e
            break
          }

          if (!part.length) {
            fileCount++
            part.resume()
          } else {
            fieldCount++
          }
        }

        assert.equal(fileCount, 0)
        assert.equal(fieldCount, 4)
        assert(err)
        assert.equal(err.message, 'Invalid filename extension: .log')
      })
    })

    it('should checkFile pass', function() {
      const form = formstream()

      form.field('foo1', 'fengmk2').field('love', 'chair1')
      form.file('file', logfile)
      form.field('foo2', 'fengmk2').field('love', 'chair2')
      form.headers = form.headers()
      form.headers['content-type'] = form.headers['Content-Type']

      return co(function*(){
        var parts = busboy(form, {
          checkFile: function (fieldname, fileStream, filename) {
            var extname = filename && path.extname(filename)
            if (!extname || ['.jpg', '.png', '.log'].indexOf(extname.toLowerCase()) === -1) {
              var err = new Error('Invalid filename extension: ' + extname)
              err.status = 400
              return err
            }
          }
        })

        var part
        var fileCount = 0
        var fieldCount = 0
        var err
        while (true) {
          try {
            part = yield parts
            if (!part) {
              break
            }
          } catch (e) {
            err = e
            break
          }

          if (!part.length) {
            fileCount++
            part.resume()
          } else {
            fieldCount++
          }
        }

        assert.equal(fileCount, 1)
        assert.equal(fieldCount, 4)
        assert(!err)
      })
    })

  })

  describe('with promise', function() {
    it('should work without autofields', function () {
      return co(function*(){
        var parts = busboy(request())
        var promise
        var part
        var fields = 0
        var streams = 0
        while (promise = parts(), part = yield promise) {
          assert(promise instanceof Promise)
          if (part.length) {
            assert.equal(part.length, 4)
            fields++
          } else {
            streams++
            part.resume()
          }
        }
        assert.equal(fields, 6)
        assert.equal(streams, 3)
      })
    })

    it('should work without autofields on gziped content', function () {
      return co(function*(){
        var parts = busboy(gziped())
        var promise
        var part
        var fields = 0
        var streams = 0
        while (promise = parts(), part = yield promise) {
          assert(promise instanceof Promise)
          if (part.length) {
            assert.equal(part.length, 4)
            fields++
          } else {
            streams++
            part.resume()
          }
        }
        assert.equal(fields, 6)
        assert.equal(streams, 3)
      })
    })

    it('should work with autofields', function () {
      return co(function*(){
        var parts = busboy(request(), {
          autoFields: true
        })
        var promise
        var part
        var fields = 0
        var streams = 0
        while (promise = parts(), part = yield promise) {
          assert(promise instanceof Promise)
          if (part.length) {
            fields++
          } else {
            streams++
            part.resume()
          }
        }
        assert.equal(fields, 0)
        assert.equal(streams, 3)
        assert.equal(parts.fields.length, 6)
        assert.equal(Object.keys(parts.field).length, 3)
      })
    })

    it('should work with autofields on gziped content', function () {
      return co(function*(){
        var parts = busboy(gziped(), {
          autoFields: true
        })
        var promise
        var part
        var fields = 0
        var streams = 0
        while (promise = parts(), part = yield promise) {
          assert(promise instanceof Promise)
          if (part.length) {
            fields++
          } else {
            streams++
            part.resume()
          }
        }
        assert.equal(fields, 0)
        assert.equal(streams, 3)
        assert.equal(parts.fields.length, 6)
        assert.equal(Object.keys(parts.field).length, 3)
      })
    })
  })

  describe('with wrong encoding', function() {
    it('will get nothing if set wrong encoding on gziped content', function () {
      return co(function*(){
        var stream = gziped()
        delete stream.headers['content-encoding']
        var parts = busboy(stream, {
          autoFields: true
        })
        var promise
        var part
        var fields = 0
        var streams = 0
        while (promise = parts(), part = yield promise) {
          assert(promise instanceof Promise)
          if (part.length) {
            fields++
          } else {
            streams++
            part.resume()
          }
        }
        assert.equal(fields, 0)
        assert.equal(streams, 0)
        assert.equal(parts.fields.length, 0)
        assert.equal(Object.keys(parts.field).length, 0)
      })
    })
  })
})

function wait(ms) {
  return function (done) {
    setTimeout(done, ms)
  }
}

function request() {
  // https://github.com/mscdex/busboy/blob/master/test/test-types-multipart.js

  var stream = new Stream.PassThrough()

  stream.headers = {
    'content-type': 'multipart/form-data; boundary=---------------------------paZqsnEHRufoShdX6fh0lUhXBP4k'
  }

  stream.end([
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k',
    'Content-Disposition: form-data; name="file_name_0"',
    '',
    'super alpha file',
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k',
    'Content-Disposition: form-data; name="file_name_0"',
    '',
    'super beta file',
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k',
    'Content-Disposition: form-data; name="file_name_0"',
    '',
    'super gamma file',
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k',
    'Content-Disposition: form-data; name="file_name_1"',
    '',
    'super gamma file',
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k',
    'Content-Disposition: form-data; name="_csrf"',
    '',
    'ooxx',
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k',
    'Content-Disposition: form-data; name="hasOwnProperty"',
    '',
    'super bad file',
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k',
    'Content-Disposition: form-data; name="upload_file_0"; filename="1k_a.dat"',
    'Content-Type: application/octet-stream',
    '',
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k',
    'Content-Disposition: form-data; name="upload_file_1"; filename="1k_b.dat"',
    'Content-Type: application/octet-stream',
    '',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k',
    'Content-Disposition: form-data; name="upload_file_2"; filename="hack.exe"',
    'Content-Type: application/octet-stream',
    '',
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k--'
  ].join('\r\n'))

  return stream
}


function gziped() {
  // using `gzip` as demo, zlib support `deflate` as well
  var stream = request()
  const oldHeaders = stream.headers
  stream = stream.pipe(zlib.createGzip())
  stream.headers = oldHeaders
  stream.headers['content-encoding'] = 'gzip'
  return stream
}
