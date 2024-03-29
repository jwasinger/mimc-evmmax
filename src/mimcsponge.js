const round_constants = require("./mimc_round_constants").mimc_round_constants_mont
const {constants, gen_return, gen_addmodmax, gen_mulmontmax, gen_mstore, gen_memcopy} = require("./util.js")

const SIZE_F = 1 // F occupies a single slot

module.exports.MiMCGenerator = () => {
    self = this
    this.ops = []

    this.emit = (vals) => {
        this.ops = this.ops.concat(vals)
    }

    this.mimc_cipher = (xL_in, xR_in, k_in, xL_out, xR_out, alloc_offset) => {

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
            // TODO this should not be necessary
            gen_mstore((pOne + 1) * constants.SIZE_F_FIELD, 0), // store something to expand memory up thru how much we want to allocate
            gen_mstore(pOne * constants.SIZE_F_FIELD, "0100000000000000000000000000000000000000000000000000000000000000")
        ])

        /* first round */ 
        this.emit([
            //gen_return(tmp2 * constants.SIZE_F_FIELD, constants.SIZE_F_FIELD),
            // t2 = xL_in ** 2
            gen_mulmontmax(tmp2, xL_in, xL_in),

            // t4 = t2 * t2
            gen_mulmontmax(tmp2, tmp2, tmp2),

            // xL_result = t^5 + xR_in
            gen_mulmontmax(tmp2, tmp2, xL_in),

            gen_addmodmax(xL_result, xR_in, tmp2),

/*
            gen_mulmontmax(xL_result, xL_result, pOne),
	    */
        ])

        tmp = xL_result_prev
        xL_result_prev  = xL_result
        xL_result = tmp 

        /* second round */
        this.emit([
            gen_mstore(offset_round_constant * constants.SIZE_F_FIELD, round_constants[1]),
            // t = k + k[i-1] + c
            gen_addmodmax(xL_result, xL_result_prev, offset_round_constant),

            // t2 = t * t
            gen_mulmontmax(tmp1, xL_result, xL_result),

            // t4 = t2 * t2
            gen_mulmontmax(tmp1, tmp1, tmp1),

            // t5 = t4 * t
            gen_mulmontmax(xL_result, tmp1, xL_result),

            // xL_result = t5 + xL_in
            gen_addmodmax(xL_result, xL_result, xL_in),
        ])

        tmp = xL_result_prev_2
        xL_result_prev_2 = xL_result_prev
        xL_result_prev = xL_result
        xL_result = tmp

        /* rounds [3..num_rounds-2] (inclusive range) */
        for (let i = 2; i < num_rounds - 2; i++) {
            this.emit([
                gen_mstore(offset_round_constant * constants.SIZE_F_FIELD, round_constants[i % round_constants.length]),
                
                // t = x_L_result_prev + k_in + c
                gen_addmodmax(tmp1, offset_round_constant, xL_result_prev),

                // t**2 = t * t
                gen_mulmontmax(tmp2, tmp1, tmp1),
                // t**4 = t**2 * t**2
                gen_mulmontmax(tmp2, tmp2, tmp2),
                // xL_result = t**5
                gen_mulmontmax(xL_result, tmp2, tmp1),

                // xL_result = xL_result + xL_result_prev_2
                gen_addmodmax(xL_result, xL_result, xL_result_prev_2)
            ])

            tmp = xL_result_prev_2
            xL_result_prev_2 = xL_result_prev
            xL_result_prev = xL_result
            xL_result = tmp
        }

        /* 2nd to last round */
        
        this.emit([
            // c = ( round_constants.buffer as usize + SIZE_F * ( (i - 1) % num_round_constants)) as usize;
            gen_mstore(offset_round_constant * constants.SIZE_F_FIELD, round_constants[(num_rounds - 2) % round_constants.length]),
            // gen_return(offset_round_constant, SIZE_F),

            // t = k_in  + mem[xL_result_table-1] + c;
            gen_addmodmax(tmp1, xL_result_prev, offset_round_constant),

            // t2 = t * t
            gen_mulmontmax(tmp2, tmp1, tmp1),

            // t4 = t2 * t2
            gen_mulmontmax(tmp2, tmp2, tmp2),

            // xL_out = t5 + xL_result_table_prev_2
            gen_mulmontmax(tmp2, tmp2, tmp1),
            gen_addmodmax(xL_out, tmp2, xL_result_prev_2),
        ])

        debugger
        /* last round */
        this.emit([
            gen_mstore(offset_round_constant * constants.SIZE_F_FIELD, round_constants[(num_rounds - 1) % round_constants.length]),

            // t = mem[xL_result_table] + mem[xL_result_table - SIZE_F] + c
            gen_addmodmax(tmp1, xL_out, offset_round_constant),

            // t2 = t * t
            gen_mulmontmax(tmp2, tmp1, tmp1),

            // t4 = t2 * t2;
            gen_mulmontmax(tmp2, tmp2, tmp2),

            // xR_out = xL_result_prev_2 + t4 * t
            gen_mulmontmax(tmp2, tmp2, tmp1),
            gen_addmodmax(xR_out, xL_result_prev, tmp2),
            
            // convert both outputs out of montgomery form
            gen_mulmontmax(xR_out, xR_out, pOne),
            gen_mulmontmax(xL_out, xL_out, pOne),
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
                gen_addmodmax(xL_in, xL_out, offset_inputs + SIZE_F * i)
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
