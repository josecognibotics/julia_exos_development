#!/usr/bin/env node

const header = require('../exos_header');
const fs = require('fs');
const { features } = require('process');


function checkVarNames(fileName, typName) {
    let out = "";

    if (fs.existsSync(fileName)) {

        let types = header.parseTypFile(fileName, typName);

        for (let child of types.children) {
            if (child.attributes.comment.includes("SUB") || child.attributes.comment.includes("PUB")) {
                switch (child.attributes.name) {
                    case "Enable": 
                    case "_Enable": 
                        throw(`Member name ${child.attributes.name} is not allowed as a PUB/SUB dataset. Keyword is in use`);
                }
            }
        }
    }
}

function generatePackage(typName, libName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio Version=4.9.1.69?>\n`;
    out += `<Package SubType="exosPackage" PackageType="exosPackage" xmlns="http://br-automation.co.at/AS/Package">\n`;
    out += `  <Objects>\n`;
    out += `    <Object Type="File">${typName}.exospkg</Object>\n`;
    out += `    <Object Type="Program" Language="ANSIC">${libName}</Object>\n`;
    out += `    <Object Type="Library" Language="ANSIC">lib${libName}</Object>\n`;
    out += `    <Object Type="Package">Linux</Object>\n`;
    out += `  </Objects>\n`;
    out += `</Package>\n`;

    return out;
}

function generateCProgram(fileName, typName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio Version=4.9.1.69?>\n`;
    out += `<Program SubType="ANSIC" xmlns="http://br-automation.co.at/AS/Program">\n`;
    out += `  <Files>\n`;
    out += `    <File Description="Init, cyclic, exit code">main.c</File>\n`;
    out += `    <File Description="Enable dynamic heap">dynamic_heap.cpp</File>\n`;
    out += `    <File Description="Data Model Definition">${fileName}</File>\n`;
    out += `    <File Description="Local variables" Private="true">Variables.var</File>\n`;
    out += `  </Files>\n`;
    out += `</Program>\n`;

    return out;
}

function generateCProgramVar(fileName, typName) {
    let out = "";

    let template = configTemplate(fileName, typName);

    out += `VAR\n`;
    out += `    Enable : BOOL;\n`;
    out += `    _Enable : BOOL;\n`;
    out += `    Connected : BOOL;\n`;
    for (let dataset of template.datasets) {
        if (!dataset.comment.includes("private")) {
            let dataType = dataset.dataType;
            if(dataset.arraySize > 0) {
                dataType = `ARRAY[0..${dataset.arraySize-1}] OF ${dataset.dataType}`
            }
            if (dataset.comment.includes("SUB") || dataset.comment.includes("PUB")) {
                out += `    ${dataset.structName} : ${dataType};\n`;
            }
        }
    }
    out += `END_VAR\n`;

    return out;
}


function generateCLibrary(typName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio Version=4.6.3.55 SP?>\n`;
    out += `<Library SubType="ANSIC" xmlns="http://br-automation.co.at/AS/Library">\n`;
    out += `  <Files>\n`;
    out += `    <File Description="Generated exos headerfile">exos_${typName.toLowerCase()}.h</File>\n`;
    out += `    <File Description="Header file">lib${typName.toLowerCase()}.h</File>\n`;
    out += `    <File Description="Implementation">lib${typName.toLowerCase()}.c</File>\n`;
    out += `  </Files>\n`;
    out += `  <Dependencies>\n`;
    out += `    <Dependency ObjectName="ExApi" />\n`;
    out += `  </Dependencies>\n`;
    out += `</Library>\n`;

    return out;
}

function configTemplate(fileName, typName) {

    let template = {
        headerName: "",
        handle: {
            dataType: "",
            name: "",
        },
        datamodel: {
            structName: "",
            varName: "",
            dataType: "",
            comment: ""
        },
        datasets: [],
        logname: ""
    };

    if (fs.existsSync(fileName)) {

        let types = header.parseTypFile(fileName, typName);

        template.logname = "logger";
        template.headerName = `exos_${types.attributes.dataType.toLowerCase()}.h`
        template.handle.dataType = `${types.attributes.dataType}Handle_t`;
        template.handle.name = "handle";

        template.datamodel.dataType = types.attributes.dataType;
        template.datamodel.structName = types.attributes.dataType;
        //check if toLowerCase is equal to datatype name, then extend it with _datamodel
        if (types.attributes.dataType == types.attributes.dataType.toLowerCase()) {
            template.datamodel.varName = types.attributes.dataType.toLowerCase() + "_datamodel";
        }
        else {
            template.datamodel.varName = types.attributes.dataType.toLowerCase();
        }

        //check if toLowerCase is same as struct name, then extend it with _dataset
        for (let child of types.children) {
            if (child.attributes.name == child.attributes.name.toLowerCase()) {
                let object = {}
                object["structName"] = child.attributes.name;
                object["varName"] = child.attributes.name.toLowerCase() + "_dataset";
                object["dataType"] = child.attributes.dataType;
                object["arraySize"] = child.attributes.arraySize;
                object["comment"] = child.attributes.comment;
                if (child.attributes.hasOwnProperty("stringLength")) { object["stringLength"] = child.attributes.stringLength; }
                template.datasets.push(object);
                ;
            }
            else {
                let object = {}
                object["structName"] = child.attributes.name;
                object["varName"] = child.attributes.name.toLowerCase();
                object["dataType"] = child.attributes.dataType;
                object["arraySize"] = child.attributes.arraySize;
                object["comment"] = child.attributes.comment;
                if (child.attributes.hasOwnProperty("stringLength")) { object["stringLength"] = child.attributes.stringLength; }
                template.datasets.push(object);
                ;
            }
        }

        // initialize non-string comments to "" and missing arraysizes to 0
        for (let dataset of template.datasets) {
            if (typeof dataset.comment !== 'string') {
                dataset.comment = "";
            }
            if (typeof dataset.arraySize !== 'number') {
                dataset.arraySize = 0;
            }
        }
    }
    else {
        throw(`file '${fileName}' not found.`);
    }
    return template;
}

module.exports = {
    generatePackage,
    generateCProgram,
    generateCProgramVar,
    generateCLibrary,
    checkVarNames
}