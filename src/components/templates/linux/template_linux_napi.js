/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const { Datamodel, GeneratedFileObj } = require('../../../datamodel');
const { Template, ApplicationTemplate } = require('../template')

class iteratorChar {
    constructor() {
        this.reset();
    }

    reset() {
        this.i = "h";
    }

    next() {
        this.i = String.fromCharCode(this.i.charCodeAt(0) + 1);
        if (this.i === "z") { this.i = "a"; }
    }

    prev() {
        this.i = String.fromCharCode(this.i.charCodeAt(0) - 1);
        if (this.i === "a") { this.i = "z"; }
    }
}
class objectIndexer {
    constructor() {
        this.reset();
    }

    reset() {
        this.i = 0;
        this.max = this.i;
    }

    next() {
        this.i++;
        if (this.i > this.max) this.max = this.i
    }

    prev() {
        this.i--;
    }

    toString(offset) {
        let o = this.i;
        if ((offset != undefined) && (typeof offset === 'number')) { o = o + offset; }

        return "object" + o.toString();
    }
}

let iterator = new iteratorChar;
let objectIdx = new objectIndexer;

class TemplateLinuxNAPI extends Template {

    /**
     * GYP build file
     * @type {GeneratedFileObj}
     */
    gypFile;
    
    /**
     * N-API library source file
     * @type {GeneratedFileObj}
     */
    librarySource;

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
     * Class that implements a N-API wrapper for the given exOS Datamodel, i.e. creates a native binding of exOS datasets for the nodejs platform
     * 
     * It generates the following {@link GeneratedFileObj} objects
     * - {@linkcode gypFile}
     * - {@linkcode librarySource}
     * - {@linkcode JsMain}
     * - {@linkcode packageJson}
     * - {@linkcode packageLockJson}
     * 
     * @param {Datamodel} datamodel 
     */
    constructor(datamodel) {
        super(datamodel, true, true); //create recursive template.dataset info
        this.gypFile = {name:"binding.gyp", contents:this._generateGyp(), description:`${this.datamodel.typeName} build file`};
        this.librarySource = {name:`lib${this.datamodel.typeName.toLowerCase()}.c`, contents:this._generateLibTemplate(), description:`${this.datamodel.typeName} N-API wrapper`};
        this.JsMain = {name:`${this.datamodel.typeName.toLowerCase()}.js`, contents:this._generateJSMain(), description:`${this.datamodel.typeName} main javascript application`};
        this.packageJson = {name:"package.json", contents:this._generatePackageJSON(), description:`${this.datamodel.typeName} package information`};
        this.packageLockJson = {name:"package-lock.json", contents:this._generatePackageLockJSON(), description:`${this.datamodel.typeName} package dependency tree`};
    }

    _generateGyp() {
        function generateGyp(typName, sourceFileName) {
            let out = "";
        
            out += `{\n`;
            out += `  "targets": [\n`;
            out += `    {\n`;
            out += `      "target_name": "l_${typName}",\n`;
            out += `      "sources": [\n`;
            out += `        "lib${typName.toLowerCase()}.c",\n`;
            out += `        "${sourceFileName}"\n`;
            out += `      ],\n`;
            out += `      "include_dirs": [\n`;
            out += `        '/usr/include'\n`;
            out += `      ],  \n`;
            out += `      'link_settings': {\n`;
            out += `        'libraries': [\n`;
            out += `          '-lexos-api',\n`;
            out += `          '-lzmq'\n`;
            out += `        ]\n`;
            out += `      }\n`;
            out += `    }\n`;
            out += `  ]\n`;
            out += `}\n`;
        
            return out;
        }
        return generateGyp(this.datamodel.typeName, this.datamodel.sourceFile.name);
    }

    _generatePackageLockJSON() {
        /**
         * @param {ApplicationTemplate} template 
         */
        function generatePackageLockJSON(template) {
            let out = "";
        
            out += `{\n`;
            out += `    "name": "${template.datamodel.varName}",\n`;
            out += `    "version": "1.0.0",\n`;
            out += `    "lockfileVersion": 1\n`;
            out += `}\n`;
        
            return out;
        }
        return generatePackageLockJSON(this.template);
    }

    _generatePackageJSON() {
        /**
         * @param {ApplicationTemplate} template 
         */
        function generatePackageJSON(template, mainName) {
            let out = "";
        
            out += `{\n`;
            out += `  "name": "${template.datamodel.varName}",\n`;
            out += `  "version": "1.0.0",\n`;
            out += `  "description": "implementation of exOS data exchange defined by datatype ${template.datamodel.structName}",\n`;
            out += `  "main": "${mainName}",\n`;
            out += `  "scripts": {\n`;
            out += `    "start": "node ${mainName}"\n`;
            out += `  },\n`;
            out += `  "author": "your name",\n`;
            out += `  "license": "MIT"\n`;
            out += `}\n`;
        
            return out;
        }

        return generatePackageJSON(this.template, this.JsMain.name);
    }

