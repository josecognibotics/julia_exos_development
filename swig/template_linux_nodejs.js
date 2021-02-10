#!/usr/bin/env node

const header = require('../exos_header');
const fs = require('fs');

function generateLinuxPackage(typName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio Version=4.9.1.69?>\n`;
    out += `<Package SubType="exosLinuxPackage" PackageType="exosLinuxPackage" xmlns="http://br-automation.co.at/AS/Package">\n`;
    out += `  <Objects>\n`;
    out += `    <Object Type="File">build.sh</Object>\n`;
    out += `    <Object Type="File">${typName.toLowerCase()}.js</Object>\n`;
    out += `    <Object Type="File">exos_${typName.toLowerCase()}.h</Object>\n`;
    out += `    <Object Type="File">l_${typName.toLowerCase()}.node</Object>\n`;
    out += `    <Object Type="File">binding.gyp</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.h</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.c</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.i</Object>\n`;
    out += `  </Objects>\n`;
    out += `</Package>\n`;

    return out;
}

function generateShBuild(typName) {
    let out = "";

    out += `#!/bin/sh\n\n`;
    out += `finalize() {\n`;
    out += `    cd ../..\n`;
    out += `    rm -rf build/*\n`;
    out += `    rm -r build\n`;
    out += `    rm lib${typName.toLowerCase()}_wrap.cpp\n`;
    out += `    sync\n`;
    out += `    exit $1\n`;
    out += `}\n\n`;
    out += `swig -c++ -javascript -node -o lib${typName.toLowerCase()}_wrap.cpp lib${typName.toLowerCase()}.i\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    finalize 1\n`;
    out += `fi\n\n`;
    out += `node-gyp rebuild\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    finalize 2\n`;
    out += `fi\n\n`;
    out += `cd build/Release\n\n`;
    out += `cp -f l_*.node ../..\n\n`;
    out += `finalize 0`;

    return out;
}

function generateExosPkg(typName, libName, fileName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<ComponentPackage Version="1.0.0" ErrorHandling="Ignore" StartupTimeout="0">\n`;
    out += `    <Service Name="${typName} Runtime Service" Executable="/usr/bin/node" Arguments="/home/user/${typName.toLowerCase()}/${typName.toLowerCase()}.js"/>\n`;
    out += `    <DataModelInstance Name="MyApp"/>\n`;
    out += `    <File Name="${typName.toLowerCase()}-script" FileName="Linux\\${typName.toLowerCase()}.js" Type="Project"/>\n`;
    out += `    <File Name="${typName.toLowerCase()}-lib" FileName="Linux\\l_${typName.toLowerCase()}.node" Type="Project"/>\n`;
    out += `    <Installation Type="Prerun" Command="mkdir /home/user/${typName.toLowerCase()}/"/>\n`;
    out += `    <Installation Type="Prerun" Command="cp /var/cache/exos/${typName.toLowerCase()}.js /home/user/${typName.toLowerCase()}/"/>\n`;
    out += `    <Installation Type="Prerun" Command="cp /var/cache/exos/l_${typName.toLowerCase()}.node /home/user/${typName.toLowerCase()}/"/>\n`;
    out += `    <Build>\n`;
    out += `        <GenerateHeader FileName="MyApp\\MyApp.typ" TypeName="MyApp">\n`;
    out += `            <SG4 Include="${fileName.split(".")[0].toLowerCase()}TYP.h"/>\n`;
    out += `            <Output Path="Linux"/>\n`;
    out += `            <Output Path="lib${libName}"/>\n`;
    out += `        </GenerateHeader>\n`;
    out += `        <BuildCommand Command="C:\\Windows\\Sysnative\\wsl.exe" WorkingDirectory="Linux" Arguments="--distribution Debian --exec ./build.sh">\n`;
    out += `            <Dependency FileName="Linux\\${typName.toLowerCase()}.js"/>\n`;
    out += `            <Dependency FileName="Linux\\exos_${typName.toLowerCase()}.h"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.h"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.c"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.i"/>\n`;
    out += `        </BuildCommand>\n`;
    out += `    </Build>\n`;
    out += `</ComponentPackage>\n`;

    return out;
}

function generateGypFile(typName) {
    let out = "";

    out += `{\n`;
    out += `  "targets": [\n`;
    out += `    {\n`;
    out += `      "target_name": "l_${typName.toLowerCase()}",\n`;
    out += `      "sources": [\n`;
    out += `        "lib${typName.toLowerCase()}.c",\n`;
    out += `        "lib${typName.toLowerCase()}_wrap.cpp"\n`;
    out += `      ],\n`;
    out += `      "include_dirs": [\n`;
    out += `          '/usr/include'\n`;
    out += `      ],\n`;
    out += `      'link_settings': {\n`;
    out += `          'libraries': [\n`;
    out += `            '-lexos-api',\n`;
    out += `            '-lzmq'\n`;
    out += `          ]\n`;
    out += `      }\n`;
    out += `    }\n`;
    out += `  ]\n`;
    out += `}\n`;

    return out;
}


module.exports = {
    generateExosPkg,
    generateShBuild,
    generateLinuxPackage,
    generateGypFile
}