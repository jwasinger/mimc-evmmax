const { bn128_curve_order, bn128_r_inv, bn128_r_squared, MASK128} = require('./bn128-params.js')

function toMont(a) {
    return (a << 256n) % bn128_curve_order
}

function fromMont(a) {
    return mulmodmont(a, 1n)
}

function mulmodmont(a, b) {
  var t = a * b
  var k0 = (t * bn128_r_inv ) & MASK128
  var res2 = ((k0 * bn128_curve_order) + t) >> 128n
  var k1 = (res2 * bn128_r_inv ) & MASK128
  var result = ((k1 * bn128_curve_order) + res2) >> 128n // k1.mul(bn128_curve_order).add(res2).shrn(128);

  if ( result >= bn128_curve_order) {
    reult -= bn128_curve_order
  }
  return result
}

let a = toMont(2n)
let b = toMont(2n)
let res = mulmodmont(a, b)

if (fromMont(res) !== 4n) {
    throw("fromMont/toMont broken")
}

// a is  the first nonzero round constant in montgomery form
a = 0x53e27bc8307157ce5836bff1f4ee44ae7bdd790e2e696e0965ac8dfe4478c84n
let a_squared = mulmodmont(a, a)
if (a_squared.toString(16) !== '47643d8d4b33bf5a14371bd30f7474749ac07fa02ba7ac1c1f1595af9f9688c') {
    throw("square broken")
}

module.exports = {
    fromMont,
    toMont,
    mulmodmont
}
