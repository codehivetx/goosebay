/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// const { users, jobcodes, timesheets } = require('tsheets-sdk');
// const { env } = require('process');
const OAuthClient = require('intuit-oauth');
const readline = require('readline');
const { stdin, stdout } = require('process');
const { promisify } = require('util');
const QuickBooks = require('node-quickbooks');
const { util } = require('chai');
// const { URL } = require('url');

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

    /**
     * Try to login interactively.
     * We try to refresh first, if not expired
     *
     * @param {Boolean} if true, always relogin
     * @returns {Promise<Object>} a copy of this.authResponse
     */
    async login(force) {
        this.oauthClient = this.getOauthClient();
        let authResponse;

        if (!force) {
            // By default, we try to refresh first.
            try {
                authResponse = await this.refresh();  // will set this.authResponse
            } catch (e) {
                console.error(e);
            }
        }

        if (!authResponse) {
            console.log('** Must re-login');

            const authConfig = {
                scope: [
                    OAuthClient.scopes.Accounting,
                    OAuthClient.scopes.OpenId,
                    // OAuthClient.scopes.TimeTracking,
                ],
                state: 'goosebay',
            };
            console.dir({authConfig});
            const authUri = this.oauthClient.authorizeUri(authConfig);
            const rl = readline.createInterface({ input: stdin, output: stdout });
            const question = promisify(rl.question).bind(rl);
            // let code, realmId, state;
            for(;;) {
                console.dir({authUri});
                console.log('Paste the localhost:3456 url here… ');
                const ln = await question('URL or EXIT)=> ');
                console.log(ln);
                if(ln === 'EXIT') {
                    rl.close();
                    throw Error('User exitted'); // break out
                    // return null;
                }
                try {
                    this.authResponse = await (this.oauthClient.createToken(ln));
                    if (this.authResponse) {
                        break;
                    } else {
                        console.error('No auth response, internal err');
                    }
                } catch(e) {
                    console.error(e);
                    console.error('The error message is :' + e.originalMessage);
                    console.error(e.intuit_tid);
                    console.dir(e.authReponse, {depth: Infinity, color: true});
                }
            }
            rl.close();
            console.log('DONE');
            this.setRefreshToken();
        }

        return this.authResponse;
    }

    /**
     * Refresh, getting token. Returns null if token was not refreshable.
     * @param {Boolean} force
     * @returns {Promise<Token>} token
     */
    async refresh(force) {
        if (!force && this.oauthClient.isAccessTokenValid()) {
            console.log('Token valid, continuing');
            return this.oauthClient.getToken();
        }
        if (this.authResponse) {
            console.log('prior authResponse - trying native refresh()');
            try {
                const authResponse = await (this.oauthClient.refresh());
                console.dir(authResponse, {depth: Infinity, color: true});
                this.authResponse = authResponse;  // todo: validate first!
                this.setRefreshToken();
                return this.oauthClient.getToken();
            } catch(e) {
                console.error(e);
                // that's ok, we'll try a prior token
            }
        }
        // Try using a prior refresh token
        const refreshtoken = this.config.get('refreshtoken');
        const refreshtoken_eol = this.config.get('refreshtoken_eol');
        if (refreshtoken && refreshtoken_eol) {
            const eol = new Date(refreshtoken_eol);
            const nowish = new Date();
            if(eol < nowish) {
                console.error('Saved refresh token has expired at ' + eol.toLocaleString() + ' and it is now ' + nowish.toLocaleString());
                return null;
            }
            console.log('Trying to refresh with ' + refreshtoken);
            try {
                const authResponse = await (this.oauthClient.refreshUsingToken(refreshtoken));
                console.dir(authResponse, {depth: Infinity, color: true});
                this.authResponse = authResponse;  // todo: validate first!
                console.log('** Refreshed!');
                this.setRefreshToken();
                return this.oauthClient.getToken();
            } catch(e) {
                console.error(e);
            }
        }

        console.error('Could not refresh.');
        return null; // Could not refresh
    }

    async logout() {
        if (this.oauthClient) {
            try {
                const authResponse = await (this.oauthClient.revoke());
                this.authResponse = null;
                console.dir({authResponse});
                console.log('Logged out.');
            } catch(e) {
                console.error(e);
                console.error('The error message is :' + e.originalMessage);
                console.error(e.intuit_tid);
                console.dir(e.authReponse, {depth: Infinity, color: true});
            }
        }
        this.config.delete('refreshtoken');
        this.config.delete('refreshtoken_eol');
        console.log('Cleared refreshtoken.');
    }

    /**
     * Given a successful this.authResponse, try to refresh it
     */
    setRefreshToken() {
        console.log('The Response is  ' + JSON.stringify(this.authResponse.getJson()));
        console.dir(this.authResponse, {color: true, depth: Infinity});
        const refreshtoken_eol =  Date.now()+this.authResponse.token.x_refresh_token_expires_in;
        console.log('Refresh Token will expire at: ' + new Date(refreshtoken_eol).toLocaleString());
        if (this.authResponse.token.refresh_token) {
            this.config.set('refreshtoken', this.authResponse.token.refresh_token);
        } else {
            console.log('Error, no refresh token. Clearing.');
            this.config.delete('refreshtoken');
        }
        if (this.authResponse?.token?.realmId) {
            this.config.set('realmid', this.authResponse?.token?.realmId);
        }
        this.config.set('refreshtoken_eol', refreshtoken_eol);
        // debug
    }

    /**
     * return a live or cached relamid
     * @returns realm (company) id
     */
    getRealmId() {
        if (this.authResponse?.token?.realmId) {
            return this.authResponse?.token?.realmId;
        } else {
            return this.config.get('realmid');
        }
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

    /**
     * Login and say hello.
     * This is important because that way the user knows they're into the correct account.
     */
    async greet() {
        await this.login();
        console.log('Logged into realm (company) id ' + this.getRealmId());

        // FOR TEST
        console.log(await this.qboFindCustomers({
            fetchAll: true
        }));
    }

    /**
     * Prototype for promisified utilities
     * @param {Object} o
     * @returns
     */
    async qboFindCustomers(o) {
        const qbo = await this.getQbo();
        const findCustomers = promisify(qbo.findCustomers).bind(qbo);
        return findCustomers(o);
    }

    /**
     * Get a QBO object. Call login() first.
     * Caches the qbo object.
     * @returns {QuickBooks} qbo object
     */
    async getQbo() {
        if (this.qbo) {
            return this.qbo;
        }
        const token = await this.refresh();
        const {
            clientId, clientSecret, environment, /*redirectUri,*/
            logging
        } = this.getOauthConfig();
        const {
            access_token: oauthToken,
            refresh_token: refreshToken,
        } = token;
        const realmId = this.getRealmId();
        const sandbox = environment !== 'production';
        const tokenSecret = null;
        const minorVersion = null;
        const oauthVersion = '2.0';
        // console.dir({
        //     clientId,
        //     clientSecret,
        //     oauthToken,
        //     tokenSecret,
        //     realmId,
        //     sandbox,
        //     logging,
        //     minorVersion,
        //     oauthVersion,
        //     refreshToken,
        // });
        const qbo = new QuickBooks(
            clientId,
            clientSecret,
            oauthToken,
            tokenSecret,
            realmId,
            sandbox,
            logging,
            minorVersion,
            oauthVersion,
            refreshToken
        );
        console.log('Created qbo into ' + realmId);
        this.qbo = qbo;
        return qbo;
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
