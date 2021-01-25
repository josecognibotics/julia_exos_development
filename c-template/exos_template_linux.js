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
    out += `    <Object Type="File">exos_${typName.toLowerCase()}.h</Object>\n`;
    out += `    <Object Type="File">${typName.toLowerCase()}.c</Object>\n`;
    out += `    <Object Type="File">termination.c</Object>\n`;
    out += `    <Object Type="File">termination.h</Object>\n`;
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
    out += `Copy-Item -Path "$PSScriptRoot\\build\\exos-comp-${typName.toLowerCase()}-*.deb" -Destination "$PSScriptRoot\\..\\..\\..\\"\n`;
    out += `Remove-Item "$PSScriptRoot\\build\\*" -Recurse\n`;
    out += `\n`;

    return out;
}

function generateExosPkg(typName,libName,fileName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<ComponentPackage Version="1.0.0" ErrorHandling="Ignore" StartupTimeout="0">\n`;
    out += `    <File Name="exos-comp-${typName.toLowerCase()}" FileName="Linux\\exos-comp-${typName.toLowerCase()}-1.0.0.deb" Type="Project"/>\n`;
    out += `    <Service Name="${typName} Runtime Service" Executable="/home/user/${typName.toLowerCase()}" Arguments=""/>\n`;
    out += `    <DataModelInstance Name="${typName}"/>\n`;
    out += `    <Build>\n`;
    out += `        <GenerateHeader FileName="${libName}\\${fileName}" TypeName="${typName}">\n`;
    out += `            <SG4 Include="${libName}.h"/>\n`;
    out += `            <Output Path="Linux"/>\n`;
    out += `            <Output Path="${libName}"/>\n`;
    out += `        </GenerateHeader>\n`;
    out += `        <BuildCommand Command="C:\\Windows\\Sysnative\\wsl.exe" WorkingDirectory="Linux" Arguments="-d Debian -e sh build.sh">\n`;
    out += `            <Dependency FileName="Linux\\exos_${typName.toLowerCase()}.h"/>\n`;
    out += `            <Dependency FileName="Linux\\${typName.toLowerCase()}.c"/>\n`;
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
    out += `add_executable(${typName.toLowerCase()} ${typName.toLowerCase()}.c termination.c)\n`;
    out += `target_include_directories(${typName.toLowerCase()} PUBLIC ..)\n`;
    out += `target_link_libraries(${typName.toLowerCase()} zmq exos-api)\n`;
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

function generateExosIncludes(template) {
    let out = "";

    out += `#define EXOS_ASSERT_LOG &${template.logname}\n`;
    out += `#include "exos_log.h"\n`;
    out += `#include "exos_${template.datamodel.dataType.toLowerCase()}.h"\n\n`;

    out += `#define SUCCESS(_format_, ...) exos_log_success(&${template.logname}, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);\n`;
    out += `#define INFO(_format_, ...) exos_log_info(&${template.logname}, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);\n`;
    out += `#define VERBOSE(_format_, ...) exos_log_debug(&${template.logname}, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, _format_, ##__VA_ARGS__);\n`;
    out += `#define ERROR(_format_, ...) exos_log_error(&${template.logname}, _format_, ##__VA_ARGS__);\n`;
    out += `\nexos_log_handle_t ${template.logname};\n\n`;

    return out;
}

