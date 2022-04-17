/*
 * Copyright (C) 2022 B&R Danmark
 * All rights reserved
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const { spawn } = require('child_process');
const os = require('os');
const vscode = require('vscode');

/**
 * @param {string} title Title to be displayed in the console
 * @param {string} cmd the linux command, like /usr/bin/exos_mr
 * @param {string[]} args arguments for the command, like ['-c', './exos-data.conf']
 * @param {string} cwd working directory
 * @param {string} [distro] wsl distribution, if used
 * @param {boolean} [shutdown] force shutdown wls distribution when terminated
 */

function runCommand(title, cmd, args, cwd, distro, shutdown) {

    let runCmd = '';
    let runArgs = []; 
    // for windows platforms, we execute in wsl
    // here the cmd and the args are put together after the -e argument
    if (os.platform().includes('win')) {
        
        runCmd = 'wsl';
        if (distro) {
            runArgs.push('-d');
            runArgs.push(distro);
        }
        runArgs.push('-e');
        runArgs.push(`${cmd} ${args.join(' ')}`);
    }
    // In Linux, we run the command 'as is'
    else if (os.platform().includes('linux')) {
        runCmd = cmd;
        runArgs = [...args];
    }
    else {
        vscode.window.showErrorMessage(`Platform ${os.platform()} is not supported`);
        return;
    }

    let runShell = spawn(runCmd, runArgs, { cwd: cwd, shell: true });
    const writeEmitter = new vscode.EventEmitter();

    let finished = false;
    const pty = {
        onDidWrite: writeEmitter.event,
        open: () => {writeEmitter.fire(`${title}..\r\nPress Enter to Terminate\r\n\r\n`)},
        close: () => {
            runShell.kill('SIGTERM');
            if (runCmd == 'wsl' && distro && shutdown) {
                runShell = spawn('wsl', ['-t', distro]);                    
            }
        },
        handleInput: data => {
            if(data === '\r')
            {
                if(finished) {
                    terminal.dispose();
                }
                else {    
                    runShell.kill('SIGTERM');
                    if (runCmd == 'wsl' && distro && shutdown) {
                        runShell = spawn('wsl', ['-t', distro]);                        
                    }
                }
            }
        }
    };		
    let terminal = vscode.window.createTerminal({ name: title, pty });

    terminal.show();
    let lineBuffer = [];

    let outputTimer = setInterval(() => {
        while (line = lineBuffer.shift()) {
            writeEmitter.fire(`${line}\r\n`);					
        }
    }, 100);
    
    runShell.stdout.setEncoding('utf8');
    runShell.stdout.on('data', (chunk) => {
        let lines = chunk.toString().replace("\r","").split("\n")
        for(line of lines) {
            if(line.length > 0) {
                lineBuffer.push(line);
            }
        }
    });
    runShell.stderr.setEncoding('utf8');
    runShell.stderr.on('data', (chunk) => {
        let lines = chunk.toString().replace("\r","").split("\n")
        for(line of lines) {
            if(line.length > 0) {
                lineBuffer.push(line);
            }
        }
    });
    runShell.on('error', function (err) {
        writeEmitter.fire(`Error from Linux shell:\r\n${err}\r\nPress Enter to close\r\n`);				
        finished = true;
    });
    runShell.on('exit', (code) => {
        if (0 == code) {
            clearInterval(outputTimer);
            
            while (line = lineBuffer.shift()) {
                writeEmitter.fire(`${line}\r\n`);					
            }
            writeEmitter.fire(`Linux shell finished successfully\r\nPress Enter to close\r\n`);
            finished = true;
        }
        else {
            writeEmitter.fire(`Linux shell exited with code ${code}\r\nPress Enter to close\r\n`);
            finished = true;
        }
    });

}

module.exports = { runCommand };
