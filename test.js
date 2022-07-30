const assert = require('assert')
const path = require('path')

const mimc_hash = require('circomlib').mimcsponge.hash

const mimcspongeEVM_genContract = require('circomlib/src/mimcsponge_gencontract.js')
const mimcspongeEVM_bytecode = mimcspongeEVM_genContract.createCode('mimcsponge', 220)

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

function convert_test_val_to_evm_input(t) {
    t = t.toString(16)

    if (t.length % 2 != 0) {
        t = '0' + t
    }

    let fill_len = 64 - t.length
    if (fill_len > 0) {
        t = "0".repeat(fill_len) + t
    }

    return t
}

function mimc_geth_evm(encoded_testcase) {
    return new Promise(resolve => {
        cmd = path.normalize("go-ethereum/build/bin/evm --statdump --code " + mimcspongeEVM_bytecode + " --input " + encoded_testcase + " run")
        exec(cmd, (a, b, sdf) => { 
            resolve(b.slice(2, -1)) })
    })
}

function mimc_geth_evm384(encoded_testcase) {
    return new Promise(resolve => {
        cmd = path.normalize("go-ethereum/build/bin/evm --statdump --codefile build/mimc_cipher.hex --input " + encoded_testcase + " run") 

        exec(cmd, (a, b, sdf) => { 
            resolve(b.slice(2, -1)) })
    })
}

async function main() {
    if (process.argv.length < 3) {
        throw("needs arguments xL xR k=30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001. e.g. test.js 1 2, test.js 0x01 0x02")
        process.exit(1)
    }

    let xL_in = BigInt(process.argv[2])
    let xR_in = BigInt(process.argv[3])

    const k = 0 
    let circomlib_output = mimc_hash(xL_in, xR_in, k)

    circomlib_output = convert_test_val_to_evm384_input(circomlib_output.xL) + convert_test_val_to_evm384_input(circomlib_output.xR)

    assert.equal(xL_in, from_mont(to_mont(xL_in)))
    assert.equal(xR_in, from_mont(to_mont(xR_in)))

    let xL_in_mont = to_mont(xL_in)
    let xR_in_mont = to_mont(xR_in)

    let evm384_input = convert_test_val_to_evm384_input(xL_in_mont) + convert_test_val_to_evm384_input(xR_in_mont)
    let evm_input = convert_test_val_to_evm_input(xL_in) + convert_test_val_to_evm_input(xR_in)

    console.log("test case for xL_in = " + xL_in.toString() + " xR_in = " + xR_in.toString() + " k = " + k.toString())

    let evm384_encoded_testcase = "3f1a1187"+evm384_input
    let evm_encoded_testcase = "3f1a1187"+evm_input

    let geth_evm384_output = await mimc_geth_evm384(evm384_encoded_testcase)

    // the evm output is big-endian so it has to be byteswapped before comparing to evm384
    let geth_output = await mimc_geth_evm(evm_encoded_testcase)
    let geth_output_le = convert_test_val_to_evm384_input(geth_output.slice(0,64)) + convert_test_val_to_evm384_input(geth_output.slice(64, 128))

    assert.equal(geth_output_le, circomlib_output)
    assert.equal(geth_evm384_output, circomlib_output)

    console.log("   passed")
}

main().then(() => { })
