/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const { users } = require('tsheets-sdk');
const { env } = require('process');
class GooseBay {
    constructor(config) {
        this.config = config;

        // hack in the token
        const token = config.get('token');
        if (token) {
            env.TSHEETS_TOKEN = token;
            console.log('set $TSHEETS_TOKEN from token');
        } else {
            console.log('NOTE: $TSHEETS_TOKEN not set');
        }
    }

    /**
     * Get user info
     * @param {Number} uid
     * @returns
     */
    async getuinfo(uid) {
        const { results } = await users().get([uid]);
        return results.users[uid];
    }

    async greet() {
        this.uid = this.config.get('uid');
        console.log(`Getting info on ${this.uid}`);
        const myUser = await this.getuinfo(this.uid);
        const {first_name, last_name, employee_number, company_name} = myUser;
        console.log(`Hello ${first_name} ${last_name} #${employee_number} from ${company_name}`);
    }
}


// get current timezone
// await t.get({user_ids: [TSHEETS_USERID], start_date:'2022-01-01', end_date:'2022-12-31'})

// > await t.add([{user_id:TSHEETS_USERID, jobcode_id: 00000, type:'regular', "start":"2022-01-10T10:00:00-07:00", "end":"2022-01-10T14:00:00-07:00", "notes":"test"}])
// return myUser;

// Need to know about jobcodes:
// (await jobcodes().get()).results


module.exports = GooseBay;
