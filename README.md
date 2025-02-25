# co busboy

[![NPM version][npm-image]][npm-url]
[![Node.js CI](https://github.com/cojs/busboy/actions/workflows/nodejs.yml/badge.svg)](https://github.com/cojs/busboy/actions/workflows/nodejs.yml)
[![Test coverage][codecov-image]][codecov-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/co-busboy.svg?style=flat-square
[npm-url]: https://npmjs.org/package/co-busboy
[codecov-image]: https://codecov.io/github/cojs/busboy/coverage.svg?branch=master
[codecov-url]: https://codecov.io/github/cojs/busboy?branch=master
[download-image]: https://img.shields.io/npm/dm/co-busboy.svg?style=flat-square
[download-url]: https://npmjs.org/package/co-busboy

[busboy](http://github.com/mscdex/busboy) multipart parser using `co` or `koa`.

## Example

```js
const parse = require('co-busboy')

app.use(async (next) => {
  // the body isn't multipart, so busboy can't parse it
  if (!this.request.is('multipart/*')) return await next()

  const parts = parse(this)
  let part
  while (part = await parts()) {
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
const parse = require('co-busboy')

app.use(async (next) => {
  const parts = parse(this, {
    autoFields: true
  })
  let part
  while (part = await parts()) {
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

### Example for csrf check

Use `options.checkField` hook `function(name, val, fieldnameTruncated, valTruncated)`
can handle fields check.

```js
const parse = require('co-busboy')

app.use(async (next) => {
  const ctx = this
  const parts = parse(this, {
    checkField: (name, value) => {
      if (name === '_csrf' && !checkCSRF(ctx, value)) {
        var err =  new Error('invalid csrf token')
        err.status = 400
        return err
      }
    }
  })
  let part
  while (part = await parts()) {
    // ...
  }
})
```

### Example for filename extension check

Use `options.checkFile` hook `function(fieldname, file, filename, encoding, mimetype)`
can handle filename check.

```js
const parse = require('co-busboy')
const path = require('path')

app.use(async (next) => {
  const ctx = this
  const parts = parse(this, {
    // only allow upload `.jpg` files
    checkFile: (fieldname, file, filename) => {
      if (path.extname(filename) !== '.jpg') {
        var err = new Error('invalid jpg image')
        err.status = 400
        return err
      }
    }
  })
  let part
  while (part = await parts()) {
    // ...
  }
})
```

## API

### parts = parse(stream, [options])

```js
const parse = require('co-busboy')
const parts = parse(stream, {
  autoFields: true
})
```

`options` are passed to [busboy](https://github.com/mscdex/busboy).
The only additional option is `autoFields`.

**Note**: If busboy events `partsLimit`, `filesLimit`, `fieldsLimit` is emitted, will throw an error.

### part = await parts()

Await the next part.
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

```
The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com
Copyright (c) 2015 cojs and other contributors

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
```
