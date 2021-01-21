#!/usr/bin/env node

const fs = require('fs')
const header = require('../exos_header');
const template_ar = require('./exos_template_ar');
const template_linux = require('./exos_template_linux');
const path = require('path');

function generateTemplate(fileName, structName, outPath) {

    let libName = structName.substring(0, 10);

    template_ar.checkVarNames(fileName, structName);

    if (fs.existsSync(`${outPath}/${structName}`)) {
        throw(`folder ${outPath}/${structName} already exists, choose another output folder`);
    }

    //AS dirs
    fs.mkdirSync(`${outPath}/${structName}`);
    fs.mkdirSync(`${outPath}/${structName}/${libName}`);
    fs.mkdirSync(`${outPath}/${structName}/${libName}_0`);

    //Linux dir
    fs.mkdirSync(`${outPath}/${structName}/Linux`);
    fs.mkdirSync(`${outPath}/${structName}/Linux/build`);
    
    //headers
    let out = header.generateHeader(fileName, structName);
    //AS header
    fs.writeFileSync(`${outPath}/${structName}/${libName}/exos_${structName.toLowerCase()}.h`, out);
    //Linux header
    fs.writeFileSync(`${outPath}/${structName}/Linux/exos_${structName.toLowerCase()}.h`, out);

    //AS files
    out = template_ar.generatePackage(structName,libName);
    fs.writeFileSync(`${outPath}/${structName}/Package.pkg`, out);

    out = template_linux.generateExosPkg(structName,libName,path.basename(fileName));
    fs.writeFileSync(`${outPath}/${structName}/${structName}.exospkg`, out);
    
    out = template_ar.generateIECProgram(libName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}_0/IEC.prg`, out);
    
    out = template_ar.generateIECProgramVar(libName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}_0/${libName}.var`, out);
    
    out = template_ar.generateIECProgramST(libName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}_0/${libName}.st`, out);

    out = template_ar.generateTemplate(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName.toLowerCase()}.c`, out);

    out = template_ar.generateFun(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${libName}.fun`, out);

    out = template_ar.generateCLibrary(path.basename(fileName), structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/ANSIC.lby`, out);

    fs.writeFileSync(`${outPath}/${structName}/${libName}/dynamic_heap.cpp`, "unsigned long bur_heap_size = 100000;\n");
    // copy the .typ file to the Library
    fs.copyFileSync(fileName, `${outPath}/${structName}/${libName}/${path.basename(fileName)}`);

    //Linux Files
    out = template_linux.generateLinuxPackage(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/Package.pkg`, out);

    out = template_linux.generateShBuild();
    fs.writeFileSync(`${outPath}/${structName}/Linux/build.sh`, out);

    out = template_linux.generateCMakeLists(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/CMakeLists.txt`, out);
    
    out = template_linux.generateTemplate(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName.toLowerCase()}.c`, out);

    out = template_linux.generateTerminationHeader();
    fs.writeFileSync(`${outPath}/${structName}/Linux/termination.h`, out);

    out = template_linux.generateTermination();
    fs.writeFileSync(`${outPath}/${structName}/Linux/termination.c`, out);

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