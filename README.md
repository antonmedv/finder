![finder](https://user-images.githubusercontent.com/141232/36463709-381f8c36-16fe-11e8-8fdc-fcbdd4f2a36c.png)

# finder

[![Build Status](https://travis-ci.org/antonmedv/finder.svg?branch=master)](https://travis-ci.org/antonmedv/finder)

> CSS Selector Generator

## Features

* Generates **shortest** selectors
* **Unique** selectors per page
* Stable and **robust** selectors
* **2.9 kB** gzip and minify size

## Install

```bash
npm install @medv/finder
```

<a href="https://www.patreon.com/antonmedv">
	<img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## Usage 

```js
import finder from '@medv/finder'

document.addEventListener('click', event => {
  const selector = finder(event.target)
  console.log(selector)  
})
```

## Example

Example of generated selector:

```css
.blog > article:nth-child(3) .add-comment
```

## Configuration

`finder` takes configuration object as second parameters. Here is example of all params with default values:

```js
const selector = finder(event.target, {
  root: document.body,
  className: (name) => true,
  tagName: (name) => true,
  seedMinLength: 1,
  optimizedMinLength: 2,
  threshold: 1000
})
```

#### `root: Element`

Root of search, defaults to `document.body`.

#### `idName: (name: string) => boolean`

Check if this ID can be used. For example you can restrict using framework specific IDs:

```js
const selector = finder(event.target, {
  idName: name => !name.startsWith('ember')
})
```

#### `className: (name: string) => boolean`

Check if this class name can be used. For example you can restrict using _is-*_ class names:

```js
const selector = finder(event.target, {
  className: name => !name.startsWith('is-')
})
```

#### `tagName: (name: string) => boolean`

Check if tag name can be used, same as `className`.

#### `seedMinLength: number`

Minimum length of levels in fining selector. Starts from `1`. 
For more robust selectors give this param value around 4-5 depending on depth of you DOM tree. 
If `finder` hits `root` this param is ignored.

#### `optimizedMinLength: number`

Minimum length for optimising selector. Starts from `2`. 
For example selector `body > div > div > p` can be optimized to `body p`.

#### `threshold: number`

Max number of selectors to check before falling into `nth-child` usage. 
Checking for uniqueness of selector is very costs operation, if you have DOM tree depth of 5, with 5 classes on each level, 
that gives you more than 3k selectors to check. 
`finder` uses two step approach so it's reaching this threshold in some cases twice.
Default `1000` is good enough in most cases.  

### Comparison with [optimal-select](https://github.com/Autarc/optimal-select)

`optimal-select` fails to generate selectors some times, and some times generates not unique selectors.
`finder` generates shorter selectors than optimal-select. Also optimal-select now does not have tests and we have :)
 
For example, on github.com page:

|          | finder | optimal-select |
|----------|--------|----------------| 
| fails    | 0      | 42             |
| shortest | 404    | 38             | 
| longest  | `.story:nth-child(3) .d-lg-flex:nth-child(2) > .width-full:nth-child(1)` | `[class="circle d-flex flex-column flex-justify-center text-center p-4 mx-auto mt-6 mb-3 m-md-3 bg-orange box-shadow-extra-large"] [class="d-block f0-light text-white lh-condensed-ultra mb-2"]` |
| size     | 2.9 kB | 4.58 kB        |

### Google Chrome Extension

![Chrome Extension](https://user-images.githubusercontent.com/141232/36737287-4a999d84-1c0d-11e8-8a14-43bcf9baf7ca.png)

Generate the unique selectors in your browser by using [Chrome Extension](https://chrome.google.com/webstore/detail/get-unique-css-selector/lkfaghhbdebclkklgjhhonadomejckai)

## License

MIT