function generateExosCallbacks(template) {
    let out = "";
    out += `static void datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info)\n{\n`;
    out += `    switch (event_type)\n    {\n`;
    out += `    case EXOS_DATASET_EVENT_UPDATED:\n`;
    out += `        VERBOSE("dataset %s updated! latency (us):%i", dataset->name, (exos_datamodel_get_nettime(dataset->datamodel,NULL) - dataset->nettime));\n`;
    out += `        //handle each subscription dataset separately\n`;
    var atleastone = false;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes("PUB")) {
            if (atleastone) {
                out += `        else `;
            }
            else {
                out += `        `;
                atleastone = true;
            }
            out += `if(0 == strcmp(dataset->name,"${dataset.structName}"))\n`;
            out += `        {\n`;
            out += `            ${header.convertPlcType(dataset.dataType)} *${dataset.varName} = (${header.convertPlcType(dataset.dataType)} *)dataset->data;\n`;
            out += `        }\n`;
        }
    }
    out += `        break;\n\n`;

    out += `    case EXOS_DATASET_EVENT_PUBLISHED:\n`;
    out += `        VERBOSE("dataset %s published to local server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);\n`;
    out += `        //handle each published dataset separately\n`;
    atleastone = false;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes("SUB")) {
            if (atleastone) {
                out += `        else `;
            }
            else {
                out += `        `;
                atleastone = true;
            }
            out += `if(0 == strcmp(dataset->name, "${dataset.structName}"))\n`;
            out += `        {\n`;
            out += `            ${header.convertPlcType(dataset.dataType)} *${dataset.varName} = (${header.convertPlcType(dataset.dataType)} *)dataset->data;\n`;
            out += `        }\n`;
        }
    }
    out += `        break;\n\n`;

    out += `    case EXOS_DATASET_EVENT_DELIVERED:\n`;
    out += `        VERBOSE("dataset %s delivered to remote server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);\n`;
    out += `        //handle each published dataset separately\n`;
    atleastone = false;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes("SUB")) {
            if (atleastone) {
                out += `        else `;
            }
            else {
                out += `        `;
                atleastone = true;
            }
            out += `if(0 == strcmp(dataset->name, "${dataset.structName}"))\n`;
            out += `        {\n`;
            out += `            ${header.convertPlcType(dataset.dataType)} *${dataset.varName} = (${header.convertPlcType(dataset.dataType)} *)dataset->data;\n`;
            out += `        }\n`;
        }
    }
    out += `        break;\n\n`;

    out += `    case EXOS_DATASET_EVENT_CONNECTION_CHANGED:\n`;
    out += `        INFO("dataset %s changed state to %s", dataset->name, exos_get_state_string(dataset->connection_state));\n\n`;
    out += `        switch (dataset->connection_state)\n`;
    out += `        {\n`;
    out += `        case EXOS_STATE_DISCONNECTED:\n`;
    out += `            break;\n`;
    out += `        case EXOS_STATE_CONNECTED:\n`;
    out += `            //call the dataset changed event to update the dataset when connected\n`;
    out += `            //datasetEvent(dataset,EXOS_DATASET_UPDATED,info);\n`;
    out += `            break;\n`;
    out += `        case EXOS_STATE_OPERATIONAL:\n`;
    out += `            break;\n`;
    out += `        case EXOS_STATE_ABORTED:\n`;
    out += `            ERROR("dataset %s error %d (%s) occured", dataset->name, dataset->error, exos_get_error_string(dataset->error));\n`;
    out += `            break;\n`;
    out += `        }\n`;
    out += `        break;\n`;
    out += `    }\n\n`;

    out += `}\n\n`;

    out += `static void datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info)\n{\n`;
    out += `    switch (event_type)\n    {\n`;
    out += `    case EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED:\n`;
    out += `        INFO("application changed state to %s", exos_get_state_string(datamodel->connection_state));\n\n`;
    out += `        switch (datamodel->connection_state)\n`;
    out += `        {\n`;
    out += `        case EXOS_STATE_DISCONNECTED:\n`;
    out += `            break;\n`;
    out += `        case EXOS_STATE_CONNECTED:\n`;
    out += `            break;\n`;
    out += `        case EXOS_STATE_OPERATIONAL:\n`;
    out += `            SUCCESS("${template.datamodel.structName} operational!");\n`
    out += `            break;\n`;
    out += `        case EXOS_STATE_ABORTED:\n`;
    out += `            ERROR("application error %d (%s) occured", datamodel->error, exos_get_error_string(datamodel->error));\n`;
    out += `            break;\n`;
    out += `        }\n`;
    out += `        break;\n    }\n`;
    out += `}\n\n`;

    return out;
}

function generateExosInit(template) {
    var out = "";

    out += `    ${template.datamodel.structName} data;\n\n`;
    out += `    exos_datamodel_handle_t ${template.datamodel.varName};\n\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes("PUB") || dataset.comment.includes("SUB")) {
            out += `    exos_dataset_handle_t ${dataset.varName};\n`;
        }
    }
    out += `    \n`;
    out += `    exos_log_init(&${template.logname}, "${template.datamodel.structName}_Linux");\n\n`;
    out += `    SUCCESS("starting ${template.datamodel.structName} application..");\n\n`;

    //initialization
    out += `    EXOS_ASSERT_OK(exos_datamodel_init(&${template.datamodel.varName}, "${template.datamodel.structName}", "${template.datamodel.structName}_Linux"));\n\n`;
    out += `    //set the user_context to access custom data in the callbacks\n`;
    out += `    ${template.datamodel.varName}.user_context = NULL; //user defined\n`;
    out += `    ${template.datamodel.varName}.user_tag = 0; //user defined\n\n`;

    for (let dataset of template.datasets) {
        if (dataset.comment.includes("PUB") || dataset.comment.includes("SUB")) {
            out += `    EXOS_ASSERT_OK(exos_dataset_init(&${dataset.varName}, &${template.datamodel.varName}, "${dataset.structName}", &data.${dataset.structName}, sizeof(data.${dataset.structName})));\n`;
            out += `    ${dataset.varName}.user_context = NULL; //user defined\n`;
            out += `    ${dataset.varName}.user_tag = 0; //user defined\n\n`;
        }
    }
    out += `    //connect the datamodel\n`;
    out += `    EXOS_ASSERT_OK(exos_datamodel_connect_${template.datamodel.structName.toLowerCase()}(&${template.datamodel.varName}, datamodelEvent));\n`;
    out += `    \n`;

    out += `    //connect datasets\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes("SUB")) {
            out += `    EXOS_ASSERT_OK(exos_dataset_connect(&${dataset.varName}, EXOS_DATASET_PUBLISH, datasetEvent));\n`;
        }
    }
    for (let dataset of template.datasets) {
        if (dataset.comment.includes("PUB")) {
            if (dataset.comment.includes("SUB")) {
                out += `    EXOS_ASSERT_OK(exos_dataset_connect(&${dataset.varName}, EXOS_DATASET_PUBLISH + EXOS_DATASET_SUBSCRIBE, datasetEvent));\n`;
            }
            else {
                out += `    EXOS_ASSERT_OK(exos_dataset_connect(&${dataset.varName}, EXOS_DATASET_SUBSCRIBE, datasetEvent));\n`;
            }
        }
    }
    out += `    \n`;

    return out;
}

function generateExosCyclic(template) {
    var out = "";
    out += `        EXOS_ASSERT_OK(exos_datamodel_process(&${template.datamodel.varName}));\n`;
    out += `        exos_log_process(&${template.logname});\n\n`;
    out += `        //put your cyclic code here!\n\n`;

    return out;
}

