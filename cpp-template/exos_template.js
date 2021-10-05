#!/usr/bin/env node

const fs = require('fs')
const header = require('../exos_header');
const ar = require('../template/ar');
const template_linux = require('./exos_template_linux');
const template_ar = require('../c-template/exos_template_ar');
const template_cpp = require('./exos_template_cpp.js');
const path = require('path');
var parse = require('../node_modules/xml-parser');

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
    let out = header.generateDatamodel(fileName, structName, [`${libName}.h`]);
    //AS header and c file
    fs.writeFileSync(`${outPath}/${structName}/${libName}/exos_${structName.toLowerCase()}.h`, out[0]);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/exos_${structName.toLowerCase()}.c`, out[1]);
    //Linux header and c file
    fs.writeFileSync(`${outPath}/${structName}/Linux/exos_${structName.toLowerCase()}.h`, out[0]);
    fs.writeFileSync(`${outPath}/${structName}/Linux/exos_${structName.toLowerCase()}.c`, out[1]);

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

    out = template_cpp.generateExosLoggerCpp(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName}Logger.cpp`, out);

    out = template_cpp.generateExosLoggerHeader(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName}Logger.h`, out);

    out = template_cpp.generateExosDataModelCpp(fileName, structName, structName + "_0", false);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName}DataModel.cpp`, out);

    out = template_cpp.generateExosDataModelHeader(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName}DataModel.h`, out);

    out = template_cpp.generateExosDataSetHeader(structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName}DataSet.h`, out);

    out = template_cpp.generateMainAR(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/main.cpp`, out);


    //Linux Files
    out = template_linux.generateLinuxPackage(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/Package.pkg`, out);

    out = template_linux.generateShBuild();
    fs.writeFileSync(`${outPath}/${structName}/Linux/build.sh`, out);

    out = template_linux.generateCMakeLists(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/CMakeLists.txt`, out);
    
    out = template_cpp.generateExosLoggerCpp(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName}Logger.cpp`, out);

    out = template_cpp.generateExosLoggerHeader(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName}Logger.h`, out);

    out = template_cpp.generateExosDataModelCpp(fileName, structName, structName + "_0", true);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName}DataModel.cpp`, out);

    out = template_cpp.generateExosDataModelHeader(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName}DataModel.h`, out);

    out = template_cpp.generateExosDataSetHeader(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName}DataSet.h`, out);

    out = template_cpp.generateMainLinux(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/main.cpp`, out);
}

function updateTemplate(fileName) {

    var xml = fs.readFileSync(fileName).toString();
    
    try {
        var obj = parse(xml);
    } catch {
        throw('Error: could not parse .exospkg file');
    }
    
    let typFile = "";
    let structName = ""; 
    let libName = "";
    let outPath = "";

    for(let child of obj.root.children) {
        if(child.name == "Build") {
            for(let build of child.children) {
                if(build.name == "GenerateDatamodel") {
                    if(build.attributes["FileName"]!= null && build.attributes["TypeName"]!=null) {
                        typFile = path.join(path.dirname(fileName), build.attributes["FileName"].replace(/\\/g, '/'));
                        structName = build.attributes["TypeName"];
                        libName = structName.substring(0, 10);
                        outPath = path.dirname(path.dirname(fileName));
                        break;
                    }
                    break;
                }
            }
            break;
        }
    }

    //check that we have all we need
    if(libName == "") throw(`GenerateDatamodel section not found in .exospkg file!`);

    if(!fs.existsSync(typFile)) throw(`Typ source file ${typFile} not found`);

    if(!fs.existsSync(`${path.dirname(fileName)}/${libName}/${structName}Logger.cpp`)) throw(`${path.dirname(fileName)}/${libName}/${structName}Logger.cpp does not exist!`);
    if(!fs.existsSync(`${path.dirname(fileName)}/${libName}/${structName}Logger.h`)) throw(`${path.dirname(fileName)}/${libName}/${structName}Logger.h does not exist!`);
    if(!fs.existsSync(`${path.dirname(fileName)}/${libName}/${structName}DataModel.cpp`)) throw(`${path.dirname(fileName)}/${libName}/${structName}DataModel.cpp does not exist!`);
    if(!fs.existsSync(`${path.dirname(fileName)}/${libName}/${structName}DataModel.h`)) throw(`${path.dirname(fileName)}/${libName}/${structName}DataModel.h does not exist!`);
    if(!fs.existsSync(`${path.dirname(fileName)}/${libName}/${structName}DataSet.h`)) throw(`${path.dirname(fileName)}/${libName}/${structName}DataSet.h does not exist!`);
    if(!fs.existsSync(`${path.dirname(fileName)}/Linux/${structName}Logger.cpp`)) throw(`${path.dirname(fileName)}/Linux/${structName}Logger.cpp does not exist!`);
    if(!fs.existsSync(`${path.dirname(fileName)}/Linux/${structName}Logger.h`)) throw(`${path.dirname(fileName)}/Linux/${structName}Logger.h does not exist!`);
    if(!fs.existsSync(`${path.dirname(fileName)}/Linux/${structName}DataModel.cpp`)) throw(`${path.dirname(fileName)}/Linux/${structName}DataModel.cpp does not exist!`);
    if(!fs.existsSync(`${path.dirname(fileName)}/Linux/${structName}DataModel.h`)) throw(`${path.dirname(fileName)}/Linux/${structName}DataModel.h does not exist!`);
    if(!fs.existsSync(`${path.dirname(fileName)}/Linux/${structName}DataSet.h`)) throw(`${path.dirname(fileName)}/Linux/${structName}DataSet.h does not exist!`);
    if(!fs.existsSync(path.join(outPath, structName, libName, `exos_${structName.toLowerCase()}.h`))) throw(`${path.join(outPath, structName, libName, `exos_${structName.toLowerCase()}.h`)} does not exist!`);
    if(!fs.existsSync(path.join(outPath, structName, 'Linux', `exos_${structName.toLowerCase()}.h`))) throw(`${path.join(outPath, structName, 'Linux', `exos_${structName.toLowerCase()}.h`)} does not exist!`);

    //ok were good to go, regenerate
    let out = "";

    //headers
    out = header.generateDatamodel(typFile, structName, [`${libName}.h`]);
    //AS header and c file
    fs.writeFileSync(`${outPath}/${structName}/${libName}/exos_${structName.toLowerCase()}.h`, out[0]);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/exos_${structName.toLowerCase()}.c`, out[1]);
    //Linux header and c file
    fs.writeFileSync(`${outPath}/${structName}/Linux/exos_${structName.toLowerCase()}.h`, out[0]);
    fs.writeFileSync(`${outPath}/${structName}/Linux/exos_${structName.toLowerCase()}.c`, out[1]);

    out = template_cpp.generateFun(typFile, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${libName}.fun`, out);

    out = template_cpp.generateExosLoggerCpp(typFile, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName}Logger.cpp`, out);

    out = template_cpp.generateExosLoggerHeader(typFile, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName}Logger.h`, out);

    out = template_cpp.generateExosDataModelCpp(typFile, structName, structName + "_0", false);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName}DataModel.cpp`, out);

    out = template_cpp.generateExosDataModelHeader(typFile, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName}DataModel.h`, out);

    out = template_cpp.generateExosDataSetHeader(structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName}DataSet.h`, out);

    out = template_cpp.generateExosLoggerCpp(typFile, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName}Logger.cpp`, out);

    out = template_cpp.generateExosLoggerHeader(typFile, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName}Logger.h`, out);

    out = template_cpp.generateExosDataModelCpp(typFile, structName, structName + "_0", true);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName}DataModel.cpp`, out);

    out = template_cpp.generateExosDataModelHeader(typFile, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName}DataModel.h`, out);

    out = template_cpp.generateExosDataSetHeader(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName}DataSet.h`, out);

    return structName;
}

module.exports = {
    generateTemplate,
    updateTemplate
}