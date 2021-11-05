#!/usr/bin/env node

const vscode = require('vscode');
const fs = require('fs-extra');
const header = require('../exos_header');
const ar = require('../template/ar');
const template_ar = require('../c-template/exos_template_ar');
const template_linux = require('./exos_template_linux_n_api');
const path = require('path');
var XMLparse = require('xml-parser');

function searchASroot(inBranch) {
    let currPath = inBranch;

    try {
        currPath = path.dirname(currPath)

        while (true) {
            let contents = fs.readdirSync(currPath);

            let apjFound = false;
            let binariesFound = false;
            let logicalFound = false;
            let physicalFound = false;
            let tempFound = false;
            let apjFile = ""

            for (let item of contents) {
                if (item.includes(".apj")) {
                    let stats = fs.statSync(path.join(currPath, item));
                    //is it a file?
                    if (stats.isFile()) {
                        apjFound = true;
                        apjFile = item;
                    }
                }
                else if (item === "Logical") {
                    let stats = fs.statSync(path.join(currPath, item));
                    //is it a directory?
                    if (!stats.isFile()) { logicalFound = true; }
                }
                else if (item === "Physical") {
                    let stats = fs.statSync(path.join(currPath, item));
                    //is it a directory?
                    if (!stats.isFile()) { physicalFound = true; }
                }
                else if (item === "Binaries") {
                    let stats = fs.statSync(path.join(currPath, item));
                    //is it a directory?
                    if (!stats.isFile()) { binariesFound = true; }
                }
                else if (item === "Temp") {
                    let stats = fs.statSync(path.join(currPath, item));
                    //is it a directory?
                    if (!stats.isFile()) { tempFound = true; }
                }
            }

            if (apjFound && binariesFound && logicalFound && physicalFound && tempFound) {
                return path.join(currPath, apjFile);
            }
            currPath = path.dirname(currPath)
        }
    } catch (e) {
        throw ("Can't find project root directory or project is not built")
    }
}

function exportBinLib(sourceDir, destDir, library) {
    return new Promise((resolve, reject) => {
        async function _exportBinLib() {
            let apjPath = searchASroot(sourceDir);
            let configsPath = path.join(path.dirname(apjPath), "Physical");

            let pkg = "";

            try {
                pkg = fs.readFileSync(path.join(configsPath, "Physical.pkg")).toString().split("\n");
            } catch (e) {
                reject(`Cannot read configurations (Physical.pkg): ${e.message}`);
            }

            let configs = [];
            let config = null;

            for (let item of pkg) {
                if (item.includes("<Object Type=\"Configuration\"")) {
                    //shitty programming since .pkg files cannot be parsed with XMLparse
                    configs.push(item.trim().split("<")[1].split(">")[1]);
                }
            }

            if (configs.length === 0) { reject("No configuration avaialble to export"); }
            else if (configs.length > 1) {
                //select config to export library from

                let items = [];
                for (config of configs) {
                    items.push({
                        label: config
                    });
                }

                let qpOpt = {
                    matchOnDescription: false,
                    matchOnDetail: false,
                    placeHolder: items[0].label,
                    ignoreFocusOut: true,
                    canPickMany: false,
                }

                config = await vscode.window.showQuickPick(items, qpOpt).catch(e => { reject(`No configuration picked: ${e.nessage}`) });
                config = config.label;
            } else {
                config = configs[0];
            }

            //read HW name from package
            let cpuName = "";
            try {
                let hwConfig = fs.readFileSync(path.join(configsPath, config, "Config.pkg")).toString().split("\n");
                for (let item of hwConfig) {
                    if (item.includes("<Object Type=\"Cpu\">")) {
                        cpuName = item.split(">")[1].split("<")[0];
                    }
                }
                if (cpuName === "") { reject("No CPU defined in configuration"); }
            } catch (e) {
                reject(`Can't read file "Config.pkg" in selected configuration: ${e.message}`);
            }

            let libDir = [];
            let lby = [];
            let lbyFileName = "";
            let lbyFiles = [];
            let binLby = "";
            let expPath = ""

            //get and copy files from 
            try {
                //get lby file name
                libDir = fs.readdirSync(path.join(sourceDir, library));
                for (let l of libDir) {
                    if (l.endsWith(".lby")) {
                        lbyFileName = l;
                        break;
                    }
                }
                //read and decode contents of lby file and copy to Binary.lby
                lby = fs.readFileSync(path.join(sourceDir, library, lbyFileName)).toString().split("\n");


                for (let line of lby) {
                    if (line.includes("<Library") && line.includes("SubType=")) {
                        if (line.includes("SubType=\"ANSIC\"")) {
                            line = line.replace("SubType=\"ANSIC\"", "SubType=\"Binary\"");
                        }

                        binLby += line;
                        binLby += "\n";
                    }
                    else if (line.includes("<File ")) {
                        if (line.includes(".typ") || line.includes(".fun")) {
                            lbyFiles.push(line.trim().split("<")[1].split(">")[1]);
                            binLby += line;
                            binLby += "\n";
                        }
                    }
                    else {
                        binLby += line;
                        binLby += "\n";
                    }
                    /// MISSING - Dependecies. AS incluedes additional dependencies (presumably form #include statements).
                }

                expPath = path.join(destDir, library);
                fs.mkdirSync(expPath);
                fs.writeFileSync(path.join(expPath, "Binary.lby"), binLby);

                let _sourceDir = path.join(sourceDir, library);
                for (let file of lbyFiles) { fs.copyFileSync(path.join(_sourceDir, file), path.join(expPath, file)) }
            } catch (e) {
                reject(`Could not copy files from Logical: ${e.message}`);
            }

            try {
                //create the binaries and h file folder
                let _expPath = path.join(expPath, "SG4");
                fs.mkdirSync(_expPath);

                //copy files
                fs.copyFileSync(path.join(path.dirname(apjPath), "Temp", "Includes", `${library}.h`), path.join(_expPath, `${library}.h`));
                fs.copyFileSync(path.join(path.dirname(apjPath), "Temp", "Archives", config, cpuName, `lib${library}.a`), path.join(_expPath, `lib${library}.a`));
                fs.copyFileSync(path.join(path.dirname(apjPath), "Binaries", config, cpuName, `${library}.br`), path.join(_expPath, `${library}.br`));
            } catch (e) {
                reject(`Error copying binary file(s): ${e.message}`);
            }

            resolve(config);
        }
        _exportBinLib();
    });
}

