#!/usr/bin/env node

//KNOWN ISSUES
/*
    NO checks on values are made. NodeJS har as a javascript language only "numbers" that will be created from SINT, INT etc. 
    This means that when writing from NodeJS to Automation Runtime, you should take care of that the value actually fits into 
    the value assigned.
    
    String arrays will most probably not work, as they are basically char[][]...

    Strings are encoded as utf8 strings in NodeJS which means that special chars will reduce length of string. And generate funny 
    charachters in Automation Runtime.

    PLCs WSTRING is not supported.

    Enums defined in typ file will parse to DINT (uint32_t). Enums are not supported in JavaScript.

    Generally the generates code is not yet fully and understanably error handled. ex. if (napi_ok != .....

    The code generated is NOT yet fully formatted to ones normal liking. There are missing indentations.
*/

const header = require('../exos_header');
const path = require('path');
const fs = require('fs');

///////////////
//support stuff
///////////////
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

function readType(fileName, typName) {
    var template = {
        type: "",
        datasets: [],
    }

    if (fs.existsSync(fileName)) {
        var types = header.parseTypFile(fileName, typName);

        if (types.name === "enum") template.type = "enum";
        else if (types.name === "struct") template.type = "struct";

        for (let child of types.children) {
            let object = {};
            object["structName"] = child.attributes.name;
            object["varName"] = child.attributes.name.toLowerCase() + (child.attributes.name == child.attributes.name.toLowerCase() ? "_dataset" : "");
            object["dataType"] = child.attributes.dataType;
            if (typeof child.attributes.arraySize === "number") {
                object["arraySize"] = child.attributes.arraySize;
            } else {
                object["arraySize"] = 0;
            }
            object["comment"] = child.attributes.comment;
            if (typeof child.attributes.comment === "string") {
                object["isPub"] = child.attributes.comment.includes("PUB");
                object["isSub"] = child.attributes.comment.includes("SUB");
                object["isPrivate"] = child.attributes.comment.includes("private");
            } else {
                object["comment"] = "";
                object["isPub"] = false;
                object["isSub"] = false;
                object["isPrivate"] = false;
            }
            if (child.attributes.hasOwnProperty("stringLength")) { object["stringLength"] = child.attributes.stringLength; }
            template.datasets.push(object);
        }
    } else {
        throw (`file '${fileName}' not found.`);
    }

    return template;
}

////////////////////////////
//file generation functions
////////////////////////////
function generateLinuxPackage(typName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio Version=4.9.1.69?>\n`;
    out += `<Package SubType="exosLinuxPackage" PackageType="exosLinuxPackage" xmlns="http://br-automation.co.at/AS/Package">\n`;
    out += `  <Objects>\n`;
    out += `    <Object Type="File">build.sh</Object>\n`;
    out += `    <Object Type="File">CMakeLists.txt</Object>\n`;
    out += `    <Object Type="File">index.js</Object>\n`;
    out += `    <Object Type="File">${typName.toLowerCase()}.js</Object>\n`;
    out += `    <Object Type="File">l_${typName}.node</Object>\n`;
    out += `    <Object Type="File">package.json</Object>\n`;
    out += `    <Object Type="File">package-lock.json</Object>\n`;
    out += `    <Object Type="File">binding.gyp</Object>\n`;
    out += `    <Object Type="File">exos_${typName.toLowerCase()}.h</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.c</Object>\n`;
    out += `    <Object Type="File">exos-comp-${typName.toLowerCase()}-1.0.0.deb</Object>\n`;
    out += `  </Objects>\n`;
    out += `</Package>\n`;

    return out;
}

function generateShBuild() {
    let out = "";

    out += `#!/bin/sh\n\n`;

    out += `rm -f l_*.node\n`;
    out += `rm -f *.deb\n\n`;

    out += `finalize() {\n`;
    out += `    rm -rf build/*\n`;
    out += `    rm -r build\n`;
    out += `    rm -rf node_modules/*\n`;
    out += `    rm -r node_modules\n`;
    out += `    rm -f Makefile\n`;
    out += `    sync\n`;
    out += `    exit $1\n`;
    out += `}\n\n`;

    out += `npm install\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    finalize 1\n`;
    out += `fi\n\n`;

    out += `cp -f build/Release/l_*.node .\n\n`;

    out += `mkdir node_modules #make sure the folder exists even if no submodules are needed\n\n`;

    out += `rm -rf build/*\n`;

    out += `cd build\n\n`;

    out += `cmake -Wno-dev ..\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    cd ..\n`;
    out += `    finalize 2\n`;
    out += `fi\n\n`;

    out += `cpack\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    cd ..\n`;
    out += `    finalize\n`;
    out += `fi\n\n`;

    out += `cp -f exos-comp-*.deb ..\n\n`;

    out += `cd ..\n\n`;

    out += `finalize 0\n\n`;
    return out;
}

