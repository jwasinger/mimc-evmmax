const { gen_mload, gen_mstore, gen_push, gen_dup, gen_swap, gen_pop, gen_or, gen_shl, gen_shr } = require("./util.js")

// TODO: turns this into generating a function with a loop once utils.js supports jumps properly
function gen_bswap256(mem_offset) {
    let ops = [
        gen_push(mem_offset),
        gen_mload(), // input
        gen_push(0xff), // mask-base
        gen_push(0) // output
    ]
    for (let i = 0; i < 256; i += 8) {
        // (v << (256 - i)) >> i
        ops = ops.concat([
            // prepare mask
            gen_dup(2),
            gen_push(256 - (i + 8)),
            gen_shl(),
            // apply mask
            gen_dup(4),
            "16", // and
            // FIXME: merge the below two shifts
            // move to left-most position
            gen_push(i),
            gen_shl(),
            // move to correct position
            gen_push(256 - i - 8),
            gen_shr(),
            // merge to output
            gen_or(),
        ])
    }
    ops = ops.concat([
        gen_swap(1),
        gen_pop(), // drop mask-base
        gen_swap(1),
        gen_pop(), // drop input
        gen_push(mem_offset),
        "52" // mstore
    ])
    return ops.join("")
}

module.exports = {
    gen_bswap256: gen_bswap256
}
