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
    out += `    <Object Type="File">CMakeLists.txt</Object>\n`;
    out += `    <Object Type="File">${typName.toLowerCase()}.js</Object>\n`;
    out += `    <Object Type="File">exos_${typName.toLowerCase()}.h</Object>\n`;
    out += `    <Object Type="File">l_${typName.toLowerCase()}.node</Object>\n`;
    out += `    <Object Type="File">package.json</Object>\n`;
    out += `    <Object Type="File">package-lock.json</Object>\n`;
    out += `    <Object Type="File">binding.gyp</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.h</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.c</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.i</Object>\n`;
    out += `    <Object Type="File">exos-comp-${typName.toLowerCase()}-1.0.0.deb</Object>\n`;
    out += `  </Objects>\n`;
    out += `</Package>\n`;

    return out;
}

function generateShBuild(typName) {
    let out = "";

    out += `#!/bin/sh\n\n`;
    out += `finalize() {\n`;
    out += `    rm -rf build/*\n`;
    out += `    rm -r build\n`;
    out += `    rm lib${typName.toLowerCase()}_wrap.cpp\n`;
    out += `    rm -rf node_modules/*\n`;
    out += `    rm -r node_modules\n`;
    out += `    rm -f Makefile\n`;
    out += `    sync\n`;
    out += `    exit $1\n`;
    out += `}\n\n`;

    out += `swig -c++ -javascript -node -o lib${typName.toLowerCase()}_wrap.cpp lib${typName.toLowerCase()}.i\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    finalize 1\n`;
    out += `fi\n\n`;

    // out += `node-gyp rebuild\n`;
    // out += `if [ "$?" -ne 0 ] ; then\n`;
    // out += `    finalize 2\n`;
    // out += `fi\n\n`;

    out += `npm install\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    finalize 1\n`;
    out += `fi\n\n`;

    out += `cp -f build/Release/l_*.node .\n\n`;

    out += `mkdir node_modules #make sure the folder exists even if no submodules are needed\n\n`;

    out += `rm -rf build/*\n`;

    out += `cd build\n\n`;

    out += `cmake ..\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    cd ..\n`;
    out += `    finalize 2\n`;
    out += `fi\n\n`;

    out += `cpack\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    cd ..\n`;
    out += `    finalize\n`;
    out += `fi\n\n`;

    out += `cp -f exos-comp-*.deb ..\n\n`;

    out += `cd ..\n\n`;

    out += `finalize 0\n\n`;

    return out;
}

function generateCMakeLists(typName) {
    let out = "";
    out += `\n`;
    out += `project(${typName.toLowerCase()})\n`;
    out += `cmake_minimum_required(VERSION 3.0)\n`;
    out += `\n`;
    out += `set(${typName.toUpperCase()}_MODULE_FILES\n`;
    out += `    l_${typName.toLowerCase()}.node\n`;
    out += `    package.json\n`;
    out += `    package-lock.json)\n`;
    out += `\n`;
    out += `install(FILES \${${typName.toUpperCase()}_MODULE_FILES} DESTINATION /home/user/${typName.toLowerCase()})\n`;
    out += `install(DIRECTORY node_modules DESTINATION /home/user/${typName.toLowerCase()}/)\n`;
    out += `\n`;
    out += `set(CPACK_GENERATOR "DEB")\n`;
    out += `set(CPACK_PACKAGE_NAME exos-comp-${typName.toLowerCase()})\n`;
    out += `set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "${typName.toLowerCase()} summary")\n`;
    out += `set(CPACK_PACKAGE_DESCRIPTION "Some description")\n`;
    out += `set(CPACK_PACKAGE_VENDOR "Your Organization")\n`;
    out += `\n`;
    out += `set(CPACK_PACKAGE_VERSION_MAJOR 1)\n`;
    out += `set(CPACK_PACKAGE_VERSION_MINOR 0)\n`;
    out += `set(CPACK_PACKAGE_VERSION_PATCH 0)\n`;
    out += `set(CPACK_PACKAGE_FILE_NAME exos-comp-${typName.toLowerCase()}-`;
    out += '${CPACK_PACKAGE_VERSION_MAJOR}.${CPACK_PACKAGE_VERSION_MINOR}.${CPACK_PACKAGE_VERSION_PATCH})\n';
    out += `set(CPACK_DEBIAN_PACKAGE_MAINTAINER "your name")\n`;
    out += `\n`;
    out += `set(CPACK_DEBIAN_PACKAGE_SHLIBDEPS ON)\n`;
    out += `\n`;
    out += `include(CPack)\n`;

    return out;
}

function generatePackageLockJSON(typName) {
    let out = "";

    out += `{\n`;
    out += `    "name": "${typName.toLowerCase()}",\n`;
    out += `    "version": "1.0.0",\n`;
    out += `    "lockfileVersion": 1\n`;
    out += `}\n`;

    return out;
}

function generatePackageJSON(typName) {
    let out = "";

    out += `{\n`;
    out += `  "name": "${typName.toLowerCase()}",\n`;
    out += `  "version": "1.0.0",\n`;
    out += `  "description": "implementation of exOS data exchange defined by datatype ${typName.toLowerCase()}",\n`;
    out += `  "main": "${typName.toLowerCase()}.js",\n`;
    out += `  "scripts": {\n`;
    out += `    "start": "node ${typName.toLowerCase()}.js"\n`;
    out += `  },\n`;
    out += `  "author": "your name",\n`;
    out += `  "license": "MIT"\n`;
    out += `}\n`;

    return out;
}

function generateExosPkg(typName, libName, fileName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<ComponentPackage Version="1.0.0" ErrorHandling="Ignore" StartupTimeout="0">\n`;
    out += `    <Service Name="${typName} Runtime Service" Executable="/usr/bin/npm" Arguments="start --prefix /home/user/${typName.toLowerCase()}/"/>\n`;
    out += `    <DataModelInstance Name="${typName}"/>\n`;
    out += `    <File Name="${typName.toLowerCase()}-script" FileName="Linux\\${typName.toLowerCase()}.js" Type="Project"/>\n`;
    out += `    <File Name="exos-comp-${typName.toLowerCase()}" FileName="Linux\\exos-comp-${typName.toLowerCase()}-1.0.0.deb" Type="Project"/>\n`;
    out += `    <Installation Type="Prerun" Command="cp /var/cache/exos/${typName.toLowerCase()}.js /home/user/${typName.toLowerCase()}/"/>\n`;
    out += `    <Build>\n`;
    out += `        <GenerateHeader FileName="${typName}\\${typName}.typ" TypeName="${typName}">\n`;
    out += `            <SG4 Include="${libName}.h"/>\n`;
    out += `            <Output Path="Linux"/>\n`;
    out += `            <Output Path="${libName}"/>\n`;
    out += `        </GenerateHeader>\n`;
    out += `        <BuildCommand Command="C:\\Windows\\Sysnative\\wsl.exe" WorkingDirectory="Linux" Arguments="--distribution Debian --exec ./build.sh">\n`;
    out += `            <Dependency FileName="Linux\\CMakeLists.txt"/>\n`;
    out += `            <Dependency FileName="Linux\\exos_${typName.toLowerCase()}.h"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.h"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.c"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.i"/>\n`;
    out += `            <Dependency FileName="Linux\\package.json"/>\n`;
    out += `            <Dependency FileName="Linux\\package-lock.json"/>\n`;
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
    generateGypFile,
    generateCMakeLists,
    generatePackageLockJSON,
    generatePackageJSON
}