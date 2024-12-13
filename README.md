# finder

![finder](https://medv.io/assets/finder.png)

**The CSS Selector Generator**

[![Test](https://github.com/antonmedv/finder/actions/workflows/test.yml/badge.svg)](https://github.com/antonmedv/finder/actions/workflows/test.yml)
[![JSR](https://jsr.io/badges/@medv/finder)](https://jsr.io/@medv/finder)

## Features

* Generates **shortest** CSS selectors
* **Unique** CSS selectors per page
* Stable and **robust** CSS selectors
* Size: **1.5kb** (minified & gzipped)

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
});
```

### root

Defines the root of the search. Defaults to `document.body`.

### timeoutMs

Timeout to search for a selector. Defaults to `1000ms`. After the timeout, finder fallbacks to `nth-child` selectors.

### className

Function that determines if a class name may be used in a selector. Defaults to a word-like class names.

You can extend the default behaviour wrapping the `className` function:

```js
import { finder, className } from '@medv/finder';

finder(event.target, {
  className: name => className(name) || name.startsWith('my-class-'),
});
```

### tagName

Function that determines if a tag name may be used in a selector. Defaults to `() => true`.

### attr

Function that determines if an attribute may be used in a selector. Defaults to a word-like attribute names and values.

You can extend the default behaviour wrapping the `attr` function:

```js
import { finder, attr } from '@medv/finder';

finder(event.target, {
  attr: (name, value) => attr(name, value) || name.startsWith('data-my-attr-'),
});
```

### idName

Function that determines if an id name may be used in a selector. Defaults to a word-like id names.

### seedMinLength

Minimum length of levels in fining selector. Defaults to `3`.

### optimizedMinLength

Minimum length for optimising selector. Defaults to `2`.

## License

[MIT](LICENSE)
