/*
 * Copyright (C) 2021 B&R Danmark
 * All rights reserved
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { TemplateLinuxJS } = require('./templates/linux/template_linux_js');
const { ExosComponentAR, ExosComponentARUpdate } = require('./exoscomponent_ar');
const { EXOS_COMPONENT_VERSION } = require("./exoscomponent");
const { ExosPkg } = require('../exospkg');

const path = require('path');

/**
 * @typedef {Object} ExosComponentJSOptions
 * @property {string} packaging  package format: `deb` | `none` - default: `deb`. If set to `none`, includeNodeModules will be forced to `false`
 * @property {string} destinationDirectory destination of the generated executable in Linux. default: `/home/user/{typeName.toLowerCase()}`
 * @property {string} templateAR template used for AR: `c-static` | `cpp` | `c-api` | `deploy-only` - default: `c-api`
 * @property {boolean} includeNodeModules include additional `node_modules` in the package - default: `true`
 */

class ExosComponentJS extends ExosComponentAR {

    /**
     * @type {ExosComponentJSOptions}
     */
     _options;

     /**
      * Create a component for N-API, the template for AR is defined via the options
      * 
      * @param {string} fileName 
      * @param {string} typeName 
      * @param {ExosComponentJSOptions} options 
      */
     constructor(fileName, typeName, options) {
        let _options = {packaging:"deb", destinationDirectory: `/home/user/${typeName.toLowerCase()}`, templateAR: "c-api", includeNodeModules: true};

        if(options) {
            if(options.destinationDirectory) {
                _options.destinationDirectory = options.destinationDirectory;
            }
            if(options.templateAR) {
                _options.templateAR = options.templateAR;
            }
            if(options.includeNodeModules)
            {
                _options.includeNodeModules = options.includeNodeModules;
            }
            if(options.packaging) {
                _options.packaging = options.packaging;
            }
        }

        super(fileName, typeName, _options.templateAR);

        this._options = _options;
        
        if(this._options.packaging == "none") {
            this._options.destinationDirectory = undefined;
            this._options.includeNodeModules = false;
        }

        this._templateBuild = new TemplateLinuxBuild(typeName);
        //this._templateBuild.options.linkLibraries = "";
        this._templateBuild.options.checkVersion = false;

        this._templateJS = new TemplateLinuxJS(this._datamodel);
    }

    makeComponent(location) {
        
        this._templateBuild.options.js.enable = true;
        this._templateBuild.options.js.sourceFiles = [this._templateJS.JsMain.name, this._templateJS.packageJson.name];
    
        
        if(this._options.packaging == "deb") {
            this._templateBuild.options.debPackage.enable = true;
            this._templateBuild.options.js.includeNodeModules = this._options.includeNodeModules;
            this._templateBuild.options.debPackage.destination = this._options.destinationDirectory;

            this._templateBuild.makeBuildFiles();
            this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateBuild.CMakeLists);
            this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateBuild.buildScript);
        }
        else {
            this._templateBuild.options.debPackage.enable = false;
            this._templateBuild.options.js.includeNodeModules = false;
            this._exospackage._exosPkg._buildCommands = [];
        }


        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateJS.packageJson);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateJS.packageLockJson);

        if(this._options.packaging == "deb") {
            this._linuxPackage.addExistingTransferDebFile(this._templateBuild.options.debPackage.fileName, this._templateBuild.options.debPackage.packageName, `${this._typeName} debian package`);
            this._exospackage.exospkg.addService("Startup", `cp ${this._templateJS.JsMain.name} ${this._templateBuild.options.debPackage.destination}`);
            this._exospackage.exospkg.addService("Runtime", `node ${this._templateJS.JsMain.name}`, this._templateBuild.options.debPackage.destination);
        }
        else {
            this._exospackage.exospkg.addFile(path.join("Linux",this._templateJS.packageJson.name), "Restart");
            this._exospackage.exospkg.addFile(path.join("Linux",this._templateJS.packageLockJson.name), "Restart");
            this._exospackage.exospkg.addService("Runtime", `node ${this._templateJS.JsMain.name}`);
        }

        this._linuxPackage.addNewTransferFileObj(this._templateJS.JsMain, "Restart");

        this._exospackage.exospkg.setComponentGenerator("ExosComponentJS", EXOS_COMPONENT_VERSION, []);

        if(this._options.packaging == "deb") {
            this._exospackage.exospkg.addGeneratorOption("exportLinux",[this._templateBuild.options.debPackage.fileName,
                                                                        this._templateJS.JsMain.name]);
        }
        else {
            this._exospackage.exospkg.addGeneratorOption("exportLinux",[this._templateJS.JsMain.name,
                                                                        this._templateJS.packageJson.name,
                                                                        this._templateJS.packageLockJson.name]);
        }

        if (this._templateAR == undefined)
            this._exospackage.makePackage(location);
        else
            super.makeComponent(location);
    }
}

class ExosComponentJSUpdate extends ExosComponentARUpdate {

    /**
     * Update class for N-API applications, only updates the sourcefile of the datamodel-wrapper
     * @param {string} exospkgFileName absolute path to the .exospkg file stored on disk
     * @param {boolean} updateAll update main application sources as well
     * 
     */
     constructor(exospkgFileName, updateAll) {
        super(exospkgFileName, updateAll);
     
        if(this._exosPkgParseResults.componentFound == true && this._exosPkgParseResults.componentErrors.length == 0) {
            this._templateJS = new TemplateLinuxJS(this._datamodel);
            this._linuxPackage.addNewFileObj(this._templateJS.librarySource);
            if(updateAll) {
                this._linuxPackage.addNewFileObj(this._templateJS.JsMain);
            }
        }
     }
}

module.exports = {ExosComponentJS, ExosComponentJSUpdate};