    _generateJSMain() {

        /**
         * @param {ApplicationTemplate} template 
         */
        function generateJSMain(template) {

            /**
             * @param {ApplicationTemplate} template 
             */
            function generateJsDoc(template) {
                function convertPlcType(type) {
                    switch (type) {
                        case "BOOL": return "boolean";
                        case "USINT": return "number";
                        case "SINT": return "number";
                        case "UINT": return "number";
                        case "INT": return "number";
                        case "UDINT": return "number";
                        case "DINT": return "number";
                        case "REAL": return "number";
                        case "LREAL": return "number";
                        case "BYTE": return "number";
                        case "STRING": return "string";
                        default: //returning the type makes the function valid even if you insert a struct
                    }
                }

                function makeValue(parent, dataset) {
                    
                    let out = "";
                    
                    for (let member of dataset.datasets) {
                        if(member.datasets && member.datasets.length > 0) {
                            out += makeValue(`${parent}${dataset.structName}`, member);
                        }
                    }

                    out += ` * @typedef {Object} ${parent}${dataset.structName}DataSetValue\n`;
                    
                    for (let member of dataset.datasets) {
                        let arrayOut = "";
                        let arraySize = ""; 
                        if (member.arraySize > 0) {
                            arrayOut = "[]";
                            arraySize = `\`[0..${member.arraySize-1}]\` `
                        }
                        if(member.datasets && member.datasets.length > 0) {
                            out += ` * @property {${parent}${dataset.structName}${member.structName}DataSetValue${arrayOut}} ${member.structName} ${arraySize}${member.comment}\n`;
                        }
                        else {
                            out += ` * @property {${convertPlcType(member.dataType)}${arrayOut}} ${member.structName} ${arraySize}${member.comment}\n`;
                        }
                    }
                    out += ` * \n`;

                    return out;
                }

                let out = "";
    
                out += `/**\n`;
                out += ` * @callback ${template.datamodel.structName}DataModelCallback\n`;
                out += ` * @returns {function()}\n`;
                out += ` * \n`;
                for (let dataset of template.datasets) {
                    if (dataset.isPub || dataset.isSub) {
                        if(dataset.datasets && dataset.datasets.length > 0) {
                            out += makeValue(template.datamodel.structName, dataset);
                        }
                    }
                }
                
                for (let dataset of template.datasets) {
                    if (dataset.isPub || dataset.isSub) {
                        out += ` * @typedef {Object} ${dataset.structName}DataSet\n`;
                        let arrayOut = "";
                        let arraySize = ""; 
                        if (dataset.arraySize > 0) {
                            arrayOut = "[]";
                            arraySize = `\`[0..${dataset.arraySize-1}]\` `
                        }
                        if (dataset.datasets && dataset.datasets.length > 0) {
                            out += ` * @property {${template.datamodel.structName}${dataset.structName}DataSetValue${arrayOut}} value ${arraySize}${dataset.comment}\n`;
                        }
                        else {
                            out += ` * @property {${convertPlcType(dataset.dataType)}${arrayOut}} value ${arraySize}${dataset.comment}\n`;
                        }
                        
                        if (dataset.isPub) {
                            out += ` * @property {function()} publish publish the value\n`;
                        }
                        if (dataset.isSub) {
                            out += ` * @property {${template.datamodel.structName}DataModelCallback} onChange event fired when \`value\` changes\n`;
                            out += ` * @property {number} nettime used in the \`onChange\` event: nettime @ time of publish\n`;
                            out += ` * @property {number} latency used in the \`onChange\` event: time in us between publish and arrival\n`;
                        }
                        out += ` * @property {${template.datamodel.structName}DataModelCallback} onConnectionChange event fired when \`connectionState\` changes \n`;
                        out += ` * @property {string} connectionState \`Connected\`|\`Operational\`|\`Disconnected\`|\`Aborted\` - used in the \`onConnectionChange\` event\n`;
                        out += ` * \n`;
                    }
                }
                out += ` * @typedef {Object} ${template.datamodel.structName}Datamodel\n`;
                for (let dataset of template.datasets) {
                    if (dataset.isPub || dataset.isSub) {
                        out += ` * @property {${dataset.structName}DataSet} ${dataset.structName}\n`;
                    }
                }
                out += ` * \n`;
                out += ` * @callback ${template.datamodel.structName}DatamodelLogMethod\n`;
                out += ` * @param {string} message\n`;
                out += ` * \n`;
                out += ` * @typedef {Object} ${template.datamodel.structName}DatamodelLog\n`;
                out += ` * @property {${template.datamodel.structName}DatamodelLogMethod} warning\n`;
                out += ` * @property {${template.datamodel.structName}DatamodelLogMethod} success\n`;
                out += ` * @property {${template.datamodel.structName}DatamodelLogMethod} info\n`;
                out += ` * @property {${template.datamodel.structName}DatamodelLogMethod} debug\n`;
                out += ` * @property {${template.datamodel.structName}DatamodelLogMethod} verbose\n`;
                out += ` * \n`;
                out += ` * @typedef {Object} ${template.datamodel.structName}\n`;
                out += ` * @property {function():number} nettime get current nettime\n`;
                out += ` * @property {${template.datamodel.structName}DataModelCallback} onConnectionChange event fired when \`connectionState\` changes \n`;
                out += ` * @property {string} connectionState \`Connected\`|\`Operational\`|\`Disconnected\`|\`Aborted\` - used in the \`onConnectionChange\` event\n`;
                out += ` * @property {boolean} isConnected\n`;
                out += ` * @property {boolean} isOperational\n`;
                out += ` * @property {${template.datamodel.structName}DatamodelLog} log\n`;
                out += ` * @property {${template.datamodel.structName}Datamodel} datamodel\n`;
                out += ` * \n`;
                out += ` */\n\n`;

                out += `/**\n`;
                out += ` * @type {${template.datamodel.structName}}\n`;
                out += ` */\n`;
                return out;
            }
    

            /**
             * @param {ApplicationTemplate} template 
             */
            function genenerateLegend(template) {
                let out = "";
            
                out += `/* datamodel features:\n`;
            
                out += `\nmain methods:\n`
                out += `    ${template.datamodel.varName}.nettime() : (int32_t) get current nettime\n`;
                out += `\nstate change events:\n`
                out += `    ${template.datamodel.varName}.onConnectionChange(() => {\n`;
                out += `        ${template.datamodel.varName}.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted" \n`;
                out += `    })\n`;
                out += `\nboolean values:\n`
                out += `    ${template.datamodel.varName}.isConnected\n`;
                out += `    ${template.datamodel.varName}.isOperational\n`;
                out += `\nlogging methods:\n`
                out += `    ${template.datamodel.varName}.log.error(string)\n`;
                out += `    ${template.datamodel.varName}.log.warning(string)\n`;
                out += `    ${template.datamodel.varName}.log.success(string)\n`;
                out += `    ${template.datamodel.varName}.log.info(string)\n`;
                out += `    ${template.datamodel.varName}.log.debug(string)\n`;
                out += `    ${template.datamodel.varName}.log.verbose(string)\n`;
                for (let dataset of template.datasets) {
                    if (dataset.isPub || dataset.isSub) {
                        out += `\ndataset ${dataset.structName}:\n`;
            
                        out += `    ${template.datamodel.varName}.datamodel.${dataset.structName}.value : (${Datamodel.convertPlcType(dataset.dataType)}`;
                        if (dataset.arraySize > 0) { // array comes before string length in c (unlike AS typ editor where it would be: STRING[80][0..1])
                            out += `[${parseInt(dataset.arraySize)}]`;
                        }
                        if (dataset.dataType.includes("STRING")) {
                            out += `[${parseInt(dataset.stringLength)}) `;
                        } else {
                            out += `) `;
                        }
                        out += ` actual dataset value`;
                        if (Datamodel.isScalarType(dataset, true)) {
                            out += `\n`;
                        }
                        else {
                            out += `s\n`;
                        }
            
                        if (dataset.isPub) {
                            out += `    ${template.datamodel.varName}.datamodel.${dataset.structName}.publish()\n`;
                        }
                        if (dataset.isSub) {
                            out += `    ${template.datamodel.varName}.datamodel.${dataset.structName}.onChange(() => {\n`;
                            out += `        ${template.datamodel.varName}.datamodel.${dataset.structName}.value ...\n`;
                            out += `        ${template.datamodel.varName}.datamodel.${dataset.structName}.nettime : (int32_t) nettime @ time of publish\n`;
                            out += `        ${template.datamodel.varName}.datamodel.${dataset.structName}.latency : (int32_t) time in us between publish and arrival\n`;
                            out += `    })\n`;
                        }
                        out += `    ${template.datamodel.varName}.datamodel.${dataset.structName}.onConnectionChange(() => {\n`;
                        out += `        ${template.datamodel.varName}.datamodel.${dataset.structName}.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted"\n`;
                        out += `    });\n`;
            
            
                    }
                }
                out += `*/\n\n`;
            
                return out;
            }


            let out = "";
        
            out += generateJsDoc(template);
            out += `let ${template.datamodel.varName} = require('./l_${template.datamodel.structName}.node').${template.datamodel.structName};\n\n`;
            out += genenerateLegend(template);
        
            out += `//connection state changes\n`;
            out += `${template.datamodel.varName}.onConnectionChange(() => {\n`;
            out += `    switch (${template.datamodel.varName}.connectionState) {\n`;
            out += `    case "Connected":\n        break;\n`;
            out += `    case "Operational":\n        break;\n`;
            out += `    case "Disconnected":\n        break;\n`;
            out += `    case "Aborted":\n        break;\n`;
            out += `    }\n`;
            out += `});\n`;
            for (let i = 0; i < template.datasets.length; i++) {
                if (template.datasets[i].isSub || template.datasets[i].isPub) {
                    out += `${template.datamodel.varName}.datamodel.${template.datasets[i].structName}.onConnectionChange(() => {\n`;
                    out += `    // switch (${template.datamodel.varName}.datamodel.${template.datasets[i].structName}.connectionState) ...\n`;
                    out += `});\n`;
                }
            }
        
            out += `\n`;
        
            out += `//value change events\n`;
            for (let i = 0; i < template.datasets.length; i++) {
                if (template.datasets[i].isSub) {
                    out += `${template.datamodel.varName}.datamodel.${template.datasets[i].structName}.onChange(() => {\n`;
                    out += `    //${template.datamodel.varName}.datamodel.${template.datasets[i].structName}.value..\n`;
                    out += `});\n`;
                }
            }
        
            out += `\n`;
        
            out += `//Cyclic call triggered from the Component Server\n`;
            out += `${template.datamodel.varName}.onProcessed(() => {\n`;
            out += `    //Publish values\n`;
            out += `    //if (${template.datamodel.varName}.isConnected) {\n`;
            for (let i = 0; i < template.datasets.length; i++) {
                if (template.datasets[i].isPub) {
                    out += `        //${template.datamodel.varName}.datamodel.${template.datasets[i].structName}.value = ..\n`;
                    out += `        //${template.datamodel.varName}.datamodel.${template.datasets[i].structName}.publish();\n`;
                }
            }
            out += `    //}\n`;
            out += `});\n\n`;
        
            return out;
        }

        return generateJSMain(this.template);
    }