function exportBinLinux(appFiles, sourceDir, destDir) {
    //Create target directory
    try {
        fs.mkdirSync(path.join(destDir, "Linux",));
    }
    catch (e) {
        throw (`can't create Linux directory`);
    }

    //copy files from defined in .exospkg
    for (let file of appFiles) {
        try {
            fs.copyFile(path.join(sourceDir, file), path.join(destDir, file));
        }
        catch (e) {
            throw (`can't copy file: ${file}`);
        }
    }

    //create a shortened Package.pkg file for destination
    let xml = fs.readFileSync(path.join(sourceDir, "Linux", "Package.pkg"), 'utf8').toString();
    xml = xml.split("\n");

    let pkgfile = "";
    let fileListFound = false;

    for (let line of xml) {
        if (line.includes("<Objects>")) {
            fileListFound = true;
            pkgfile += line + "\n"
        }
        else if (line.includes("</Objects>")) {
            pkgfile += line + "\n"
            fileListFound = false;
        }
        else {
            if (!fileListFound) { pkgfile += line + "\n" }
            else {
                for (let file of appFiles) {
                    //skip not needed files
                    if (line.includes(path.basename(file))) { pkgfile += line + "\n" }
                }
            }
        }
    }

    try {
        fs.writeFileSync(path.join(destDir, "Linux", "Package.pkg"), pkgfile)
    }
    catch (e) {
        throw (`can't write file: ${destDir}\\Linux\\Package.pkg`);
    }
}

