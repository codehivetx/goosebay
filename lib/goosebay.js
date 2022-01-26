/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const { users, jobcodes, timesheets } = require('tsheets-sdk');
const { env } = require('process');
const tw_to_iso = require('./tw_to_iso');
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

    async import(data) {
        this.uid = this.config.get('uid');
        const p = [];
        for (const n of data) {
            // console.dir(n);
            const { start, end, tags } = n;
            const jobcode = this.findcode(tags);
            if (!jobcode) {
                throw Error(`No jobcode for ${tags}`);
            }
            console.log(`Jobcode: ${jobcode} for ${tags}`);
            if (!start || !end) {
                console.error(`missing start/end for ${n}`);
            } else {
                p.push({
                    user_id: this.uid,
                    jobcode_id: jobcode,
                    type: 'regular',
                    start: tw_to_iso(start),
                    end: tw_to_iso(end),
                    notes: `TW: ${tags}`,
                });
            }
        }
        console.dir(p, {depth: Infinity, color: true});
        const t = timesheets();
        // const r = await t.add(p);
        // console.dir(r, {depth: Infinity, color: true});
    }

    findcode(tags) {
        for (const tag of tags) {
            const jobcode = this.config.get(`${tag}.jobcode`);
            if (jobcode) {
                return jobcode;
            }
        }
        return undefined;
    }

    async jobcodes() {
        const { results } = await (await jobcodes().get());
        return results.jobcodes;
    }
}


// get current timezone
// await t.get({user_ids: [TSHEETS_USERID], start_date:'2022-01-01', end_date:'2022-12-31'})

// > await t.add([{user_id:TSHEETS_USERID, jobcode_id: 00000, type:'regular', "start":"2022-01-10T10:00:00-07:00", "end":"2022-01-10T14:00:00-07:00", "notes":"test"}])
// return myUser;

// Need to know about jobcodes:
// (await jobcodes().get()).results


module.exports = GooseBay;
