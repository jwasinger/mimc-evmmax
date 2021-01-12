const bn128_curve_order = 21888242871839275222246405745257275088548364400416034343698204186575808495617n
// montgomery parameters for field defined by bn128 curve order
const bn128_r_inv = 134950519161967129512891662437158223871n
const bn128_r_squared = 944936681149208446651664254269745548490766851729442924617792859073125903783n

const MASK64 = 0xffffffffffffffffn
const MASK128 = 0xffffffffffffffffffffffffffffffffn

module.exports = {
    bn128_curve_order,
    bn128_r_inv,
    bn128_r_squared,
    MASK64,
    MASK128
}
