import { JSDOM } from 'jsdom'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { finder } from '../finder.js'

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
    assert.is(document.querySelectorAll(css).length, 1,
      `Selector "${css}" selects more then one node.`)
    assert.is(document.querySelector(css), node,
      `Selector "${css}" selects another node.`)
    selectors.push(css)
  }
  return selectors
}

test('github', () => {
  const selectors = check(readFileSync(__dirname + '/pages/github.com.html', 'utf8'))
  assert.fixture(selectors.join('\n') + '\n', readFileSync(__dirname + '/pages/github.com.txt', 'utf8'))
})

test('stripe', () => {
  const selectors = check(readFileSync(__dirname + '/pages/stripe.com.html', 'utf8'))
  assert.fixture(selectors.join('\n') + '\n', readFileSync(__dirname + '/pages/stripe.com.txt', 'utf8'))
})

test('deployer', () => {
  const selectors = check(readFileSync(__dirname + '/pages/deployer.org.html', 'utf8'))
  assert.fixture(selectors.join('\n') + '\n', readFileSync(__dirname + '/pages/deployer.org.txt', 'utf8'))
})

test('config:seed', () => {
  const html = `
  <div>
    <span>
      <p></p>
    </span>
  </div>
  `
  check(html)
  check(html, {seedMinLength: 3})
  check(html, {seedMinLength: 3, optimizedMinLength: 3})
  check(html, {threshold: 2})
})

test('config:threshold', () => {
  const html = `
  <div>
    <p></p>
    <p></p>
    <p></p>
  </div>
  `
  check(html, {threshold: 1})
})

test('config:fun', () => {
  const html = `
  <div>
    <div></div>
  </div>
  `
  check(html, {tagName: tag => tag !== 'div'})
})

test('config:id', () => {
  const html = `
  <div id="test">
    <div></div>
  </div>
  `
  check(html, {idName: id => id !== 'test'})
})

test('config:attr', () => {
  const html = `
  <div data-test="1">
    <div data-qa="2"></div>
    <div data-qa="3"></div>
  </div>
  `
  check(html, {
    attr: (name, value) => {
      return name !== 'data-test' && name === 'data-qa' && value % 2 === 0
    }
  })
})

test('duplicate', () => {
  const html = `
  <div id="foo"></div>
  <div id="foo"></div>
  `
  check(html)
})

test('duplicate:sub-nodes', () => {
  const html = `
  <div id="foo"><i></i></div>
  <div id="foo"><i></i></div>
  `
  check(html)
})

test.run()
