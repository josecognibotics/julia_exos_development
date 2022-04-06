/*
 * Copyright (C) 2021 B&R Danmark
 * All rights reserved
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const path = require('path');
const fs = require('fs');
const parser = require('xml-parser');

function removeASXML(packageXML) {
    return packageXML.replace(/<\?AutomationStudio\/?[^>]+(\?>|$)/g,""); //the xml-parser doesnt like this entry
}

/**
 * The AS Project class is used to locate Temp and Binaries folders of the AS project using a file within the project
 * It also contains a list of configurations, which the user needs to select in order to e.g. export a library
 * (which is build for a certain configuration)
 * 
 * @typedef {Object} ASProjectConfiguration
 * @property {string} name name of the configuration (like in AS)
 * @property {string} cpu name of the CPU folder, the one subfolder of the configuration
 * @property {string} description description of the configuration (if anyone uses that)
 */
class ASProject {
    /**
     * @type {ASProjectConfiguration[]}
     */
    _configurations;

    /**
     * Path to the AS project
     * @type {string}
     */
    _apjPath;

    /**
     * AS project file (basename)
     * @type {string}
     */
    _apjFile;
    
    /**
     * @type {boolean}
     */
    _hasTemp;

    /**
     * @type {boolean}
     */
    _hasBinaries;

