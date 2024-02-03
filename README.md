An implementation of [MiMC-Feistel](https://github.com/iden3/circomlib/blob/master/test/mimcspongecircuit.js) using EVM384-v7.

This library is actively under development.  things may be broken already, or at any time without notice.

#### Setup
```
git submodule update --init && cd go-ethereum && make all
npm install && npm run build
```

#### Usage
* run tests: `npm run test`
* benchmark evm mimc used by tornado cash: `./bench-evm-mimc.sh`
* benchmark EVMMAX (push-based) variant: `./bench-evmmax-mimc.sh`
