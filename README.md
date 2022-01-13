# Goose Bay Chrono Bridge

## What is this?

`@codehivetx/goosebay` is a Node.js app which takes [Time Warrior](https://timewarrior.net) export data and feeds it
into [QuickBooks Time](https://quickbooks.intuit.com/time-tracking/timesheets/) (formerly TSheets).

Not affiliated with either

### Why would I use this?

If you use Time Warrior for your time tracking, but want to send that data
over to QuickBooks Time for invoicing purposes.

### Where did the name come from?

Goose Bay, NL, Canada is very roughly somewhere between Göteborg and Mountain View.

## How does it work?

Node.js, rest TBD
## Running

can use npx setc.

## Setup

### Configuration

Uses [Conf](https://npmjs.com/package/conf) to store config. For details on config
file locations, see [env-paths docs](https://github.com/sindresorhus/env-paths#pathsconfig).
On my mac for example, the config is in `~/Library/Preferences/@codehivetx/goosebay-nodejs/config.json`

Note that you can use the `-K` option to choose an alternate config name (instead of the default `config`).
So for testing I use `-K test` before get, set or other operations.

### Configuration Options

Set the following config settings (where `goosebay` is the CLI)

- `goosebay --set uid=1234`

your TSheets (numeric) user id (_how do I find this?_)

- `goosebay --set 'token=MYTOKENTOKENTOKEN'`

A TSheets access token, see [here](https://tsheetsteam.github.io/api_docs/#getting-help).
You can also set the `TSHEETS_TOKEN` env variable.

## License

[Apache-2.0](./LICENSE)

## Author

[Steven R. Loomis @srl295](https://github.com/srl295) of [@codehivetx](https://github.com/codehivetx)
