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

const push_lookup = {
    1: '60',
    2: '61',
    3: '62',
    4: '63',
    5: '64',
    6: '65',
    7: '66',
    8: '67',
    9: '68',
    10: '69',
    11: '6a',
    12: '6b',
    13: '6c',
    14: '6d',
    15: '6e',
    16: '6f',
    17: '70',
    18: '71',
    19: '72',
    20: '73',
    21: '74',
    22: '75',
    23: '76',
    24: '77',
    25: '78',
    26: '79',
    27: '7a',
    28: '7b',
    29: '7c',
    30: '7d',
    31: '7e',
    32: '7f'
}

function gen_push(value) {
    if (typeof(value) === "number") {
        value = value.toString(16)
    } else if (typeof(value) === "bigint") {
        value = value.toString(16)
    }

    if (value.length > 64) {
        throw("push32 value size must not be larger than 32 bytes")
    }

    if (value.length % 2 != 0) {
        value = "0" + value 
    }

    return push_lookup[value.length/2] + value
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
