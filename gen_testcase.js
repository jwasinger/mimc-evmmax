const assert = require('assert')

const mimc_hash = require('circomlib').mimcsponge.hash

function from_mont(val) {
    r_inv = 9915499612839321149637521777990102151350674507940716049588462388200839649614n // (r_inv * r) % mod == 1
    mod = 21888242871839275222246405745257275088548364400416034343698204186575808495617n

    return (val * r_inv) % mod
}

function to_mont(val) {
    r = 6350874878119819312338956282401532410528162663560392320966563075034087161851n
    mod = 21888242871839275222246405745257275088548364400416034343698204186575808495617n

    return (val * r) % mod
}

function convert_test_val_to_evm384_input(t) {
    t = t.toString(16) 

    let fill_len = 96 - t.length
    if (fill_len > 0) {
        t += "0".repeat(fill_len)
    }

    return t
}

// TODO read these from stdin
let xL_in = 2n
let xR_in = 4n

assert.equal(xL_in, from_mont(to_mont(xL_in)))
assert.equal(xR_in, from_mont(to_mont(xR_in)))

let xL_in_mont = to_mont(xL_in)
let xR_in_mont = to_mont(xR_in)

let evm_input = convert_test_val_to_evm384_input(xL_in_mont) + convert_test_val_to_evm384_input(xR_in_mont)

console.log("test case for xL_in = " + xL_in.toString() + " xR_in = " + xR_in.toString())
console.log(evm_input)
