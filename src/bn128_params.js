const { gen_return, gen_mstore, gen_push, constants } = require("./util.js")

let BN128_CURVE_ORDER = 21888242871839275222246405745257275088548364400416034343698204186575808495617n

// lower 64 bits of modular inverse of the montgomery parameter (with curve order as modulus)?  why do we only need this part for montmul?
// 134950519161967129512891662437158223871n  & 0xffffffffffffffff = 
let BN128_R_INV = 0xc2e1f593efffffffn

const SIZE_F = constants.SIZE_F

function bigint_to_le_hexstring(bigint) {
    str = bigint.toString(16)
    if (str.length % 2 != 0) {
        str = "0" + str
    }

    pieces = []
    for (let i = 0; i < str.length; i++) {
        if (i % 2 == 0) {
            pieces = pieces.concat(str[i] + str[i + 1])
        }
    }

    pieces.reverse()

    //return "".join(pieces)
    return pieces.join("")
}

// TODO rename these to indicate that they are little endian literals
BN128_CURVE_ORDER = bigint_to_le_hexstring(BN128_CURVE_ORDER)
BN128_R_INV = bigint_to_le_hexstring(BN128_R_INV) + '0'.repeat(48)

function init_curve_params(offset) {
    return gen_mstore(offset, BN128_CURVE_ORDER) + gen_mstore(offset + SIZE_F, BN128_R_INV)
}

module.exports = {
    modulus: BN128_CURVE_ORDER,
    r_inv: BN128_R_INV, // comes from https://github.com/cdetrio/wabt/blob/bls12-bignums-working/src/interp/interp.cc#L130
    init_curve_params: init_curve_params,
    bigint_to_le_hexstring: bigint_to_le_hexstring
}
