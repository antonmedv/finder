# finder

![finder](https://medv.io/assets/finder.png)

[![Test](https://github.com/antonmedv/finder/actions/workflows/test.yml/badge.svg)](https://github.com/antonmedv/finder/actions/workflows/test.yml)

**The CSS Selector Generator**

## Features

* Generates **shortest** CSS selectors.
* **Unique** CSS selectors per page.
* Stable and **robust** CSS selectors.
* Size: **1.5kb** (minified & gzipped).

## Install

```bash
npm install @medv/finder
```

## Usage 

```ts
import { finder } from '@medv/finder';

document.addEventListener('click', (event) => {
  const selector = finder(event.target);
});
```

## Example

An example of a generated selector:

```css
.blog > article:nth-of-type(3) .add-comment
```

## Configuration

```js
const selector = finder(event.target, {
  root: document.body,
  timeoutMs: 1000,  
  seedMinLength: 3,
  optimizedMinLength: 2,
});
```

### root

Defines the root of the search. Defaults to `document.body`.

### timeoutMs

Timeout to search for a selector. Defaults to `1000ms`. After the timeout, finder fallbacks to `nth-child` selectors.

### seedMinLength

Minimum length of levels in fining selector. Defaults to `3`.

### optimizedMinLength

Minimum length for optimising selector. Defaults to `2`.

## License

[MIT](LICENSE)
