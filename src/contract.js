const {MiMCGenerator} = require('./mimcsponge.js')
const {to_evm384_addressing_mode, constants, gen_return, gen_revert, gen_callvalue, gen_calldatacopy, gen_push, gen_dup, gen_mstore, gen_mload, gen_iszero, gen_eq, gen_jumpdest, gen_jumpi} = require("./util.js")
// const SIZE_F = constants.SIZE_F
const SIZE_F = 48

const {init_curve_params} = require("./bn128_params.js")

function gen_mimc_contract() {
    let mimc = MiMCGenerator()
    
    const offset_mod = 0
    const offset_modinv = offset_mod + SIZE_F
    const offset_inputs = offset_modinv + SIZE_F
    const offset_outputs = offset_inputs + 2 * SIZE_F
    const modinv = offset_outputs + 2 * SIZE_F
    const offset_k = modinv + 2 * SIZE_F
    const alloc_offset = offset_k + SIZE_F 

    // TODO store bn128 params at right offset

    let ops = [
        // Check for incoming value (and reject if so)
        gen_callvalue(),
        gen_iszero(),
        gen_push(9), // to sig
        gen_jumpi(),
        gen_push(0),
        gen_dup(1),
        gen_revert(),
        // Check signature and inputs
        // sig:
        gen_jumpdest(),
        gen_push(4),
        gen_push(0),
        gen_push(28),
        gen_calldatacopy(),
        gen_push(0),
        gen_mload(),
        gen_push(0x3f1a1187),
        gen_eq(),
        gen_push(33), // to init
        gen_jumpi(),
        gen_push(0),
        gen_dup(1),
        gen_revert(),
        // init:
        gen_jumpdest(),
        // TODO: make ABI strict and reject short inputs?
        // load xL
        gen_push(32),
        gen_push(4),
        gen_push(offset_inputs),
        gen_calldatacopy(),
        // load xR
        gen_push(32),
        gen_push(36),
        gen_push(offset_inputs + 48),
        gen_calldatacopy(),
        // load k
        gen_push(32),
        gen_push(68),
        gen_push(offset_k),
        gen_calldatacopy()
        // TOOD: byteswap xL/xR/k
    ]

/*
    // Check for incoming value
    callvalue
    iszero
    jumpi <sig>
    push 0
    dup 1
    revert

    // Check signature
    sig:
    push 4
    push 0
    push 28
    calldatacopy
    push 0
    mload
    push 0x3f1a1187
    eq
    jumpi <init>
    push 0
    dup 1
    revert

    init:
    // Load xL
    push 32
    push 4
    push <offset_inputs + 16>
    calldatacopy

    // Load xR
    push 32
    push 36
    push <offset_inputs + 16 + 48>
    calldatacopy

    // Load k
    push 32
    push 68
    push <offset_k + 16>
    calldatacopy
*/

    ops = ops.concat([
        gen_mstore(alloc_offset * 48, 0),
        init_curve_params(offset_mod)
    ])
    
    mimc.mimc_cipher(to_evm384_addressing_mode(0, offset_inputs),
                     to_evm384_addressing_mode(0, offset_inputs + SIZE_F), 
                     to_evm384_addressing_mode(0, offset_k),
                     to_evm384_addressing_mode(0, offset_outputs), 
                     to_evm384_addressing_mode(0, offset_outputs + SIZE_F),
                     to_evm384_addressing_mode(0, modinv),
                     to_evm384_addressing_mode(0, alloc_offset),
                     0)

    ops = ops.concat(mimc.ops)

    // Here we remove the 16 bytes of zeroes between the two outputs,
    // and return it as (uint256 xL, uint256 xR) in the Solidity ABI.
    ops = ops.concat([
        gen_push(offset_outputs + 48),
        gen_mload(),
        gen_push(offset_outputs + 32),
        "52", // mstore
        gen_return(offset_outputs, 2 * 32)
    ])

    result = ops.join("")
    return result
}

console.log(gen_mimc_contract())
