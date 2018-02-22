import selector from '../../dist'
import {readFileSync} from 'fs'

export default function check(t, html, config = void 0) {
  document.write(html)

  const list = []

  // Bug in jsdom: svg can't be queried.
  for(let node of document.querySelectorAll('*:not(svg):not(path):not(circle):not(title):not(g):not(rect)')) {

    const css = selector(node, config)

    t.is(document.querySelectorAll(css).length, 1, `Selector "${css}" selects more then one node.`)
    t.is(document.querySelector(css), node, `Selector "${css}" selects another node.`)

    list.push(css)
  }

  t.snapshot(list.join('\n'))

  document.clear()
}
