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

function generateFun(fileName, typName) {

    let template = configTemplate(fileName, typName);
    let out = "";

    out += `FUNCTION_BLOCK ${template.datamodel.structName}Cyclic\n`;
    out += `	VAR_INPUT\n`;
    out += `		Enable : BOOL;\n`;
    out += `		Start : BOOL;\n`;
    out += `        ${template.datamodel.varName} : REFERENCE TO ${typName};`;
    out += `	END_VAR\n`;
    out += `	VAR_OUTPUT\n`;
    out += `		Connected : BOOL;\n`;
    out += `		Operational : BOOL;\n`;
    out += `		Error : BOOL;\n`;
    out += `	END_VAR\n`;
    out += `	VAR\n`;
    out += `		_Handle : UDINT;\n`;
    out += `		_Start : BOOL;\n`;
    out += `		_Enable : BOOL;\n`;
    out += `	END_VAR\n`;
    out += `END_FUNCTION_BLOCK\n`;
    out += `\n`;

    return out;
}

function generatePackage(typName, libName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio Version=4.9.1.69?>\n`;
    out += `<Package SubType="exosPackage" PackageType="exosPackage" xmlns="http://br-automation.co.at/AS/Package">\n`;
    out += `  <Objects>\n`;
    out += `    <Object Type="File">${typName}.exospkg</Object>\n`;
    out += `    <Object Type="Program" Language="IEC">${libName}_0</Object>\n`;
    out += `    <Object Type="Library" Language="ANSIC">${libName}</Object>\n`;
    out += `    <Object Type="Package">Linux</Object>\n`;
    out += `  </Objects>\n`;
    out += `</Package>\n`;

    return out;
}

function generateIECProgram(typName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio Version=4.9.1.69?>\n`;
    out += `<Program SubType="IEC" xmlns="http://br-automation.co.at/AS/Program">\n`;
    out += `  <Files>\n`;
    out += `    <File Description="Init, cyclic, exit code">${typName}.st</File>\n`;
    out += `    <File Description="Local variables" Private="true">${typName}.var</File>\n`;
    out += `  </Files>\n`;
    out += `</Program>\n`;

    return out;
}

function generateIECProgramVar(typName) {
    let out = "";

    out += `VAR\n`;
    out += `    ${typName.toLowerCase()} : ${typName};\n`;
    out += `    ${typName}Cyclic_0 : ${typName}Cyclic;\n`;
    out += `END_VAR\n`;

    return out;
}

function generateIECProgramST(typName) {
    let out = "";

    out += `\n`;
    out += `PROGRAM _INIT\n`;
    out += `\n`;
    out += `END_PROGRAM\n`;
    out += `\n`;
    out += `PROGRAM _CYCLIC\n`;
    out += `\n`;
    out += `    ${typName}Cyclic_0.${typName.toLowerCase()} := ADR(${typName.toLowerCase()});\n`;
    out += `    ${typName}Cyclic_0();\n`;
    out += `\n`;
    out += `END_PROGRAM\n`;
    out += `\n`;
    out += `PROGRAM _EXIT\n`;
    out += `\n`;
    out += `    ${typName}Cyclic_0.Enable := FALSE;\n`;
    out += `    ${typName}Cyclic_0();\n`;
    out += `\n`;
    out += `END_PROGRAM\n`;

    return out;
}

function generateCLibrary(fileName, typName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio Version=4.6.3.55 SP?>\n`;
    out += `<Library SubType="ANSIC" xmlns="http://br-automation.co.at/AS/Library">\n`;
    out += `  <Files>\n`;
    out += `    <File Description="Main">main.c</File>\n`;
    out += `    <File Description="Data Model Definition">${fileName}</File>\n`;
    out += `    <File Description="Exported functions and function blocks">${typName.substring(0, 10)}.fun</File>\n`;
    out += `    <File Description="Generated exos headerfile">exos_${typName.toLowerCase()}.h</File>\n`;
    out += `    <File Description="Header file">lib${typName.toLowerCase()}.h</File>\n`;
    out += `    <File Description="Implementation">lib${typName.toLowerCase()}.c</File>\n`;
    out += `    <File Description="Enable dynamic heap">dynamic_heap.cpp</File>\n`;
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
    }
    else {
        throw(`file '${fileName}' not found.`);
    }
    return template;
}

module.exports = {
    generatePackage,
    generateCLibrary,
    checkVarNames,
    generateIECProgram,
    generateIECProgramVar,
    generateIECProgramST,
    configTemplate,
    generateFun
}