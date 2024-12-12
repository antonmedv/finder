// License: MIT
// Author: Anton Medvedev <anton@medv.io>
// Source: https://github.com/antonmedv/finder

type Knot = {
  name: string
  penalty: number
  level?: number
}

type Path = Knot[]

export type Options = {
  root: Element
  idName: (name: string) => boolean
  className: (name: string) => boolean
  tagName: (name: string) => boolean
  attr: (name: string, value: string) => boolean
  timeoutMs: number | undefined
}

export function finder(input: Element, options?: Partial<Options>): string {
  //const startTime = new Date()
  if (input.nodeType !== Node.ELEMENT_NODE) {
    throw new Error(`Can't generate CSS selector for non-element node type.`)
  }
  if (input.tagName.toLowerCase() === 'html') {
    return 'html'
  }
  const defaults: Options = {
    root: document.body,
    idName: wordLike,
    className: wordLike,
    tagName: (name: string) => true,
    attr: (name: string, value: string) => false,
    timeoutMs: undefined,
  }

  const config = {...defaults, ...options}
  const rootDocument = findRootDocument(config.root, defaults)

  const stack: Knot[][] = []
  let current: Element | null = input
  let i = 0
  while (current) {
    const level = tie(current, config)
    for (let node of level) {
      node.level = i
    }
    stack.push(level)
    current = current.parentElement
    i++

    const paths = sort(combinations(stack))
    for (const candidate of paths) {
      if (unique(candidate, rootDocument)) {
        return selector(candidate)
      }
    }
  }

  throw new Error(`Selector was not found.`)
}

function wordLike(name: string) {
  if (/^[a-z0-9\-]{3,}$/i.test(name)) {
    const words = name.split(/-|[A-Z]/)
    for (const word of words) {
      if (word.length <= 2) { // No short words.
        return false
      }
      if (/[^aeiou]{3,}/i.test(word)) { // 3 or more consonants in a row.
        return false
      }
    }
    return true
  }
  return false
}

function tie(element: Element, config: Options): Knot[] {
  const level: Knot[] = []

  const elementId = element.getAttribute('id')
  if (elementId && config.idName(elementId)) {
    level.push({
      name: '#' + CSS.escape(elementId),
      penalty: 0,
    })
  }

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i]
    if (config.attr(attr.name, attr.value)) {
      level.push({
        name: `[${CSS.escape(attr.name)}="${CSS.escape(attr.value)}"]`,
        penalty: 1,
      })
    }
  }

  for (let i = 0; i < element.classList.length; i++) {
    const name = element.classList[i]
    if (config.className(name)) {
      level.push({
        name: '.' + CSS.escape(name),
        penalty: 2,
      })
    }
  }

  const tagName = element.tagName.toLowerCase()
  if (config.tagName(tagName)) {
    level.push({
      name: tagName,
      penalty: 3,
    })

    const index = indexOf(element, tagName)
    if (index !== undefined) {
      level.push({
        name: `${tagName}:nth-of-type(${index})`,
        penalty: 4,
      })
    }
  }

  const nth = indexOf(element)
  if (nth !== undefined) {
    level.push({
      name: `*:nth-child(${nth})`,
      penalty: 9,
    })
  }

  return level
}

function selector(path: Path): string {
  let node = path[0]
  let query = node.name
  for (let i = 1; i < path.length; i++) {
    const level = path[i].level || 0
    if (node.level === level - 1) {
      query = `${path[i].name} > ${query}`
    } else {
      query = `${path[i].name} ${query}`
    }
    node = path[i]
  }
  return query
}

function penalty(path: Path): number {
  return path.map((node) => node.penalty).reduce((acc, i) => acc + i, 0)
}

function indexOf(input: Element, tagName?: string): number | undefined {
  const parent = input.parentNode
  if (!parent) {
    return undefined
  }
  let child = parent.firstChild
  if (!child) {
    return undefined
  }
  let i = 0
  while (child) {
    if (
      child.nodeType === Node.ELEMENT_NODE
      && (
        tagName === undefined
        || (child as Element).tagName.toLowerCase() === tagName
      )
    ) {
      i++
    }
    if (child === input) {
      break
    }
    child = child.nextSibling
  }
  return i
}

function* combinations(stack: Knot[][], path: Knot[] = []): Generator<Knot[]> {
  if (stack.length > 0) {
    for (let node of stack[0]) {
      yield* combinations(stack.slice(1, stack.length), path.concat(node))
    }
  } else {
    yield path
  }
}

function sort(paths: Iterable<Path>): Path[] {
  return [...paths].sort((a, b) => penalty(a) - penalty(b))
}

function findRootDocument(rootNode: Element | Document, defaults: Options) {
  if (rootNode.nodeType === Node.DOCUMENT_NODE) {
    return rootNode
  }
  if (rootNode === defaults.root) {
    return rootNode.ownerDocument as Document
  }
  return rootNode
}

function unique(path: Path, rootDocument: Element | Document) {
  const css = selector(path)
  switch (rootDocument.querySelectorAll(css).length) {
    case 0:
      throw new Error(
        `Can't select any node with this selector: ${css}`,
      )
    case 1:
      return true
    default:
      return false
  }
}

