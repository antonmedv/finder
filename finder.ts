// License: MIT
// Author: Anton Medvedev <anton@medv.io>
// Source: https://github.com/antonmedv/finder

type Knot = {
  name: string
  penalty: number
  level?: number
}

export type Options = {
  root: Element
  idName: (name: string) => boolean
  className: (name: string) => boolean
  tagName: (name: string) => boolean
  attr: (name: string, value: string) => boolean
  seedMinLength: number
  optimizedMinLength: number
  timeoutMs: number
}

export function finder(input: Element, options?: Partial<Options>): string {
  const startTime = new Date()
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
    seedMinLength: 2,
    optimizedMinLength: 2,
    timeoutMs: 1000,
  }

  const config = {...defaults, ...options}
  const rootDocument = findRootDocument(config.root, defaults)

  const stack: Knot[][] = []
  let paths: Knot[][] = []
  let foundPath: Knot[] | undefined
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

    paths.push(...combinations(stack))

    if (i >= config.seedMinLength) {
      foundPath = search(paths, config, rootDocument, startTime)
      if (foundPath) {
        break
      }
      paths = []
    }
  }

  if (paths.length > 0) {
    foundPath = search(paths, config, rootDocument, startTime)
  }

  if (!foundPath) {
    throw new Error(`Selector was not found.`)
  }

  const optimized = [...optimize(foundPath, input, config, rootDocument, startTime)]
  optimized.sort(byPenalty)
  if (optimized.length > 0) {
    return selector(optimized[0])
  }
  return selector(foundPath)
}

function search(paths: Knot[][], config: Options, rootDocument: Element | Document, startTime: Date) {
  paths.sort(byPenalty)
  for (const candidate of paths) {
    const elapsedTimeMs = new Date().getTime() - startTime.getTime()
    if (elapsedTimeMs > config.timeoutMs) {
      for (let i = paths.length - 1; i >= paths.length - 10 && i >= 0; i--) {
        if (unique(paths[i], rootDocument)) {
          return paths[i]
        }
      }
      throw new Error(`Timeout: Can't find a unique selector after ${elapsedTimeMs}ms`)
    }
    if (unique(candidate, rootDocument)) {
      return candidate
    }
  }
}

function wordLike(name: string) {
  if (/^[a-z0-9\-]{3,}$/i.test(name)) {
    const words = name.split(/-|[A-Z]/)
    for (const word of words) {
      if (word.length <= 2) {
        return false
      }
      if (/[^aeiou]{4,}/i.test(word)) {
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
      name: `:nth-child(${nth})`,
      penalty: 9,
    })
  }

  return level
}

function selector(path: Knot[]): string {
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

function penalty(path: Knot[]): number {
  return path.map((node) => node.penalty).reduce((acc, i) => acc + i, 0)
}

function byPenalty(a: Knot[], b: Knot[]) {
  return penalty(a) - penalty(b)
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

function findRootDocument(rootNode: Element | Document, defaults: Options) {
  if (rootNode.nodeType === Node.DOCUMENT_NODE) {
    return rootNode
  }
  if (rootNode === defaults.root) {
    return rootNode.ownerDocument as Document
  }
  return rootNode
}

function unique(path: Knot[], rootDocument: Element | Document) {
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

function* optimize(
  path: Knot[],
  input: Element,
  config: Options,
  rootDocument: Element | Document,
  startTime: Date,
): Generator<Knot[]> {
  if (path.length > 2 && path.length > config.optimizedMinLength) {
    for (let i = 1; i < path.length - 1; i++) {
      const elapsedTimeMs = new Date().getTime() - startTime.getTime()
      if (elapsedTimeMs > config.timeoutMs) {
        return
      }
      const newPath = [...path]
      newPath.splice(i, 1)
      if (unique(newPath, rootDocument) && rootDocument.querySelector(selector(newPath)) === input) {
        yield newPath
        yield* optimize(newPath, input, config, rootDocument, startTime)
      }
    }
  }
}
