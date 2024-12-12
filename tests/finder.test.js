import {test, assert, expect} from 'vitest'
import {JSDOM} from 'jsdom'
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname} from 'node:path'
import {finder} from '../finder.js'

import 'css.escape'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function check(html, config = {}) {
  const dom = new JSDOM(html)
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  const selectors = []
  for (let node of document.querySelectorAll('*')) {
    let css
    try {
      css = finder(node, config)
    } catch (err) {
      assert.ok(false, err.toString() + '\n    Node: ' + node.outerHTML.substring(0, 100))
    }
    assert.equal(document.querySelectorAll(css).length, 1, `Selector "${css}" selects more then one node.`)
    assert.equal(document.querySelector(css), node, `Selector "${css}" selects another node.`)
    selectors.push(css)
  }
  return selectors
}

test('github', () => {
  const selectors = check(readFileSync(__dirname + '/pages/github.com.html', 'utf8'))
  expect(selectors).toMatchSnapshot()
})

test('stripe', () => {
  const selectors = check(readFileSync(__dirname + '/pages/stripe.com.html', 'utf8'))
  expect(selectors).toMatchSnapshot()
})

test('deployer', () => {
  const selectors = check(readFileSync(__dirname + '/pages/deployer.org.html', 'utf8'))
  expect(selectors).toMatchSnapshot()
})

test('tailwindcss', () => {
  const selectors = check(readFileSync(__dirname + '/pages/tailwindcss.html', 'utf8'))
  expect(selectors).toMatchSnapshot()
})

test('duplicate', () => {
  const html = `
  <div id="foo"></div>
  <div id="foo"></div>
  `
  expect(check(html)).toMatchSnapshot()
})

test('duplicate:sub-nodes', () => {
  const html = `
  <div id="foo"><i></i></div>
  <div id="foo"><i></i></div>
  `
  expect(check(html)).toMatchSnapshot()
})
