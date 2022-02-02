/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const { users, jobcodes, timesheets } = require('tsheets-sdk');
const DRY_RUN = false;
const { env } = require('process');
const moment = require('moment-timezone');
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
        const { first_name, last_name, employee_number, company_name } = myUser;
        console.log(`Hello ${first_name} ${last_name} #${employee_number} from ${company_name}`);
    }

    /**
     *
     * @param {String[]} tags tag list
     */
    mapNotes(tags, mainTag) {
        let notes = '';
        for (const tag of tags.sort()) {
            if (tag == mainTag) {
                continue; // skip this one
            }
            const note = this.config.get(`tag.${tag}.note`);
            if (note === undefined) {
                notes = (notes + ` ${tag}`).trim();
            } else {
                notes = (notes + ` ${note}`).trim();
            }
        }
        return notes;
    }

    async import(data) {
        this.uid = this.config.get('uid');
        this.tz = this.config.get('tz') || 'Etc/UTC';
        const p = [];
        for (const n of data) {
            // console.dir(n);
            const { start, end, tags } = n;
            const { jobcode, mainTag } = this.findcode(tags);
            if (!jobcode) {
                throw Error(`No jobcode for ${tags}`);
            }
            console.log(`Jobcode: ${jobcode} for ${tags}`);
            if (!start || !end) {
                console.error(`missing start/end for ${n}`);
            } else {
                const notes = this.mapNotes(tags, mainTag);
                p.push({
                    user_id: this.uid,
                    jobcode_id: jobcode,
                    type: 'regular',
                    start: moment(tw_to_iso(start)).tz(this.tz).format(),
                    end: moment(tw_to_iso(end)).tz(this.tz).format(),
                    notes
                });
            }
        }
        console.dir(p, { depth: Infinity, color: true });
        if (DRY_RUN) { return { DRY_RUN }; }
        const t = timesheets();
        const r = await t.add(p);
        console.dir(r, { depth: Infinity, color: true });
    }

    findcode(tags) {
        for (const tag of tags) {
            const jobcode = this.config.get(`tag.${tag}.jobcode`);
            if (jobcode) {
                return { jobcode, mainTag: tag };
            }
        }
        return { jobcode: undefined, mainTag: undefined };
    }

    async jobcodes() {
        const { results } = await (await jobcodes().get());
        return results.jobcodes;
    }

    async export(range) {
        const t = timesheets();
        this.uid = this.config.get('uid');
        const query = { user_ids: [Number(this.uid)], start_date: range[0], end_date: range[1] };
        console.dir({query});
        return t.get(query);
    }
}




module.exports = GooseBay;
