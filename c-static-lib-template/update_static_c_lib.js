const fs = require('fs');
const header = require('../exos_header');
var parse = require('../node_modules/xml-parser');
const path = require('path');
const template_lib = require('./c_static_lib_template');
const template_swig = require('../swig/swig_c_template')

function updateLibrary(fileName, swig_type) {

    var xml = fs.readFileSync(fileName).toString();
    
    var obj = parse(xml);

    let typFile = "";
    let structName = ""; 
    let libLinux = "";
    let libAR = "";

    /*
    <ComponentPackage .. >
    <File  .. />
    <Service .. />
    <DatamodelInstance .. />
    <Build>
        <GenerateDatamodel (FileName="Threads\Threads.typ" => typFile) (TypeName="Threads" => structName) >
            <SG4  .. />
            (<Output Path="Linux"/>       => libLinux)
            (<Output Path="libThreads"/>  => libAR)
        </GenerateDatamodel>
    
    */

    for(let child of obj.root.children) {
        if(child.name == "Build") {
            for(let build of child.children) {
                if(build.name == "GenerateDatamodel") {
                    if(build.attributes["FileName"]!= null && build.attributes["TypeName"]!=null) {
                        typFile = `${path.dirname(fileName)}/${build.attributes["FileName"]}`;
                        structName = build.attributes["TypeName"];
                        libName = structName.substring(0, 10);
                        outPath = path.dirname(path.dirname(fileName));
                        for(let output of build.children) {
                            if(output.name == "Output" && output.attributes["Path"]!=null) {
                                if(output.attributes["Path"] == "Linux") {
                                    libLinux = `${path.dirname(fileName)}/${output.attributes["Path"]}/lib${structName.toLowerCase()}`;
                                }
                                else {
                                    libAR = `${path.dirname(fileName)}/${output.attributes["Path"]}/lib${structName.toLowerCase()}`;
                                }
                            }
                        }
                        break;

                    }
                    break;
                }
            }
            break;
        }
    }

    //check that we have all we need
    if(libLinux == "") throw(`No Static Lib for Linux found`);
    if(libAR == "") throw(`No Static Lib for AR found`);

    if(!fs.existsSync(typFile)) throw(`Typ source file ${typFile} not found`);

    if(!fs.existsSync(`${libLinux}.c`)) throw(`${libLinux}.c does not exist!`);
    if(!fs.existsSync(`${libLinux}.h`)) throw(`${libLinux}.h does not exist!`);
    if(!fs.existsSync(`${libAR}.c`)) throw(`${libAR}.c does not exist!`);
    if(!fs.existsSync(`${libAR}.h`)) throw(`${libAR}.h does not exist!`);
    if(swig_type !== undefined && swig_type == "python") {
        if(!fs.existsSync(`${libLinux}.i`)) throw(`${libLinux}.i does not exist!`);
    }

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

    out = template_lib.genenerateLibHeader(typFile, structName, false);
    fs.writeFileSync(`${libAR}.h`, out);

    out = template_lib.generateTemplate(typFile, structName, false, `${structName}_AR`);
    fs.writeFileSync(`${libAR}.c`, out);

    out = template_lib.genenerateLibHeader(typFile, structName, true);
    fs.writeFileSync(`${libLinux}.h`, out);

    out = template_lib.generateTemplate(typFile, structName, true, `${structName}_Linux`);
    fs.writeFileSync(`${libLinux}.c`, out);

    if(swig_type !== undefined && swig_type == "python") {
        out = template_swig.generateSwigInclude(typFile, structName, true);
        fs.writeFileSync(`${libLinux}.i`, out);
    }

    return structName;
}

module.exports = {
    updateLibrary
}