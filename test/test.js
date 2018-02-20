import test from 'ava'
import check from './helpers/check'

test('github', t => {
  check(t, __dirname + '/pages/github.com.html')
})

test('stripe', t => {
  check(t, __dirname + '/pages/stripe.com.html')
})

test('deployer', t => {
  check(t, __dirname + '/pages/deployer.org.html')
})

