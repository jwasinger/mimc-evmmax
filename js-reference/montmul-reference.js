const { bn128_params, bls12381_params, MASK128} = require('./util.js')

function toMont(a, curve_params) {
    // mont form of a: aR % modulus
    return (a << 256n) % curve_params.modulus 
}

function fromMont(a, curve_params) {
    return mulmodmont(a, 1n, curve_params)
}

function mulmodmont(a, b, curve_params) {
  var t = a * b
  var k0 = (t * curve_params.r_inv) & MASK128
  var res2 = ((k0 * curve_params.modulus) + t) >> 128n
  var k1 = (res2 * curve_params.r_inv) & MASK128
  var result = ((k1 * curve_params.modulus) + res2) >> 128n

  if ( result >= curve_params.modulus) {
    result -= curve_params.modulus
  }
  return result
}

// tests for bn128
let a = toMont(2n, bn128_params)
let b = toMont(2n, bn128_params)
let res = mulmodmont(a, b, bn128_params)

if (fromMont(res, bn128_params) !== 4n) {
    throw("fromMont/toMont broken")
}

// a is  the first nonzero round constant in montgomery form
a = 0x53e27bc8307157ce5836bff1f4ee44ae7bdd790e2e696e0965ac8dfe4478c84n
let a_squared = mulmodmont(a, a, bn128_params)
if (a_squared.toString(16) !== '47643d8d4b33bf5a14371bd30f7474749ac07fa02ba7ac1c1f1595af9f9688c') {
    throw("square broken")
}

module.exports = {
    fromMont,
    toMont,
    mulmodmont
}
