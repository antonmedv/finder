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

## Usage 

```js
import finder from '@medv/finder'

document.addEventListener('click', event => {
  const selector = finder(event.target)
  console.log(selector)  
})
```

## Example

```css
.blog > article:nth-child(3) .add-comment
```

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

## License

MIT
