/*
 * Copyright (C) 2021 B&R Danmark
 * All rights reserved
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const { Datamodel, GeneratedFileObj } = require('../../../datamodel');
const { Template, ApplicationTemplate } = require('../template')

class TemplateLinuxJS extends Template {

    /**
     * main javascript application
     * @type {GeneratedFileObj}
     */
    JsMain;

    /**
     * nodejs package JSON file
     * @type {GeneratedFileObj}
     */
    packageJson;

    /**
     * nodejs package-lock JSON file
     * @type {GeneratedFileObj}
     */
         packageLockJson;

    /**
     * Class that implements a Javascript template with no exOS Datamodel
     * 
     * It generates the following {@link GeneratedFileObj} objects
     * - {@linkcode JsMain}
     * - {@linkcode packageJson}
     * - {@linkcode packageLockJson}
     * 
     * @param {Datamodel} datamodel
     */
    constructor(datamodel) {
        super(datamodel, true, true); //create recursive template.dataset info
        this.JsMain = {name:`main.js`, contents:this._generateJSMain(), description:`main javascript application`};
        this.packageJson = {name:"package.json", contents:this._generatePackageJSON(), description:`package information`};
        this.packageLockJson = {name:"package-lock.json", contents:this._generatePackageLockJSON(), description:`package dependency tree`};
    }

    _generatePackageLockJSON() {
        /**
         * @param {ApplicationTemplate} template 
         */
        function generatePackageLockJSON(mainName) {
            let out = "";
        
            out += `{\n`;
            out += `    "name": "${mainName}",\n`;
            out += `    "version": "1.0.0",\n`;
            out += `    "lockfileVersion": 1\n`;
            out += `}\n`;
        
            return out;
        }
        return generatePackageLockJSON(this.JsMain.name);
    }

    _generatePackageJSON() {

        function generatePackageJSON(mainName) {
            let out = "";
        
            out += `{\n`;
            out += `  "name": "${mainName}",\n`;
            out += `  "version": "1.0.0",\n`;
            out += `  "description": "implementation of ${mainName}",\n`;
            out += `  "main": "${mainName}",\n`;
            out += `  "scripts": {\n`;
            out += `    "start": "node ${mainName}"\n`;
            out += `  },\n`;
            out += `  "author": "your name",\n`;
            out += `  "license": "MIT"\n`;
            out += `}\n`;
        
            return out;
        }

        return generatePackageJSON(this.JsMain.name);
    }

    _generateJSMain() {

        /**
         * @param {ApplicationTemplate} template 
         */
        function generateJSMain(template) {

            let out = "";

            out += `async function main() {\n`;
            out += `    console.log('Application started');\n\n`;

            out += `    while (1) {\n`;
            out += `        // put your cyclic code here!\n`;
            out += `        await new Promise(resolve => setTimeout(resolve, 1000));\n`;
            out += `    }\n`;
            out += `}\n\n`;
            
            out += `main();\n`;

            return out;
        }

        return generateJSMain(this.template);
    }

}

module.exports = { TemplateLinuxJS };