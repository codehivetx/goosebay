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
                I: 'import', // -I
                X: 'logout',
                G: 'greet',
                E: 'employee'
            }
        };
    }

    async run(argv) {
        const { configName } = argv;
        const config = require('./config')({
            configName
        });

        if(argv.greet) {
            return new GooseBay(config).greet();
        } else if(argv.import) {
            if (argv.import === true) {
                argv.import = '/dev/stdin';
            }
            const g =  new GooseBay(config);
            const str = fs.readFile(argv.import, 'utf-8');
            const data = JSON.parse(await str);
            await g.greet();
            return g.import(data);
        } else if(argv.export) { // --export=fromdate,todate
            const g =  new GooseBay(config);
            const data = g.export(argv.export.split(','));
            console.log(JSON.stringify(data, null, ' '));
        // } else if(argv.jobcodes) {
        //     const g =  new GooseBay(config);
        //     console.dir(await g.jobcodes());
        } else if(argv.logout) {
            return new GooseBay(config).logout();
        } else if(argv.set) {
            const [k,v] = argv.set.split('=');
            console.log(k, '=', v);
            config.set(k, v);
        } else if(argv.get) {
            console.log(config.get(argv.get));
        } else if(argv.employee) {
            const g = new GooseBay(config);
            await g.greet();
            return g.setEmployeeByName(argv.employee);
        } else if(argv.tag2customer) {
            const g = new GooseBay(config);
            await g.greet();
            const tag = argv.tag2customer.split(',')[0];
            const rest = argv.tag2customer.split(',').slice(1).join(',');
            return g.setCustomerTag(tag, rest);
        } else if(argv.tag2rate) {
            const g = new GooseBay(config);
            await g.greet();
            const tag = argv.tag2rate.split(',')[0];
            const rest = argv.tag2rate.split(',').slice(1).join(',');
            return g.setRateTag(tag, rest);
        } else if(argv.tag2item) {
            const g = new GooseBay(config);
            await g.greet();
            const tag = argv.tag2item.split(',')[0];
            const rest = argv.tag2item.split(',').slice(1).join(',');
            return g.setItemTag(tag, rest);
        } else {
            throw Error('wrong usage');
        }
    }
}

module.exports = Cli;
