/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// const { users, jobcodes, timesheets } = require('tsheets-sdk');
const { env } = require('process');
const OAuthClient = require('intuit-oauth');
const readline = require('readline');
const { stdin, stdout } = require('process');
const { promisify } = require('util');
const { URL } = require('url');

// set $GOOSE_BAY_COMMIT=true to actually commit
// const DRY_RUN = (!env.GOOSE_BAY_COMMIT);
// const moment = require('moment-timezone');
// const tw_to_iso = require('./tw_to_iso');
class GooseBay {
    constructor(config) {
        this.config = config;

        // // hack in the token
        // const token = config.get('token');
        // if (token) {
        //     env.TSHEETS_TOKEN = token;
        //     console.log('set $TSHEETS_TOKEN from token');
        // } else {
        //     console.log('NOTE: $TSHEETS_TOKEN not set');
        // }
    }

    getOauthConfig() {
        return {
            clientId: this.config.get('clientid'),
            clientSecret: this.config.get('clientsecret'),
            environment: this.config.get('clientenvironment'),
            redirectUri: this.config.get('clienturi'),
            logging: true
        };
    }

    getOauthClient() {
        const oauthConfig = this.getOauthConfig();
        console.dir({oauthConfig});
        return new OAuthClient(oauthConfig);
    }

    async login() {
        this.oauthClient = this.getOauthClient();
        const authConfig = {
            scope: [OAuthClient.scopes.Accounting /*, OAuthClient.scopes.TimeTracking, OAuthClient.scopes.OpenId*/],
            state: 'goosebay',
        };
        console.dir({authConfig});
        const authUri = this.oauthClient.authorizeUri(authConfig);
        console.dir({authUri});
        console.log('Paste the localhost:3456 url here… ');
        const rl = readline.createInterface({ input: stdin, output: stdout });
        const question = promisify(rl.question).bind(rl);
        // let code, realmId, state;
        for(;;) {
            const ln = await question('URL=> ');
            console.log(ln);
            // const u = new URL(ln);
            // code = u.searchParams.get('code');
            // realmId = u.searchParams.get('realmId');
            // state = u.searchParams.get('state');
            // if (code && realmId && state) {
            //     break;
            // }
            try {
                this.authReponse = await this.oauthClient.createToken();
                break;
            } catch(e) {
                console.error(e);
                console.error('The error message is :' + e.originalMessage);
                console.error(e.intuit_tid);
            }
        }
        rl.close();
        console.log('DONE');
        console.dir(this.authResponse, {color: true, depth: Infinity});
        console.log('The Token is  ' + JSON.stringify(this.authResponse.getJson()));
    }

    // /**
    //  * Get user info
    //  * @param {Number} uid
    //  * @returns
    //  */
    // async getuinfo(uid) {
    //     // const { results } = await users().get([uid]);
    //     // return results.users[uid];
    // }

    async greet() {
        await this.login();
        // this.uid = this.config.get('uid');
        // console.log(`Getting info on ${this.uid}`);
        // const myUser = await this.getuinfo(this.uid);
        // const { first_name, last_name, employee_number, company_name } = myUser;
        // console.log(`Hello ${first_name} ${last_name} #${employee_number} from ${company_name}`);
    }

    // /**
    //  *
    //  * @param {String[]} tags tag list
    //  */
    // mapNotes(tags, mainTag) {
    //     let notes = '';
    //     for (const tag of tags.sort()) {
    //         if (tag == mainTag) {
    //             continue; // skip this one
    //         }
    //         const note = this.config.get(`tag.${tag}.note`);
    //         if (note === undefined) {
    //             notes = (notes + ` ${tag}`).trim();
    //         } else {
    //             notes = (notes + ` ${note}`).trim();
    //         }
    //     }
    //     return notes;
    // }

    // async import(data) {
    //     this.uid = this.config.get('uid');
    //     this.tz = this.config.get('tz') || 'Etc/UTC';
    //     const p = [];
    //     for (const n of data) {
    //         // console.dir(n);
    //         const { start, end, tags } = n;
    //         const { jobcode, mainTag } = this.findcode(tags);
    //         if (!jobcode) {
    //             throw Error(`No jobcode for ${tags}`);
    //         }
    //         console.log(`Jobcode: ${jobcode} for ${tags}`);
    //         if (!start || !end) {
    //             console.error(`missing start/end for ${n}`);
    //         } else {
    //             const notes = this.mapNotes(tags, mainTag);
    //             p.push({
    //                 user_id: this.uid,
    //                 jobcode_id: jobcode,
    //                 type: 'regular',
    //                 start: moment(tw_to_iso(start)).tz(this.tz).format(),
    //                 end: moment(tw_to_iso(end)).tz(this.tz).format(),
    //                 notes
    //             });
    //         }
    //     }
    //     console.dir(p, { depth: Infinity, color: true });
    //     if (DRY_RUN) { return { DRY_RUN }; }
    //     const t = timesheets();
    //     const r = await t.add(p);
    //     console.dir(r, { depth: Infinity, color: true });
    // }

    // findcode(tags) {
    //     for (const tag of tags) {
    //         const jobcode = this.config.get(`tag.${tag}.jobcode`);
    //         if (jobcode) {
    //             return { jobcode, mainTag: tag };
    //         }
    //     }
    //     return { jobcode: undefined, mainTag: undefined };
    // }

    // async jobcodes() {
    //     const { results } = await (await jobcodes().get());
    //     return results.jobcodes;
    // }

    // async export(range) {
    //     const t = timesheets();
    //     this.uid = this.config.get('uid');
    //     const query = { user_ids: [Number(this.uid)], start_date: range[0], end_date: range[1] };
    //     console.dir({query});
    //     return t.get(query);
    // }
}




module.exports = GooseBay;
