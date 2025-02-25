
2.0.2 / 2025-02-20
==================

**fixes**
  * [[`c0fafde`](https://github.com/cojs/busboy/commit/86813312c340ad1bf59db349fda399347c0fafde)] - fix: catch 'Unexpected end of form' error when receive malformed multipart (#50) (dennisleung <<xiyuxistory@163.com>>)

2.0.1 / 2023-05-07
==================

**fixes**
  * [[`448fc4b`](http://github.com/cojs/busboy/commit/448fc4b7af677009749a9f4ebfb9048ec3b20f53)] - fix: catch file stream error (#31) (Xin Hao <<haoxinst@gmail.com>>)

2.0.0 / 2022-09-16
==================

**others**
  * [[`d33789a`](http://github.com/cojs/busboy/commit/d33789a2af0b04fb9a68b1016a70857fc5f3c584)] - BREAKING CHANGE: update busboy to 1.x and node 14.x (#48) (TZ | 天猪 <<atian25@qq.com>>)

1.5.0 / 2021-04-12
==================

**features**
  * [[`e99083c`](http://github.com/cojs/busboy/commit/e99083c62f85a6bab84821cd677fc49e726a9ae8)] - feat: unzip http stream (#43) (Artin <<lengthmin@gmail.com>>)

1.4.1 / 2020-07-30
==================

**fixes**
  * [[`95127c9`](http://github.com/cojs/busboy/commit/95127c9ae202024b8117b35403cb52680b1aef81)] - fix: compatible with node14 (#42) (killa <<killa123@126.com>>)

1.4.0 / 2017-10-12
==================

**features**
  * [[`99c1385`](http://github.com/cojs/busboy/commit/99c1385423a32c2919f93871b68772f47088bc61)] - feat: parts() return promise (#37) (Yiyu He <<dead_horse@qq.com>>)

**others**
  * [[`750e8d2`](http://github.com/cojs/busboy/commit/750e8d284d649bf2b7f938ee345d150a44eb4dbb)] - clean gitignore (haoxin <<coderhaoxin@outlook.com>>)
  * [[`a59ff69`](http://github.com/cojs/busboy/commit/a59ff69d8093579c781b37ac9f449b8df86991e0)] - remove Makefile, use npm scripts (haoxin <<coderhaoxin@outlook.com>>)
  * [[`3a1a887`](http://github.com/cojs/busboy/commit/3a1a887142ca9452183d587efed53a5cfd840bdd)] - travis: node@4+ (haoxin <<coderhaoxin@outlook.com>>)

1.3.1 / 2015-09-23
==================

 * test: use codecov.io instead of coveralls
 * fix: need read all request's datas when error happened
 * test: add node version 1, 2, 3, 4

1.3.0 / 2015-03-02
==================

 * improve tests and coverage
 * add checkFile hook to do file check, like limit filenam extension
 * add checkField hook to do prepare jobs, like csrf

1.2.1 / 2015-02-28
==================

 * avoid slicing arguments
