#!/usr/bin/env node

const header = require('../exos_header');
const fs = require('fs');

function generateLinuxPackage(typName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio FileVersion="4.9"?>\n`;
    out += `<Package SubType="exosLinuxPackage" PackageType="exosLinuxPackage" xmlns="http://br-automation.co.at/AS/Package">\n`;
    out += `  <Objects>\n`;
    out += `    <Object Type="File">build.sh</Object>\n`;
    out += `    <Object Type="File">CMakeLists.txt</Object>\n`;
    out += `    <Object Type="File">${typName.toLowerCase()}.py</Object>\n`;
    out += `    <Object Type="File">exos_${typName.toLowerCase()}.h</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.h</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.c</Object>\n`;
    out += `    <Object Type="File">_lib${typName}.so</Object>\n`;
    out += `    <Object Type="File">lib${typName}.py</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.i</Object>\n`;
    out += `    <Object Type="File">exos-comp-${typName.toLowerCase()}-1.0.0.deb</Object>\n`;
    out += `  </Objects>\n`;
    out += `</Package>\n`;

    return out;
}

function generateShBuild()
{
    let out = "";

    out += `#!/bin/sh\n\n`;
    out += `finalize() {\n`;
    out += `    cd ..\n`;
    out += `    rm -rf build/*\n`;
    out += `    rm -r build\n`;
    out += `    sync\n`;
    out += `    exit $1\n`;
    out += `}\n\n`;
    out += `mkdir build > /dev/null 2>&1\n`;
    out += `rm -rf build/*\n\n`;
    out += `cd build\n\n`;
    out += `cmake -Wno-dev ..\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    finalize 1\n`;
    out += `fi\n\n`;
    out += `make\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    finalize 2\n`;
    out += `fi\n\n`;
    out += `cpack\n`;
    out += `if [ "$?" -ne 0 ] ; then\n`;
    out += `    finalize 3\n`;
    out += `fi\n\n`;
    out += `cp -f _lib*.so ..\n\n`;
    out += `cp -f lib*.py ..\n\n`;
    out += `cp -f exos-comp-*.deb ..\n\n`;
    out += `finalize 0\n`;

    return out;
}

function generateExosPkg(typName,libName,fileName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<ComponentPackage Version="1.0.0" ErrorHandling="Ignore" StartupTimeout="0">\n`;
    out += `    <File Name="exos-comp-${typName.toLowerCase()}" FileName="Linux\\exos-comp-${typName.toLowerCase()}-1.0.0.deb" Type="Project"/>\n`;
    out += `    <Service Name="${typName} Runtime Service" Executable="/usr/bin/python" Arguments="/home/user/${typName.toLowerCase()}/${typName.toLowerCase()}.py"/>\n`;
    out += `    <DataModelInstance Name="${typName}"/>\n`;
    out += `    <File Name="${typName.toLowerCase()}-script" FileName="Linux\\${typName.toLowerCase()}.py" Type="Project"/>\n`;
    out += `    <Installation Type="Prerun" Command="cp /var/cache/exos/${typName.toLowerCase()}.py /home/user/${typName.toLowerCase()}/"/>\n`;
    out += `    <Build>\n`;
    out += `        <GenerateHeader FileName="${libName}\\${fileName}" TypeName="${typName}">\n`;
    out += `            <SG4 Include="${libName}.h"/>\n`;
    out += `            <Output Path="Linux"/>\n`;
    out += `            <Output Path="${libName}"/>\n`;
    out += `        </GenerateHeader>\n`;
    out += `        <BuildCommand Command="C:\\Windows\\Sysnative\\wsl.exe" WorkingDirectory="Linux" Arguments="-d Debian -e sh build.sh">\n`;
    out += `            <Dependency FileName="Linux\\CMakeLists.txt"/>\n`;
    out += `            <Dependency FileName="Linux\\exos_${typName.toLowerCase()}.h"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.h"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.c"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.i"/>\n`;
    out += `        </BuildCommand>\n`;
    out += `    </Build>\n`;
    out += `</ComponentPackage>\n`;

    return out;
}

function generateCMakeLists(typName) {
    let out = "";

    out += `cmake_minimum_required(VERSION 3.0)\n`;
    out += `\n`;
    out += `project(lib${typName})\n`;
    out += `find_package(SWIG REQUIRED)\n`;
    out += `include(\${SWIG_USE_FILE})\n`;
    out += `\n`;
    out += `# Load Python Libraries\n`;
    out += `# ---------------------\n`;
    out += `# a.) use Python 2.7 to avoid version conflicts\n`;
    out += `find_package(PythonLibs)\n`;
    out += `# b.) use Python 3 from the distro (same distro used on the target)\n`;
    out += `# find_package(PythonLibs 3)\n`;
    out += `# c.) use pyenv to manually install a version matching the Python version on the target distro https://realpython.com/intro-to-pyenv/\n`;
    out += `# set(PYTHON_INCLUDE_PATH ~/.pyenv/versions/3.5-dev/include/python3.5m)\n`;
    out += `# set(PYTHON_LIBRARIES ~/.pyenv/versions/3.5-dev/lib/libpython3.5m.so)\n`;
    out += `\n`;
    out += `include_directories(\${PYTHON_INCLUDE_PATH})\n`;
    out += `\n`;
    out += `include_directories(\${CMAKE_CURRENT_SOURCE_DIR})\n`;
    out += `\n`;
    out += `set(CMAKE_SWIG_FLAGS "")\n`;
    out += `\n`;
    out += `set(${typName.toUpperCase()}_SOURCES\n`;
    out += `    "lib${typName.toLowerCase()}.i"\n`;
    out += `    "lib${typName.toLowerCase()}.c")\n`;
    out += `\n`;
    out += `set_source_files_properties(\${${typName.toUpperCase()}_SOURCES} PROPERTIES CPLUSPLUS ON)\n`;
    out += `\n`;
    out += `swig_add_module(lib${typName} python \${${typName.toUpperCase()}_SOURCES})\n`;
    out += `swig_link_libraries(lib${typName} \${PYTHON_LIBRARIES} zmq exos-api)\n`;
    out += `\n`;
    out += `set(${typName.toUpperCase()}_MODULE_FILES\n`;
   // out += `    "${typName.toLowerCase()}.py"\n`;
    out += `    "build/_lib${typName}.so"\n`;
    out += `    build/lib${typName}.py)\n`;
    out += `\n`;
    out += `install(FILES \${${typName.toUpperCase()}_MODULE_FILES} DESTINATION /home/user/${typName.toLowerCase()})\n`;
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
    out += `\n`;

    return out;
}

module.exports = {
    generateCMakeLists,
    generateExosPkg,
    generateShBuild,
    generateLinuxPackage
}