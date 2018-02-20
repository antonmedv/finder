import test from 'ava'
import check from './helpers/check'

test('github', t => {
  check(t, __dirname + '/pages/github.com')
})

test('stripe', t => {
  check(t, __dirname + '/pages/stripe.com')
})

test('deployer', t => {
  check(t, __dirname + '/pages/deployer.org')
})

