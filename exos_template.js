#!/usr/bin/env node

const fs = require('fs')
const header = require('./exos_header');
const template_ar = require('./exos_template_ar');
const template_linux = require('./exos_template_linux');
const path = require('path');


function generateTemplate(fileName, structName, outPath) {

    let libName = structName.substring(0, 10);

    if (fs.existsSync(`${outPath}/${structName}`)) {
        throw(`folder ${outPath}/${structName} already exists, choose another output folder`);
    }

    fs.mkdirSync(`${outPath}/${structName}`);
    fs.mkdirSync(`${outPath}/${structName}/linux`);
    fs.mkdirSync(`${outPath}/${structName}/ar`);
    fs.mkdirSync(`${outPath}/${structName}/ar/${libName}`);

    let out = header.generateHeader(fileName, structName);

    fs.writeFileSync(`${outPath}/${structName}/linux/exos_${structName.toLowerCase()}.h`, out);
    fs.writeFileSync(`${outPath}/${structName}/ar/${libName}/exos_${structName.toLowerCase()}.h`, out);

    out = template_linux.generateTemplate(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/linux/${structName.toLowerCase()}.c`, out);

    out = template_linux.generateTerminationHeader();
    fs.writeFileSync(`${outPath}/${structName}/linux/termination.h`, out);

    out = template_linux.generateTermination();
    fs.writeFileSync(`${outPath}/${structName}/linux/termination.c`, out);

    out = template_linux.generateCMakeLists(structName);
    fs.writeFileSync(`${outPath}/${structName}/linux/CMakeLists.txt`, out);

    out = template_ar.generateTemplate(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/ar/${libName}/${structName.toLowerCase()}.c`, out);

    out = template_ar.generateFun(structName);
    fs.writeFileSync(`${outPath}/${structName}/ar/${libName}/${libName}.fun`, out);

    out = template_ar.generateCLibrary(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/ar/${libName}/ANSIC.lby`, out);

    fs.writeFileSync(`${outPath}/${structName}/ar/${libName}/dynamic_heap.cpp`, "unsigned long bur_heap_size = 100000;\n");

    fs.copyFileSync(fileName, `${outPath}/${structName}/ar/${libName}/${path.basename(fileName)}`);
}

if (require.main === module) {

    if (process.argv.length > 3) {
        outPath = process.argv[4];
        if (outPath == "" || outPath == undefined) {
            outPath = ".";
        }
        let fileName = process.argv[2];
        let structName = process.argv[3];
        
        try {
            generateTemplate(fileName, structName, outPath);    
            process.stdout.write(`exos_template ${structName} generated at ${outPath}`);
        } catch (error) {
            process.stderr.write(error);    
        }
    }
    else {
        process.stderr.write("usage: ./exos_template.js <filename.typ> <structname> <template output folder>\n");
    }
}

module.exports = {
    generateTemplate
}