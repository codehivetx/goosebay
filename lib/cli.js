/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

class Cli {
    constructor() {

    }

    static get opts() {
        return {
            alias: {
                // map short to long ids
                K: 'configName', // -K altconfig (default 'config')
                D: 'set',  // -D dir=/some/path
                P: 'get',  // -P dir
            }
        };
    }

    async run(argv) {
        const { configName } = argv;
        const config = require('./config')({
            configName
        });

        if(argv.set) {
            const [k,v] = argv.set.split('=');
            console.log(k, '=', v);
            config.set(k, v);
        } else if(argv.get) {
            console.log(config.get(argv.get));
        } else {
            throw Error('wrong usage');
        }
    }
}

module.exports = Cli;