    _generateLibTemplate() {

        /**
         * @param {ApplicationTemplate} template 
         */
        function generateLibTemplate(template) {

            /**
             * @param {ApplicationTemplate} template 
             */
            function generateExosCallbacks(template) {
                let out = "";
                out += `// exOS callbacks\n`;
                out += `static void datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info)\n{\n`;
                out += `    switch (event_type)\n    {\n`;
                out += `    case EXOS_DATASET_EVENT_UPDATED:\n`;
                out += `        VERBOSE("dataset %s updated! latency (us):%i", dataset->name, (exos_datamodel_get_nettime(dataset->datamodel) - dataset->nettime));\n`;
                var atleastone = false;
                for (let dataset of template.datasets) {
                    if (dataset.isSub) {
                        if (atleastone) {
                            out += `        else `;
                        }
                        else {
                            out += `        `;
                            atleastone = true;
                        }
                        out += `if(0 == strcmp(dataset->name,"${dataset.structName}"))\n`;
                        out += `        {\n`;
                        out += `            if (${dataset.structName}.onchange_cb != NULL)\n`;
                        out += `            {\n`;
                        out += `                napi_acquire_threadsafe_function(${dataset.structName}.onchange_cb);\n`;
                        out += `                napi_call_threadsafe_function(${dataset.structName}.onchange_cb, &dataset->nettime, napi_tsfn_blocking);\n`;
                        out += `                napi_release_threadsafe_function(${dataset.structName}.onchange_cb, napi_tsfn_release);\n`;
                        out += `            }\n`;
                        out += `        }\n`;
                    }
                }
                out += `        break;\n\n`;
            
                out += `    case EXOS_DATASET_EVENT_PUBLISHED:\n`;
                out += `        VERBOSE("dataset %s published!", dataset->name);\n`;
                out += `        // fall through\n\n`;
                out += `    case EXOS_DATASET_EVENT_DELIVERED:\n`;
                out += `        if (event_type == EXOS_DATASET_EVENT_DELIVERED) { VERBOSE("dataset %s delivered!", dataset->name); }\n\n`;
                atleastone = false;
                for (let dataset of template.datasets) {
                    if (dataset.isPub) {
                        if (atleastone) {
                            out += `        else `;
                        }
                        else {
                            out += `        `;
                            atleastone = true;
                        }
                        out += `if(0 == strcmp(dataset->name, "${dataset.structName}"))\n`;
                        out += `        {\n`;
                        out += `            //${Datamodel.convertPlcType(dataset.dataType)} *${dataset.varName} = (${Datamodel.convertPlcType(dataset.dataType)} *)dataset->data;\n`;
                        out += `        }\n`;
                    }
                }
                out += `        break;\n\n`;
            
                out += `    case EXOS_DATASET_EVENT_CONNECTION_CHANGED:\n`;
                out += `        VERBOSE("dataset %s connecton changed to: %s", dataset->name, exos_get_state_string(dataset->connection_state));\n\n`;
                atleastone = false;
                for (let dataset of template.datasets) {
                    if (dataset.isSub || dataset.isPub) {
                        if (atleastone) {
                            out += `        else `;
                        }
                        else {
                            out += `        `;
                            atleastone = true;
                        }
                        out += `if(0 == strcmp(dataset->name, "${dataset.structName}"))\n`;
                        out += `        {\n`;
                        out += `            if (${dataset.structName}.connectiononchange_cb != NULL)\n`;
                        out += `            {\n`;
                        out += `                napi_acquire_threadsafe_function(${dataset.structName}.connectiononchange_cb);\n`;
                        out += `                napi_call_threadsafe_function(${dataset.structName}.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);\n`;
                        out += `                napi_release_threadsafe_function(${dataset.structName}.connectiononchange_cb, napi_tsfn_release);\n`;
                        out += `            }\n`;
                        out += `        }\n`;
                    }
                }
                out += `\n`;
                out += `        switch (dataset->connection_state)\n`;
                out += `        {\n`;
                out += `        case EXOS_STATE_DISCONNECTED:\n`;
                out += `        case EXOS_STATE_CONNECTED:\n`;
                out += `        case EXOS_STATE_OPERATIONAL:\n`;
                out += `        case EXOS_STATE_ABORTED:\n`;
                out += `            break;\n`;
                out += `        }\n`;
                out += `        break;\n`;
                out += `    default:\n`;
                out += `        break;\n\n`;
                out += `    }\n`;
                out += `}\n\n`;
            
                out += `static void datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info)\n{\n`;
                out += `    switch (event_type)\n    {\n`;
                out += `    case EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED:\n`;
                out += `        INFO("application ${template.datamodel.structName} changed state to %s", exos_get_state_string(datamodel->connection_state));\n\n`;
                out += `        if (${template.datamodel.varName}.connectiononchange_cb != NULL)\n`;
                out += `        {\n`;
                out += `            napi_acquire_threadsafe_function(${template.datamodel.varName}.connectiononchange_cb);\n`;
                out += `            napi_call_threadsafe_function(${template.datamodel.varName}.connectiononchange_cb, exos_get_state_string(datamodel->connection_state), napi_tsfn_blocking);\n`;
                out += `            napi_release_threadsafe_function(${template.datamodel.varName}.connectiononchange_cb, napi_tsfn_release);\n`;
                out += `        }\n\n`;
                out += `        switch (datamodel->connection_state)\n`;
                out += `        {\n`;
                out += `        case EXOS_STATE_DISCONNECTED:\n`;
                out += `        case EXOS_STATE_CONNECTED:\n`;
                out += `            break;\n`;
                out += `        case EXOS_STATE_OPERATIONAL:\n`;
                out += `            SUCCESS("${template.datamodel.structName} operational!");\n`;
                out += `            break;\n`;
                out += `        case EXOS_STATE_ABORTED:\n`;
                out += `            ERROR("${template.datamodel.structName} application error %d (%s) occured", datamodel->error, exos_get_error_string(datamodel->error));\n`;
                out += `            break;\n`;
                out += `        }\n`;
                out += `        break;\n`;
                out += `    case EXOS_DATAMODEL_EVENT_SYNC_STATE_CHANGED:\n`;
                out += `        break;\n\n`;
                out += `    default:\n`;
                out += `        break;\n\n`;
                out += `    }\n`;
                out += `}\n\n`;
            
                return out;
            }

            /**
             * 
             */
            function generateNApiCBinitMMain() {

                let out = "";
            
                out += `// napi callback setup main function\n`;
                out += `static napi_value init_napi_onchange(napi_env env, napi_callback_info info, const char *identifier, napi_threadsafe_function_call_js call_js_cb, napi_threadsafe_function *result)\n`;
                out += `{\n`;
                out += `    size_t argc = 1;\n`;
                out += `    napi_value argv[1];\n\n`;
            
                out += `    if (napi_ok != napi_get_cb_info(env, info, &argc, argv, NULL, NULL))\n`;
                out += `    {\n`;
                out += `        char msg[100] = {};\n`;
                out += `        strcpy(msg, "init_napi_onchange() napi_get_cb_info failed - ");\n`;
                out += `        strcat(msg, identifier);\n`;
                out += `        napi_throw_error(env, "EINVAL", msg);\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
            
                out += `    if (argc < 1)\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Too few arguments");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
            
                out += `    napi_value work_name;\n`;
                out += `    if (napi_ok != napi_create_string_utf8(env, identifier, NAPI_AUTO_LENGTH, &work_name))\n`;
                out += `    {\n`;
                out += `        char msg[100] = {};\n`;
                out += `        strcpy(msg, "init_napi_onchange() napi_create_string_utf8 failed - ");\n`;
                out += `        strcat(msg, identifier);\n`;
                out += `        napi_throw_error(env, "EINVAL", msg);\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
            
                out += `    napi_valuetype cb_typ;\n`;
                out += `    if (napi_ok != napi_typeof(env, argv[0], &cb_typ))\n`;
                out += `    {\n`;
                out += `        char msg[100] = {};\n`;
                out += `        strcpy(msg, "init_napi_onchange() napi_typeof failed - ");\n`;
                out += `        strcat(msg, identifier);\n`;
                out += `        napi_throw_error(env, "EINVAL", msg);\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
            
                out += `    if (cb_typ == napi_function)\n`;
                out += `    {\n`;
                out += `        if (napi_ok != napi_create_threadsafe_function(env, argv[0], NULL, work_name, 0, 1, NULL, NULL, NULL, call_js_cb, result))\n`;
                out += `        {\n`;
                out += `            const napi_extended_error_info *info;\n`;
                out += `            napi_get_last_error_info(env, &info);\n`;
                out += `            napi_throw_error(env, NULL, info->error_message);\n`;
                out += `            return NULL;\n`;
                out += `        }\n`;
                out += `    }\n`;
                out += `    return NULL;\n`;
                out += `}\n\n`;
            
                return out;
            }

            /**
             * @param {ApplicationTemplate} template 
             */
            function generateConnectionCallbacks(template) {
                let out = "";
            
                out += `// js object callbacks\n`;
            
                //datamodel
                out += `static void ${template.datamodel.varName}_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)\n`;
                out += `{\n`;
                out += `    const char *string = data;\n`;
                out += `    napi_value napi_true, napi_false, undefined;\n\n`;
            
                out += `    napi_get_undefined(env, &undefined);\n\n`;
                out += `    napi_get_boolean(env, true, &napi_true);\n`;
                out += `    napi_get_boolean(env, false, &napi_false);\n\n`;
            
                out += `    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &${template.datamodel.varName}.value))\n`;
                out += `        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - ${template.datamodel.varName}.value");\n\n`;
            
                out += `    if (napi_ok != napi_get_reference_value(env, ${template.datamodel.varName}.ref, &${template.datamodel.varName}.object_value))\n`;
                out += `        napi_throw_error(env, "EINVAL", "Can't get reference - ${template.datamodel.varName} ");\n\n`;
                out += `    switch (${template.datamodel.varName}_datamodel.connection_state)\n`;
                out += `    {\n`;
                out += `    case EXOS_STATE_DISCONNECTED:\n`;
                out += `        if (napi_ok != napi_set_named_property(env, ${template.datamodel.varName}.object_value, "isConnected", napi_false))\n`;
                out += `            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ${template.datamodel.varName}");\n\n`;
                out += `        if (napi_ok != napi_set_named_property(env, ${template.datamodel.varName}.object_value, "isOperational", napi_false))\n`;
                out += `            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ${template.datamodel.varName}");\n\n`;
                out += `        break;\n`;
                out += `    case EXOS_STATE_CONNECTED:\n`;
                out += `        if (napi_ok != napi_set_named_property(env, ${template.datamodel.varName}.object_value, "isConnected", napi_true))\n`;
                out += `            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ${template.datamodel.varName}");\n\n`;
                out += `        if (napi_ok != napi_set_named_property(env, ${template.datamodel.varName}.object_value, "isOperational", napi_false))\n`;
                out += `            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ${template.datamodel.varName}");\n\n`;
                out += `        break;\n`;
                out += `    case EXOS_STATE_OPERATIONAL:\n`;
                out += `        if (napi_ok != napi_set_named_property(env, ${template.datamodel.varName}.object_value, "isConnected", napi_true))\n`;
                out += `            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ${template.datamodel.varName}");\n\n`;
                out += `        if (napi_ok != napi_set_named_property(env, ${template.datamodel.varName}.object_value, "isOperational", napi_true))\n`;
                out += `            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ${template.datamodel.varName}");\n\n`;
                out += `        break;\n`;
                out += `    case EXOS_STATE_ABORTED:\n`;
                out += `        if (napi_ok != napi_set_named_property(env, ${template.datamodel.varName}.object_value, "isConnected", napi_false))\n`;
                out += `            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ${template.datamodel.varName}");\n\n`;
                out += `        if (napi_ok != napi_set_named_property(env, ${template.datamodel.varName}.object_value, "isOperational", napi_false))\n`;
                out += `            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ${template.datamodel.varName}");\n\n`;
                out += `        break;\n`;
                out += `    }\n\n`;
            
                out += `    if (napi_ok != napi_set_named_property(env, ${template.datamodel.varName}.object_value, "connectionState", ${template.datamodel.varName}.value))\n`;
                out += `        napi_throw_error(env, "EINVAL", "Can't set connectionState property - ${template.datamodel.varName}");\n\n`;
            
                out += `    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))\n`;
                out += `        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - ${template.datamodel.varName}");\n`;
                out += `}\n\n`;
            
                out += `static void ${template.datamodel.varName}_onprocessed_js_cb(napi_env env, napi_value js_cb, void *context, void *data)\n`;
                out += `{\n`;
                out += `    napi_value undefined;\n\n`;
            
                out += `    napi_get_undefined(env, &undefined);\n\n`;
            
                out += `    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))\n`;
                out += `        throw_fatal_exception_callbacks(env, "EINVAL", "Error calling onProcessed - ${template.datamodel.structName}");\n`;
                out += `}\n\n`;
            
                //datasets
                for (let dataset of template.datasets) {
                    if (dataset.isPub || dataset.isSub) {
                        out += `static void ${dataset.structName}_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)\n`;
                        out += `{\n`;
                        out += `    const char *string = data;\n`;
                        out += `    napi_value undefined;\n\n`;
            
                        out += `    napi_get_undefined(env, &undefined);\n\n`;
            
                        out += `    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &${dataset.structName}.value))\n`;
                        out += `        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - ${dataset.structName}.value");\n\n`;
            
                        out += `    if (napi_ok != napi_get_reference_value(env, ${dataset.structName}.ref, &${dataset.structName}.object_value))\n`;
                        out += `        napi_throw_error(env, "EINVAL", "Can't get reference - ${dataset.structName} ");\n\n`;
            
                        out += `    if (napi_ok != napi_set_named_property(env, ${dataset.structName}.object_value, "connectionState", ${dataset.structName}.value))\n`;
                        out += `        napi_throw_error(env, "EINVAL", "Can't set connectionState property - ${dataset.structName}");\n\n`;
            
                        out += `    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))\n`;
                        out += `        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - ${dataset.structName}");\n`;
                        out += `}\n\n`;
                    }
                }
            
                return out;
            }

            /**
             * @param {ApplicationTemplate} template 
             */
            function generateValueCallbacks(template) {

                /**
                 * 
                 * @param {*} srcVariable 
                 * @param {*} destNapiVar 
                 * @param {*} dataset 
                 * @returns 
                 */
                function generateValuesSubscribeItem(srcVariable, destNapiVar, dataset) {

                    /**
                     * 
                     * @param {*} type 
                     * @param {*} srcVariable 
                     * @param {*} destNapiVar 
                     * @returns 
                     */
                    function subSetLeafValue(type, srcVariable, destNapiVar) {
                        let out = "";
                    
                        switch (type) {
                            case "BOOL":
                                out += `    if (napi_ok != napi_get_boolean(env, ${srcVariable}, &${destNapiVar}))\n`;
                                out += `    {\n`;
                                out += `        napi_throw_error(env, "EINVAL", "Can't convert C-var to bool");\n`;
                                out += `    }\n\n`;
                                break;
                            case "BYTE":
                            case "SINT":
                            case "INT":
                            case "DINT":
                                out += `    if (napi_ok != napi_create_int32(env, (int32_t)${srcVariable}, &${destNapiVar}))\n`;
                                out += `    {\n`;
                                out += `        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit integer");\n`;
                                out += `    }\n`;
                                break;
                            case "UDINT":
                            case "USINT":
                            case "UINT":
                                out += `    if (napi_ok != napi_create_uint32(env, (uint32_t)${srcVariable}, &${destNapiVar}))\n`;
                                out += `    {\n`;
                                out += `        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");\n`;
                                out += `    }\n`;
                                break;
                            case "REAL":
                            case "LREAL":
                                out += `    if (napi_ok != napi_create_double(env, (double)${srcVariable}, &${destNapiVar}))\n`;
                                out += `    {\n`;
                                out += `        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");\n`;
                                out += `    }\n`;
                                break;
                            case "STRING":
                                out += `    if (napi_ok != napi_create_string_utf8(env, ${srcVariable}, strlen(${srcVariable}), &${destNapiVar}))\n`;
                                out += `    {\n`;
                                out += `        napi_throw_error(env, "EINVAL", "Can convert C-variable char* to utf8 string");\n`;
                                out += `    }\n\n`;
                                break;
                        }
                    
                        return out;
                    }
                    
                    let out = "";
                
                    //check if the type is an enum and change enums to DINT
                    if (dataset.type === "enum") dataset.dataType = "DINT";
                
                    if (Datamodel.isScalarType(dataset, true)) {
                        if (dataset.arraySize > 0) {
                            iterator.next();
                            out += `napi_create_array(env, &${destNapiVar});`
                            out += `for (uint32_t ${iterator.i} = 0; ${iterator.i} < (sizeof(${srcVariable})/sizeof(${srcVariable}[0])); ${iterator.i}++)\n`;
                            out += `{\n`;
                            out += `    ` + subSetLeafValue(dataset.dataType, `${srcVariable}[${iterator.i}]`, `arrayItem`);
                            out += `    napi_set_element(env, ${destNapiVar}, ${iterator.i}, arrayItem);\n`;
                            out += `}\n`;
                        } else {
                            out += subSetLeafValue(dataset.dataType, `${srcVariable}`, `${destNapiVar}`);
                        }
                    } else {
                        //resolve datatype and call self if there are sub-datatypes also at this level            
                        objectIdx.next();
                
                        if (dataset.arraySize > 0) {
                            iterator.next();
                            out += `napi_create_array(env, &${destNapiVar});\n`
                            out += `for (uint32_t ${iterator.i} = 0; ${iterator.i} < (sizeof(${srcVariable})/sizeof(${srcVariable}[0])); ${iterator.i}++)\n`;
                            out += `{\n`;
                            out += `    napi_create_object(env, &${objectIdx.toString()});\n`;
                            for (let type of dataset.datasets) {
                                if (Datamodel.isScalarType(type, true)) {
                                    if (type.arraySize > 0) {
                                        objectIdx.next(); //force "max" property to ++1 in order to get declarations rigt.
                                        objectIdx.prev();
                                        let olditerator = iterator.i;
                                        out += generateValuesSubscribeItem(`${srcVariable}[${iterator.i}].${type.structName}`, `${objectIdx.toString(1)}`, type);
                                        iterator.i = olditerator;
                                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", ${objectIdx.toString(1)});\n`;
                                    } else {
                                        out += `    ` + subSetLeafValue(type.dataType, `${srcVariable}[${iterator.i}].${type.structName}`, `property`);
                                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", property);\n`;
                                    }
                                } else {
                                    //subtype detected
                                    out += generateValuesSubscribeItem(`${srcVariable}[${iterator.i}].${type.structName}`, `${objectIdx.toString()}`, type);
                                    objectIdx.prev();
                                }
                            }
                            out += `napi_set_element(env, ${destNapiVar}, ${iterator.i}, ${objectIdx.toString()});\n`;
                            out += `}\n`;
                        } else {
                            out += `    napi_create_object(env, &${objectIdx.toString()});\n`;
                            for (let type of dataset.datasets) {
                                if (Datamodel.isScalarType(type, true)) {
                                    if (type.arraySize > 0) {
                                        objectIdx.next(); //force "max" property to ++1 in order to get declarations rigt.
                                        objectIdx.prev();
                                        out += generateValuesSubscribeItem(`${srcVariable}.${type.structName}`, `${objectIdx.toString(1)}`, type);
                                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", ${objectIdx.toString(1)});\n`;
                                    } else {
                                        out += subSetLeafValue(type.dataType, `${srcVariable}.${type.structName}`, `property`);
                                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", property);\n`;
                                    }
                                } else {
                                    //subtype detected
                                    out += generateValuesSubscribeItem(`${srcVariable}.${type.structName}`, `${objectIdx.toString()}`, type);
                                    objectIdx.prev();
                                }
                            }
                            if (objectIdx.i != 0) {
                                out += `napi_set_named_property(env, ${destNapiVar}, "${dataset.structName}", ${objectIdx.toString()});\n`;
                            } else {
                                out += `${destNapiVar} = ${objectIdx.toString()};\n`;
                            }
                        }
                    }
                
                    return out;
                }
            
                let out = "";
                let out2 = "";
                let atleastone = false;

                for (let dataset of template.datasets) {
                    if (dataset.isSub) {
                        if (atleastone === false) {
                            out += `// js value callbacks\n`;;
                            atleastone = true;
                        }

                        iterator.reset();
                        objectIdx.reset();
                        objectIdx.prev();//initialize to -1
                        out2 = generateValuesSubscribeItem(`exos_data.${dataset.structName}`, `${dataset.structName}.value`, dataset);

                        out += `static void ${dataset.structName}_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *netTime_exos)\n`;
                        out += `{\n`;
                        // check what variables to declare for the publish process in "out2" variable.
                        if (out2.includes("&object")) {
                            out += `    napi_value `;
                            for (let i = 0; i <= objectIdx.max; i++) {
                                if (i == 0) {
                                    out += `object${i}`;
                                } else {
                                    out += `, object${i}`;
                                }
                            }
                            out += `;\n`;
                        }
                        objectIdx.reset();
                        if (out2.includes(", &property")) { out += `    napi_value property;\n` }
                        if (out2.includes(", &arrayItem")) { out += `    napi_value arrayItem;\n` }
                        if (out2.includes(", &_r")) { out += `    size_t _r;\n` }
                        if (out2.includes(", &_value")) { out += `    int32_t _value;\n` }
                        if (out2.includes(", &__value")) { out += `    double __value;\n` }

                        out += `    napi_value undefined, netTime, latency;\n`;
                        out += `    napi_get_undefined(env, &undefined);\n\n`;
                        out += `    if (napi_ok != napi_get_reference_value(env, ${dataset.structName}.ref, &${dataset.structName}.object_value))\n`;
                        out += `    {\n`;
                        out += `        napi_throw_error(env, "EINVAL", "Can't get reference");\n`;
                        out += `    }\n\n`;

                        out += out2;

                        out += `        int32_t _latency = exos_datamodel_get_nettime(&${template.datamodel.varName}_datamodel) - *(int32_t *)netTime_exos;\n`;
                        out += `        napi_create_int32(env, *(int32_t *)netTime_exos, &netTime);\n`;
                        out += `        napi_create_int32(env, _latency, &latency);\n`;
                        out += `        napi_set_named_property(env, ${dataset.structName}.object_value, "nettime", netTime);\n`;
                        out += `        napi_set_named_property(env, ${dataset.structName}.object_value, "latency", latency);\n`;
                        out += `    if (napi_ok != napi_set_named_property(env, ${dataset.structName}.object_value, "value", ${dataset.structName}.value))\n`;
                        out += `    {\n`;
                        out += `        napi_throw_error(env, "EINVAL", "Can't get property");\n`;
                        out += `    }\n\n`;
                        out += `    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))\n`;
                        out += `        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onChange callback");\n\n`;
                        out += `    exos_dataset_publish(&${dataset.structName}_dataset);\n`;
                        out += `}\n\n`;
                    }
                }

                return out;
            }
            
            /**
             * @param {ApplicationTemplate} template 
             */
            function generateCallbackInits(template) {
                let out = "";
            
                out += `// js callback inits\n`;
                out += `static napi_value ${template.datamodel.varName}_connonchange_init(napi_env env, napi_callback_info info)\n`;
                out += `{\n`;
                out += `    return init_napi_onchange(env, info, "${template.datamodel.structName} connection change", ${template.datamodel.varName}_connonchange_js_cb, &${template.datamodel.varName}.connectiononchange_cb);\n`;
                out += `}\n\n`;
                out += `static napi_value ${template.datamodel.varName}_onprocessed_init(napi_env env, napi_callback_info info)\n`;
                out += `{\n`;
                out += `    return init_napi_onchange(env, info, "${template.datamodel.structName} onProcessed", ${template.datamodel.varName}_onprocessed_js_cb, &${template.datamodel.varName}.onprocessed_cb);\n`;
                out += `}\n\n`;
            
                for (let dataset of template.datasets) {
                    if (dataset.isSub || dataset.isPub) {
                        out += `static napi_value ${dataset.structName}_connonchange_init(napi_env env, napi_callback_info info)\n`;
                        out += `{\n`;
                        out += `    return init_napi_onchange(env, info, "${dataset.structName} connection change", ${dataset.structName}_connonchange_js_cb, &${dataset.structName}.connectiononchange_cb);\n`;
                        out += `}\n\n`;
                    }
                }
            
                for (let dataset of template.datasets) {
                    if (dataset.isSub) {
                        out += `static napi_value ${dataset.structName}_onchange_init(napi_env env, napi_callback_info info)\n`;
                        out += `{\n`;
                        out += `    return init_napi_onchange(env, info, "${dataset.structName} dataset change", ${dataset.structName}_onchange_js_cb, &${dataset.structName}.onchange_cb);\n`;
                        out += `}\n\n`;
                    }
                }
            
                return out;
            }

            /**
             * generates publish methods prototypes and basic andling like dereferencing paramet.value handle
             * @param {ApplicationTemplate} template 
             * @returns 
             */
            function generateValuesPublishMethods(template) {

                /**
                 * recursive function that generates the actual copying of data from NodeJS to C struct
                 * @param {*} rootCall 
                 * @param {*} srcobj 
                 * @param {*} destvar 
                 * @param {*} dataset 
                 * @returns 
                 */
                function generateValuesPublishItem(rootCall, srcobj, destvar, dataset) {
                    
                    /**
                     * handles indiviual leafs in struct
                     * @param {*} type 
                     * @param {*} srcValue 
                     * @param {*} destVarName 
                     * @returns 
                     */
                    function pubFetchLeaf(type, srcValue, destVarName) {
                        let out = "";
                    
                        switch (type) {
                            case "BOOL":
                                out += `    if (napi_ok != napi_get_value_bool(env, ${srcValue}, &${destVarName}))\n`;
                                out += `    {\n`;
                                out += `        napi_throw_error(env, "EINVAL", "Expected bool");\n`;
                                out += `        return NULL;\n`;
                                out += `    }\n`;
                                break;
                            case "BYTE":
                            case "USINT":
                            case "SINT":
                            case "UINT":
                            case "INT":
                            case "UDINT":
                            case "DINT":
                                out += `    if (napi_ok != napi_get_value_int32(env, ${srcValue}, &_value))\n`;
                                out += `    {\n`;
                                out += `        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");\n`;
                                out += `        return NULL;\n`;
                                out += `    }\n`;
                                out += `    ${destVarName} = (${Datamodel.convertPlcType(type)})_value;\n`;
                                break;
                            case "REAL":
                            case "LREAL":
                                out += `    if (napi_ok != napi_get_value_double(env, ${srcValue}, &__value))\n`;
                                out += `    {\n`;
                                out += `        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");\n`;
                                out += `        return NULL;\n`;
                                out += `    }\n`;
                                out += `    ${destVarName} = (${Datamodel.convertPlcType(type)})__value;\n`;
                                break;
                            case "STRING":
                                out += `    if (napi_ok != napi_get_value_string_utf8(env, ${srcValue}, (char *)&${destVarName}, sizeof(${destVarName}), &_r))\n`;
                                out += `    {\n`;
                                out += `        napi_throw_error(env, "EINVAL", "Expected string");\n`;
                                out += `        return NULL;\n`;
                                out += `    }\n`;
                                break;
                        }
                    
                        return out;
                    }
                    
                    let out = "";
                
                    //check if the type is an enum and change enums to DINT
                    if (dataset.type === "enum") dataset.dataType = "DINT";

                    if (Datamodel.isScalarType(dataset, true)) {
                        if (dataset.arraySize > 0) {
                            iterator.next();
                            out += `for (uint32_t ${iterator.i} = 0; ${iterator.i} < (sizeof(${destvar})/sizeof(${destvar}[0])); ${iterator.i}++)\n`;
                            out += `{\n`;
                            out += `    napi_get_element(env, ${srcobj}, ${iterator.i}, &arrayItem);\n`;
                            out += pubFetchLeaf(dataset.dataType, `arrayItem`, `${destvar}[${iterator.i}]`);
                            out += `}\n\n`;
                        } else {
                            out += pubFetchLeaf(dataset.dataType, `${srcobj}`, `${destvar}`);
                            out += `\n`;
                        }
                    } else {
                        //resolve datatype and call self if there are sub-datatypes also at this level
                
                        if (dataset.arraySize > 0) {
                            iterator.next();
                            out += `for (uint32_t ${iterator.i} = 0; ${iterator.i} < (sizeof(${destvar})/sizeof(${destvar}[0])); ${iterator.i}++)\n`;
                            out += `{\n`;
                            out += `    napi_get_element(env, ${srcobj}, ${iterator.i}, &${objectIdx.toString()});\n\n`;
                
                            for (let type of dataset.datasets) {
                                objectIdx.next();
                                out += `    napi_get_named_property(env, ${objectIdx.toString(-1)}, "${type.structName}", &${objectIdx.toString()});\n`;
                                if (Datamodel.isScalarType(type, true)) {
                                    if (type.arraySize > 0) {
                                        let olditerator = iterator.i;
                                        out += generateValuesPublishItem(false, `${objectIdx.toString()}`, `${destvar}[${iterator.i}].${type.structName}`, type);
                                        iterator.i = olditerator;
                                    } else {
                                        out += pubFetchLeaf(type.dataType, `${objectIdx.toString()}`, `${destvar}[${iterator.i}].${type.structName}`);
                                    }
                                } else {
                                    //subtype detected
                                    out += generateValuesPublishItem(false, `${objectIdx.toString()}`, `${destvar}[${iterator.i}].${type.structName}`, type);
                                }
                                objectIdx.prev();
                            }
                            out += `}\n\n`;
                        } else {
                            if (rootCall) {
                                rootCall = false;
                                out += `    object0 = ${srcobj};\n`;
                            }
                
                            for (let type of dataset.datasets) {
                                objectIdx.next();
                                out += `    napi_get_named_property(env, ${objectIdx.toString(-1)}, "${type.structName}", &${objectIdx.toString()});\n`;
                                if (Datamodel.isScalarType(type, true)) {
                                    if (type.arraySize > 0) {
                                        out += generateValuesPublishItem(false, `${objectIdx.toString()}`, `${destvar}.${type.structName}`, type);
                                    } else {
                                        out += pubFetchLeaf(type.dataType, `${objectIdx.toString()}`, `${destvar}.${type.structName}`);
                                    }
                                } else {
                                    //subtype detected
                                    out += generateValuesPublishItem(false, `${objectIdx.toString()}`, `${destvar}.${type.structName}`, type);
                                }
                                objectIdx.prev();
                            }
                        }
                    }
                
                    return out;
                }


                let out = "";
                let out2 = "";
                let atleastone = false;

                for (let dataset of template.datasets) {
                    if (dataset.isPub) {
                        if (atleastone === false) {
                            out += `// publish methods\n`;
                            atleastone = true;
                        }
                        iterator.reset();
                        objectIdx.reset();
                        out2 = generateValuesPublishItem(true, `${dataset.structName}.value`, `exos_data.${dataset.structName}`, dataset);

                        out += `static napi_value ${dataset.structName}_publish_method(napi_env env, napi_callback_info info)\n`;
                        out += `{\n`;
                        // check what variables to declare for the publish process in "out2" variable.
                        if (out2.includes("&object")) {
                            out += `    napi_value `;
                            for (let i = 0; i <= objectIdx.max; i++) {
                                if (i == 0) {
                                    out += `object${i}`;
                                } else {
                                    out += `, object${i}`;
                                }
                            }
                            out += `;\n`;
                        }
                        objectIdx.reset();
                        if (out2.includes(", &property")) { out += `    napi_value property;\n` }
                        if (out2.includes(", &arrayItem")) { out += `    napi_value arrayItem;\n` }
                        if (out2.includes(", &_r")) { out += `    size_t _r;\n` }
                        if (out2.includes(", &_value")) { out += `    int32_t _value;\n` }
                        if (out2.includes(", &__value")) { out += `    double __value;\n` }
                        out += `\n`;
                        out += `    if (napi_ok != napi_get_reference_value(env, ${dataset.structName}.ref, &${dataset.structName}.object_value))\n`;
                        out += `    {\n`;
                        out += `        napi_throw_error(env, "EINVAL", "Can't get reference");\n`;
                        out += `        return NULL;\n`;
                        out += `    }\n\n`;
                        out += `    if (napi_ok != napi_get_named_property(env, ${dataset.structName}.object_value, "value", &${dataset.structName}.value))\n`;
                        out += `    {\n`;
                        out += `        napi_throw_error(env, "EINVAL", "Can't get property");\n`;
                        out += `        return NULL;\n`;
                        out += `    }\n\n`;

                        out += out2;

                        out += `    exos_dataset_publish(&${dataset.structName}_dataset);\n`;
                        out += `    return NULL;\n`;
                        out += `}\n\n`;
                    }
                }

                return out;
            }

            /**
             * 
             * @param {ApplicationTemplate} template 
             */
            function generateLogCleanUpHookCyclic(template) {
                let out = "";
            
                out += `//logging functions\n`;
                out += `static napi_value log_error(napi_env env, napi_callback_info info)\n`;
                out += `{\n`;
                out += `    napi_value argv[1];\n`;
                out += `    size_t argc = 1;\n`;
                out += `    char log_entry[81] = {};\n`;
                out += `    size_t res;\n\n`;
                out += `    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);\n\n`;
                out += `    if (argc < 1)\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Too few arguments for ${template.datamodel.varName}.log.error()");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
                out += `    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Expected string as argument for ${template.datamodel.varName}.log.error()");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
                out += `    exos_log_error(&logger, log_entry);\n`;
                out += `    return NULL;\n`;
                out += `}\n\n`;
                out += `static napi_value log_warning(napi_env env, napi_callback_info info)\n`;
                out += `{\n`;
                out += `    napi_value argv[1];\n`;
                out += `    size_t argc = 1;\n`;
                out += `    char log_entry[81] = {};\n`;
                out += `    size_t res;\n\n`;
                out += `    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);\n\n`;
                out += `    if (argc < 1)\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Too few arguments for ${template.datamodel.varName}.log.warning()");\n`;
                out += `        return  NULL;\n`;
                out += `    }\n\n`;
                out += `    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Expected string as argument for ${template.datamodel.varName}.log.warning()");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
                out += `    exos_log_warning(&logger, EXOS_LOG_TYPE_USER, log_entry);\n`;
                out += `    return NULL;\n`;
                out += `}\n\n`;
                out += `static napi_value log_success(napi_env env, napi_callback_info info)\n`;
                out += `{\n`;
                out += `    napi_value argv[1];\n`;
                out += `    size_t argc = 1;\n`;
                out += `    char log_entry[81] = {};\n`;
                out += `    size_t res;\n\n`;
                out += `    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);\n\n`;
                out += `    if (argc < 1)\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Too few arguments for ${template.datamodel.varName}.log.success()");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
                out += `    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Expected string as argument for ${template.datamodel.varName}.log.success()");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
                out += `    exos_log_success(&logger, EXOS_LOG_TYPE_USER, log_entry);\n`;
                out += `    return NULL;\n`;
                out += `}\n\n`;
                out += `static napi_value log_info(napi_env env, napi_callback_info info)\n`;
                out += `{\n`;
                out += `    napi_value argv[1];\n`;
                out += `    size_t argc = 1;\n`;
                out += `    char log_entry[81] = {};\n`;
                out += `    size_t res;\n\n`;
                out += `    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);\n\n`;
                out += `    if (argc < 1)\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Too few arguments for ${template.datamodel.varName}.log.info()");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
                out += `    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Expected string as argument for ${template.datamodel.varName}.log.info()");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
                out += `    exos_log_info(&logger, EXOS_LOG_TYPE_USER, log_entry);\n`;
                out += `    return NULL;\n`;
                out += `}\n\n`;
                out += `static napi_value log_debug(napi_env env, napi_callback_info info)\n`;
                out += `{\n`;
                out += `    napi_value argv[1];\n`;
                out += `    size_t argc = 1;\n`;
                out += `    char log_entry[81] = {};\n`;
                out += `    size_t res;\n\n`;
                out += `    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);\n\n`;
                out += `    if (argc < 1)\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Too few arguments for ${template.datamodel.varName}.log.debug()");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
                out += `    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Expected string as argument for ${template.datamodel.varName}.log.debug()");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
                out += `    exos_log_debug(&logger, EXOS_LOG_TYPE_USER, log_entry);\n`;
                out += `    return NULL;\n`;
                out += `}\n\n`;
                out += `static napi_value log_verbose(napi_env env, napi_callback_info info)\n`;
                out += `{\n`;
                out += `    napi_value argv[1];\n`;
                out += `    size_t argc = 1;\n`;
                out += `    char log_entry[81] = {};\n`;
                out += `    size_t res;\n\n`;
                out += `    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);\n\n`;
                out += `    if (argc < 1)\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Too few arguments for ${template.datamodel.varName}.log.verbose()");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
                out += `    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Expected string as argument for ${template.datamodel.varName}.log.verbose()");\n`;
                out += `        return NULL;\n`;
                out += `    }\n\n`;
                out += `    exos_log_warning(&logger, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, log_entry);\n`;
                out += `    return NULL;\n`;
                out += `}\n\n`;
            
