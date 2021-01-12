const BN = require('bn.js')

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

function num_to_string(num) {
    let result = 0n

    for (let i = 0; i < NUM_LIMBS; i++) {
        result += (num[i] & MASK64) << (BigInt(i) * 64n)
    }

    return result.toString()
}

function EVM384Element(num) {
    this.value = num_to_limbs(num)
}

function sub(a,b, mod) {
    carry = 0n
    result = [0n,0n,0n,0n]
    for (let i = 0; i < NUM_LIMBS; i++) {
        result[i] = (((a[i] - b[i]) & MASK64) - carry) & MASK64
        carry = (result[i] >> 16n) == 0? 0n : 1n
        // result[i] &= MASK64
    }

    return result
}

function mulmodmont256(a, b, m, inv) {
    let A = [0n,0n,0n,0n,0n,0n,0n,0n]
    for (let i = 0; i < 4; i++) {
        let ui_64 = ((((((A[i] * a[i]) & MASK64) * y[0]) & MASK64) & MASK64) * inv) & MASK64
        let carry_64 = 0n
        for (let j = 0; j < 4; j++) {
            let xiyj_128 = (x[i] * y[j]) & MASK128
            let uimj_128 = (ui * m[j]) & MASK128
            let partial_sum_128 = (xiyj_128 + carry) & MASK128
            let sum = (((uimj_12 + A[i + j]) & MASK128) + partial_sum_128) & MASK128
            A[i + j] = sum & MASK64 // want to take sum as uint64

            if (sum < partial_sum) {
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
        out = sub(out, mod)
    }

    return out
}

console.log("testing conversion to/from bignum")
debugger
if (num_to_string(num_to_limbs(bn128_curve_order)) !== bn128_curve_order.toString()) {
    throw("failed")
}
