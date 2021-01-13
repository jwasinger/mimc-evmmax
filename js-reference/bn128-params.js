const bn128_curve_order = 21888242871839275222246405745257275088548364400416034343698204186575808495617n
// montgomery parameters for field defined by bn128 curve order
const bn128_r = 1n << 256n

// TODO why is 2**64 used as the aux mod to calculate this inv when R is clearly 1 << 256 ??
// mod_inv = -bn128_curve_order^(-1) % (2**64)
// (mod_inv * mod ) % (2**64) == -1 mod (2**64)
const bn128_mod_inv = 134950519161967129512891662437158223871n
const aux_mod = 2n << 64n

const bn128_r_squared = (bn128_r * bn128_r) % bn128_curve_order
// const bn128_r_squared = 944936681149208446651664254269745548490766851729442924617792859073125903783n

module.exports = {
    modulus: bn128_curve_order,
    r_inv: bn128_mod_inv,
    r_squared: bn128_r_squared,
    r: bn128_r,
    aux_mod: aux_mod
}
