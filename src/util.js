const assert = require('assert')

function to_padded_hex(value) {
    if (typeof(value) === "number" || typeof(value) === "bigint") {
        value = value.toString(16)
    } else {
        assert(typeof(value) === "string")
    }
    if (value.length % 2 !== 0) {
        return "0" + value
    }
    return value
}

// evm384 element size in bytes
const SIZE_F = 48

function to_evm384_addressing_mode(start, offset) {
    return (offset - start) / SIZE_F
}

function from_evm384_addressing_mode(start, offset) {
    return (offset - start)  * SIZE_F
}

// convert a uint64 to a padded little endian hex string
function uint32_to_be_hex_string(num) {
    result = num.toString(16)
    fill_length = 4 - result.length

    if (fill_length > 0) {
        result = "0".repeat(fill_length) + result
        //result = result + "0".repeat(fill_length)
    }

    return result
}

function encode_offsets(out, x, y, curve_params) {
    return uint32_to_be_hex_string(out) +
        uint32_to_be_hex_string(x) +
        uint32_to_be_hex_string(y) +
        uint32_to_be_hex_string(curve_params)
}

function gen_mstore(offset, value) {
    return gen_push(value) + gen_push(offset) + "52"
}

function gen_calldatacopy(result_offset, calldata_offset, n_bytes) {
    return gen_push(n_bytes) + gen_push(calldata_offset) + gen_push(result_offset) + "37"
}

function gen_return(offset, n_bytes) {
    return gen_push(n_bytes) + gen_push(offset) + "f3"
}

function gen_with_immediate(base_op, value) {
    value = to_padded_hex(value)

    if (value.length > 64) {
        throw("push value size must not be larger than 32 bytes")
    } else if (value.length < 2) {
        throw("push value size must not be smaller than 1 byte")
    }

    return to_padded_hex(base_op + (value.length / 2) - 1) + value
}

function gen_push(value) {
    return gen_with_immediate(0x60, value)
}

const constants  = {
    SIZE_F: 48,
    OP_ADDMOD384: "c0",
    OP_SUBMOD384: "c1",
    OP_MULMODMONT384: "c2",
}

module.exports = {
    gen_addmod384: (offset_out, offset_x, offset_y, offset_mod) => {
        return gen_push(encode_offsets(offset_out, offset_x, offset_y, offset_mod)) + constants.OP_ADDMOD384
    },
    gen_submod384: (offset_out, offset_x, offset_y, offset_mod) => {
        return gen_push(encode_offsets(offset_out, offset_x, offset_y, offset_mod)) + constants.OP_SUBMOD384
    },
    gen_mulmodmont384: (offset_out, offset_x, offset_y, offset_mod) => {
        return gen_push(encode_offsets(offset_out, offset_x, offset_y, offset_mod)) + constants.OP_MULMODMONT384
    },
    gen_push: gen_push,
    // store single 32 byte word at offset
    gen_mstore: gen_mstore,
    gen_calldatacopy: gen_calldatacopy,
    gen_return: gen_return,
    constants: constants,
    to_evm384_addressing_mode: to_evm384_addressing_mode,
    from_evm384_addressing_mode: from_evm384_addressing_mode
}
