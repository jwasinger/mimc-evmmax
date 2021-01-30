const round_constants = require("./mimc_round_constants").mimc_round_constants_mont
const {from_evm384_addressing_mode, constants, gen_return, gen_addmod384, gen_mulmodmont384, gen_mstore, gen_memcopy} = require("./util.js")

const SIZE_F = 1 // constants.SIZE_F

module.exports.MiMCGenerator = () => {
    self = this
    this.ops = []

    this.emit = (vals) => {
        this.ops = this.ops.concat(vals)
    }

    this.mimc_cipher = (xL_in, xR_in, k_in, xL_out, xR_out, modinv, alloc_offset, evm384_mem_start) => {

        /* 
            most rounds make use of the results of the previous 2 rounds.
            keep pointers to the result of the current (to be calculated) and previous 2 rounds,
            swapping at the end of each round to overwrite the oldest value on the start of the next round.
        */
        let xL_result = alloc_offset;
        let xL_result_prev = xL_result + SIZE_F;
        let xL_result_prev_2 = xL_result_prev + SIZE_F;
        let offset_round_constant = xL_result_prev_2 + SIZE_F;
        let tmp1 = offset_round_constant + SIZE_F;
        let tmp2 = tmp1 + SIZE_F;
        let pOne = tmp2 + SIZE_F;

        const num_rounds = 220

        this.emit([
            gen_mstore(from_evm384_addressing_mode(evm384_mem_start, pOne + SIZE_F), 0), // store something to expand memory up thru how much we want to allocate
            gen_mstore(from_evm384_addressing_mode(evm384_mem_start, pOne), "0100000000000000000000000000000000000000000000000000000000000000")
        ])

        /* first round */ 
        this.emit([
            // t2 = xL_in ** 2
            gen_mulmodmont384(tmp2, xL_in, xL_in, modinv),

            // t4 = t2 * t2
            gen_mulmodmont384(tmp2, tmp2, tmp2, modinv),

            // xL_result = t^5 + xR_in
            gen_mulmodmont384(tmp2, tmp2, xL_in, modinv),
            gen_addmod384(xL_result, xR_in, tmp2, modinv),

/*
            gen_mulmodmont384(xL_result, xL_result, pOne, modinv),
            gen_return(from_evm384_addressing_mode(evm384_mem_start, xL_result), 32),
*/
        ])

        tmp = xL_result_prev
        xL_result_prev  = xL_result
        xL_result = tmp 

        /* second round */
        this.emit([
            gen_mstore(from_evm384_addressing_mode(evm384_mem_start, offset_round_constant), round_constants[1], 32),
            // t = k + k[i-1] + c
            gen_addmod384(xL_result, xL_result_prev, offset_round_constant, modinv),

            // t2 = t * t
            gen_mulmodmont384(tmp1, xL_result, xL_result, modinv),

            // t4 = t2 * t2
            gen_mulmodmont384(tmp1, tmp1, tmp1, modinv),

            // t5 = t4 * t
            gen_mulmodmont384(xL_result, tmp1, xL_result, modinv),

            // xL_result = t5 + xL_in
            gen_addmod384(xL_result, xL_result, xL_in, modinv)
        ])

        tmp = xL_result_prev_2
        xL_result_prev_2 = xL_result_prev
        xL_result_prev = xL_result
        xL_result = tmp

        /* rounds [3..num_rounds-2] (inclusive range) */
        for (let i = 2; i < num_rounds - 2; i++) {
            this.emit([
                gen_mstore(from_evm384_addressing_mode(evm384_mem_start, offset_round_constant), round_constants[i % round_constants.length]),
                
                // t = x_L_result_prev + k_in + c
                gen_addmod384(tmp1, offset_round_constant, xL_result_prev, modinv),

                // t**2 = t * t
                gen_mulmodmont384(tmp2, tmp1, tmp1, modinv),
                // t**4 = t**2 * t**2
                gen_mulmodmont384(tmp2, tmp2, tmp2, modinv),
                // xL_result = t**5
                gen_mulmodmont384(xL_result, tmp2, tmp1, modinv),

                // xL_result = xL_result + xL_result_prev_2
                gen_addmod384(xL_result, xL_result, xL_result_prev_2, modinv)
            ])

            tmp = xL_result_prev_2
            xL_result_prev_2 = xL_result_prev
            xL_result_prev = xL_result
            xL_result = tmp
        }


        /* 2nd to last round */
        
        this.emit([
            // c = ( round_constants.buffer as usize + SIZE_F * ( (i - 1) % num_round_constants)) as usize;
            gen_mstore(from_evm384_addressing_mode(evm384_mem_start, offset_round_constant), round_constants[(num_rounds - 2) % round_constants.length]),
            // gen_return(offset_round_constant, SIZE_F),

            // t = k_in  + mem[xL_result_table-1] + c;
            gen_addmod384(tmp1, xL_result_prev, offset_round_constant, modinv),

            // t2 = t * t
            gen_mulmodmont384(tmp2, tmp1, tmp1, modinv),

            // t4 = t2 * t2
            gen_mulmodmont384(tmp2, tmp2, tmp2, modinv),

            // xL_out = t5 + xL_result_table_prev_2
            gen_mulmodmont384(tmp2, tmp2, tmp1, modinv),
            gen_addmod384(xL_out, tmp2, xL_result_prev_2, modinv),
        ])

        /* last round */
        this.emit([
            gen_mstore(from_evm384_addressing_mode(evm384_mem_start, offset_round_constant), round_constants[(num_rounds - 1) % round_constants.length]),

            // t = mem[xL_result_table] + mem[xL_result_table - SIZE_F] + c
            gen_addmod384(tmp1, xL_out, offset_round_constant, modinv),

            // t2 = t * t
            gen_mulmodmont384(tmp2, tmp1, tmp1, modinv),

            // t4 = t2 * t2;
            gen_mulmodmont384(tmp2, tmp2, tmp2, modinv),

            // xR_out = xL_result_prev_2 + t4 * t
            gen_mulmodmont384(tmp2, tmp2, tmp1, modinv),
            gen_addmod384(xR_out, xL_result_prev, tmp2, modinv),
            
            // convert both outputs out of montgomery form
            gen_mulmodmont384(xR_out, xR_out, pOne, modinv),
            gen_mulmodmont384(xL_out, xL_out, pOne, modinv)
        ])
    }

/*
    // TODO if this is needed, finish it.  compress doesn't appear to be used in the tornado contracts


    // everything argument other than num_inputs, num_outputs is a pointer
    this.mimc_compress = (offset_inputs, num_inputs, k, offset_outputs, num_outputs, alloc_offset) => {
        xR_in = alloc_offset
        xL_in = offset_inputs

        this.gen_mimc_cipher(xL_in, xR_in, k, xL_out, xR_out, alloc_offset);

        for (let i: usize = 1; i < num_inputs; i++) {
            // xL_in = xL_out + inputs[i]
            this.emit([
                gen_addmod384(xL_in, xL_out, offset_inputs + SIZE_F * i)
            ])

            // xR_in = xR_out
            xR_in = xR_out
            this.mimc_cipher(xL_in, xR_in, k, xL_out, xR_out, alloc_offset);
        }

        // TODO output size larger than 1 un-tested
        for (let i: usize = 0; i < num_outputs - 1; i++) {
            this.mimc_cipher(xL_in, xR_in, k, xL_out, xR_out, alloc_offset);

            // outputs[i + 1] = xL_out;
            this.emit([
                gen_memcpy(outputs + ( (i + 1) * SIZE_F), xL_out)
            ])
        }

        // TODO convert from montgomery to normal form
    }
*/

    return this
}
