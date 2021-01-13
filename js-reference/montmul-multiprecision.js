const BN = require('bn.js')
const {toMont, fromMont} = require('./montmul-reference.js')

const bn128_curve_order = 21888242871839275222246405745257275088548364400416034343698204186575808495617n
// montgomery parameters for field defined by bn128 curve order
const bn128_r_inv = 134950519161967129512891662437158223871n
const bn128_r_squared = 944936681149208446651664254269745548490766851729442924617792859073125903783n

const NUM_LIMBS = 4
const MASK64 = 0xffffffffffffffffn
const MASK128 = 0xffffffffffffffffffffffffffffffffn

function num_to_limbs(num) {
    let result = [0n, 0n, 0n, 0n]
    for (let i = 0; i < NUM_LIMBS; i++) {
        result[i] = num & MASK64 
        num = num >> 64n
    }

    return result
}

function limbs_to_bigint(limbs) {
    let result = 0n

    for (let i = 0; i < NUM_LIMBS; i++) {
        result += (limbs[i] & MASK64) << (BigInt(i) * 64n)
    }

    return result
}

function num_to_string(num) {
    //return result.toString()
    return limbs_to_bigint(num).toString()
}

function EVM384Element(num) {
    this.value = num_to_limbs(num)
}

function add64(a, b) {
    return (a + b) & MASK64
}

function sub64(a, b) {
    return (a - b) & MASK64
}

function mul64(a, b) {
    return (a * b) & MASK64
}

function add128(a, b) {
    return (a + b) & MASK128
}

function sub128(a, b) {
    return (a - b) & MASK128
}

function mul128(a, b) {
    return (a * b) & MASK128
}

function sub(a,b, mod) {
    carry = 0n
    result = [0n,0n,0n,0n]
    for (let i = 0; i < NUM_LIMBS; i++) {
        // result[i] = (((a[i] - b[i]) & MASK64) - carry) & MASK64
        result[i] = sub64(sub64(a[i], b[i]), carry)
        carry = (result[i] >> 16n) == 0? 0n : 1n
    }

    return result
}

function uint64_hi(a) {
    return (b & 0xffffffff00000000)
}

function uint64_lo(b) {
    return b & 0xffffffffn
}


function mulmodmont256(a, b, m, inv) {
    let A = [0n,0n,0n,0n,0n,0n,0n,0n]
    for (let i = 0; i < 4; i++) {
        let ui_64 = mul64(add64(mul64(a[i], b[0]), A[i]), inv)
        let carry_64 = 0n
        for (let j = 0; j < 4; j++) {
            let xiyj_128 = mul128(a[i], b[j])
            let uimj_128 = mul128(ui_64, m[j])
            let partial_sum_128 = add128(xiyj_128, carry_64)

            let sum = add128(add128(add128(uimj_128, A[i + j]), xiyj_128), partial_sum_128)
            A[i + j] = uint64_lo(sum)
            carry = uint64_hi(sum)

            if (sum < partial_sum_128) {
                let k = 2
                while (i + j + k < 8 &&A[i + j + k] == 0xffffffffffffffffn) {
                    A[i + j + k] = 0
                    k++
                }

                if (i + j + k < 9) {
                    A[i + j + k] = (A[i + j + k] + 1n) & MASK64
                }
            }
        }
    }

    let out = [A[4], A[5], A[6], A[7], A[8]]
    let final_subtraction = false

    if (out[4] > 0) {
        let c = 0
        for (let i = 0; i < 5; i++) {
            let tmp = out[i] - m[i] - c
            j
        }
    }

    if (out[4] > m[4]) {
        debugger
        out = sub(out, mod)
    }

    return out
}

function num_eq(a, b) {
    for (let i = 0; i < NUM_LIMBS; i++) {
        if (a[i] != b[i]) {
            return false
        }
    }

    return true
}

let curve_params = require("./bn128-params.js")

let mod = num_to_limbs(bn128_curve_order)
let a = num_to_limbs(toMont(BigInt(2), curve_params))
let b = num_to_limbs(toMont(BigInt(2), curve_params))
debugger
let c = mulmodmont256(a, b, num_to_limbs(curve_params.modulus), curve_params.r_inv)
let expected = num_to_limbs(toMont(BigInt(4), curve_params))

if (!num_eq(c, expected)) {
    throw("failed")
}

console.log("passed")

function mulmodmont(a, b, curve_params) {
    let n1 = num_to_limbs(a)
    let n2 = num_to_limbs(b)
    debugger
    let result = mulmodmont256(n1, n2, curve_params.modulus, curve_params.mod_inv)
    return limbs_to_num(num)
}
