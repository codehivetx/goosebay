const { users } = require('tsheets-sdk');
const { TSHEETS_USERID } = require('process').env;

async function getuinfo(uid) {
    const { results } = await users().get([uid]);

    return results.users[uid];
}

async function doit() {
    const myUser = await getuinfo(TSHEETS_USERID);
    const {first_name, last_name, employee_number, company_name} = myUser;

    console.log(`Hello ${first_name} ${last_name} #${employee_number} from ${company_name}`);

    // get current timezone
    // await t.get({user_ids: [TSHEETS_USERID], start_date:'2022-01-01', end_date:'2022-12-31'})

    // > await t.add([{user_id:TSHEETS_USERID, jobcode_id: 00000, type:'regular', "start":"2022-01-10T10:00:00-07:00", "end":"2022-01-10T14:00:00-07:00", "notes":"test"}])
    // return myUser;

    // Need to know about jobcodes:
    // (await jobcodes().get()).results

    return null;
}

doit ()
.then(x => console.dir(x), err => console.error(err));
