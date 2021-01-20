const {MiMCGenerator} = require('./mimcsponge.js')
const {to_evm384_addressing_mode, constants, gen_return, gen_calldatacopy, gen_mstore} = require("./util.js")
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
        gen_mstore(alloc_offset * 48, 0),
        init_curve_params(offset_inputs),
        gen_calldatacopy(offset_inputs, 0, SIZE_F * 2)
    ]
    
    mimc.mimc_cipher(to_evm384_addressing_mode(0, offset_inputs),
                     to_evm384_addressing_mode(0, offset_inputs + SIZE_F), 
                     to_evm384_addressing_mode(0, offset_k),
                     to_evm384_addressing_mode(0, offset_outputs), 
                     to_evm384_addressing_mode(0, offset_outputs + SIZE_F),
                     to_evm384_addressing_mode(0, modinv),
                     to_evm384_addressing_mode(0, alloc_offset),
                     0)

    ops = ops.concat(mimc.ops)

    ops = ops.concat([
        gen_return(offset_outputs, SIZE_F * 2)
    ])

    result = ops.join("")
    return result
}

console.log(gen_mimc_contract())
