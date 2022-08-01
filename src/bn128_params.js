const { gen_setmodmax, gen_return, gen_mstore, gen_push, constants } = require("./util.js")

let BN128_CURVE_ORDER = 21888242871839275222246405745257275088548364400416034343698204186575808495617n

// let BN128_R_INV = 134950519161967129512891662437158223871n >> 64n
let BN128_R_INV = 14042775128853446655n

// lower hex(inv_val & 0xffffffffffffffff)
// upper hex(134950519161967129512891662437158223871 >> 64)

// const SIZE_F = constants.SIZE_F
const SIZE_F = 32

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
    // modulus (bn128 curve order) occupies 4 64bit limbs
    return gen_mstore(offset, BN128_CURVE_ORDER) + gen_setmodmax(offset, 4)
}

module.exports = {
    modulus: BN128_CURVE_ORDER,
    r_inv: BN128_R_INV,
    init_curve_params: init_curve_params,
    bigint_to_le_hexstring: bigint_to_le_hexstring
}
