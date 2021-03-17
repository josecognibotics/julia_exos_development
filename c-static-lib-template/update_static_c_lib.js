const fs = require('fs');
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
    <DataModelInstance .. />
    <Build>
        <GenerateHeader (FileName="Threads\Threads.typ" => typFile) (TypeName="Threads" => structName) >
            <SG4  .. />
            (<Output Path="Linux"/>       => libLinux)
            (<Output Path="libThreads"/>  => libAR)
        </GenerateHeader>
    
    */

    for(let child of obj.root.children) {
        if(child.name == "Build") {
            for(let build of child.children) {
                if(build.name == "GenerateHeader") {
                    if(build.attributes["FileName"]!= null && build.attributes["TypeName"]!=null) {
                        typFile = `${path.dirname(fileName)}/${build.attributes["FileName"]}`;
                        structName = build.attributes["TypeName"];
                        
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

    out = template_lib.genenerateLibHeader(typFile, structName, false);
    fs.writeFileSync(`${libAR}.h`, out);

    out = template_lib.generateTemplate(typFile, structName, false, `${structName}_AR`);
    fs.writeFileSync(`${libAR}.c`, out);

    out = template_lib.genenerateLibHeader(typFile, structName, true);
    fs.writeFileSync(`${libLinux}.h`, out);

    out = template_lib.generateTemplate(typFile, structName, true, `${structName}_Linux`, (swig_type !== undefined && swig_type == "python"));
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