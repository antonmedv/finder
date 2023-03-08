![finder](https://medv.io/assets/finder.png)

# finder

[![Test](https://github.com/antonmedv/finder/actions/workflows/test.yml/badge.svg)](https://github.com/antonmedv/finder/actions/workflows/test.yml)

**The CSS Selector Generator**

## Features

* Generates the **shortest** selector
* **Unique** selectors per page
* Stable and **robust** selectors
* **2kB** minified + gzipped

## Install

```bash
npm install @medv/finder
```

## Usage 

```js
import {finder} from '@medv/finder'

document.addEventListener('click', event => {
  const selector = finder(event.target)
  console.log(selector)  
})
```

## Example

An example of a generated selector:

```css
.blog > article:nth-child(3) .add-comment
```

## Configuration

```js
const selector = finder(event.target, {
  root: document.body,          // Root of search, defaults to document.body.
  idName: (name) => true,       // Check if this ID can be used.
  className: (name) => true,    // Check if this class name can be used.
  tagName: (name) => true,      // Check if tag name can be used.
  attr: (name, value) => false, // Check if attr name can be used.
  seedMinLength: 1,           
  optimizedMinLength: 2,
  threshold: 1000,
  maxNumberOfTries: 10_000,
})
```

### seedMinLength

Minimum length of levels in fining selector. Starts from `1`. 
For more robust selectors give this param value around 4-5 depending on depth of
you DOM tree. If finder hits the `root`, this param is ignored.

### optimizedMinLength

Minimum length for optimising selector. Starts from `2`. 
For example selector `body > div > div > p` can be optimised to `body p`.

### threshold

Max number of selectors to check before falling into `nth-child` usage. 
Checking for uniqueness of selector is very costly operation, if you have DOM 
tree depth of 5, with 5 classes on each level, that gives you more than 3k 
selectors to check. Default `1000` is good enough in most cases.  

### maxNumberOfTries

Max number of tries for the optimization. This is a trade-off between
optimization and efficiency. Default `10_000` is good enough in most cases.

## License

[MIT](LICENSE)
