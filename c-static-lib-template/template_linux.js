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
    out += `    <Object Type="File">main.c</Object>\n`;
    out += `    <Object Type="File">exos_${typName.toLowerCase()}.h</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.h</Object>\n`;
    out += `    <Object Type="File">lib${typName.toLowerCase()}.c</Object>\n`;
    out += `    <Object Type="File">termination.c</Object>\n`;
    out += `    <Object Type="File">termination.h</Object>\n`;
    out += `    <Object Type="File">exar-${typName.toLowerCase()}-1.0.0.deb</Object>\n`;
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
    out += `cp -f exar-*.deb ..\n\n`;
    out += `finalize 0\n`;

    return out;
}

function generateWSLBuild(typName) {
    let out = "";

    out += `[CmdletBinding()]\n`;
    out += `param (\n`;
    out += `    [Parameter()][switch]$Rebuild = $false,\n`;
    out += `    [Parameter()][switch]$Pack = $false\n`;
    out += `)\n`;
    out += `\n`;
    out += `$wsli = New-Object System.Diagnostics.ProcessStartInfo\n`;
    out += `$wsli.FileName = "wsl.exe"\n`;
    out += `$wsli.UseShellExecute = $false \n`;
    out += `$wsli.RedirectStandardInput = $true\n`;
    out += `$wsli.RedirectStandardOutput = $true\n`;
    out += `$wsli.Arguments = "-d Debian"\n`;
    out += `$wsli.WorkingDirectory = "$PSScriptRoot"\n`;
    out += `\n`;
    out += `$wsl = New-Object System.Diagnostics.Process\n`;
    out += `$wsl.StartInfo = $wsli\n`;
    out += `\n`;
    out += `Register-ObjectEvent -InputObject $wsl -EventName OutputDataReceived -action {\n`;
    out += `    $output = $Event.SourceEventArgs.Data\n`;
    out += '    Write-Host "WSL: $output`r"\n';
    out += `} | Out-Null\n`;
    out += `Write-Host "Starting WSL.."\n`;
    out += `$wsl.Start()\n`;
    out += `\n`;
    out += `$wsl.BeginOutputReadLine()\n`;
    out += `\n`;
    out += `Remove-Item "$PSScriptRoot\\build\\*" -Recurse\n`;
    out += '$wsl.StandardInput.Write("cd build`n");\n';
    out += '$wsl.StandardInput.Write("cmake ..`n");\n';
    out += '$wsl.StandardInput.Write("make`n");\n';
    out += '$wsl.StandardInput.Write("cpack`n");\n';
    out += '$wsl.StandardInput.Write("echo done`n");\n';
    out += '$wsl.StandardInput.Write("exit`n");\n';
    out += `\n`;
    out += `$wsl.WaitForExit()\n`;
    out += `\n`;
    out += `Copy-Item -Path "$PSScriptRoot\\build\\exar-${typName.toLowerCase()}-*.deb" -Destination "$PSScriptRoot\\..\\..\\..\\"\n`;
    out += `Remove-Item "$PSScriptRoot\\build\\*" -Recurse\n`;
    out += `\n`;

    return out;
}

function generateExosPkg(typName,libName,fileName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<ComponentPackage Version="1.0.0" ErrorHandling="Ignore" StartupTimeout="0">\n`;
    out += `    <File Name="exar-${typName.toLowerCase()}" FileName="Linux\\exar-${typName.toLowerCase()}-1.0.0.deb" Type="Project"/>\n`;
    out += `    <Service Name="${typName} Runtime Service" Executable="/home/user/${typName.toLowerCase()}" Arguments=""/>\n`;
    out += `    <DataModelInstance Name="${typName}"/>\n`;
    out += `    <Build>\n`;
    out += `        <GenerateHeader FileName="${libName}\\${fileName}" TypeName="${typName}">\n`;
    out += `            <SG4 Include="${fileName.split(".")[0].toLowerCase()}TYP.h"/>\n`;
    out += `            <Output Path="Linux"/>\n`;
    out += `            <Output Path="lib${libName}"/>\n`;
    out += `        </GenerateHeader>\n`;
    out += `        <BuildCommand Command="C:\\Windows\\Sysnative\\wsl.exe" WorkingDirectory="Linux" Arguments="-d Debian -e sh build.sh">\n`;
    out += `            <Dependency FileName="Linux\\exos_${typName.toLowerCase()}.h"/>\n`;
    out += `            <Dependency FileName="Linux\\main.c"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.h"/>\n`;
    out += `            <Dependency FileName="Linux\\lib${typName.toLowerCase()}.c"/>\n`;
    out += `            <Dependency FileName="Linux\\termination.h"/>\n`;
    out += `            <Dependency FileName="Linux\\termination.c"/>\n`;
    out += `        </BuildCommand>\n`;
    out += `    </Build>\n`;
    out += `</ComponentPackage>\n`;

    return out;
}

