# anchor
![tests](https://github.com/substrate-system/anchor/actions/workflows/nodejs.yml/badge.svg)
[![types](https://img.shields.io/npm/types/@substrate-system/anchor?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![install size](https://flat.badgen.net/packagephobia/install/@substrate-system/anchor)](https://packagephobia.com/result?p=@substrate-system/anchor?cache-control=no-cache)
[![dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg?style=flat-square)](package.json)
[![license](https://img.shields.io/badge/license-Polyform_Strict-f52f2f?style=flat-square)](LICENSE)

Add anchor links to the headings in a document.

[See a live demo](https://substrate-system.github.io/anchor/)

This has been adapted from [bryanbraun/anchorjs](https://github.com/bryanbraun/anchorjs). Thanks [@bryanbraun](https://github.com/bryanbraun) for working in open source.

<details><summary><h2>Contents</h2></summary>

<!-- toc -->

- [install](#install)
- [Modules](#modules)
  * [ESM](#esm)
  * [Common JS](#common-js)
  * [pre-built JS](#pre-built-js)
- [CSS](#css)
  * [Import CSS](#import-css)

<!-- tocstop -->

</details>

## install

```sh
npm i -S @substrate-system/anchor
```

## Example

```js
// import a function
import { anchor } from '@substrate-system/anchor'

// import the class
import { Anchor } from '@substrate-system/anchor'

// Use defaults for everything.
// This will target any h2, h3, h4, or h5 tags
anchor()

// Or use the class.
// Must call a.add after creating an instance
// these are the default options
const a = new Anchor()
```

## Modules

This exposes ESM and common JS via [package.json `exports` field](https://nodejs.org/api/packages.html#exports).

### ESM
```js
import { Anchor } from '@substrate-system/anchor'
```

### Common JS
```js
const Anchor = require('@substrate-system/anchor/module')
```

### pre-built JS
This package exposes minified JS files too. Copy them to a location that is
accessible to your web server, then link to them in HTML.

#### copy
```sh
cp ./node_modules/@substrate-system/anchor/dist/index.min.js ./public/anchor.min.js
```

#### HTML
```html
<script type="module" src="./anchor.min.js"></script>
```

## API

### options

```ts
type AnchorOpts = {
    // Characters like  '#', '¶', '❡', or '§'.
    icon:string;
    visible:'hover'|'always'|'touch';
    placement:'right'|'left';
    ariaLabel:string;  // any text, default "Anchor"
    class:string;  // css class name
    base:string;  // any base URI
    truncate:number;  // Max length. Default 64
    titleText:string;  // any text
}
```

### `Anchor`

```js
class Anchor {
    constructor (opts:Partial<AnchorOpts> = {
        icon: '\uE9CB',
        visible: 'always'
    })
}
```

### `anchor`
Lower case `anchor` is a function that will create a new `Anchor` and call
`.add()`.

```ts
function anchor (opts:Partial<AnchorOpts> = {}):Anchor
```
