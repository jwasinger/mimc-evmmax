const BN = require('bn.js')

const bn128_curve_order = new BN("21888242871839275222246405745257275088548364400416034343698204186575808495617")
// montgomery parameters for field defined by bn128 curve order
const bn128_r_inv = new BN("134950519161967129512891662437158223871")
const bn128_r_squared = new BN("944936681149208446651664254269745548490766851729442924617792859073125903783")

function toMont(a) {
    return a.shln(256).mod(bn128_curve_order)
}

function fromMont(a) {
    return mulmodmont(a, new BN(1))
}

function mulmodmont(a, b) {
  var t = a.mul(b);
  var k0 = t.mul(bn128_r_inv).maskn(128);
  var res2 = k0.mul(bn128_curve_order).add(t).shrn(128);
  var k1 = res2.mul(bn128_r_inv).maskn(128);
  var result = k1.mul(bn128_curve_order).add(res2).shrn(128);
  if (result.gt(bn128_curve_order)) {
    result = result.sub(bn128_curve_order)
  }
  return result
}

let a = toMont(new BN("2"))
let b = toMont(new BN("2"))
let res = mulmodmont(a, b)

if (fromMont(res).toString() !== new BN(2 * 2).toString()) {
    throw("fromMont/toMont broken")
}

// a is  the first nonzero round constant in montgomery form
a = new BN(0x53e27bc8307157ce5836bff1f4ee44ae7bdd790e2e696e0965ac8dfe4478c84n)
let a_squared = mulmodmont(a, a)
if (a_squared.toString(16) !== '47643d8d4b33bf5a14371bd30f7474749ac07fa02ba7ac1c1f1595af9f9688c') {
    throw("square broken")
}