function generateTerminationHeader() {
    let out = "";

    out += `#ifndef _TERMINATION_H_\n`;
    out += `#define _TERMINATION_H_\n`;
    out += `\n`;
    out += `#include <stdbool.h>\n`;
    out += `\n`;
    out += `void catch_termination();\n`;
    out += `bool is_terminated();\n`;
    out += `\n`;
    out += `#endif//_TERMINATION_H_\n`;

    return out;
}

function generateTermination() {
    let out = "";

    out += `#include "termination.h"\n`;
    out += `#include <signal.h>\n`;
    out += `#include <stdlib.h>\n`;
    out += `\n`;
    out += `static bool terminate_process = false;\n`;
    out += `\n`;
    out += `bool is_terminated()\n`;
    out += `{\n`;
    out += `    return terminate_process;\n`;
    out += `}\n`;
    out += `\n`;
    out += `static void handle_term_signal(int signum)\n`;
    out += `{\n`;
    out += `    switch (signum)\n`;
    out += `    {\n`;
    out += `    case SIGINT:\n`;
    out += `    case SIGTERM:\n`;
    out += `    case SIGQUIT:\n`;
    out += `        terminate_process = true;\n`;
    out += `        break;\n`;
    out += `\n`;
    out += `    default:\n`;
    out += `        break;\n`;
    out += `    }\n`;
    out += `}\n`;
    out += `\n`;
    out += `void catch_termination()\n`;
    out += `{\n`;
    out += `    struct sigaction new_action;\n`;
    out += `\n`;
    out += `    // Register termination handler for signals with termination semantics\n`;
    out += `    new_action.sa_handler = handle_term_signal;\n`;
    out += `    sigemptyset(&new_action.sa_mask);\n`;
    out += `    new_action.sa_flags = 0;\n`;
    out += `\n`;
    out += `    // Sent via CTRL-C.\n`;
    out += `    sigaction(SIGINT, &new_action, NULL);\n`;
    out += `\n`;
    out += `    // Generic signal used to cause program termination.\n`;
    out += `    sigaction(SIGTERM, &new_action, NULL);\n`;
    out += `\n`;
    out += `    // Terminate because of abnormal condition.\n`;
    out += `    sigaction(SIGQUIT, &new_action, NULL);\n`;
    out += `}\n`;

    return out;
}

function generateCMakeLists(typName) {
    let out = "";

    out += `cmake_minimum_required(VERSION 3.0)\n`;
    out += `\n`;
    out += `project(${typName.toLowerCase()} C)\n`;
    out += `\n`;
    out += `add_library(lib${typName.toLowerCase()} STATIC lib${typName.toLowerCase()}.c)\n`;
    out += `target_include_directories(lib${typName.toLowerCase()} PUBLIC ..)\n`;
    //out += `target_link_libraries(lib${typName.toLowerCase()} zmq exos-api)\n`;
    out += `add_executable(${typName.toLowerCase()} main.c termination.c)\n`;
    out += `target_include_directories(${typName.toLowerCase()} PUBLIC ..)\n`;
    out += `target_link_libraries(${typName.toLowerCase()} lib${typName.toLowerCase()} zmq exos-api)\n`;
    out += `\n`;
    out += `install(TARGETS ${typName.toLowerCase()} RUNTIME DESTINATION /home/user)\n`;
    out += `install(TARGETS lib${typName.toLowerCase()} ARCHIVE DESTINATION /home/user)\n`;
    out += `\n`;
    out += `set(CPACK_GENERATOR "DEB")\n`;
    out += `set(CPACK_PACKAGE_NAME exar-${typName.toLowerCase()})\n`;
    out += `set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "${typName.toLowerCase()} summary")\n`;
    out += `set(CPACK_PACKAGE_DESCRIPTION "Some description")\n`;
    out += `set(CPACK_PACKAGE_VENDOR "Your Organization")\n`;
    out += `\n`;
    out += `set(CPACK_PACKAGE_VERSION_MAJOR 1)\n`;
    out += `set(CPACK_PACKAGE_VERSION_MINOR 0)\n`;
    out += `set(CPACK_PACKAGE_VERSION_PATCH 0)\n`;

    out += `set(CPACK_PACKAGE_FILE_NAME exar-${typName.toLowerCase()}-`;
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
    generateTermination,
    generateTerminationHeader,
    generateExosPkg,
    generateWSLBuild,
    generateShBuild,
    generateLinuxPackage
}