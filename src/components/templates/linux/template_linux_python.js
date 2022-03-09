/*
 * Copyright (C) 2021 B&R Danmark
 * All rights reserved
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const { GeneratedFileObj } = require('../../../datamodel');
const { Template } = require('../template');


class TemplateLinuxPython extends Template {

    /**
     * Main python script
     * @type {GeneratedFileObj}
     */
    pythonMain;

    /**
     * Class to create python linux template with no datamodel, generating 
     * 
     * - {@linkcode pythonMain}
     * 
     * inherited from {@linkcode Template}
     * 
     * 
     */
    constructor() {
        super(undefined, true);

        this.pythonMain = {name:`main.py`, contents:this._generatePythonMain(), description:"Main python script"};
    }

    _generatePythonMain() {
        let out = "";

        out += `import time\n\n`;
        out += `try:\n`;
        out += `    while True:\n`;
        out += `        # put your cyclic code here!\n`;
        out += `        time.sleep(1)\n`;
        out += `except(KeyboardInterrupt, SystemExit):\n`;
        out += `    print("Application terminated, shutting down")\n`;
    
        return out;
    }
}

module.exports = {TemplateLinuxPython};