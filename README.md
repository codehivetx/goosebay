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

### Configuration

Uses [Conf](https://npmjs.com/package/conf) to store config. For details on config
file locations, see [env-paths docs](https://github.com/sindresorhus/env-paths#pathsconfig).
On my mac for example, the config is in `~/Library/Preferences/@codehivetx/goosebay-nodejs/config.json`

Note that you can use the `-K` option to choose an alternate config name (instead of the default `config`).
So for testing I use `-K test` before get, set or other operations.

### Configuration Options

Set the following config settings (where `goosebay` is the CLI)

- ( a bunch of auth stuff )

- `goosebay --greet` to make sure you can login OK

- `goosebay --employee='Emily Platt'` to set your Employee ID.

- `goosebay --set 'tag.othertag.note=Do Some Stuff'`

This will cause an entry tagged 'mytag,othertag' to have the note 'Do Some Stuff'.

- `goosebay --set 'tz=America/New_York'`

Set the time zone for all entries. Defaults to UTC.

## Running

### Importing

`timew export mytag 2022-01-12 | goosebay --import`

## License

[Apache-2.0](./LICENSE)

## Author

[Steven R. Loomis @srl295](https://github.com/srl295) of [@codehivetx](https://github.com/codehivetx)
