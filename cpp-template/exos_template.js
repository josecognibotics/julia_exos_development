#!/usr/bin/env node

const fs = require('fs')
const header = require('../exos_header');
const ar = require('../template/ar');
const template_linux = require('./exos_template_linux');
const template_ar = require('../c-template/exos_template_ar');
const template_cpp = require('./exos_template_cpp.js');
const path = require('path');

function generateTemplate(fileName, structName, outPath) {

    let libName = structName.substring(0, 10);

    if (fs.existsSync(`${outPath}/${structName}`)) {
        throw(`folder ${outPath}/${structName} already exists, choose another output folder`);
    }

    //AS dirs
    fs.mkdirSync(`${outPath}/${structName}`);
    fs.mkdirSync(`${outPath}/${structName}/${libName}`);
    fs.mkdirSync(`${outPath}/${structName}/${libName}_0`);

    //Linux dir
    fs.mkdirSync(`${outPath}/${structName}/Linux`);
    
    //headers
    let out = header.generateHeader(fileName, structName, [`${libName}.h`]);
    //AS header
    fs.writeFileSync(`${outPath}/${structName}/${libName}/exos_${structName.toLowerCase()}.h`, out);
    //Linux header
    fs.writeFileSync(`${outPath}/${structName}/Linux/exos_${structName.toLowerCase()}.h`, out);

    //AS files
    out = template_ar.generatePackage(structName, libName);
    fs.writeFileSync(`${outPath}/${structName}/Package.pkg`, out);

    out = ar.generateGitAttributes();
    fs.writeFileSync(`${outPath}/${structName}/.gitattributes`, out);

    out = ar.generateGitIgnore(null);
    fs.writeFileSync(`${outPath}/${structName}/.gitignore`, out);

    out = template_linux.generateExosPkg(structName, libName, path.basename(fileName));
    fs.writeFileSync(`${outPath}/${structName}/${structName}.exospkg`, out);

    
    // ST Program
    out = template_cpp.generateIECProgram(libName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}_0/IEC.prg`, out);
    
    out = template_cpp.generateIECProgramVar(structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}_0/${libName}.var`, out);
    
    out = template_cpp.generateIECProgramST(structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}_0/${libName}.st`, out);

    // C++ library
    out = template_cpp.generateCLibrary(path.basename(fileName), structName, libName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/ANSIC.lby`, out);

    fs.writeFileSync(`${outPath}/${structName}/${libName}/dynamic_heap.cpp`, "unsigned long bur_heap_size = 100000;\n");
    
    // copy the .typ file to the Library
    fs.copyFileSync(fileName, `${outPath}/${structName}/${libName}/${path.basename(fileName)}`);

    out = template_cpp.generateFun(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${libName}.fun`, out);

    out = template_cpp.generateExosDataModelCpp(fileName, structName, structName + "_AR", false);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/ExosDataModel.cpp`, out);

    out = template_cpp.generateExosDataModelHeader(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/ExosDataModel.h`, out);

    out = template_cpp.generateExosDataSetHeader(structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/ExosDataSet.h`, out);

    out = template_cpp.generateMainAR(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/main.cpp`, out);


    //Linux Files
    out = template_linux.generateLinuxPackage(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/Package.pkg`, out);

    out = template_linux.generateShBuild();
    fs.writeFileSync(`${outPath}/${structName}/Linux/build.sh`, out);

    out = template_linux.generateCMakeLists(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/CMakeLists.txt`, out);

    out = template_cpp.generateExosDataModelCpp(fileName, structName, structName + "_Linux", true);
    fs.writeFileSync(`${outPath}/${structName}/Linux/ExosDataModel.cpp`, out);

    out = template_cpp.generateExosDataModelHeader(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/ExosDataModel.h`, out);

    out = template_cpp.generateExosDataSetHeader(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/ExosDataSet.h`, out);

    out = template_cpp.generateMainLinux(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/main.cpp`, out);
}

module.exports = {
    generateTemplate
}