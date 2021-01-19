const {MiMCGenerator} = require('./mimcsponge.js')
const {constants, gen_return, gen_calldatacopy, gen_mstore} = require("./util.js")
// const SIZE_F = constants.SIZE_F
const SIZE_F = 1

const {init_curve_params} = require("./bn128_params.js")

function gen_mimc_contract() {
    let mimc = MiMCGenerator()
    
    const offset_inputs = 0
    const offset_outputs = offset_inputs + 2 * SIZE_F
    const modinv = offset_outputs + 2 * SIZE_F
    const offset_k = modinv + 2
    const alloc_offset = offset_k + SIZE_F 

    // TODO store bn128 params at right offset

    let ops = [
        gen_mstore(alloc_offset * 48, 0),
        init_curve_params(modinv),
        gen_calldatacopy(offset_inputs, 0, SIZE_F * 2)
    ]
    
    mimc.mimc_cipher(offset_inputs, offset_inputs + SIZE_F, offset_k, offset_outputs, offset_outputs + SIZE_F, modinv, alloc_offset)
    ops = ops.concat(mimc.ops)

    ops = ops.concat([
        gen_return(offset_outputs, SIZE_F * 2)
    ])

    result = ops.join("")
    return result
}

console.log(gen_mimc_contract())
