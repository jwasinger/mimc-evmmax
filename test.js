const assert = require('assert')
const path = require('path')

const mimc_hash = require('circomlib').mimcsponge.hash

var exec = require('child_process').exec;
function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

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

function convert_le_to_be_hexstring(num) {
    let chunks = []
    for (let i = 0; i < num.length; i += 2) {
        chunks.push(num[i]+num[i + 1])
    }

    chunks.reverse()
    return chunks.join("")
}

function convert_test_val_to_evm384_input(t) {
    t = t.toString(16) 

    if (t.length % 2 != 0) {
        t = '0' + t
    }

    t = convert_le_to_be_hexstring(t)

    let fill_len = 64 - t.length
    if (fill_len > 0) {
        t += "0".repeat(fill_len)
    }

    return t
}

function mimc_geth_evm384(encoded_testcase) {
    // TODO format inputs

    return new Promise(resolve => {
        //exec(path.normalize("go-ethereum/build/bin/evm --statdump --codefile build/mimc_cipher.hex --input 0x3f1a1187f6ffff9f38682c59539ac13e2bedf86d5c8cf2f0de46ddcc5ebe0f3483ef141cebffff4fddda766e15c4c9030ef2bdb35bc0636007486ae193dced869390c507 run"), (a, b, sdf) => { 
        exec(path.normalize("go-ethereum/build/bin/evm --statdump --codefile build/mimc_cipher.hex --input " + encoded_testcase + " run"), (a, b, sdf) => { 
            resolve(b.slice(2, -1)) })
    })
}

async function main() {
    if (process.argv.length < 4) {
        throw("needs arguments xL xR k. e.g. test.js 1 2 3, test.js 0x01 0x02 0x03")
        process.exit(1)
    }

    let xL_in = BigInt(process.argv[2])
    let xR_in = BigInt(process.argv[3])
    let k_in = BigInt(process.argv[4]) // k not implemented yet

    let circomlib_output = mimc_hash(xL_in, xR_in, k_in)
    circomlib_output = convert_test_val_to_evm384_input(circomlib_output.xL) + convert_test_val_to_evm384_input(circomlib_output.xR)

    assert.equal(xL_in, from_mont(to_mont(xL_in)))
    assert.equal(xR_in, from_mont(to_mont(xR_in)))

    let xL_in_mont = to_mont(xL_in)
    let xR_in_mont = to_mont(xR_in)
    let k_in_mont = to_mont(k_in)


    let evm_input = convert_test_val_to_evm384_input(xL_in_mont) + convert_test_val_to_evm384_input(xR_in_mont) + convert_test_val_to_evm384_input(k_in_mont)

    console.log("test case for xL_in = " + xL_in.toString() + " xR_in = " + xR_in.toString() + " k = " + k_in.toString())

    encoded_testcase = "3f1a1187"+evm_input

    let geth_output = await mimc_geth_evm384(encoded_testcase)
    
    assert.equal(geth_output, circomlib_output)
    console.log("   passed")
}

main().then(() => { })