function generateExosExit(template) {
    var out = "";

    out += `\n`;
    out += `    EXOS_ASSERT_OK(exos_datamodel_delete(&${template.datamodel.varName}));\n\n`;

    out += `    //finish with deleting the log\n`;
    out += `    exos_log_delete(&${template.logname});\n`;

    return out;
}

function generateTemplate(fileName, typName) {
    let out = "";

    let template = configTemplate(fileName, typName);

    //includes

    out += `#include <unistd.h>\n`;
    out += `#include <string.h>\n`;
    out += `#include "termination.h"\n\n`;
    out += generateExosIncludes(template);

    out += generateExosCallbacks(template);

    //declarations
    out += `int main()\n{\n`

    out += generateExosInit(template);

    out += `    catch_termination();\n`;

    //main loop
    out += `    while (true)\n    {\n`;

    out += generateExosCyclic(template);
    out += `        if (is_terminated())\n`;
    out += `        {\n`;
    out += `            SUCCESS("${template.datamodel.structName} application terminated, closing..");\n`;
    out += `            break;\n`;
    out += `        }\n`;
    out += `    }\n\n`;

    //unregister

    out += generateExosExit(template);

    out += `    return 0;\n`
    out += `}\n`

    return out;
}

function configTemplate(fileName, typName) {
    var template = {
        headerName: "",
        datamodel: {
            structName: "",
            varName: "",
            dataType: "",
            comment: ""
        },
        datasets: [],
        logname: ""
    }

    if (fs.existsSync(fileName)) {

        var types = header.parseTypFile(fileName, typName);

        template.logname = "logger";
        template.headerName = `exos_${types.attributes.dataType.toLowerCase()}.h`

        template.datamodel.dataType = types.attributes.dataType;
        template.datamodel.structName = types.attributes.dataType;
        //check if toLowerCase is equal to datatype name, then extend it with _datamodel
        if (types.attributes.dataType == types.attributes.dataType.toLowerCase()) {
            template.datamodel.varName = types.attributes.dataType.toLowerCase() + "_datamodel";
        }
        else {
            template.datamodel.varName = types.attributes.dataType.toLowerCase();
        }

        //check if toLowerCase is same as struct name, then extend it with _dataset
        for (let child of types.children) {
            if (child.attributes.name == child.attributes.name.toLowerCase()) {
                template.datasets.push({
                    structName: child.attributes.name,
                    varName: child.attributes.name.toLowerCase() + "_dataset",
                    dataType: child.attributes.dataType,
                    arraySize: child.attributes.arraySize,
                    comment: child.attributes.comment
                });
            }
            else {
                template.datasets.push({
                    structName: child.attributes.name,
                    varName: child.attributes.name.toLowerCase(),
                    dataType: child.attributes.dataType,
                    arraySize: child.attributes.arraySize,
                    comment: child.attributes.comment
                });
            }
        }

        // initialize non-string comments to "" and missing arraysizes to 0
        for (let dataset of template.datasets) {
            if (typeof dataset.comment !== 'string') {
                dataset.comment = "";
            }
            if (typeof dataset.arraySize !== 'number') {
                dataset.arraySize = 0;
            }
        }

    } else {
        throw(`file '${fileName}' not found.`);
    }

    return template;
}

if (require.main === module) {
    if (process.argv.length > 3) {
        let outPath = process.argv[4];
        if (outPath == "" || outPath == undefined) {
            outPath = ".";
        }
        let fileName = process.argv[2];
        let structName = process.argv[3];

        try {
            let out = generateTemplate(fileName, structName);
            fs.writeFileSync(`${outPath}/exos_template_${structName.toLowerCase()}_linux.c`, out);
            process.stdout.write(`${outPath}/exos_template_${structName.toLowerCase()}_linux.c generated`);    
        } catch (error) {
            process.stderr.write(error);
        }
    }
    else {
        process.stderr.write(" - usage: ./exos_template_linux.js <filename.typ> <structname> <template output folder>\n");
    }
}

module.exports = {
    generateExosPkg,
    generateLinuxPackage,
    generateTemplate,
    generateTerminationHeader,
    generateTermination,
    generateCMakeLists,
    generateWSLBuild,
    generateShBuild
}
