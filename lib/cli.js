/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const GooseBay = require('./goosebay');
const fs = require('fs').promises;

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

        if(argv.greet) {
        //     return new GooseBay(config).greet();
        // } else if(argv.import) {
        //     const g =  new GooseBay(config);
        //     const str = fs.readFile('/dev/stdin', 'utf-8');
        //     const data = JSON.parse(await str);
        //     await g.greet();
        //     return g.import(data);
        // } else if(argv.export) {
        //     const g =  new GooseBay(config);
        //     const data = g.export(argv.export.split(','));
        //     console.log(JSON.stringify(data, null, ' '));
        // } else if(argv.jobcodes) {
        //     const g =  new GooseBay(config);
        //     console.dir(await g.jobcodes());
        } else if(argv.set) {
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
