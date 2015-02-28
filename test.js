var co = require('co')
var Stream = require('stream')
var assert = require('assert')
var path = require('path')

var busboy = require('./')

describe('Co Busboy', function () {
  it('should work without autofields', function () {
    return co(function*(){
      var parts = busboy(request());
      var part;
      var fields = 0;
      var streams = 0;
      while (part = yield parts) {
        if (part.length) {
          assert.equal(part.length, 4)
          fields++
        } else {
          streams++
          part.resume()
        }
      }
      assert.equal(fields, 5)
      assert.equal(streams, 2)
    })
  })

  it('should work with autofields', function () {
    return co(function*(){
      var parts = busboy(request(), {
        autoFields: true
      });
      var part;
      var fields = 0;
      var streams = 0;
      while (part = yield parts) {
        if (part.length) {
          fields++
        } else {
          streams++
          part.resume()
        }
      }
      assert.equal(fields, 0)
      assert.equal(streams, 2)
      assert.equal(parts.fields.length, 5)
      assert.equal(Object.keys(parts.field).length, 3)
    })
  })

  it('should work with autofields and arrays', function () {
    return co(function*(){
      var parts = busboy(request(), {
        autoFields: true
      });
      var part;
      while (part = yield parts) {
        part.resume()
      }
      assert.equal(Object.keys(parts.field).length, 3)
      assert.equal(parts.field['file_name_0'].length, 2)
    })
  })

  it('should work with delays', function () {
    return co(function*(){
      var parts = busboy(request(), {
        autoFields: true
      });
      var part;
      var streams = 0;
      while (part = yield parts) {
        streams++
        part.resume()
        yield wait(10)
      }
      assert.equal(streams, 2)
    })
  })

  it('should not overwrite prototypes', function () {
    return co(function*(){
      var parts = busboy(request(), {
        autoFields: true
      });
      var part;
      while (part = yield parts) {
        if (!part.length) part.resume()
      };
      assert.equal(parts.field.hasOwnProperty, Object.prototype.hasOwnProperty);
    })
  })

  it('should throw error when the files limit is reached', function () {
    return co(function*(){
      var parts = busboy(request(), {
        limits: {
          files: 1
        }
      });
      var part;
      var error;
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

  it('should use options.checkField do csrf check', function () {
    return co(function*(){
      var parts = busboy(request(), {
        checkField: function (name, value) {
          if (name === '_csrf' && value !== 'pass') {
            return new Error('invalid csrf token')
          }
        }
      });
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
          if (path.extname(filename) !== '.jpg') {
            return new Error('invalid filename extension')
          }
        }
      });
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
   '-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k--'
  ].join('\r\n'))

  return stream
}
