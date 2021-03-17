#!/usr/bin/env node

const fs = require('fs')
const header = require('../exos_header');
const ar = require('../template/ar');
const template_lib = require('./c_static_lib_template');
const template_linux = require('./template_linux');
const template_ar = require('./template_ar');
const path = require('path');

function generateTemplate(fileName, structName, outPath) {

    let libName = structName.substring(0, 10);

    if (fs.existsSync(`${outPath}/${structName}`)) {
        throw(`folder ${outPath}/${structName} already exists, choose another output folder`);
    }

    template_ar.checkVarNames(fileName,structName);

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

    // //AS files
    out = template_ar.generatePackage(structName,libName);
    fs.writeFileSync(`${outPath}/${structName}/Package.pkg`, out);

    out = ar.generateGitAttributes();
    fs.writeFileSync(`${outPath}/${structName}/.gitattributes`, out);
    
    out = ar.generateGitIgnore(null);
    fs.writeFileSync(`${outPath}/${structName}/.gitignore`, out);

    out = template_linux.generateExosPkg(structName,libName,path.basename(fileName));
    fs.writeFileSync(`${outPath}/${structName}/${structName}.exospkg`, out);

    out = template_ar.generateCLibrary(path.basename(fileName), structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/ANSIC.lby`, out);

    out = template_lib.genenerateLibHeader(fileName, structName, false);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/lib${structName.toLowerCase()}.h`, out);

    out = template_lib.generateTemplate(fileName, structName, false, `${structName}_AR`);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/lib${structName.toLowerCase()}.c`, out);

    out = template_ar.generateIECProgram(libName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}_0/IEC.prg`, out);
    
    out = template_ar.generateIECProgramVar(structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}_0/${libName}.var`, out);
    
    out = template_ar.generateIECProgramST(structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}_0/${libName}.st`, out);

    out = template_ar.generateFun(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${libName}.fun`, out);

    fs.writeFileSync(`${outPath}/${structName}/${libName}/dynamic_heap.cpp`, "unsigned long bur_heap_size = 100000;\n");
    
    // copy the .typ file to the Library
    fs.copyFileSync(fileName, `${outPath}/${structName}/${libName}/${path.basename(fileName)}`);

    out = template_lib.generateMainAR(fileName, structName, libName, false);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/main.c`, out);

    //Linux Files
    out = template_lib.genenerateLibHeader(fileName, structName, true);
    fs.writeFileSync(`${outPath}/${structName}/Linux/lib${structName.toLowerCase()}.h`, out);
    
    out = template_lib.generateTemplate(fileName, structName, true, `${structName}_Linux`);
    fs.writeFileSync(`${outPath}/${structName}/Linux/lib${structName.toLowerCase()}.c`, out);

    out = template_linux.generateLinuxPackage(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/Package.pkg`, out);

    out = template_linux.generateShBuild();
    fs.writeFileSync(`${outPath}/${structName}/Linux/build.sh`, out);

    out = template_linux.generateCMakeLists(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/CMakeLists.txt`, out);
    
    out = template_linux.generateTerminationHeader();
    fs.writeFileSync(`${outPath}/${structName}/Linux/termination.h`, out);

    out = template_linux.generateTermination();
    fs.writeFileSync(`${outPath}/${structName}/Linux/termination.c`, out);
    
    out = template_lib.generateMain(fileName, structName, true);
    fs.writeFileSync(`${outPath}/${structName}/Linux/main.c`, out);

}

module.exports = {
    generateTemplate
}