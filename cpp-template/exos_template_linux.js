function generateExosPkg(typName, libName, fileName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<ComponentPackage Version="1.0.0" ErrorHandling="Ignore" StartupTimeout="0">\n`;
    out += `    <File Name="exos-comp-${typName.toLowerCase()}" FileName="Linux\\exos-comp-${typName.toLowerCase()}-1.0.0.deb" Type="Project"/>\n`;
    out += `    <Service Name="${typName} Runtime Service" Executable="/home/user/${typName.toLowerCase()}" Arguments=""/>\n`;
    out += `    <DataModelInstance Name="${typName}"/>\n`;
    out += `    <Build>\n`;
    out += `        <GenerateHeader FileName="${libName}\\${fileName}" TypeName="${typName}">\n`;
    out += `            <SG4 Include="${libName.toLowerCase()}.h"/>\n`;
    out += `            <Output Path="Linux"/>\n`;
    out += `            <Output Path="${libName}"/>\n`;
    out += `        </GenerateHeader>\n`;
    out += `        <BuildCommand Command="C:\\Windows\\Sysnative\\wsl.exe" WorkingDirectory="Linux" Arguments="-d Debian -e sh build.sh">\n`;
    out += `            <Dependency FileName="Linux\\CMakeLists.txt"/>\n`;
    out += `            <Dependency FileName="Linux\\exos_${typName.toLowerCase()}.h"/>\n`;
    out += `            <Dependency FileName="Linux\\main.cpp"/>\n`;
    out += `            <Dependency FileName="Linux\\${typName}DataModel.h"/>\n`;
    out += `            <Dependency FileName="Linux\\${typName}DataModel.cpp"/>\n`;
    out += `            <Dependency FileName="Linux\\${typName}DataSet.h"/>\n`;
    out += `        </BuildCommand>\n`;
    out += `    </Build>\n`;
    out += `</ComponentPackage>\n`;

    return out;
}

function generateLinuxPackage(typName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio FileVersion="4.9"?>\n`;
    out += `<Package SubType="exosLinuxPackage" PackageType="exosLinuxPackage" xmlns="http://br-automation.co.at/AS/Package">\n`;
    out += `  <Objects>\n`;
    out += `    <Object Type="File">build.sh</Object>\n`;
    out += `    <Object Type="File">CMakeLists.txt</Object>\n`;
    out += `    <Object Type="File">main.cpp</Object>\n`;
    out += `    <Object Type="File">exos_${typName.toLowerCase()}.h</Object>\n`;
    out += `    <Object Type="File">${typName}DataModel.cpp</Object>\n`;
    out += `    <Object Type="File">${typName}DataModel.h</Object>\n`;
    out += `    <Object Type="File">${typName}DataSet.h</Object>\n`;
    out += `    <Object Type="File">${typName}Logger.cpp</Object>\n`;
    out += `    <Object Type="File">${typName}Logger.h</Object>\n`;
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
    out += `cmake ..\n`;
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
    out += `cp -f exos-comp-*.deb ..\n\n`;
    out += `finalize 0\n`;

    return out;
}

function generateCMakeLists(typName) {
    let out = "";

    out += `cmake_minimum_required(VERSION 3.0)\n`;
    out += `\n`;
    out += `project(${typName.toLowerCase()})\n`;
    out += `\n`;
    out += `add_library(libExosCpp STATIC ${typName}DataModel.h ${typName}DataModel.cpp ${typName}DataSet.h ${typName}Logger.h ${typName}Logger.cpp)\n`;
    out += `target_include_directories(libExosCpp PUBLIC ..)\n`;
    out += `add_executable(${typName.toLowerCase()} main.cpp)\n`;
    out += `target_include_directories(${typName.toLowerCase()} PUBLIC ..)\n`;
    out += `target_link_libraries(${typName.toLowerCase()} libExosCpp zmq exos-api)\n`;
    out += `\n`;
    out += `install(TARGETS ${typName.toLowerCase()} RUNTIME DESTINATION /home/user)\n`;
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
    generateExosPkg,
    generateLinuxPackage,
    generateShBuild,
    generateCMakeLists
}