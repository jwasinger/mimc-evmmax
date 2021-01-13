const MASK64 = 0xffffffffffffffffn
const MASK128 = 0xffffffffffffffffffffffffffffffffn
const MASK192 = 0xffffffffffffffffffffffffffffffffffffffffffffffffn

const bn128_params = require("./bn128-params.js")
const bls12381_params = require("./bls12381-params.js")

module.exports = {
    MASK64,
    MASK128,
    MASK192,
    bn128_params,
    bls12381_params
}