    /** Creates an AS project structure from a given file within the project (eg. a .exospkg file)
     * 
     * @throws Throws an error description string if the provided file is not within an AS project, or a certain resource cannot be found, eg. Temp
     * @param {string} filePath complete path to the file name or folder within the AS project, e.g. C:\projects\MyProj\Logical\Component\Component.exospkg
     * @param {boolean} [requireTemp] true if it is required for the AS Project to include a "Temp" folder, i.e to find the exos TransferToTarget components
     * @param {boolean} [requireBinaries] true if it is required for the AS Project to include a "Binaries" folder, i.e to perform an export of a Library
    */
    constructor(filePath, requireTemp=false, requireBinaries=false) {

        /**
         * Search the AS Project for the .apj file and return the file together with info regarding Temp and Binaries
         * 
         * @typedef {Object} ASroot
         * @property {string} apjFile complete path to the .apj file
         * @property {boolean} binariesFound true if project contains Binaries Folder
         * @property {boolean} tempFound
         * 
         * @throws an error if .apj, logical or physical isnt found
         * @returns {ASroot} AS project file description
         */
        function searchASroot(inBranch, requireTemp, requireBinaries) {
            let currPath = inBranch;
        
            try {
                
                currPath = path.dirname(currPath)
                let apjFound = false;
                let binariesFound = false;
                let logicalFound = false;
                let physicalFound = false;
                let tempFound = false;
                let apjFile = ""

                while (currPath != path.dirname(currPath)) {
                    let contents = fs.readdirSync(currPath);
        
                    for (let item of contents) {
                        if (item.includes(".apj")) {
                            let stats = fs.statSync(path.join(currPath, item));
                            //is it a file?
                            if (stats.isFile()) {
                                apjFound = true;
                                apjFile = item;
                            }
                        }
                        else if (item === "Logical") {
                            let stats = fs.statSync(path.join(currPath, item));
                            //is it a directory?
                            if (!stats.isFile()) { logicalFound = true; }
                        }
                        else if (item === "Physical") {
                            let stats = fs.statSync(path.join(currPath, item));
                            //is it a directory?
                            if (!stats.isFile()) { physicalFound = true; }
                        }
                        else if (item === "Binaries") {
                            let stats = fs.statSync(path.join(currPath, item));
                            //is it a directory?
                            if (!stats.isFile()) { binariesFound = true; }
                        }
                        else if (item === "Temp") {
                            let stats = fs.statSync(path.join(currPath, item));
                            //is it a directory?
                            if (!stats.isFile()) { tempFound = true; }
                        }
                    }
                    if (apjFound && (binariesFound || !requireBinaries) && logicalFound && physicalFound && (tempFound || !requireTemp)) {
                        break;
                    }

                    currPath = path.dirname(currPath)
                }
                
                if(!apjFound) {
                    throw ("ASProject: Can't find project file");
                }
                if(!logicalFound || !physicalFound) {
                    throw (`ASProject: ${apjFile} is not a valid AS project (missing Logical/Physical)`);
                }
                if (!binariesFound && requireBinaries) {
                    throw(`ASProject: ${apjFile} does not have a Binaries folder - project needs to be built first`);
                }
                if (!tempFound && requireTemp) {
                    throw(`ASProject: ${apjFile} does not have a Temp folder - project needs to be built first`);
                }

                return {
                    apjFile: path.join(currPath, apjFile),
                    binariesFound: binariesFound,
                    tempFound: tempFound
                };

            } catch (e) {
                throw (`ASProject: Can't find project root directory: ${e}`);
            }
        }

        let asProj = searchASroot(filePath, requireTemp, requireBinaries);
        this._apjPath = path.dirname(asProj.apjFile);
        this._apjFile = path.basename(asProj.apjFile);
        this._hasBinaries = asProj.binariesFound;
        this._hasTemp = asProj.tempFound;
        this._configurations = [];

        let physicalPkgName = path.join(this._apjPath, "Physical", "Physical.pkg");
        if(!fs.existsSync(physicalPkgName)) {
            throw(`Can't find Physical package ${physicalPkgName}`);
        }

        let physicalPkgXML = fs.readFileSync(physicalPkgName).toString();
        physicalPkgXML = removeASXML(physicalPkgXML);

        let physicalPkgJSON = parser(physicalPkgXML);

        if(!physicalPkgJSON.root || physicalPkgJSON.root.name != "Physical") {
            throw(`Physical package ${physicalPkgName} is invalid`);
        }

        
        //the physical package defines its configurations in the <Objects><Object> list
        //get the path of all these configurations, to be used later
        for(let child of physicalPkgJSON.root.children) {
            if(child.name == "Objects" && child.children) {
                for(let item of child.children) {
                    if(item.name == "Object" && item.content && item.attributes) {
                        let description = ""
                        if(item.attributes.Description) {
                            description = item.attributes.Description;
                        }

                        if(item.attributes.Type == "Configuration") {	

                            //all paths in the Temp are based on the cpu name as well, therefore take out the name of the cpu folder from the Config.pkg within the configuration folder.. 
                            let cpuObjName = path.join(path.dirname(physicalPkgName),item.content,"Config.pkg");
                            if(!fs.existsSync(cpuObjName)) {
                                throw(`Can't find Configuration package ${cpuObjName}`);
                            }

                            let cpuObjXML = fs.readFileSync(cpuObjName).toString();
                            cpuObjXML = removeASXML(cpuObjXML);
                            let cpuObjJSON = parser(cpuObjXML);
                            if(!cpuObjJSON.root || cpuObjJSON.root.name != "Configuration") {
                                throw(`Configuration package ${cpuObjName} is invalid`);
                            }

                            for(let cpuchild of cpuObjJSON.root.children) {
                                if(cpuchild.name == "Objects" && cpuchild.children) {
                                    for(let cpuitem of cpuchild.children) {
                                        if(cpuitem.name == "Object" && cpuitem.content && cpuitem.attributes && cpuitem.attributes.Type == "Cpu") {
                                            //as soon as we have one cpu, we can populate the configurations[] list
                                            this._configurations.push({name:item.content, cpu:cpuitem.content, description:description});
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * @returns {ASProjectConfiguration[]} a list of available configurations to select from, derived from the Physical folder
     */
    getConfigurations() {
        return this._configurations;
    }

    /**
     * @returns {boolean} true if the project has a Temp Folder
     */
    hasTemp() {
        return this._hasTemp;
    }

    /**
     * @returns {boolean} true if the project has a Binaries Folder
     */
    hasBinaries() {
        return this._hasBinaries;
    }

    /**
     * @returns {string} path to the root directory of the project, ie. C:\projects\MyProj containing Logical, Physical [Temp] [Binaries] - check with hasTemp() hasBinaries()
     */
    getApjPath() {
        return this._apjPath;
    }

    /**
     * @returns {string} the basename of the AS project file, ie. MyProj.apj
     */
    getApjFileName() {
        return this._apjPath;
    }
}

module.exports = {ASProject};