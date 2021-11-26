/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

var net = require('net');
const vscode = require('vscode');

class ExosDebugConsole {

    _ip;
    _port;
    _client;
    _timeout;
    _reconnectOnClose;
    _reconnectCounter;

    /**
     * Creates a connection to the exos log server on AR and outputs the messages via a callback function
     * 
     * @callback ExosDebugConsole.logCallback
     * @param {string} message
     * 
     * @param {vscode.EventEmitter} eventEmitter
     * 
     */
    constructor(eventEmitter) {

        this._client = new net.Socket();
        this._timeout = null;
        this._reconnectOnClose = false;
        this._reconnectCounter = 0;
        this._eventEmitter = eventEmitter;

        this._client.on('this._timeout', () => {
            this._eventEmitter.fire('Disconnected');
            this._client.end();
            this._client.connect(this._port, this._ip);
        });

        this._client.on('connect', function () {
            if (this._reconnectOnClose) {
                stdout.write('\n');
            }
            this._client.setTimeout(3000);
            this._eventEmitter.fire('Connected');
            console.log('Connected');
            this._reconnectOnClose = false;
            this._reconnectCounter = 0;
        });

        this._client.on('data', function (data) {
            process.stdout.write(data.toString());
            this._eventEmitter.fire(data.toString());
            /* file output - remove color codes
            data.toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
            */
        });

        this._client.on('close', function () {
            if (this._reconnectOnClose) {
                this._timeout = setTimeout(() => {
                    this._client.end();
                    this._client.connect(this._port, this._ip);
                }, 2000);
            }
            else {
                this._eventEmitter.fire('Connection closed');
            }
        });

        this._client.on('error', function (error) {
            this._reconnectCounter++;
            let spinner = ["-", "\\", "|", "/"][this._reconnectCounter % 4];
            let prepend = this._reconnectOnClose ? "\r" : "\n"

            stdout.write(`${prepend}Connection error (${error.code}), reconnecting ${spinner}            `);

            if (this._timeout) {
                clearTimeout(this._timeout);
            }
            this._reconnectOnClose = true;
        });
    }

    connect(ip) {
        this._ip = ip;
        this._port = 49000;
        this._eventEmitter.fire(`Connecting to ${this._ip}:${this._port}`);
        console.log(`Connecting to ${this._ip}:${this._port}`);
        this._client.connect(this._port, this._ip);
    }
}

module.exports = { ExosDebugConsole }; 