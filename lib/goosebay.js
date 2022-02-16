/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// const { users, jobcodes, timesheets } = require('tsheets-sdk');
const { env } = require('process');
const OAuthClient = require('intuit-oauth');
const readline = require('readline');
const { /*stdin,*/ stdout } = require('process');
const { promisify } = require('util');
const QuickBooks = require('node-quickbooks');
// const { URL } = require('url');

// set $GOOSE_BAY_COMMIT=true to actually commit
const DRY_RUN = (!env.GOOSE_BAY_COMMIT);
const moment = require('moment-timezone');
const tw_to_iso = require('./tw_to_iso');
const seconds_to_hm = require('./seconds_to_hm');
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
            const input = require('fs').createReadStream('/dev/tty');  // TODO: danger will robinson
            const rl = readline.createInterface({ input, output: stdout });
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
            input.close();
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

        const {CompanyName, Country} = await this.qboGetCompanyInfo(this.getRealmId());

        console.dir({CompanyName, Country}, {color: true, depth: Infinity});

        // // FOR TEST
        // // console.log(await this.qboFindTimeActivities([
        // //     {field: 'TxnDate', value: '2014-12-01', operator: '>'},
        // //     {field: 'limit',  value: 5},
        // // ]));
        // console.log(await this.qboFindTimeActivities([
        //     {field: 'TxnDate', value: '2014-12-01', operator: '>'},
        //     {field: 'limit',  value: 5},
        // ]));
    }

    /**
     * Set the employee info from this
     * @param {String} displayName
     */
    async setEmployeeByName(displayName) {
        if (!displayName) {
            console.log('Unsetting employee');
            this.config.delete('employee_id');
            this.config.delete('employee_name');
        } else {
            const employees = await this.qboFindEmployees([
                { field: 'DisplayName', value: displayName }
            ]);
            console.dir(employees);
            const Employee = employees?.QueryResponse?.Employee;
            if (!Employee) {
                throw Error(`No employees found as ${displayName}`);
            } else if(Employee.length !== 1) {
                throw Error(`Error, found ${Employee.length} employees found as ${displayName}, wanted one`);
            }
            const { Id } = Employee[0];
            if (!Id) {
                throw Error(`Error, no Id for ${displayName}`);
            }
            console.log(`Found and setting id=${Id} for ${displayName}`);
            this.config.set('employee_id', Id);
            this.config.set('employee_name', displayName);
        }
    }

    /**
     * Set the employee info from this
     * @param {String} displayName
     */
    async setCustomerTag(tag, displayName) {
        if (!displayName) {
            console.log('Unsetting tag2customer ' + tag);
            this.config.delete(`tag.${tag}.customer_id`);
            this.config.delete(`tag.${tag}.customer_name`);
        } else {
            const results = await this.qboFindCustomers([
                { field: 'DisplayName', value: displayName }
            ]);
            console.dir(results);
            const Customer = results?.QueryResponse?.Customer;
            if (!Customer) {
                throw Error(`No customers found as ${displayName}`);
            } else if (Customer.length !== 1) {
                throw Error(`Error, found ${Customer.length} as ${displayName}, wanted one`);
            }
            const { Id } = Customer[0];
            if (!Id) {
                throw Error(`Error, no Id for ${displayName}`);
            }
            console.log(`Found and setting ${tag} => id=${Id} for ${displayName}`);
            this.config.set(`tag.${tag}.customer_id`, Id);
            this.config.set(`tag.${tag}.customer_name`, displayName);
        }
    }

    /**
     * Set the employee info from this
     * @param {String} displayName
     */
    async setItemTag(tag, displayName) {
        if (!displayName) {
            console.log('Unsetting tag2item ' + tag);
            this.config.delete(`tag.${tag}.item_id`);
            this.config.delete(`tag.${tag}.item_name`);
        } else {
            const results = await this.qboFindItems([
                { field: 'Name', value: displayName }
            ]);
            console.dir(results);
            const Item = results?.QueryResponse?.Item;
            if (!Item) {
                throw Error(`No items found as ${displayName}`);
            } else if (Item.length !== 1) {
                throw Error(`Error, found ${Item.length} as ${displayName}, wanted one`);
            }
            const { Id } = Item[0];
            if (!Id) {
                throw Error(`Error, no Id for ${displayName}`);
            }
            console.log(`Found and setting ${tag} => id=${Id} for ${displayName}`);
            this.config.set(`tag.${tag}.item_id`, Id);
            this.config.set(`tag.${tag}.item_name`, displayName);
        }
    }

    /**
     * Set the employee info from this
     * @param {String} displayName
     */
    async setRateTag (tag, rate) {
        if (!rate) {
            console.log('Unsetting tag2rate ' + tag);
            this.config.delete(`tag.${tag}.rate`);
        } else {
            console.log(`setting ${tag} => rate=${rate}`);
            this.config.set(`tag.${tag}.rate`, rate);
        }
    }


    /**
     * Prototype for promisified utilities
     * @param {Object} o
     * @returns
     */
    async qboFindCustomers(o) {
        return this.qboApiCall('findCustomers', o);
    }
    /**
     * Prototype for promisified utilities
     * @param {Object} o
     * @returns
     */
    async qboFindEmployees(o) {
        return this.qboApiCall('findEmployees', o);
    }


    /**
     * Prototype for promisified utilities
     * @param {Object} o
     * @returns
     */
    async qboFindItems(o) {
        return this.qboApiCall('findItems', o);
    }

    /**
     * Prototype for promisified utilities
     * @param {Object} o
     * @returns
     */
    async qboCreateTimeActivity(o) {
        return this.qboApiCall('createTimeActivity', o);
    }
    /**
     * Prototype for promisified utilities
     * @param {Object} o
     * @returns
     */
    async qboUpdateTimeActivity(o) {
        return this.qboApiCall('updateTimeActivity', o);
    }
    /**
     * Prototype for promisified utilities
     * @param {Object} o
     * @returns
     */
    async qboFindTimeActivities(o) {
        return this.qboApiCall('findTimeActivities', o);
    }
    /**
     * Prototype for promisified utilities
     * @param {Object} o
     * @returns
     */
    async qboDeleteTimeActivity(o) {
        return this.qboApiCall('deleteTimeActivity', o);
    }
    /**
     * Prototype for promisified utilities
     * @param {Object} o
     * @returns
     */
    async qboGetTimeActivity(o) {
        return this.qboApiCall('getTimeActivity', o);
    }

    async qboGetCompanyInfo(id) {
        return this.qboApiCall('getCompanyInfo', id);
    }

    /**
     * Call some qbo function
     * @param {String} api
     * @param {Object} o
     * @returns
     */
    async qboApiCall(api, o) {
        const qbo = await this.getQbo();
        const func = promisify(qbo[api]).bind(qbo);
        return func(o);
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
        await this.login();
        const employee_id = this.config.get('employee_id');
        const employee_name = this.config.get('employee_name');
        if (!employee_id || !employee_name) {
            throw Error('use --employee to set employee');
        }

        // Fetch ALL existing data
        const existing = {};

        const fetchExisting = await this.qboFindTimeActivities([
            // ! query not working here. Just get everything.
            // {field: 'EmployeeRef', value: employee_id},
        ]);

        for (const activity of (fetchExisting?.QueryResponse?.TimeActivity) || []) {
            const {TxnDate, EmployeeRef, CustomerRef, ItemRef} = activity;
            if (EmployeeRef.value != employee_id) {
                continue;
            }
            existing[TxnDate] = existing[TxnDate] || new Set();
            existing[TxnDate].add(`c${CustomerRef?.value || 'NONE'}:i${ItemRef?.value}`);
        }

        console.dir(existing, {color: true, depth: Infinity});

        this.tz = this.config.get('tz') || 'Etc/UTC';
        const p = {};
        for (const n of data) {
            console.dir(n);
            const { start, end, tags } = n;
            const { item_id, item_name, customer_id, customer_name, rate, mainTag } = this.findcode(tags);
            // findcode will throw
            console.dir({ tags, item_id, item_name, customer_id, customer_name, rate, mainTag });

            if (!start || !end) {
                console.error(`missing start/end for ${n}`);
            } else {
                const notes = this.mapNotes(tags, mainTag);
                const startm = moment(tw_to_iso(start)).tz(this.tz);
                const endm = moment(tw_to_iso(end)).tz(this.tz);
                const ends = endm.format();
                const starts = startm.format();

                // todo: 0-pad month and day
                const startDate = startm.format('YYYY-MM-DD');

                p[startDate] = p[startDate] || {};
                const ourDay = p[startDate];

                const key = `c${customer_id}:i${item_id}:r${rate}`;

                const seconds = (endm - startm) / 1000.0;

                if (!ourDay[key]) {
                    ourDay[key] = {
                        start: starts,
                        end: ends,
                        seconds,
                        entries: 0,
                        notes: new Set(),
                        tags, item_id, item_name, customer_id, customer_name, rate, mainTag
                    };
                } else {
                    ourDay[key].seconds += seconds;
                }
                ourDay[key].notes.add(notes);
                ourDay[key].entries += 1;
            }
        }
        console.dir(p, { depth: Infinity, color: true });

        const fails = new Set();
        const upds = new Set();
        const skips = new Set();
        const missings = new Set();

        for (const [TxnDate, kinds] of Object.entries(p)) {
            console.log('=' + TxnDate);
            for (const [k, o] of Object.entries(kinds)) {
                console.log(' t: '+k);
                const { Hours, Minutes } = seconds_to_hm(o.seconds);
                const req = {
                    NameOf: 'Employee',
                    TxnDate,
                    EmployeeRef: {
                        value: employee_id
                    },
                    CustomerRef: {
                        value: o.customer_id
                    },
                    ItemRef: {
                        value: o.item_id
                    },
                    HourlyRate: o.rate,
                    Hours,
                    Minutes,
                    BillableStatus: 'Billable',
                    Description: Array.from(o.notes.values()).sort().join(', '),
                };
                console.dir(req);
                const skipKey = `c${o.customer_id}:i${o.item_id}`;
                if (!req.HourlyRate || !req.CustomerRef.value || !req.ItemRef.value) {
                    console.log('Skipping (no data) ' + req.TxnDate + ' ' + skipKey );
                    missings.add(req.TxnDate + ' ' + skipKey);
                } else if (existing[req.TxnDate]?.has(skipKey)) {
                    console.log('Skipping (exists) ' + req.TxnDate + ' ' + skipKey );
                    skips.add(req.TxnDate + ' ' + skipKey);
                } else if (!DRY_RUN) {
                    try {
                        const r = await this.qboCreateTimeActivity(req);
                        console.dir(r, {color: true, depth: Infinity});
                        upds.add(req.TxnDate);
                    } catch(e) {
                        console.error(e);
                        fails.add(req.TxnDate);
                    }
                } else {
                    upds.add(req.TxnDate);
                }
            }
        }
        // const t = timesheets();
        // const r = await t.add(p);
        // console.dir(r, { depth: Infinity, color: true });

        console.dir({skips, upds, fails, missings});
        if (DRY_RUN) {
            console.log('** set GOOSE_BAY_COMMIT=1 to commit **');
            return { DRY_RUN };
        }
    }

    findcode(tags) {
        for (const tag of tags) {
            const customer_id = this.config.get(`tag.${tag}.customer_id`);
            if (customer_id) {
                const customer_name = this.config.get(`tag.${tag}.customer_name`) || `customer#${customer_id}`;
                const item_id = this.config.get(`tag.${tag}.item_id`);
                if (!item_id) {
                    throw Error(`customer_id but no item_id for ${tag}`);
                }
                const item_name = this.config.get(`tag.${tag}.item_name`) || `item#${item_id}`;
                const rate = this.config.get(`tag.${tag}.rate`);
                if (!rate) {
                    throw Error(`customer_id but no item_id for ${tag}`);
                }
                return { customer_id, item_id, rate, customer_name, item_name, mainTag: tag };
            }
        }
        return { jobcode: undefined, mainTag: undefined };
    }

    // async jobcodes() {
    //     const { results } = await (await jobcodes().get());
    //     return results.jobcodes;
    // }

    async export(range) {
        await this.login();

        const query = [
            {field: 'TxnDate', value: range[0], operator: '>'},
            {field: 'TxnDate', value: range[1], operator: '<'},
            {field: 'limit',  value: 5},
        ];
        console.dir(query);
        const resp = await this.qboFindTimeActivities(query);
        console.log(resp);

        // const t = timesheets();
        // this.uid = this.config.get('uid');
        // const query = { user_ids: [Number(this.uid)], start_date: range[0], end_date: range[1] };
        // console.dir({query});
        // return t.get(query);
        return resp;
    }
}




module.exports = GooseBay;
