#! /usr/bin/bash

set -e
# shopt -s nullglob

# for f in "tests/"*."json"; do echo $f; done

# evmone/build/bin/evmone-bench --benchmark_format=json --benchmark_color=false ./build/mimc_cipher.hex 00 "" 

# do the below command for opcode/mem trace
# go-ethereum/build/bin/evm --debug --statdump --codefile build/mimc_cipher.hex --input 0x$(cat tests/tests.json | jq -r '.["tests"][0] | .["input"]') run

# benchmark
# go-ethereum/build/bin/evm --statdump --codefile build/mimc_cipher.hex --input 0x$(cat tests/tests.json | jq -r '.["tests"][0] | .["input"]') --bench run

go-ethereum/build/bin/evm --statdump --codefile build/mimc_cipher.hex --input 0x$(cat tests/tests.json | jq -r '.["tests"][0] | .["input"]') run
