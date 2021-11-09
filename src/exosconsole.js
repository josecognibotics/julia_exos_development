var net = require('net');
const { stdout } = require("process");

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
     * @param {string} ip
     * @param {ExosDebugConsole.logCallback} log
     * 
     */
    constructor() {

        this._client = new net.Socket();
        this._timeout = null;
        this._reconnectOnClose = false;
        this._reconnectCounter = 0;
        this._log = log;

        this._client.on('this._timeout', () => {
            this._log('Disconnected');
            this._client.end();
            this._client.connect(this._port, this._ip);
        });

        this._client.on('connect', function () {
            if (this._reconnectOnClose) {
                stdout.write('\n');
            }
            this._client.setTimeout(3000);
            this._log('Connected');
            console.log('Connected');
            this._reconnectOnClose = false;
            this._reconnectCounter = 0;
        });

        this._client.on('data', function (data) {
            process.stdout.write(data.toString());
            this._log(data.toString());
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
                this._log('Connection closed');
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

    setCallback(log) {
        this._log = log;
    }

    connect(ip) {
        this._ip = ip;
        this._port = 49000;
        this._log(`Connecting to ${this._ip}:${this._port}`);
        console.log(`Connecting to ${this._ip}:${this._port}`);
        this._client.connect(this._port, this._ip);
    }
}

module.exports = { ExosDebugConsole }; 