/*
 * Copyright (C) 2021 B&R Danmark
 * All rights reserved
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const { ExosComponentAR, ExosComponentARUpdate } = require('./exoscomponent_ar');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { TemplateLinuxJulia } = require('./templates/linux/template_linux_julia');
const { EXOS_COMPONENT_VERSION } = require("./exoscomponent");
const { ExosPkg } = require('../exospkg');

const path = require('path');

/**
 * @typedef {Object} ExosComponentJuliaOptions
 * @property {string} packaging  package format: `deb` | `none` - default: `deb`
 * @property {string} destinationDirectory destination of the generated executable in Linux. default: `/home/user/{typeName.toLowerCase()}`
 * @property {string} templateAR template used for AR: `c-static` | `cpp` | `c-api` | `deploy-only` - default: `c-static` 
 */

class ExosComponentJulia extends ExosComponentAR {

    /**
     * 
     * @type {ExosComponentJuliaOptions}
     */
    _options;

    /**
     * Create a Julia template using Julia - the template for AR is defined via the options
     * 
     * @param {string} fileName 
     * @param {string} typeName 
     * @param {ExosComponentJuliaOptions} options 
     */
    constructor(fileName, typeName, options) {

        let _options = {packaging:"deb", destinationDirectory: `/home/user/${typeName.toLowerCase()}`, templateAR: "c-static"};

        if(options) {
            if(options.destinationDirectory) {
                _options.destinationDirectory = options.destinationDirectory;
            }
            if(options.templateAR) {
                _options.templateAR = options.templateAR;
            }
            if(options.packaging) {
                _options.packaging = options.packaging;
            }
        }

        super(fileName, typeName, _options.templateAR);
        this._options = _options;

        if(this._options.packaging == "none") {
            this._options.destinationDirectory = undefined;
        }

        this._templateBuild = new TemplateLinuxBuild(typeName);
        this._templateJulia = new TemplateLinuxJulia(this._datamodel);
        this._exospackage._exosPkg._buildCommands = [];
    }

    makeComponent(location) {
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateJulia.staticLibraryHeader);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateJulia.staticLibrarySource);
        
        this._templateBuild.options.julia.enable = true;
        this._templateBuild.options.swigJulia.enable = true;

        if(this._options.packaging == "deb") {
            this._templateBuild.options.debPackage.enable = true;
            this._templateBuild.options.debPackage.destination = this._options.destinationDirectory;
        }
        else {
            this._templateBuild.options.debPackage.enable = false;
        }

        this._templateBuild.makeBuildFiles();
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateBuild.CMakeLists);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateBuild.buildScript);

        this._linuxPackage.addNewTransferFileObj(this._templateJulia.mainSource, "Restart");

        if(this._options.packaging == "deb") {
            this._linuxPackage.addExistingTransferDebFile(this._templateBuild.options.debPackage.fileName, this._templateBuild.options.debPackage.packageName, `${this._typeName} debian package`);
            this._exospackage.exospkg.addService("Startup", `cp ${this._templateJulia.mainSource.name} ${this._templateBuild.options.debPackage.destination}`);
            this._exospackage.exospkg.addService("Runtime", `julia ${this._templateJulia.mainSource.name}`, this._templateBuild.options.debPackage.destination);
        }
        else {
            this._exospackage.exospkg.addService("Runtime", `julia ${this._templateJulia.mainSource.name}`);
        }


        this._exospackage.exospkg.setComponentGenerator("ExosComponentJulia", EXOS_COMPONENT_VERSION, []);

        if(this._options.packaging == "deb") {
            this._exospackage.exospkg.addGeneratorOption("exportLinux",[this._templateBuild.options.debPackage.fileName,
                                                                        this._templateJulia.mainSource.name]);
        }
        else {
            this._exospackage.exospkg.addGeneratorOption("exportLinux",[this._templateJulia.mainSource.name]);
        }
        if (this._templateAR == undefined)
            this._exospackage.makePackage(location);
        else
            super.makeComponent(location);
    }
}

class ExosComponentJuliaUpdate extends ExosComponentARUpdate {

    /**
     * Update class for Julia applications, only updates the sourcefile of the datamodel-wrapper
     * @param {string} exospkgFileName absolute path to the .exospkg file stored on disk
     * @param {boolean} updateAll update main application sources as well
     */
     constructor(exospkgFileName, updateAll) {
        super(exospkgFileName, updateAll);
     
        if(this._exosPkgParseResults.componentFound == true && this._exosPkgParseResults.componentErrors.length == 0) {
            this._templateJulia = new TemplateLinuxJulia(this._datamodel);

            if(updateAll) {
                this._linuxPackage.addNewFileObj(this._templateJulia.mainSource);
            }
        }
     }
}
if (require.main === module) {

    process.stdout.write(`exOS Julia Template\n`);

    if (process.argv.length > 3) {

        let fileName = process.argv[2];
        let structName = process.argv[3];

        let template = new ExosComponentJulia(fileName, structName);
        let outDir = path.join(__dirname,path.dirname(fileName));

        process.stdout.write(`Writing ${structName} to folder: ${outDir}\n`);
        
        template.makeComponent(outDir);     
    }
    else {
        process.stderr.write("usage: ./exoscomponent_c_template.js <filename.typ> <structname>\n");
    }
}
module.exports = {ExosComponentJulia, ExosComponentJuliaUpdate}