function binExport(fileName, workingDir, exportPath) {
    return new Promise((resolve, reject) => {
        if (workingDir.trim() === exportPath.trim()) {
            reject(`can't export to source folder, choose another export folder`);
        }

        //get foldername containing the .exospkg file
        let componentFolder = workingDir.replaceAll("\\", "/");
        componentFolder = (componentFolder.split("/"));
        componentFolder = componentFolder[componentFolder.length - 1];

        if (!fs.existsSync(exportPath)) {
            reject(`folder ${exportPath} does not exist, choose another export folder`);
        }

        //build complete export path
        exportPath += componentFolder;
        if (fs.existsSync(exportPath)) {
            reject(`folder ${exportPath} already exist, choose another export folder`);
        }

        let workingDirFolders = fs.readdirSync(workingDir);
        let pkgFile = "";
        let pkg = {};
        let exospkgFile = "";
        let exospkg = {};

        for (let fileFolder of workingDirFolders) {
            let stats = fs.statSync(`${workingDir}\\${fileFolder}`);

            //is it a file
            if (stats.isFile()) {
                let content = "";

                if (fileFolder.endsWith(".pkg")) {
                    try {

                        pkg = fs.readFileSync(path.join(workingDir, fileFolder)).toString().split("\n");
                        pkgFile = fileFolder;
                    } catch (e) {
                        reject("Error reading .pkg file: " + e.message)
                    }
                }
                else if (fileFolder.endsWith(".exospkg")) {
                    try {
                        content = fs.readFileSync(path.join(workingDir, fileFolder)).toString();
                        exospkg = XMLparse(content);
                        exospkgFile = fileFolder;
                    } catch (e) {
                        reject("Error reading .exospkg file: " + e.message)
                    }
                }
            }
        }

        //check that files could be read and parsed to {}
        if ((pkgFile === "") || (exospkgFile === "")) { reject("Not an exOS package"); }

        //create export folder
        try {
            fs.mkdirSync(exportPath);
        } catch (e) {
            reject(`folder ${exportPath} can't be created`);
        }

        //Copy needed Linux Contents
        let LinuxAppFiles = [];

        if ((exospkg.root !== undefined) && (exospkg.root.children !== undefined) && (Array.isArray(exospkg.root.children))) {
            for (let child of exospkg.root.children) {
                if (child.attributes.hasOwnProperty("FileName")) {
                    LinuxAppFiles.push(child.attributes.FileName);
                }
            }
        }

        if (LinuxAppFiles.length === 0) {
            reject(`.exospkg file ${fileName} doesn't contain any files to export`);
        } else {
            exportBinLinux(LinuxAppFiles, workingDir, exportPath);
        }

        let foundPLCprg = false;
        let libName = null;

        //check package contents
        for (let line of pkg) {
            if (line.includes("Program")) {
                //shitty programming, but .pkg files are not parsed with XMLparse for some reason
                let prgName = line.trim().split("<")[1].split(">")[1];
                try {
                    fs.copySync(path.join(workingDir, prgName), path.join(exportPath, prgName));
                } catch (e) {
                    reject(`Program ${prgName} can't be copied/exported`)
                }
                foundPLCprg = true;
            }
            else if (line.includes("Library")) {
                libName = line.trim().split("<")[1].split(">")[1];
            }
        }

        if (!foundPLCprg || (libName == null)) reject('export could not complete, library or program missing')

        exportBinLib(workingDir, exportPath, libName)
            .then((config) => {
                //Finally copy root folder files
                try {
                    fs.copyFileSync(path.join(workingDir, pkgFile), path.join(exportPath, pkgFile));
                    let exosPkg = fs.readFileSync(path.join(workingDir, exospkgFile)).toString().split("\n");
                    let exp_exosPkg = "";
                    let inBuild = false;
                    for (let row of exosPkg) {
                        if (row.includes("<Build>")) { inBuild = true; }
                        if (!inBuild) { exp_exosPkg += `${row}\n`; }
                        if (row.includes("</Build>")) { inBuild = false; }
                    }
                    fs.writeFileSync(path.join(exportPath, exospkgFile), exp_exosPkg);
                } catch (e) {
                    reject(`Can't export .pkg/.exospkg file: ${e.message}`);
                }
                let result = { component: path.basename(fileName), binaries_config: config };
                resolve(result);
            })
            .catch((e) => {
                reject(`Can't export Library ${libName} as binary. Error: ${e.message}`);
            });
    });
}

//used during dev. for simple testing in VS Code..
if (require.main === module) {
    if (process.argv.length > 3) {
        if (process.argv[2] != "-u") {
            let outPath = process.argv[4];
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
            let fileName = process.argv[2];
            try {
                updateTemplate(fileName);
                process.stdout.write(`exOS component for ${fileName}updated`);
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
    updateTemplate,
    binExport
}