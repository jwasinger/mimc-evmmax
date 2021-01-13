const { bn128_params, bls12381_params, MASK128} = require('./util.js')
const { fromMont, toMont, mulmodmont } = require("./montmul-reference.js")
const assert = require('assert')

function testCurve(curve_params) {
    // r == mulmodmont(r**2, 1)
    assert.strictEqual(curve_params.r % curve_params.modulus, mulmodmont(curve_params.r_squared, 1n, curve_params))

    // r**2 = r * r % mod
    assert.strictEqual(curve_params.r_squared, (curve_params.r * curve_params.r) % curve_params.modulus)

    // to/from mont conversion
    assert.strictEqual(fromMont(toMont(2n, curve_params), curve_params), 2n)

    // r == mulmodmont(r**2, 1)
    assert.strictEqual(curve_params.r % curve_params.modulus, mulmodmont(curve_params.r_squared, 1n, curve_params))

    // test 2 * 2 = 4 in montgomery
    let a = toMont(2n, curve_params)
    let b = toMont(2n, curve_params)
    let res = mulmodmont(a, b, curve_params)
    assert.strictEqual(fromMont(res, curve_params), 4n)

    // test (mod_inv * mod) % aux_mod == -1 % aux_mod
    // but I still don't know why aux_mod is defined the way it is here (even tho wikipedia says it should be R...  it's 2**64 for bn128 and bls12381)
    // maybe its some kind of optimization (?)
    assert.strictEqual((curve_params.r_inv * curve_params.modulus) % curve_params.aux_mod, curve_params.aux_mod - 1n)
}

testCurve(bn128_params)