function generateGyp(typName) {
    let out = "";

    out += `{\n`;
    out += `  "targets": [\n`;
    out += `    {\n`;
    out += `      "target_name": "l_${typName}",\n`;
    out += `      "sources": [\n`;
    out += `        "lib${typName.toLowerCase()}.c"\n`;
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

function generateExosPkg(typName, libName, fileName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<ComponentPackage Version="1.0.0" ErrorHandling="Ignore" StartupTimeout="0">\n`;
    out += `    <Service Name="${typName} Runtime Service" Executable="/usr/bin/npm" Arguments="start --prefix /home/user/${typName.toLowerCase()}/"/>\n`;
    out += `    <DataModelInstance Name="${typName}"/>\n`;
    out += `    <File Name="exos-comp-${typName.toLowerCase()}" FileName="Linux\\exos-comp-${typName.toLowerCase()}-1.0.0.deb" Type="Project"/>\n`;
    out += `    <File Name="main-script" FileName="Linux\\index.js" Type="Project"/>\n`;
    out += `    <Installation Type="Prerun" Command="cp /var/cache/exos/index.js /home/user/${typName.toLowerCase()}/"/>\n`;
    out += `    <Build>\n`;
    out += `        <GenerateHeader FileName="${typName}\\${typName}.typ" TypeName="${typName}">\n`;
    out += `            <SG4 Include="${fileName.split(".")[0].toLowerCase()}.h"/>\n`;
    out += `            <Output Path="Linux"/>\n`;
    out += `            <Output Path="${libName}"/>\n`;
    out += `        </GenerateHeader>\n`;
    out += `        <BuildCommand Command="C:\\Windows\\Sysnative\\wsl.exe" WorkingDirectory="Linux" Arguments="--distribution Debian --exec ./build.sh">\n`;
    out += `            <Dependency FileName="Linux\\CMakeLists.txt"/>\n`;
    out += `            <Dependency FileName="Linux\\exos_${typName.toLowerCase()}.h"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.c"/>\n`;
    out += `            <Dependency FileName="Linux\\${typName.toLowerCase()}.js"/>\n`;
    out += `            <Dependency FileName="Linux\\binding.gyp"/>\n`;
    out += `            <Dependency FileName="Linux\\package.json"/>\n`;
    out += `            <Dependency FileName="Linux\\package-lock.json"/>\n`;
    out += `        </BuildCommand>\n`;
    out += `    </Build>\n`;
    out += `</ComponentPackage>\n`;

    return out;
}

function generateCMakeLists(typName) {
    let out = "";
    out += `\n`;
    out += `project(${typName.toLowerCase()})\n`;
    out += `cmake_minimum_required(VERSION 3.0)\n`;
    out += `\n`;
    out += `set(${typName.toUpperCase()}_MODULE_FILES\n`;
    out += `    l_${typName}.node\n`;
    out += `    ${typName.toLowerCase()}.js\n`;
    out += `    package.json\n`;
    out += `    package-lock.json)\n`;
    out += `\n`;
    out += `install(FILES \${${typName.toUpperCase()}_MODULE_FILES} DESTINATION /home/user/${typName.toLowerCase()})\n`;
    out += `install(DIRECTORY node_modules DESTINATION /home/user/${typName.toLowerCase()}/)\n`;
    out += `\n`;
    out += `set(CPACK_GENERATOR "DEB")\n`;
    out += `set(CPACK_PACKAGE_NAME exos-comp-${typName.toLowerCase()})\n`;
    out += `set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "${typName.toLowerCase()} summary")\n`;
    out += `set(CPACK_PACKAGE_DESCRIPTION "Some description")\n`;
    out += `set(CPACK_PACKAGE_VENDOR "Your Organization")\n`;
    out += `\n`;
    out += `set(CPACK_PACKAGE_VERSION_MAJOR 1)\n`;
    out += `set(CPACK_PACKAGE_VERSION_MINOR 0)\n`;
    out += `set(CPACK_PACKAGE_VERSION_PATCH 0)\n`;
    out += `set(CPACK_PACKAGE_FILE_NAME exos-comp-${typName.toLowerCase()}-`;
    out += '${CPACK_PACKAGE_VERSION_MAJOR}.${CPACK_PACKAGE_VERSION_MINOR}.${CPACK_PACKAGE_VERSION_PATCH})\n';
    out += `set(CPACK_DEBIAN_PACKAGE_MAINTAINER "your name")\n`;
    out += `\n`;
    out += `set(CPACK_DEBIAN_PACKAGE_SHLIBDEPS ON)\n`;
    out += `\n`;
    out += `include(CPack)\n`;

    return out;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//lib____.c file generator functions basically in order of call from configtemplate() (and in lib____.c file order)
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function generateExosCallbacks(template) {
    let out = "";
    out += `// exOS callbacks\n`;
    out += `static void datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info)\n{\n`;
    out += `    switch (event_type)\n    {\n`;
    out += `    case EXOS_DATASET_EVENT_UPDATED:\n`;
    var atleastone = false;
    for (let dataset of template.datasets) {
        if (dataset.isPub) {
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
    out += `    case EXOS_DATASET_EVENT_DELIVERED:\n`;
    atleastone = false;
    for (let dataset of template.datasets) {
        if (dataset.isSub) {
            if (atleastone) {
                out += `        else `;
            }
            else {
                out += `        `;
                atleastone = true;
            }
            out += `if(0 == strcmp(dataset->name, "${dataset.structName}"))\n`;
            out += `        {\n`;
            out += `            //${header.convertPlcType(dataset.dataType)} *${dataset.varName} = (${header.convertPlcType(dataset.dataType)} *)dataset->data;\n`;
            out += `        }\n`;
        }
    }
    out += `        break;\n\n`;

    out += `    case EXOS_DATASET_EVENT_CONNECTION_CHANGED:\n`;
    atleastone = false;
    for (let dataset of template.datasets) {
        if (dataset.isPub || dataset.isSub) {
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
    out += `    }\n`;
    out += `}\n\n`;

    out += `static void datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info)\n{\n`;
    out += `    switch (event_type)\n    {\n`;
    out += `    case EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED:\n`;

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
    out += `        case EXOS_STATE_OPERATIONAL:\n`;
    out += `        case EXOS_STATE_ABORTED:\n`;
    out += `            break;\n`;
    out += `        }\n`;
    out += `        break;\n`;
    out += `    }\n`;
    out += `}\n\n`;

    return out;
}

function generateNApiCBinitMMain() {

    let out = "";

    out += `// napi callback setup main function\n`;
    out += `napi_value init_napi_onchange(napi_env env, napi_callback_info info, const char *identifier, napi_threadsafe_function_call_js call_js_cb, napi_threadsafe_function *result)\n`;
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

function generateConnectionCallbacks(template) {
    let out = "";

    out += `// js object callbacks\n`;

    //datamodel
    out += `static void ${template.datamodel.varName}_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)\n`;
    out += `{\n`;
    out += `    const char *string = data;\n`;
    out += `    napi_value undefined;\n\n`;

    out += `    napi_get_undefined(env, &undefined);\n\n`;

    out += `    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &${template.datamodel.varName}.value))\n`;
    out += `        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - ${template.datamodel.varName}.value");\n\n`;

    out += `    if (napi_ok != napi_get_reference_value(env, ${template.datamodel.varName}.ref, &${template.datamodel.varName}.object_value))\n`;
    out += `        napi_throw_error(env, "EINVAL", "Can't get reference - ${template.datamodel.varName} ");\n\n`;

    out += `    if (napi_ok != napi_set_named_property(env, ${template.datamodel.varName}.object_value, "connectionState", ${template.datamodel.varName}.value))\n`;
    out += `        napi_throw_error(env, "EINVAL", "Can't set connectionState property - ${template.datamodel.varName}");\n\n`;

    out += `    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))\n`;
    out += `        napi_throw_error(env, "EINVAL", "Can't call connectionOnChange callback - ${template.datamodel.varName}");\n`;
    out += `}\n\n`;

    //datasets
    for (let dataset of template.datasets) {
        if (dataset.isSub || dataset.isPub) {
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
            out += `        napi_throw_error(env, "EINVAL", "Can't call connectionOnChange callback - ${dataset.structName}");\n`;
            out += `}\n\n`;
        }
    }

    return out;
}

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

function generateValuesSubscribeItem(fileName, srcVariable, destNapiVar, dataset) {
    let out = "";

    //check if the type is an enum and change enums to DINT
    if (!header.isScalarType(dataset.dataType, true)) {
        let t = readType(fileName, dataset.dataType);
        if (t.type === "enum") dataset.dataType = "DINT";
    }

    if (header.isScalarType(dataset.dataType, true)) {
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
        let types = readType(fileName, dataset.dataType);

        objectIdx.next();

        if (dataset.arraySize > 0) {
            iterator.next();
            out += `napi_create_array(env, &${destNapiVar});\n`
            out += `for (uint32_t ${iterator.i} = 0; ${iterator.i} < (sizeof(${srcVariable})/sizeof(${srcVariable}[0])); ${iterator.i}++)\n`;
            out += `{\n`;
            out += `    napi_create_object(env, &${objectIdx.toString()});\n`;
            for (let type of types.datasets) {
                if (header.isScalarType(type.dataType, true)) {
                    if (type.arraySize > 0) {
                        objectIdx.next(); //force "max" property to ++1 in order to get declarations rigt.
                        objectIdx.prev();
                        let olditerator = iterator.i;
                        out += generateValuesSubscribeItem(fileName, `${srcVariable}[${iterator.i}].${type.structName}`, `${objectIdx.toString(1)}`, type);
                        iterator.i = olditerator;
                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", ${objectIdx.toString(1)});\n`;
                    } else {
                        out += `    ` + subSetLeafValue(type.dataType, `${srcVariable}[${iterator.i}].${type.structName}`, `property`);
                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", property);\n`;
                    }
                } else {
                    //subtype detected
                    out += generateValuesSubscribeItem(fileName, `${srcVariable}[${iterator.i}].${type.structName}`, `${objectIdx.toString()}`, type);
                    objectIdx.prev();
                }
            }
            out += `napi_set_element(env, ${destNapiVar}, ${iterator.i}, ${objectIdx.toString()});\n`;
            out += `}\n`;
        } else {
            out += `    napi_create_object(env, &${objectIdx.toString()});\n`;
            for (let type of types.datasets) {
                if (header.isScalarType(type.dataType, true)) {
                    if (type.arraySize > 0) {
                        objectIdx.next(); //force "max" property to ++1 in order to get declarations rigt.
                        objectIdx.prev();
                        out += generateValuesSubscribeItem(fileName, `${srcVariable}.${type.structName}`, `${objectIdx.toString(1)}`, type);
                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", ${objectIdx.toString(1)});\n`;
                    } else {
                        out += subSetLeafValue(type.dataType, `${srcVariable}.${type.structName}`, `property`);
                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", property);\n`;
                    }
                } else {
                    //subtype detected
                    out += generateValuesSubscribeItem(fileName, `${srcVariable}.${type.structName}`, `${objectIdx.toString()}`, type);
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

function generateValueCallbacks(fileName, template) {
    let out = "";
    let out2 = "";
    let atleastone = false;

    for (let dataset of template.datasets) {
        if (dataset.isPub) {
            if (atleastone === false) {
                out += `// js value callbacks\n`;;
                atleastone = true;
            }

            iterator.reset();
            objectIdx.reset();
            objectIdx.prev();//initialize to -1
            out2 = generateValuesSubscribeItem(fileName, `exos_data.${dataset.structName}`, `${dataset.structName}.value`, dataset);

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

            out += `        int32_t _latency = exos_datamodel_get_nettime(&${template.datamodel.varName}_datamodel, NULL) - *(int32_t *)netTime_exos;\n`;
            out += `        napi_create_int32(env, *(int32_t *)netTime_exos, &netTime);\n`;
            out += `        napi_create_int32(env, _latency, &latency);\n`;
            out += `        napi_set_named_property(env, ${dataset.structName}.object_value, "netTime", netTime);\n`;
            out += `        napi_set_named_property(env, ${dataset.structName}.object_value, "latency", latency);\n`;
            out += `    if (napi_ok != napi_set_named_property(env, ${dataset.structName}.object_value, "value", ${dataset.structName}.value))\n`;
            out += `    {\n`;
            out += `        napi_throw_error(env, "EINVAL", "Can't get property");\n`;
            out += `    }\n\n`;
            out += `    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))\n`;
            out += `        napi_throw_error(env, "EINVAL", "Can't call onChange callback");\n\n`;
            out += `    exos_dataset_publish(&${dataset.structName}_dataset);\n`;
            out += `}\n\n`;
        }
    }

    return out;
}

function generateCallbackInits(template) {
    let out = "";

    out += `// js callback inits\n`;
    out += `napi_value ${template.datamodel.varName}_connonchange_init(napi_env env, napi_callback_info info)\n`;
    out += `{\n`;
    out += `    return init_napi_onchange(env, info, "${template.datamodel.structName} connection change", ${template.datamodel.varName}_connonchange_js_cb, &${template.datamodel.varName}.connectiononchange_cb);\n`;
    out += `}\n\n`;

    for (let dataset of template.datasets) {
        if (dataset.isPub || dataset.isSub) {
            out += `napi_value ${dataset.structName}_connonchange_init(napi_env env, napi_callback_info info)\n`;
            out += `{\n`;
            out += `    return init_napi_onchange(env, info, "${dataset.structName} connection change", ${dataset.structName}_connonchange_js_cb, &${dataset.structName}.connectiononchange_cb);\n`;
            out += `}\n\n`;
        }
    }

    for (let dataset of template.datasets) {
        if (dataset.isPub) {
            out += `napi_value ${dataset.structName}_onchange_init(napi_env env, napi_callback_info info)\n`;
            out += `{\n`;
            out += `    return init_napi_onchange(env, info, "${dataset.structName} dataset change", ${dataset.structName}_onchange_js_cb, &${dataset.structName}.onchange_cb);\n`;
            out += `}\n\n`;
        }
    }

    return out;
}

//handles indiviual leafs in struct
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
            out += `    ${destVarName} = (${header.convertPlcType(type)})_value;\n`;
            break;
        case "REAL":
        case "LREAL":
            out += `    if (napi_ok != napi_get_value_double(env, ${srcValue}, &__value))\n`;
            out += `    {\n`;
            out += `        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");\n`;
            out += `        return NULL;\n`;
            out += `    }\n`;
            out += `    ${destVarName} = (${header.convertPlcType(type)})__value;\n`;
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

// recursive function that generates the actual copying of data from NodeJS to C struct
function generateValuesPublishItem(rootCall, fileName, srcobj, destvar, dataset) {
    let out = "";

    //check if the type is an enum and change enums to DINT
    if (!header.isScalarType(dataset.dataType, true)) {
        let t = readType(fileName, dataset.dataType);
        if (t.type === "enum") dataset.dataType = "DINT";
    }

    if (header.isScalarType(dataset.dataType, true)) {
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
        let types = readType(fileName, dataset.dataType);

        if (dataset.arraySize > 0) {
            iterator.next();
            out += `for (uint32_t ${iterator.i} = 0; ${iterator.i} < (sizeof(${destvar})/sizeof(${destvar}[0])); ${iterator.i}++)\n`;
            out += `{\n`;
            out += `    napi_get_element(env, ${srcobj}, ${iterator.i}, &${objectIdx.toString()});\n\n`;

            for (let type of types.datasets) {
                objectIdx.next();
                out += `    napi_get_named_property(env, ${objectIdx.toString(-1)}, "${type.structName}", &${objectIdx.toString()});\n`;
                if (header.isScalarType(type.dataType, true)) {
                    if (type.arraySize > 0) {
                        let olditerator = iterator.i;
                        out += generateValuesPublishItem(false, fileName, `${objectIdx.toString()}`, `${destvar}[${iterator.i}].${type.structName}`, type);
                        iterator.i = olditerator;
                    } else {
                        out += pubFetchLeaf(type.dataType, `${objectIdx.toString()}`, `${destvar}[${iterator.i}].${type.structName}`);
                    }
                } else {
                    //subtype detected
                    out += generateValuesPublishItem(false, fileName, `${objectIdx.toString()}`, `${destvar}[${iterator.i}].${type.structName}`, type);
                }
                objectIdx.prev();
            }
            out += `}\n\n`;
        } else {
            if (rootCall) {
                rootCall = false;
                out += `    object0 = ${srcobj};\n`;
            }

            for (let type of types.datasets) {
                objectIdx.next();
                out += `    napi_get_named_property(env, ${objectIdx.toString(-1)}, "${type.structName}", &${objectIdx.toString()});\n`;
                if (header.isScalarType(type.dataType, true)) {
                    if (type.arraySize > 0) {
                        out += generateValuesPublishItem(false, fileName, `${objectIdx.toString()}`, `${destvar}.${type.structName}`, type);
                    } else {
                        out += pubFetchLeaf(type.dataType, `${objectIdx.toString()}`, `${destvar}.${type.structName}`);
                    }
                } else {
                    //subtype detected
                    out += generateValuesPublishItem(false, fileName, `${objectIdx.toString()}`, `${destvar}.${type.structName}`, type);
                }
                objectIdx.prev();
            }
        }
    }

    return out;
}

// generates publish methods prototypes and basic andling like dereferencing paramet.value handle
function generateValuesPublishMethods(fileName, template) {
    let out = "";
    let out2 = "";
    let atleastone = false;

    for (let dataset of template.datasets) {
        if (dataset.isSub) {
            if (atleastone === false) {
                out += `// publish methods\n`;
                atleastone = true;
            }
            iterator.reset();
            objectIdx.reset();
            out2 = generateValuesPublishItem(true, fileName, `${dataset.structName}.value`, `exos_data.${dataset.structName}`, dataset);

            out += `napi_value ${dataset.structName}_publish_method(napi_env env, napi_callback_info info)\n`;
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

function generateCleanUpHookCyclic(template) {
    let out = "";

    out += `// cleanup/cyclic\n`;
    out += `static void cleanup_${template.datamodel.varName}(void *env)\n`;
    out += `{\n`;
    out += `    uv_idle_stop(&cyclic_h);\n\n`;
    out += `    if (EXOS_ERROR_OK != exos_datamodel_delete(&${template.datamodel.varName}_datamodel))\n`;
    out += `    {\n`;
    out += `        napi_throw_error(env, "EINVAL", "Can't delete datamodel");\n`;
    out += `    }\n`;
    out += `}\n\n`;

    out += `void cyclic(uv_idle_t * handle) \n`;
    out += `{\n`;
    out += `    exos_datamodel_process(&${template.datamodel.varName}_datamodel); \n`;
    out += `}\n\n`;

    out += `//read nettime for DataModel\n`;
    out += `napi_value get_net_time(napi_env env, napi_callback_info info)\n`;
    out += `{\n`;
    out += `    napi_value netTime;\n\n`;
    out += `    if (napi_ok == napi_create_int32(env, exos_datamodel_get_nettime(&${template.datamodel.varName}_datamodel, NULL), &netTime))\n`;
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

function getDefaultValue(dataType) {
    if (dataType === "BOOL") {
        return "def_bool";
    } else if (dataType === "STRING") {
        return "def_string";
    } else {
        return "def_number";
    }
}

function generateDataSetStructures(rootCall, fileName, srcVariable, destNapiVar, dataset) {
    let out = "";

    //check if the type is an enum and change enums to DINT
    if (!header.isScalarType(dataset.dataType, true)) {
        let t = readType(fileName, dataset.dataType);
        if (t.type === "enum") dataset.dataType = "DINT";
    }

    if (header.isScalarType(dataset.dataType, true)) {
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
        let types = readType(fileName, dataset.dataType);

        if (dataset.arraySize > 0) {
            iterator.next();
            out += `napi_create_array(env, &${destNapiVar});\n`
            out += `for (uint32_t ${iterator.i} = 0; ${iterator.i} < (sizeof(${srcVariable})/sizeof(${srcVariable}[0])); ${iterator.i}++)\n`;
            out += `{\n`;
            out += `    napi_create_object(env, &${objectIdx.toString()});\n`;
            for (let type of types.datasets) {
                if (header.isScalarType(type.dataType, true)) {
                    if (type.arraySize > 0) {
                        let olditerator = iterator.i;
                        objectIdx.next();
                        out += `    ` + generateDataSetStructures(false, fileName, `${srcVariable}[${iterator.i}].${type.structName}`, `${objectIdx.toString()}`, type);
                        iterator.i = olditerator;
                        out += `    napi_set_named_property(env, ${objectIdx.toString(-1)}, "${type.structName}", ${objectIdx.toString()});\n`;
                        objectIdx.prev();
                    } else {
                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", ${getDefaultValue(type.dataType)});\n`;
                    }
                } else {
                    //subtype detected
                    objectIdx.next();
                    out += `    ` + generateDataSetStructures(false, fileName, `${srcVariable}[${iterator.i}].${type.structName}`, `${objectIdx.toString()}`, type);
                    out += `    napi_set_named_property(env, ${objectIdx.toString(-1)}, "${type.structName}", ${objectIdx.toString()});\n`;
                    objectIdx.prev();
                }
            }
            out += `napi_set_element(env, ${destNapiVar}, ${iterator.i}, ${objectIdx.toString()});\n`;
            out += `}\n`;
        } else {
            out += `    napi_create_object(env, &${objectIdx.toString()});\n`;
            for (let type of types.datasets) {
                if (header.isScalarType(type.dataType, true)) {
                    if (type.arraySize > 0) {
                        objectIdx.next();
                        out += `    ` + generateDataSetStructures(false, fileName, `${srcVariable}.${type.structName}`, `${objectIdx.toString()}`, type);
                        out += `    napi_set_named_property(env, ${objectIdx.toString(-1)}, "${type.structName}", ${objectIdx.toString()});\n`;
                        objectIdx.prev();
                    } else {
                        out += `    napi_set_named_property(env, ${objectIdx.toString()}, "${type.structName}", ${getDefaultValue(type.dataType)});\n`;
                    }
                } else {
                    //subtype detected
                    objectIdx.next();
                    out += `    ` + generateDataSetStructures(false, fileName, `${srcVariable}.${type.structName}`, `${objectIdx.toString()}`, type);
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

function generateInitFunction(fileName, template) {
    let out = "";
    let out1 = "";
    let out2 = "";
    let out3 = "";
    let out_structs = "";

    objectIdx.reset();

    //generate .value object structures
    for (let dataset of template.datasets) {
        out2 = out3 = "";
        if (dataset.isPub) {
            out2 += `    napi_create_function(env, NULL, 0, ${dataset.structName}_onchange_init, NULL, &${dataset.structName}_onchange);\n`;
            out2 += `    napi_set_named_property(env, ${dataset.structName}.value, "onChange", ${dataset.structName}_onchange);\n`;
            out2 += `    napi_set_named_property(env, ${dataset.structName}.value, "netTime", undefined);\n`;
            out2 += `    napi_set_named_property(env, ${dataset.structName}.value, "latency", undefined);\n`;
        }
        if (dataset.isSub) {
            out3 += `    napi_create_function(env, NULL, 0, ${dataset.structName}_publish_method, NULL, &${dataset.structName}_publish);\n`;
            out3 += `    napi_set_named_property(env, ${dataset.structName}.value, "publish", ${dataset.structName}_publish);\n`;
        }
        if (dataset.isPub || dataset.isSub) {
            iterator.reset();
            objectIdx.i = 0;
            out1 = generateDataSetStructures(true, fileName, `exos_data.${dataset.structName}`, `${dataset.structName}_value`, dataset);

            out3 += `    napi_set_named_property(env, ${dataset.structName}.value, "value", ${dataset.structName}_value);\n`;

            out3 += `    napi_create_function(env, NULL, 0, ${dataset.structName}_connonchange_init, NULL, &${dataset.structName}_conn_change);\n`;
            out3 += `    napi_set_named_property(env, ${dataset.structName}.value, "connectionOnChange", ${dataset.structName}_conn_change);\n`;
            out3 += `    napi_set_named_property(env, ${dataset.structName}.value, "connectionState", undefined);\n\n`;

            out_structs += out1 + out2 + out3;
        }
    }

    //prototype    
    out += `// init of module, called at "require"\n`;
    out += `napi_value init_${template.datamodel.varName}(napi_env env, napi_value exports)\n{\n`;

    // declarations
    out += `    napi_value `;
    out += `${template.datamodel.varName}_conn_change,`;
    for (let i = 0; i < template.datasets.length; i++) {
        if (template.datasets[i].isPub || template.datasets[i].isSub) {
            out += ` ${template.datasets[i].structName}_conn_change`;

            if ((i + 1) != template.datasets.length) {
                out += `,`;
            }
        }
    }
    out += `;\n`;

    let atleastone = false;
    for (let i = 0; i < template.datasets.length; i++) {
        if (template.datasets[i].isPub) {
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
        if (template.datasets[i].isSub) {
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
        if (template.datasets[i].isSub || template.datasets[i].isPub) {
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
    out += `    napi_create_string_utf8(env, BUR_NAPI_DEFAULT_STRING_INIT, sizeof(BUR_NAPI_DEFAULT_STRING_INIT), &def_string); \n`;
    out += `    napi_get_undefined(env, &undefined); \n\n`;

    //base objects
    out += `    // create base objects\n`;
    out += `    if (napi_ok != napi_create_object(env, &dataModel)) \n        return NULL; \n\n`;
    out += `    if (napi_ok != napi_create_object(env, &${template.datamodel.varName}.value)) \n        return NULL; \n\n`;
    for (let i = 0; i < template.datasets.length; i++) {
        if (template.datasets[i].isPub || template.datasets[i].isSub) { out += `    if (napi_ok != napi_create_object(env, &${template.datasets[i].structName}.value)) \n        return NULL; \n\n`; }
    }

    // insert build structures
    out += `    // build object structures\n`;
    out += out_structs;

    //bind topics to datamodel
    out += `    // bind dataset objects to datamodel object\n`;
    for (let i = 0; i < template.datasets.length; i++) {
        if (template.datasets[i].isPub || template.datasets[i].isSub) { out += `    napi_set_named_property(env, dataModel, "${template.datasets[i].structName}", ${template.datasets[i].structName}.value); \n`; }
    }
    out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "dataModel", dataModel); \n`;
    out += `    napi_create_function(env, NULL, 0, ${template.datamodel.varName}_connonchange_init, NULL, &${template.datamodel.varName}_conn_change); \n`;
    out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "connectionOnChange", ${template.datamodel.varName}_conn_change); \n`;
    out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "connectionState", undefined);\n`;
    out += `    napi_create_function(env, NULL, 0, get_net_time, NULL, &getNetTime);\n`;
    out += `    napi_set_named_property(env, ${template.datamodel.varName}.value, "netTime", getNetTime);\n`;

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
        if (template.datasets[i].isPub || template.datasets[i].isSub) {
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
    out += `    if (EXOS_ERROR_OK != exos_datamodel_init(&${template.datamodel.varName}_datamodel, "${template.datamodel.structName}", "${template.datamodel.structName}_NodeJS")) \n`;
    out += `    {\n`;
    out += `        napi_throw_error(env, "EINVAL", "Can't initialize ${template.datamodel.structName}"); \n`;
    out += `    } \n`;
    out += `    ${template.datamodel.varName}_datamodel.user_context = NULL; \n`;
    out += `    ${template.datamodel.varName}_datamodel.user_tag = 0; \n\n`;

    for (let i = 0; i < template.datasets.length; i++) {
        if (template.datasets[i].isPub || template.datasets[i].isSub) {
            out += `    if (EXOS_ERROR_OK != exos_dataset_init(&${template.datasets[i].structName}_dataset, &${template.datamodel.varName}_datamodel, "${template.datasets[i].structName}", &exos_data.${template.datasets[i].structName}, sizeof(exos_data.${template.datasets[i].structName}))) \n`;
            out += `    {\n`;
            out += `        napi_throw_error(env, "EINVAL", "Can't initialize ${template.datasets[i].structName}"); \n`;
            out += `    }\n`;
            out += `    ${template.datasets[i].structName}_dataset.user_context = NULL; \n`;
            out += `    ${template.datasets[i].structName}_dataset.user_tag = 0; \n\n`;
        }
    }

    // register the datamodel
    out += `    // exOS register datamodel\n`;
    out += `    if (EXOS_ERROR_OK != exos_datamodel_connect_${template.datamodel.varName}(&${template.datamodel.varName}_datamodel, datamodelEvent)) \n`;
    out += `    {\n`;
    out += `        napi_throw_error(env, "EINVAL", "Can't connect ${template.datamodel.structName}"); \n`;
    out += `    } \n\n`;

    // register datasets
    out += `    // exOS register datasets\n`;
    for (let i = 0; i < template.datasets.length; i++) {
        if (template.datasets[i].isPub || template.datasets[i].isSub) {
            out += `    if (EXOS_ERROR_OK != exos_dataset_connect(&${template.datasets[i].structName}_dataset, `;
            if (template.datasets[i].isPub) {
                out += `EXOS_DATASET_SUBSCRIBE`;
                if (template.datasets[i].isSub) {
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

    out += `    // start up module\n`;
    out += `\n    uv_idle_init(uv_default_loop(), &cyclic_h); \n`;
    out += `    uv_idle_start(&cyclic_h, cyclic); \n\n`;

    out += `    return exports; \n`;

    out += `} \n\n`;

    return out;
}

function generateLibTemplate(fileName, typName) {
    let out = "";

    let template = configTemplate(fileName, typName);

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
    out += `#include "exos_${template.datamodel.varName}.h"\n`;
    out += `#include <uv.h>\n`;
    out += `#include <unistd.h>\n`;
    out += `#include <string.h>\n`;
    out += `\n`;
    out += `#define BUR_NAPI_DEFAULT_BOOL_INIT false\n`;
    out += `#define BUR_NAPI_DEFAULT_NUM_INIT 0\n`;
    out += `#define BUR_NAPI_DEFAULT_STRING_INIT ""\n`;
    out += `\n`;
    out += `typedef struct\n`;
    out += `{\n`;
    out += `    napi_ref ref; \n`;
    out += `    uint32_t ref_count; \n`;
    out += `    napi_threadsafe_function onchange_cb; \n`;
    out += `    napi_threadsafe_function connectiononchange_cb; \n`;
    out += `    napi_value object_value; //volatile placeholder.\n`;
    out += `    napi_value value;        //volatile placeholder.\n`;
    out += `} obj_handles;\n`;
    out += `\n`;
    out += `obj_handles ${template.datamodel.varName} = {};\n`;
    for (let dataset of template.datasets) {
        if (dataset.isPub || dataset.isSub) { out += `obj_handles ${dataset.structName} = {};\n`; }
    }
    out += `\n`;
    out += `napi_deferred deferred = NULL;\n`;
    out += `uv_idle_t cyclic_h;\n`;
    out += `\n`;
    out += `${template.datamodel.dataType} exos_data = {};\n`;
    out += `exos_datamodel_handle_t ${template.datamodel.varName}_datamodel;\n`;
    for (let dataset of template.datasets) {
        if (dataset.isPub || dataset.isSub) { out += `exos_dataset_handle_t ${dataset.structName}_dataset;\n`; }
    }
    out += `\n`;

    out += generateExosCallbacks(template);

    out += generateNApiCBinitMMain();

    out += generateConnectionCallbacks(template);

    out += generateValueCallbacks(fileName, template);

    out += generateCallbackInits(template);

    out += generateValuesPublishMethods(fileName, template);

    out += generateCleanUpHookCyclic(template);

    out += generateInitFunction(fileName, template);

    out += `// hook for Node-API\n`;
    out += `NAPI_MODULE(NODE_GYP_MODULE_NAME, init_${template.datamodel.varName});\n`;

    return out;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//END lib____.c file generator functions basically in order of call from configtemplate() (and in lib____.c file order)
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function generateJSmodule(fileName, typName) {
    let out = "";

    let template = configTemplate(fileName, typName);

    out += `var binding = require("./l_${template.datamodel.structName}.node");\n\n`;

    out += `module.exports = binding.${template.datamodel.structName};\n`;

    return out;
}

function generateIndexJS(fileName, typName) {
    let out = "";

    let template = configTemplate(fileName, typName);

    out += `let ${template.datamodel.structName} = require('./${template.datamodel.varName}.js');\n\n`;

    out += `//connection callbacks\n`;
    out += `${template.datamodel.structName}.connectionOnChange(() => {\n`;
    out += `    //${template.datamodel.structName}.connectionState.....;\n`;
    out += `});\n`;
    for (let i = 0; i < template.datasets.length; i++) {
        if (template.datasets[i].isPub || template.datasets[i].isSub) {
            out += `${template.datamodel.structName}.dataModel.${template.datasets[i].structName}.connectionOnChange(() => {\n`;
            out += `    //${template.datamodel.structName}.dataModel.${template.datasets[i].structName}.connectionState ...\n`;
            out += `});\n`;
        }
    }

    out += `\n`;

    out += `//value callbacks\n`;
    for (let i = 0; i < template.datasets.length; i++) {
        if (template.datasets[i].isPub) {
            out += `${template.datamodel.structName}.dataModel.${template.datasets[i].structName}.onChange(() => {\n`;
            out += `    //${template.datamodel.structName}.dataModel.${template.datasets[i].structName}.value..\n`;
            out += `});\n`;
        }
    }

    out += `\n`;

    out += `//publishing of values\n`;
    out += `if (1 === 0) {\n`;
    for (let i = 0; i < template.datasets.length; i++) {
        if (template.datasets[i].isSub) {
            out += `    //${template.datamodel.structName}.dataModel.${template.datasets[i].structName}.value..\n`;
            out += `    ${template.datamodel.structName}.dataModel.${template.datasets[i].structName}.publish();\n`;
        }
    }
    out += `}\n\n`;

    out += `/*
All values in ${template.datamodel.structName}.dataModel that has a .onChange() callback will
have the corresponding "netTime" and "latency" datas. These are initialized to "undefined" until
the first data have arrived via the call to .onchange().

- "latency" describes the time it took ´for the data to be transmitted from Automation Runtime 
  (real time OS) to this application.
- "netTime" describes the local timestamp (CLOCK_MONOTONIC) when the last data arrived to this 
  application.

To check the current time, call the ${template.datamodel.structName}.netTime() method that 
returns current netTime.

Note that ALL netTime and latency values are created from int32_t datatype and the wrapping of
these values are not considered/handled in the imported module.
*/\n`;

    out += `setInterval(() => {\n`;
    out += `    //console.log("current netTime is: " + ${template.datamodel.structName}.netTime().toString());\n`;
    out += `}, 2000);\n`;


    return out;
}

function generatePackageLockJSON(fileName, typName) {
    let out = "";

    let template = configTemplate(fileName, typName);

    out += `{\n`;
    out += `    "name": "${template.datamodel.varName}",\n`;
    out += `    "version": "1.0.0",\n`;
    out += `    "lockfileVersion": 1\n`;
    out += `}\n`;

    return out;
}

function generatePackageJSON(fileName, typName) {
    let out = "";

    let template = configTemplate(fileName, typName);

    out += `{\n`;
    out += `  "name": "${template.datamodel.varName}",\n`;
    out += `  "version": "1.0.0",\n`;
    out += `  "description": "implementation of exOS data exchange defined by datatype ${template.datamodel.structName} from file ${path.basename(fileName)}",\n`;
    out += `  "main": "index.js",\n`;
    out += `  "scripts": {\n`;
    out += `    "start": "node index.js"\n`;
    out += `  },\n`;
    out += `  "author": "your name",\n`;
    out += `  "license": "MIT"\n`;
    out += `}\n`;

    return out;
}

function configTemplate(fileName, typName) {
    var template = {
        headerName: "",
        datamodel: {
            structName: "",
            varName: "",
            dataType: "",
            comment: ""
        },
        datasets: [],
        logname: ""
    }

    if (fs.existsSync(fileName)) {

        var types = header.parseTypFile(fileName, typName);

        template.logname = "logger";
        template.headerName = `exos_${types.attributes.dataType.toLowerCase()}.h`

        template.datamodel.dataType = types.attributes.dataType;
        template.datamodel.structName = types.attributes.dataType;
        //check if toLowerCase is equal to datatype name, then extend it with _datamodel
        if (types.attributes.dataType == types.attributes.dataType.toLowerCase()) {
            template.datamodel.varName = types.attributes.dataType.toLowerCase() + "_datamodel";
        }
        else {
            template.datamodel.varName = types.attributes.dataType.toLowerCase();
        }

        for (let child of types.children) {
            let object = {};
            object["structName"] = child.attributes.name;
            object["varName"] = child.attributes.name.toLowerCase() + (child.attributes.name == child.attributes.name.toLowerCase() ? "_dataset" : "");
            object["dataType"] = child.attributes.dataType;
            if (typeof child.attributes.arraySize === "number") {
                object["arraySize"] = child.attributes.arraySize;
            } else {
                object["arraySize"] = 0;
            }
            object["comment"] = child.attributes.comment;
            if (typeof child.attributes.comment === "string") {
                object["isPub"] = child.attributes.comment.includes("PUB");
                object["isSub"] = child.attributes.comment.includes("SUB");
                object["isPrivate"] = child.attributes.comment.includes("private");
            } else {
                object["comment"] = "";
                object["isPub"] = false;
                object["isSub"] = false;
                object["isPrivate"] = false;
            }
            if (child.attributes.hasOwnProperty("stringLength")) { object["stringLength"] = child.attributes.stringLength; }
            template.datasets.push(object);
        }
    } else {
        throw (`file '${fileName}' not found.`);
    }

    return template;
}

if (require.main === module) {
    if (process.argv.length > 3) {
        let outPath = process.argv[4];
        if (outPath == "" || outPath == undefined) {
            outPath = ".";
        }
        let fileName = process.argv[2];
        let structName = process.argv[3];

        try {
            let out = generateTemplate(fileName, structName);
            fs.writeFileSync(`${outPath}/exos_template_${structName.toLowerCase()}_linux.c`, out);
            process.stdout.write(`${outPath}/exos_template_${structName.toLowerCase()}_linux.c generated`);
        } catch (error) {
            process.stderr.write(error);
        }
    }
    else {
        process.stderr.write(" - usage: ./exos_template_linux.js <filename.typ> <structname> <template output folder>\n");
    }
}

module.exports = {
    generateExosPkg,
    generateLinuxPackage,
    generateGyp,
    generateLibTemplate,
    generateJSmodule,
    generateIndexJS,
    generateShBuild,
    generatePackageJSON,
    generatePackageLockJSON,
    generateCMakeLists
}
