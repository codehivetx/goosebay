# Goose Bay Chrono Bridge

## What is this?

`@codehivetx/goosebay` is a Node.js app which takes [Time Warrior](https://timewarrior.net) export data and feeds it
into [QuickBooks Time](https://quickbooks.intuit.com/time-tracking/timesheets/) (formerly TSheets).

Not affiliated at all with either organization.

[![Node.js](https://github.com/codehivetx/goosebay/actions/workflows/nodejs.yaml/badge.svg?branch=dev)](https://github.com/codehivetx/goosebay/actions/workflows/nodejs.yaml)
### Why would I use this?

If you use Time Warrior for your time tracking, but want to send that data
over to QuickBooks Time for invoicing purposes.

### Where did the name come from?

Goose Bay, NL, Canada is very roughly somewhere between Göteborg and Mountain View.

## How does it work?

Node.js, rest TBD
## Setup

- You have to register your tool as an App in the Intuit Developer  dashboard, <https://developer.intuit.com/app/developer/dashboard> — how to do so is beyond the scope of this document.
- Determine whether you are setting up a sandbox (start with the sandbox!) or production usage of GooseBay.

### Configuration

Uses [Conf](https://npmjs.com/package/conf) to store config. For details on config
file locations, see [env-paths docs](https://github.com/sindresorhus/env-paths#pathsconfig).
On my mac for example, the config is in `~/Library/Preferences/@codehivetx/goosebay-nodejs/config.json`

Note that you can use the `-K` option to choose an alternate config name (instead of the default `config`).
So for testing I use `-K test` before get, set or other operations.

- `goosebay --get` to list all current settings.

- `goosebay --get tz` to get one setting.

- `goosebay --set 'tz=America/Chicago'` to set a setting

### Configuration Options

Set the following config settings (where `goosebay` is the CLI)

- `goosebay --set 'clientid=SECRET'`

Get the Client ID information from the Keys & Oauth section of your app info.
(Be sure you check whether you are getting the Development or Production info!)

- `goosebay --set 'clientsecret=SECRET'`

Get the Client Secret information from the Keys & Oauth section of your app info.
(Be sure you check whether you are getting the Development or Production info!)

- `goosebay --set 'clientenvironment=sandbox'`

Set this to `sandbox` or `production`

- `goosebay --set 'clienturi=http://localhost:3456/callback'`

This has to be one of the Redirect URIs for your app.
For production you can use <https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl>
THis information is  information from the Keys & Oauth section of your app info.
(Be sure you check whether you are getting the Development or Production info!)

- Now run `goosebay --greet` to make sure you can login OK,

1. The way login works is that you will be given a URL on the command line
2. click the URL
3. login (you may need to choose your company)
4. You will be redirected somewhere, possibly to localhost
5. Copy the URL from the browser
6. Paste the URL into the CLI and hit enter. (Or type EXIT to exit.)
7. You should see something like `{ CompanyName: 'Sandbox Company_US_43', Country: 'US' }`

Note that if the app is able to refresh the token, it will.
Use `goosebay --logout` to clear all security tokens from your session.

- `goosebay --employee='Emily Platt'` to set your Employee ID. (Name from the QB sandbox)

- `goosebay --set 'tag.othertag.note=Do Some Stuff'`

This will cause an entry tagged 'mytag,othertag' to have the note 'Do Some Stuff'.

- `goosebay --tag2rate 'GreatStuff,9999'`

Set the hourly rate to 9999 for the tag `GreatStuff`

- `goosebay --tag2customer 'GreatStuff,MyProject'`

Set the tag `GreatStuff` to map to the customer or project `GreatStuff`

- `goosebay --tag2item 'GreatStuff,Pest Control'`

Set the tag `GreatStuff` to map to the QB Item 'Pest Control' (under Products and Services)

- `goosebay --set 'tz=America/New_York'`

Set the time zone for all entries. Defaults to UTC.

## Running

### Importing

Perform a timew export and feed the results to `goosebay --import`

`timew export mytag 2022-01-12 | goosebay --import`

Review the output carefully and rerun with the following to actually make changes:

`timew export mytag 2022-01-12 | env GOOSE_BAY_COMMIT=1 goosebay --import`

## License

[Apache-2.0](./LICENSE)

Note: We can’t be responsible for any results from use or misuse of this alpha level software.
Please check everything carefully and review the code.

## Author

[Steven R. Loomis @srl295](https://github.com/srl295) of [@codehivetx](https://github.com/codehivetx)
