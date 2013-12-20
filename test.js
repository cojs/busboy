var co = require('co')
var Stream = require('stream')
var assert = require('assert')

var busboy = require('./')

describe('Co Busboy', function () {
  it('should work without autofields', function (done) {
    co(function*(){
      var parts = busboy(request());
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
      assert.equal(fields, 3)
      assert.equal(streams, 2)
    })(done)
  })

  it('should work with autofields', function (done) {
    co(function*(){
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
      assert.equal(parts.fields.length, 3)
      assert.equal(Object.keys(parts.field).length, 2)
    })(done)
  })

  it('should work with delays', function (done) {
    co(function*(){
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
    })(done)
  })
  
  it('should not overwrite prototypes', function (done) {
    co(function*(){
      var parts = busboy(request(), {
        autoFields: true
      });
      var part;
      while (part = yield parts) {
        if (!part.length) part.resume()
      };
      assert.equal(parts.field.hasOwnProperty, Object.prototype.hasOwnProperty);
    })(done)
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
    'Content-Disposition: form-data; name="file_name_1"',
    '',
    'super beta file',
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