                out += `// cleanup/cyclic\n`;
                out += `static void cleanup_${template.datamodel.varName}(void *env)\n`;
                out += `{\n`;
                out += `    uv_idle_stop(&cyclic_h);\n\n`;
                out += `    if (EXOS_ERROR_OK != exos_datamodel_delete(&${template.datamodel.varName}_datamodel))\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Can't delete datamodel");\n`;
                out += `    }\n\n`;
                out += `    if (EXOS_ERROR_OK != exos_log_delete(&logger))\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Can't delete logger");\n`;
                out += `    }\n`;
                out += `}\n\n`;
            
                out += `static void cyclic(uv_idle_t * handle) \n`;
                out += `{\n`;
                out += `    int dummy = 0;\n`;
                out += `    exos_datamodel_process(&${template.datamodel.varName}_datamodel);\n`;
                out += `    napi_acquire_threadsafe_function(${template.datamodel.varName}.onprocessed_cb);\n`;
                out += `    napi_call_threadsafe_function(${template.datamodel.varName}.onprocessed_cb, &dummy, napi_tsfn_blocking);\n`;
                out += `    napi_release_threadsafe_function(${template.datamodel.varName}.onprocessed_cb, napi_tsfn_release);\n`;
                out += `    exos_log_process(&logger);\n`;
                out += `}\n\n`;
            
