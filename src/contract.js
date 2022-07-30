const {MiMCGenerator} = require('./mimcsponge.js')
const {to_evm384_addressing_mode, constants, gen_return, gen_revert, gen_callvalue, gen_calldatacopy, gen_push, gen_dup, gen_mstore, gen_mload, gen_iszero, gen_eq, gen_jumpdest, gen_jumpi} = require("./util.js")

function reverse_endianness(val) {
    if (val.length % 2 != 0) {
        throw("fuck")
    }

    let parts = []
    for (let i = 0; i < val.length; i += 2) {
        parts.push(val.slice(i, i + 2))
    }
    parts.reverse()

    return parts.join("")
}

const SIZE_F = 1

const {init_curve_params} = require("./bn128_params.js")

/* The contract ABI:
    {
        "type": "function"
        "name": "MiMCSponge",
        "inputs": [
            {
                "name": "xL_in",
                "type": "uint256"
            },
            {
                "name": "xR_in",
                "type": "uint256"
            },
            {
                "name": "k",
                "type": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "xL_out",
                "type": "uint256"
            },
            {
                "name": "xR_out",
                "type": "uint256"
            }
        ],
        "stateMutability": "pure",
    }
*/

function gen_mimc_contract() {
    let mimc = MiMCGenerator()
    
    const offset_mod = 0
    const offset_inputs = offset_mod + SIZE_F
    const offset_outputs = offset_inputs + 2 * SIZE_F
    const offset_k = offset_outputs + 2 * SIZE_F
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
        gen_push(offset_inputs * constants.SIZE_F_FIELD),
        gen_calldatacopy(),
        // load xR
        gen_push(32),
        gen_push(36),
        gen_push(offset_inputs * constants.SIZE_F_FIELD + constants.SIZE_F_FIELD),
        gen_calldatacopy(),
        //gen_calldatacopy(),
        gen_mstore(offset_k * constants.SIZE_F_FIELD, reverse_endianness("30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001")),
        // TOOD: byteswap xL/xR/k
    ]

    ops = ops.concat([
        //gen_mstore(alloc_offset * 48, 0),
        init_curve_params(offset_mod)
    ])
    
    debugger
    mimc.mimc_cipher(offset_inputs,
                     offset_inputs + SIZE_F,
                     offset_k,
                     offset_outputs,
                     offset_outputs + SIZE_F,
                     alloc_offset)

    ops = ops.concat(mimc.ops)

    ops = ops.concat([
        gen_return(offset_outputs * constants.SIZE_F_FIELD, 2 * 32)
    ])

    result = ops.join("")
    return result
}

console.log(gen_mimc_contract())
