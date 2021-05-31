#!/usr/bin/env node

const fs = require('fs')
const header = require('../exos_header');
const ar = require('../template/ar');
const template_ar = require('../c-template/exos_template_ar');
const template_linux = require('./exos_template_linux_n_api');
const path = require('path');
var XMLparse = require('../node_modules/xml-parser');

function generateTemplate(fileName, structName, outPath) {

    let libName = structName.substring(0, 10);

    template_ar.checkVarNames(fileName, structName);

    if (fs.existsSync(`${outPath}/${structName}`)) {
        throw (`folder ${outPath}/${structName} already exists, choose another output folder`);
    }

    //AS dirs
    fs.mkdirSync(`${outPath}/${structName}`);
    fs.mkdirSync(`${outPath}/${structName}/${libName}`);
    fs.mkdirSync(`${outPath}/${structName}/${libName}_0`);

    //Linux dir
    fs.mkdirSync(`${outPath}/${structName}/Linux`);
    fs.mkdirSync(`${outPath}/${structName}/Linux/build`);

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

    out = template_linux.generateGyp(structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/binding.gyp`, out);

    out = template_linux.generateLibTemplate(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/lib${structName.toLowerCase()}.c`, out);

    out = template_linux.generateIndexJS(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/${structName.toLowerCase()}.js`, out);

    out = template_linux.generatePackageJSON(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/package.json`, out);

    out = template_linux.generatePackageLockJSON(fileName, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/package-lock.json`, out);
}

function updateTemplate(fileName) {
    try {
        var xml = fs.readFileSync(fileName).toString();
    } catch {
        throw ('Error: could not read .exospkg file')
    }

    try {
        var obj = XMLparse(xml);
    } catch {
        throw ('Error: could not parse .exospkg file');
    }

    let typFile = "";
    let structName = "";
    let libName = "";
    let outPath = "";

    for (let child of obj.root.children) {
        if (child.name == "Build") {
            for (let build of child.children) {
                if (build.name == "GenerateHeader") {
                    if (build.attributes["FileName"] != null && build.attributes["TypeName"] != null) {
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
    if (libName == "") throw (`GenerateHeader section not found in .exospkg file!`);

    if (!fs.existsSync(typFile)) throw (`Typ source file ${typFile} not found`);

    //mainly checking that folders exist and points to something valid
    if (!fs.existsSync(`${path.dirname(fileName)}/${libName}/${structName.toLowerCase()}.c`)) throw (`${path.dirname(fileName)}/${libName}/${structName.toLowerCase()}.c does not exist!`);
    if (!fs.existsSync(`${path.dirname(fileName)}/Linux/lib${structName.toLowerCase()}.c`)) throw (`${path.dirname(fileName)}/Linux/lib${structName.toLowerCase()}.c does not exist!`);

    //ok were good to go, regenerate
    let out = "";

    //headers
    out = header.generateHeader(typFile, structName, [`${libName}.h`]);
    //AS header
    fs.writeFileSync(path.join(outPath, structName, libName, `exos_${structName.toLowerCase()}.h`), out);
    //Linux header
    fs.writeFileSync(path.join(outPath, structName, 'Linux', `exos_${structName.toLowerCase()}.h`), out);

    //AR library
    out = template_ar.generateTemplate(typFile, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${structName.toLowerCase()}.c`, out);

    out = template_ar.generateFun(typFile, structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/${libName}.fun`, out);

    out = template_ar.generateCLibrary(path.basename(typFile), structName);
    fs.writeFileSync(`${outPath}/${structName}/${libName}/ANSIC.lby`, out);

    fs.writeFileSync(`${outPath}/${structName}/${libName}/dynamic_heap.cpp`, "unsigned long bur_heap_size = 100000;\n");

    //Linux files
    out = template_linux.generateLibTemplate(typFile, structName);
    fs.writeFileSync(`${outPath}/${structName}/Linux/lib${structName.toLowerCase()}.c`, out);

    return structName;
}

//used during dev. for simple testing in VS Code..
if (require.main === module) {
    if (process.argv.length > 3) {
        if (process.argv[2] != "-u") {
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
        } else {
            let fileName = process.argv[3];
            // structName not defined here? 
            // why use argv[3] when argv[2] is unused, and normally points to a file??
            try {
                updateTemplate(fileName);
                process.stdout.write(`exos_template ${structName} generated at ${outPath}`);
            } catch (error) {
                process.stderr.write(error);
            }
        }
    }
    else {
        process.stderr.write("usage: ./exos_template.js <filename.typ> <structname> <template output folder>\n");
    }
}

module.exports = {
    generateTemplate,
    updateTemplate
}