# co busboy

[busboy](http://github.com/mscdex/busboy) multipart parser using `co` or `koa`.

## Example

```js
var parse = require('co-busboy')

app.use(function* (next) {
  // the body isn't multipart, so busboy can't parse it
  if (!this.request.is('multipart/*')) return yield next

  var parts = parse(this)
  var part
  while (part = yield parts) {
    if (part.length) {
      // arrays are busboy fields
      console.log('key: ' + part[0])
      console.log('value: ' + part[1])
    } else {
      // otherwise, it's a stream
      part.pipe(fs.createWriteStream('some file.txt'))
    }
  }
  console.log('and we are done parsing the form!')
})
```

Note that parts will be delievered in the order they are defined in the form.
Put your CSRF token first in the form and your larger files last.

If you want `co-busboy` to automatically handle the fields,
set the `autoFields: true` option.
Now all the parts will be streams and a field object and array will automatically be populated.

```js
var parse = require('co-busboy')

app.use(function* (next) {
  var parts = parse(this, {
    autoFields: true
  })
  var part
  while (part = yield parts) {
    // it's a stream
    part.pipe(fs.createWriteStream('some file.txt'))
  }
  console.log('and we are done parsing the form!')
  // .field holds all the fields in key/value form
  console.log(parts.field._csrf)
  // .fields holds all the fields in [key, value] form
  console.log(parts.fields[0])
})
```

## API

### parts = parse(stream, [options])

```js
var parse = require('co-busboy')
var parts = parse(stream, {
  autoFields: true
})
```

`options` are passed to [busboy](https://github.com/mscdex/busboy).
The only additional option is `autoFields`.

**Note**: If busboy events `partsLimit`, `filesLimit`, `fieldsLimit` is emitted, will throw an error.

### part = yield parts

Yield the next part.
If `autoFields: true`, this will always be a file stream.
Otherwise, it will be a [field](https://github.com/mscdex/busboy#busboy-special-events) as an array.

- Readable Stream

    - `fieldname`
    - `filename`
    - `transferEncoding` or `encoding`
    - `mimeType` or `mime`

- Field[]

    0. `fieldname`
    1. `value`
    2. `valueTruncated` - `Boolean`
    3. `fieldnameTruncated` - Boolean

If falsey, then the parser is done.

### parts.field{}

If `autoFields: true`, this object will be populated with key/value pairs.

### parts.fields[]

If `autoFields: true`, this array will be populated with all fields.

## License

The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