                out += `//read nettime for DataModel\n`;
                out += `static napi_value get_net_time(napi_env env, napi_callback_info info)\n`;
                out += `{\n`;
                out += `    napi_value netTime;\n\n`;
                out += `    if (napi_ok == napi_create_int32(env, exos_datamodel_get_nettime(&${template.datamodel.varName}_datamodel), &netTime))\n`;
                out += `    {\n`;
                out += `        return netTime;\n`;
                out += `    }\n`;
                out += `    else\n`;
                out += `    {\n`;
                out += `        return NULL;\n`;
                out += `    }\n`;
                out += `}\n\n`;
            
                return out;
            }

            /**
             * 
             * @param {ApplicationTemplate} template 
             * @returns 
             */
            function generateInitFunction(template) {

                /**
                 * 
                 * @param {*} rootCall 
                 * @param {*} srcVariable 
                 * @param {*} destNapiVar 
                 * @param {*} dataset 
                 * @returns 
                 */
                function generateDataSetStructures(rootCall, srcVariable, destNapiVar, dataset) {

                    /**
                     * 
                     * @param {*} dataType 
                     * @returns 
                     */
                    function getDefaultValue(dataType) {
                        if (dataType === "BOOL") {
                            return "def_bool";
                        } else if (dataType === "STRING") {
                            return "def_string";
                        } else {
                            return "def_number";
                        }
                    }

                    let out = "";
                
                    //check if the type is an enum and change enums to DINT
                    if (dataset.type === "enum") dataset.dataType = "DINT";
                
                    if (Datamodel.isScalarType(dataset, true)) {
                        if (dataset.arraySize > 0) {
                            iterator.next();
                            out += `napi_create_array(env, &${destNapiVar});\n`;
                            out += `for (uint32_t ${iterator.i} = 0; ${iterator.i} < (sizeof(${srcVariable})/sizeof(${srcVariable}[0])); ${iterator.i}++)\n`;
                            out += `{\n`;
                            out += `    napi_set_element(env, ${destNapiVar}, ${iterator.i}, ${getDefaultValue(dataset.dataType)});\n`;
                            out += `}\n`;
                        } else {
                            out += `${destNapiVar} = ${getDefaultValue(dataset.dataType)};\n`;
                        }
                    } else {
                        //resolve datatype and call self if there are sub-datatypes also at this level
                
                        if (dataset.arraySize > 0) {
                            iterator.next();
                            out += `napi_create_array(env, &${destNapiVar});\n`
                            out += `for (uint32_t ${iterator.i} = 0; ${iterator.i} < (sizeof(${srcVariable})/sizeof(${srcVariable}[0])); ${iterator.i}++)\n`;
                            out += `{\n`;
                            out += `    napi_create_object(env, &${objectIdx.toString()});\n`;
                            for (let type of dataset.datasets) {
                                if (Datamodel.isScalarType(type, true)) {
                                    if (type.arraySize > 0) {
                                        let olditerator = iterator.i;
                                        objectIdx.next();
                                        out += `    ` + generateDataSetStructures(false, `${srcVariable}[${iterator.i}].${type.structName}`, `${objectIdx.toString()}`, type);
                                        iterator.i = olditerator;
                                        out += `    napi_set_named_property(env, ${objectIdx.toString(-1)}, "${type.structName}", ${objectIdx.toString()});\n`;
                                        objectIdx.prev();
                                    } else {
                                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", ${getDefaultValue(type.dataType)});\n`;
                                    }
                                } else {
                                    //subtype detected
                                    objectIdx.next();
                                    out += `    ` + generateDataSetStructures(false, `${srcVariable}[${iterator.i}].${type.structName}`, `${objectIdx.toString()}`, type);
                                    out += `    napi_set_named_property(env, ${objectIdx.toString(-1)}, "${type.structName}", ${objectIdx.toString()});\n`;
                                    objectIdx.prev();
                                }
                            }
                            out += `napi_set_element(env, ${destNapiVar}, ${iterator.i}, ${objectIdx.toString()});\n`;
                            out += `}\n`;
                        } else {
                            out += `    napi_create_object(env, &${objectIdx.toString()});\n`;
                            for (let type of dataset.datasets) {
                                if (Datamodel.isScalarType(type, true)) {
                                    if (type.arraySize > 0) {
                                        objectIdx.next();
                                        out += `    ` + generateDataSetStructures(false, `${srcVariable}.${type.structName}`, `${objectIdx.toString()}`, type);
                                        out += `    napi_set_named_property(env, ${objectIdx.toString(-1)}, "${type.structName}", ${objectIdx.toString()});\n`;
                                        objectIdx.prev();
                                    } else {
                                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", ${getDefaultValue(type.dataType)});\n`;
                                    }
                                } else {
                                    //subtype detected
                                    objectIdx.next();
                                    out += `    ` + generateDataSetStructures(false, `${srcVariable}.${type.structName}`, `${objectIdx.toString()}`, type);
                                    out += `    napi_set_named_property(env, ${objectIdx.toString(-1)}, "${type.structName}", ${objectIdx.toString()});\n`;
                                    objectIdx.prev();
                                }
                            }
                
                            if (rootCall) {
                                out += `    ${destNapiVar} = object0;\n`;
                            }
                        }
                    }
                
                    return out;
                }

                let out = "";
                let out1 = "";
                let out2 = "";
                let out3 = "";
                let out_structs = "";
            
                objectIdx.reset();
            
                //generate .value object structures
                for (let dataset of template.datasets) {
                    out2 = out3 = "";
                    if (dataset.isSub) {
                        out2 += `    napi_create_function(env, NULL, 0, ${dataset.structName}_onchange_init, NULL, &${dataset.structName}_onchange);\n`;
                        out2 += `    napi_set_named_property(env, ${dataset.structName}.value, "onChange", ${dataset.structName}_onchange);\n`;
                        out2 += `    napi_set_named_property(env, ${dataset.structName}.value, "nettime", undefined);\n`;
                        out2 += `    napi_set_named_property(env, ${dataset.structName}.value, "latency", undefined);\n`;
                    }
                    if (dataset.isPub) {
                        out3 += `    napi_create_function(env, NULL, 0, ${dataset.structName}_publish_method, NULL, &${dataset.structName}_publish);\n`;
                        out3 += `    napi_set_named_property(env, ${dataset.structName}.value, "publish", ${dataset.structName}_publish);\n`;
                    }
                    if (dataset.isSub || dataset.isPub) {
                        iterator.reset();
                        objectIdx.i = 0;
                        out1 = generateDataSetStructures(true, `exos_data.${dataset.structName}`, `${dataset.structName}_value`, dataset);
            
                        out3 += `    napi_set_named_property(env, ${dataset.structName}.value, "value", ${dataset.structName}_value);\n`;
            
                        out3 += `    napi_create_function(env, NULL, 0, ${dataset.structName}_connonchange_init, NULL, &${dataset.structName}_conn_change);\n`;
                        out3 += `    napi_set_named_property(env, ${dataset.structName}.value, "onConnectionChange", ${dataset.structName}_conn_change);\n`;
                        out3 += `    napi_set_named_property(env, ${dataset.structName}.value, "connectionState", def_string);\n\n`;
            
                        out_structs += out1 + out2 + out3;
                    }
                }
            
                //prototype    
                out += `// init of module, called at "require"\n`;
                out += `static napi_value init_${template.datamodel.varName}(napi_env env, napi_value exports)\n{\n`;
            
                // declarations
                out += `    napi_value `;
                out += `${template.datamodel.varName}_conn_change, ${template.datamodel.varName}_onprocessed,`;
                let atleastone = false;
                for (let i = 0; i < template.datasets.length; i++) {
                    if (template.datasets[i].isSub || template.datasets[i].isPub) {
                        if (atleastone == true) {
                            out += `,`;
                        }
                        out += ` ${template.datasets[i].structName}_conn_change`;
                        atleastone = true;
                    }
                }
                out += `;\n`;
            
                atleastone = false;
                for (let i = 0; i < template.datasets.length; i++) {
                    if (template.datasets[i].isSub) {
                        if (atleastone == true) {
                            out += `,`;
                        }
                        if (atleastone == false) {
                            out += `    napi_value`;
                            atleastone = true;
                        }
                        out += ` ${template.datasets[i].structName}_onchange`;
                    }
                }
                if (atleastone == true) {
                    out += `;\n`;
                    atleastone = false;
                }
            
                for (let i = 0; i < template.datasets.length; i++) {
                    if (template.datasets[i].isPub) {
                        if (atleastone == true) {
                            out += `,`;
                        }
                        if (atleastone == false) {
                            out += `    napi_value`;
                            atleastone = true;
                        }
                        out += ` ${template.datasets[i].structName}_publish`;
                    }
                }
                if (atleastone == true) {
                    out += `;\n`;
                    atleastone = false;
                }
            
                for (let i = 0; i < template.datasets.length; i++) {
                    if (template.datasets[i].isPub || template.datasets[i].isSub) {
                        if (atleastone == true) {
                            out += `,`;
                        }
                        if (atleastone == false) {
                            out += `    napi_value`;
                            atleastone = true;
                        }
                        out += ` ${template.datasets[i].structName}_value`;
                    }
                }
                if (atleastone == true) {
                    out += `;\n`;
                    atleastone = false;
                }
            
                // base variables needed
                out += `\n    napi_value dataModel, getNetTime, undefined, def_bool, def_number, def_string;\n`;
                out += `    napi_value log, logError, logWarning, logSuccess, logInfo, logDebug, logVerbose;\n`;
            
                if (out_structs.includes("&object")) {
                    out += `    napi_value `;
                    for (let i = 0; i <= objectIdx.max; i++) {
                        if (i == 0) {
                            out += `object${i}`;
                        } else {
                            out += `, object${i}`;
                        }
                    }
                    out += `;\n\n`;
                    objectIdx.reset();
                } else {
                    out += `\n`;
                }
            
                out += `    napi_get_boolean(env, BUR_NAPI_DEFAULT_BOOL_INIT, &def_bool); \n`;
                out += `    napi_create_int32(env, BUR_NAPI_DEFAULT_NUM_INIT, &def_number); \n`;
                out += `    napi_create_string_utf8(env, BUR_NAPI_DEFAULT_STRING_INIT, strlen(BUR_NAPI_DEFAULT_STRING_INIT), &def_string);\n`;
                out += `    napi_get_undefined(env, &undefined); \n\n`;
            
                //base objects
                out += `    // create base objects\n`;
                out += `    if (napi_ok != napi_create_object(env, &dataModel)) \n        return NULL; \n\n`;
                out += `    if (napi_ok != napi_create_object(env, &log)) \n        return NULL; \n\n`;
                out += `    if (napi_ok != napi_create_object(env, &${template.datamodel.varName}.value)) \n        return NULL; \n\n`;
            
                for (let i = 0; i < template.datasets.length; i++) {
                    if (template.datasets[i].isSub || template.datasets[i].isPub) { out += `    if (napi_ok != napi_create_object(env, &${template.datasets[i].structName}.value)) \n        return NULL; \n\n`; }
                }
            
                //insert build structures
                out += `    // build object structures\n`;
                out += out_structs;
            
                //logging functions
                out += `    //connect logging functions\n`;
                out += `    napi_create_function(env, NULL, 0, log_error, NULL, &logError);\n`;
                out += `    napi_set_named_property(env, log, "error", logError);\n`;
                out += `    napi_create_function(env, NULL, 0, log_warning, NULL, &logWarning);\n`;
                out += `    napi_set_named_property(env, log, "warning", logWarning);\n`;
                out += `    napi_create_function(env, NULL, 0, log_success, NULL, &logSuccess);\n`;
                out += `    napi_set_named_property(env, log, "success", logSuccess);\n`;
                out += `    napi_create_function(env, NULL, 0, log_info, NULL, &logInfo);\n`;
                out += `    napi_set_named_property(env, log, "info", logInfo);\n`;
                out += `    napi_create_function(env, NULL, 0, log_debug, NULL, &logDebug);\n`;
                out += `    napi_set_named_property(env, log, "debug", logDebug);\n`;
                out += `    napi_create_function(env, NULL, 0, log_verbose, NULL, &logVerbose);\n`;
                out += `    napi_set_named_property(env, log, "verbose", logVerbose);\n`;
            
                //bind topics to datamodel
                out += `\n    // bind dataset objects to datamodel object\n`;
                for (let i = 0; i < template.datasets.length; i++) {
                    if (template.datasets[i].isSub || template.datasets[i].isPub) { out += `    napi_set_named_property(env, dataModel, "${template.datasets[i].structName}", ${template.datasets[i].structName}.value); \n`; }
                }
                out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "datamodel", dataModel); \n`;
                out += `    napi_create_function(env, NULL, 0, ${template.datamodel.varName}_connonchange_init, NULL, &${template.datamodel.varName}_conn_change); \n`;
                out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "onConnectionChange", ${template.datamodel.varName}_conn_change); \n`;
                out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "connectionState", def_string);\n`;
                out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "isConnected", def_bool);\n`;
                out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "isOperational", def_bool);\n`;
                out += `    napi_create_function(env, NULL, 0, ${template.datamodel.varName}_onprocessed_init, NULL, &${template.datamodel.varName}_onprocessed); \n`;
                out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "onProcessed", ${template.datamodel.varName}_onprocessed); \n`;
                out += `    napi_create_function(env, NULL, 0, get_net_time, NULL, &getNetTime);\n`;
                out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "nettime", getNetTime);\n`;
                out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "log", log);\n`;
            
                //export the application
                out += `    // export application object\n`;
                out += `    napi_set_named_property(env, exports, "${template.datamodel.structName}", ${template.datamodel.varName}.value); \n\n`;
            
                //save references to objects
                out += `    // save references to object as globals for this C-file\n`;
                out += `    if (napi_ok != napi_create_reference(env, ${template.datamodel.varName}.value, ${template.datamodel.varName}.ref_count, &${template.datamodel.varName}.ref)) \n`;
                out += `    {
                    \n`;
                out += `        napi_throw_error(env, "EINVAL", "Can't create ${template.datamodel.varName} reference"); \n`;
                out += `        return NULL; \n`;
                out += `    } \n`;
                for (let i = 0; i < template.datasets.length; i++) {
                    if (template.datasets[i].isSub || template.datasets[i].isPub) {
                        out += `    if (napi_ok != napi_create_reference(env, ${template.datasets[i].structName}.value, ${template.datasets[i].structName}.ref_count, &${template.datasets[i].structName}.ref)) \n`;
                        out += `    {\n`;
                        out += `        napi_throw_error(env, "EINVAL", "Can't create ${template.datasets[i].structName} reference"); \n`;
                        out += `        return NULL; \n`;
                        out += `    } \n`;
                    }
                }
                out += `\n`;
            
                // register cleanup hook
                out += `    // register clean up hook\n`;
                out += `    if (napi_ok != napi_add_env_cleanup_hook(env, cleanup_${template.datamodel.varName}, env)) \n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Can't register cleanup hook"); \n`;
                out += `        return NULL; \n`;
                out += `    } \n\n`;
            
                // exOS
                // exOS inits
                out += `    // exOS\n`;
                out += `    // exOS inits\n`;
                out += `    if (EXOS_ERROR_OK != exos_datamodel_init(&${template.datamodel.varName}_datamodel, "${template.datamodelInstanceName}", "${template.aliasName}")) \n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Can't initialize ${template.datamodel.structName}"); \n`;
                out += `    } \n`;
                out += `    ${template.datamodel.varName}_datamodel.user_context = NULL; \n`;
                out += `    ${template.datamodel.varName}_datamodel.user_tag = 0; \n\n`;
            
                for (let i = 0; i < template.datasets.length; i++) {
                    if (template.datasets[i].isSub || template.datasets[i].isPub) {
                        out += `    if (EXOS_ERROR_OK != exos_dataset_init(&${template.datasets[i].structName}_dataset, &${template.datamodel.varName}_datamodel, "${template.datasets[i].structName}", &exos_data.${template.datasets[i].structName}, sizeof(exos_data.${template.datasets[i].structName}))) \n`;
                        out += `    {\n`;
                        out += `        napi_throw_error(env, "EINVAL", "Can't initialize ${template.datasets[i].structName}"); \n`;
                        out += `    }\n`;
                        out += `    ${template.datasets[i].structName}_dataset.user_context = NULL; \n`;
                        out += `    ${template.datasets[i].structName}_dataset.user_tag = 0; \n\n`;
                    }
                }
            
                // register the datamodel & logger
                out += `    if (EXOS_ERROR_OK != exos_log_init(&logger, "${template.datamodel.structName}_0"))\n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Can't register logger for ${template.datamodel.structName}"); \n`;
                out += `    } \n\n`;
                out += `    INFO("${template.datamodel.structName} starting!")\n`;
                out += `    // exOS register datamodel\n`;
                out += `    if (EXOS_ERROR_OK != exos_datamodel_connect_${template.datamodel.varName}(&${template.datamodel.varName}_datamodel, datamodelEvent)) \n`;
                out += `    {\n`;
                out += `        napi_throw_error(env, "EINVAL", "Can't connect ${template.datamodel.structName}"); \n`;
                out += `    } \n\n`;
            
                // register datasets
                out += `    // exOS register datasets\n`;
                for (let i = 0; i < template.datasets.length; i++) {
                    if (template.datasets[i].isSub || template.datasets[i].isPub) {
                        out += `    if (EXOS_ERROR_OK != exos_dataset_connect(&${template.datasets[i].structName}_dataset, `;
                        if (template.datasets[i].isSub) {
                            out += `EXOS_DATASET_SUBSCRIBE`;
                            if (template.datasets[i].isPub) {
                                out += ` + EXOS_DATASET_PUBLISH`;
                            }
                        } else {
                            out += `EXOS_DATASET_PUBLISH`;
                        }
                        out += `, datasetEvent)) \n`;
                        out += `    {\n`;
                        out += `        napi_throw_error(env, "EINVAL", "Can't connect ${template.datasets[i].structName}"); \n`;
                        out += `    }\n\n`;
                    }
                }
            
                out += `    // start up module\n\n`;
                out += `    uv_idle_init(uv_default_loop(), &cyclic_h); \n`;
                out += `    uv_idle_start(&cyclic_h, cyclic); \n\n`;
                out += `    SUCCESS("${template.datamodel.structName} started!")\n`;
            
                out += `    return exports; \n`;
            
                out += `} \n\n`;
            
                return out;
            }

            let out = "";
        
            //general info
            out += `//KNOWN ISSUES\n`;
            out += `/*\n`;
            out += `NO checks on values are made. NodeJS har as a javascript language only "numbers" that will be created from SINT, INT etc.\n`;
            out += `This means that when writing from NodeJS to Automation Runtime, you should take care of that the value actually fits into \n`;
            out += `the value assigned.\n\n`;
        
            out += `String arrays will most probably not work, as they are basically char[][]...\n\n`;
        
            out += `Strings are encoded as utf8 strings in NodeJS which means that special chars will reduce length of string. And generate funny \n`;
            out += `charachters in Automation Runtime.\n\n`;
        
            out += `PLCs WSTRING is not supported.\n\n`;
        
            out += `Enums defined in typ file will parse to DINT (uint32_t). Enums are not supported in JavaScript.\n\n`;
        
            out += `Generally the generates code is not yet fully and understanably error handled. ex. if (napi_ok != .....\n\n`;
        
            out += `The code generated is NOT yet fully formatted to ones normal liking. There are missing indentations.\n`;
            out += `*/\n\n`;
        
            //includes, defines, types and global variables
            out += `#define NAPI_VERSION 6\n`;
            out += `#include <node_api.h>\n`;
            out += `#include <stdint.h>\n`;
            out += `#include <exos_api.h>\n`;
            out += `#include <exos_log.h>\n`;
            out += `#include "exos_${template.datamodel.varName}.h"\n`;
            out += `#include <uv.h>\n`;
            out += `#include <unistd.h>\n`;
            out += `#include <string.h>\n\n`;
            out += `#define SUCCESS(_format_, ...) exos_log_success(&logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);\n`;
            out += `#define INFO(_format_, ...) exos_log_info(&logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);\n`;
            out += `#define VERBOSE(_format_, ...) exos_log_debug(&logger, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, _format_, ##__VA_ARGS__);\n`;
            out += `#define ERROR(_format_, ...) exos_log_error(&logger, _format_, ##__VA_ARGS__);\n`;
            out += `\n`;
            out += `#define BUR_NAPI_DEFAULT_BOOL_INIT false\n`;
            out += `#define BUR_NAPI_DEFAULT_NUM_INIT 0\n`;
            out += `#define BUR_NAPI_DEFAULT_STRING_INIT ""\n`;
            out += `\n`;
            out += `static exos_log_handle_t logger;\n`;
            out += `\n`;
            out += `typedef struct\n`;
            out += `{\n`;
            out += `    napi_ref ref;\n`;
            out += `    uint32_t ref_count;\n`;
            out += `    napi_threadsafe_function onchange_cb;\n`;
            out += `    napi_threadsafe_function connectiononchange_cb;\n`;
            out += `    napi_threadsafe_function onprocessed_cb; //used only for datamodel\n`;
            out += `    napi_value object_value; //volatile placeholder.\n`;
            out += `    napi_value value;        //volatile placeholder.\n`;
            out += `} obj_handles;\n`;
            out += `\n`;
            out += `obj_handles ${template.datamodel.varName} = {};\n`;
            for (let dataset of template.datasets) {
                if (dataset.isSub || dataset.isPub) { out += `obj_handles ${dataset.structName} = {};\n`; }
            }
            out += `\n`;
            out += `napi_deferred deferred = NULL;\n`;
            out += `uv_idle_t cyclic_h;\n`;
            out += `\n`;
            out += `${template.datamodel.dataType} exos_data = {};\n`;
            out += `exos_datamodel_handle_t ${template.datamodel.varName}_datamodel;\n`;
            for (let dataset of template.datasets) {
                if (dataset.isSub || dataset.isPub) { out += `exos_dataset_handle_t ${dataset.structName}_dataset;\n`; }
            }
            out += `\n`;
            out += `// error handling (Node.js)\n`;
            out += `static void throw_fatal_exception_callbacks(napi_env env, const char *defaultCode, const char *defaultMessage)\n`;
            out += `{\n`;
            out += `    napi_value err;\n`;
            out += `    bool is_exception = false;\n\n`;
            out += `    napi_is_exception_pending(env, &is_exception);\n\n`;
            out += `    if (is_exception)\n`;
            out += `    {\n`;
            out += `        napi_get_and_clear_last_exception(env, &err);\n`;
            out += `        napi_fatal_exception(env, err);\n`;
            out += `    }\n`;
            out += `    else\n`;
            out += `    {\n`;
            out += `        napi_value code, msg;\n`;
            out += `        napi_create_string_utf8(env, defaultCode, NAPI_AUTO_LENGTH, &code);\n`;
            out += `        napi_create_string_utf8(env, defaultMessage, NAPI_AUTO_LENGTH, &msg);\n`;
            out += `        napi_create_error(env, code, msg, &err);\n`;
            out += `        napi_fatal_exception(env, err);\n`;
            out += `    }\n`;
            out += `}\n\n`;
        
            out += generateExosCallbacks(template);
        
            out += generateNApiCBinitMMain();
        
            out += generateConnectionCallbacks(template);
        
            out += generateValueCallbacks(template);
        
            out += generateCallbackInits(template);
        
            out += generateValuesPublishMethods(template);
        
            out += generateLogCleanUpHookCyclic(template);
        
            out += generateInitFunction(template);
        
            out += `// hook for Node-API\n`;
            out += `NAPI_MODULE(NODE_GYP_MODULE_NAME, init_${template.datamodel.varName});\n`;
        
            return out;
        }

        return generateLibTemplate(this.template);
    }
}

module.exports = { TemplateLinuxNAPI };