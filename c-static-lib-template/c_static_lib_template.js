const header = require('../exos_header');
const fs = require('fs');

function generateTemplate(fileName, typName, SUB, PUB, userAlias, dynamic) {
    let out = "";

    let template = configTemplate(fileName, typName);

    //includes

    out += `#include <string.h>\n`;

    out += `#define EXOS_ASSERT_LOG &${template.logname}\n`;
    out += `#include "exos_log.h"\n`;
    if(dynamic === undefined || dynamic == false) {
        out += `#define EXOS_STATIC_INCLUDE\n`
    }
    out += `#include "${template.libHeaderName}"\n\n`;

    out += `#define SUCCESS(_format_, ...) exos_log_success(&${template.logname}, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);\n`;
    out += `#define INFO(_format_, ...) exos_log_info(&${template.logname}, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);\n`;
    out += `#define VERBOSE(_format_, ...) exos_log_debug(&${template.logname}, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, _format_, ##__VA_ARGS__);\n`;
    out += `#define ERROR(_format_, ...) exos_log_error(&${template.logname}, _format_, ##__VA_ARGS__);\n`;
    out += `\nstatic exos_log_handle_t ${template.logname};\n\n`;

    out += `typedef struct ${template.datamodel.libStructName}Handle\n`;
    out += `{\n`;
    out += `    ${template.datamodel.libStructName}_t ext_${template.datamodel.varName};\n`;
    out += `    exos_datamodel_handle_t ${template.datamodel.varName};\n\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB) || dataset.comment.includes(SUB)) {
            out += `    exos_dataset_handle_t ${dataset.varName};\n`;
        }
    }
    out += `} ${template.datamodel.libStructName}Handle_t;\n\n`;

    out += `static ${template.datamodel.libStructName}Handle_t ${template.datamodel.handleName};\n\n`;

    out += `static void ${template.datamodel.libStructName}_datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info)\n{\n`;
    out += `    switch (event_type)\n    {\n`;
    out += `    case EXOS_DATASET_EVENT_UPDATED:\n`;
    out += `        VERBOSE("dataset %s updated! latency (us):%i", dataset->name, (exos_datamodel_get_nettime(dataset->datamodel,NULL) - dataset->nettime));\n`;
    out += `        //handle each subscription dataset separately\n`;
    var atleastone = false;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            if (atleastone) {
                out += `        else `;
            }
            else {
                out += `        `;
                atleastone = true;
            }
            out += `if (0 == strcmp(dataset->name,"${dataset.structName}"))\n`;
            out += `        {\n`;
            out += `            //update the nettime\n`;
            out += `            ${template.datamodel.handleName}.ext_${template.datamodel.varName}.${dataset.structName}.nettime = dataset->nettime;\n\n`;

            out += `            //trigger the callback if assigned\n`;
            out += `            if (NULL != ${template.datamodel.handleName}.ext_${template.datamodel.varName}.${dataset.structName}.on_change)\n`;
            out += `            {\n`;
            out += `                ${template.datamodel.handleName}.ext_${template.datamodel.varName}.${dataset.structName}.on_change();\n`;
            out += `            }\n`;
            out += `        }\n`;
        }
    }
    out += `        break;\n\n`;
    out += `    default:\n`;
    out += `        break;\n\n`;
    out += `    }\n`;
    out += `}\n\n`;

    out += `static void ${template.datamodel.libStructName}_datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info)\n{\n`;
    out += `    switch (event_type)\n    {\n`;
    out += `    case EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED:\n`;
    out += `        INFO("application changed state to %s", exos_get_state_string(datamodel->connection_state));\n\n`;
    out += `        ${template.datamodel.handleName}.ext_${template.datamodel.varName}.is_connected = false;\n`;
    out += `        ${template.datamodel.handleName}.ext_${template.datamodel.varName}.is_operational = false;\n`;
    out += `        switch (datamodel->connection_state)\n`;
    out += `        {\n`;
    out += `        case EXOS_STATE_DISCONNECTED:\n`;
    out += `            if (NULL != ${template.datamodel.handleName}.ext_${template.datamodel.varName}.on_disconnected)\n`;
    out += `            {\n`;
    out += `                ${template.datamodel.handleName}.ext_${template.datamodel.varName}.on_disconnected();\n`;
    out += `            }\n`;
    out += `            break;\n`;
    out += `        case EXOS_STATE_CONNECTED:\n`;
    out += `            ${template.datamodel.handleName}.ext_${template.datamodel.varName}.is_connected = true;\n`;
    out += `            if (NULL != ${template.datamodel.handleName}.ext_${template.datamodel.varName}.on_connected)\n`;
    out += `            {\n`;
    out += `                ${template.datamodel.handleName}.ext_${template.datamodel.varName}.on_connected();\n`;
    out += `            }\n`;
    out += `            break;\n`;
    out += `        case EXOS_STATE_OPERATIONAL:\n`;
    out += `            ${template.datamodel.handleName}.ext_${template.datamodel.varName}.is_connected = true;\n`;
    out += `            ${template.datamodel.handleName}.ext_${template.datamodel.varName}.is_operational = true;\n`;
    out += `            if (NULL != ${template.datamodel.handleName}.ext_${template.datamodel.varName}.on_operational)\n`;
    out += `            {\n`;
    out += `                ${template.datamodel.handleName}.ext_${template.datamodel.varName}.on_operational();\n`;
    out += `            }\n`;
    out += `            SUCCESS("${template.datamodel.structName} operational!");\n`
    out += `            break;\n`;
    out += `        case EXOS_STATE_ABORTED:\n`;
    out += `            if (NULL != ${template.datamodel.handleName}.ext_${template.datamodel.varName}.on_disconnected)\n`;
    out += `            {\n`;
    out += `                ${template.datamodel.handleName}.ext_${template.datamodel.varName}.on_disconnected();\n`;
    out += `            }\n`;
    out += `            ERROR("application error %d (%s) occured", datamodel->error, exos_get_error_string(datamodel->error));\n`;
    out += `            break;\n`;
    out += `        }\n`;
    out += `        break;\n    }\n`;
    out += `}\n\n`;


    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB)) {
            out += `static void ${template.datamodel.libStructName}_publish_${dataset.varName}(void)\n`;
            out += `{\n`;
            out += `    exos_dataset_publish(&${template.datamodel.handleName}.${dataset.varName});\n`;
            out += `}\n`;
        }
    }
    out += `\n`;
    
    out += `static void ${template.datamodel.libStructName}_connect(void)\n`;
    out += `{\n`;
    out += `    //connect the datamodel\n`;
    out += `    EXOS_ASSERT_OK(exos_datamodel_connect_${template.datamodel.structName.toLowerCase()}(&(${template.datamodel.handleName}.${template.datamodel.varName}), ${template.datamodel.libStructName}_datamodelEvent));\n`;
    out += `    \n`;

    out += `    //connect datasets\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            if (dataset.comment.includes(PUB)) {
                out += `    EXOS_ASSERT_OK(exos_dataset_connect(&(${template.datamodel.handleName}.${dataset.varName}), EXOS_DATASET_PUBLISH + EXOS_DATASET_SUBSCRIBE, ${template.datamodel.libStructName}_datasetEvent));\n`;
            }
            else {
                out += `    EXOS_ASSERT_OK(exos_dataset_connect(&(${template.datamodel.handleName}.${dataset.varName}), EXOS_DATASET_SUBSCRIBE, ${template.datamodel.libStructName}_datasetEvent));\n`;
            }
        }
        else {
            if (dataset.comment.includes(PUB)) {
                out += `    EXOS_ASSERT_OK(exos_dataset_connect(&(${template.datamodel.handleName}.${dataset.varName}), EXOS_DATASET_PUBLISH, ${template.datamodel.libStructName}_datasetEvent));\n`;
            }
        }
    }
    out += `}\n`;

    out += `static void ${template.datamodel.libStructName}_disconnect(void)\n`;
    out += `{\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.is_connected = false;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.is_operational = false;\n\n`;
    out += `    EXOS_ASSERT_OK(exos_datamodel_disconnect(&(${template.datamodel.handleName}.${template.datamodel.varName})));\n`;
    out += `}\n\n`;

    out += `static void ${template.datamodel.libStructName}_set_operational(void)\n`;
    out += `{\n`;
    out += `    EXOS_ASSERT_OK(exos_datamodel_set_operational(&(${template.datamodel.handleName}.${template.datamodel.varName})));\n`;
    out += `}\n\n`;

    out += `static void ${template.datamodel.libStructName}_process(void)\n`;
    out += `{\n`;
    out += `    EXOS_ASSERT_OK(exos_datamodel_process(&(${template.datamodel.handleName}.${template.datamodel.varName})));\n`;
    out += `    exos_log_process(&${template.logname});\n`;
    out += `}\n\n`;

    out += `static void ${template.datamodel.libStructName}_dispose(void)\n`;
    out += `{\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.is_connected = false;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.is_operational = false;\n\n`;
    out += `    EXOS_ASSERT_OK(exos_datamodel_delete(&(${template.datamodel.handleName}.${template.datamodel.varName})));\n`;
    out += `    exos_log_delete(&${template.logname});\n`;
    out += `}\n\n`;

    out += `static int32_t ${template.datamodel.libStructName}_get_nettime(void)\n`;
    out += `{\n`;
    out += `    return exos_datamodel_get_nettime(&(${template.datamodel.handleName}.${template.datamodel.varName}), NULL);\n`;
    out += `}\n\n`;

    out += `${template.datamodel.libStructName}_t *${template.datamodel.libStructName}_init(void)\n`;
    out += `{\n`;
    
    out += `    memset(&${template.datamodel.handleName},0,sizeof(${template.datamodel.handleName}));\n\n`;

    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB)) {
            out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.${dataset.structName}.publish = ${template.datamodel.libStructName}_publish_${dataset.varName};\n`;
        }
    }
    out += `    \n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.connect = ${template.datamodel.libStructName}_connect;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.disconnect = ${template.datamodel.libStructName}_disconnect;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.process = ${template.datamodel.libStructName}_process;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.set_operational = ${template.datamodel.libStructName}_set_operational;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.dispose = ${template.datamodel.libStructName}_dispose;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.get_nettime = ${template.datamodel.libStructName}_get_nettime;\n`;
    out += `    \n`;

    out += `    exos_log_init(&${template.logname}, "${userAlias}");\n\n`;
    out += `    SUCCESS("starting ${userAlias} application..");\n\n`;

    //initialization
    out += `    EXOS_ASSERT_OK(exos_datamodel_init(&${template.datamodel.handleName}.${template.datamodel.varName}, "${template.datamodel.structName}", "${userAlias}"));\n\n`;
    out += `    //set the user_context to access custom data in the callbacks\n`;
    out += `    ${template.datamodel.handleName}.${template.datamodel.varName}.user_context = NULL; //not used\n`;
    out += `    ${template.datamodel.handleName}.${template.datamodel.varName}.user_tag = 0; //not used\n\n`;

    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB) || dataset.comment.includes(SUB)) {
            out += `    EXOS_ASSERT_OK(exos_dataset_init(&${template.datamodel.handleName}.${dataset.varName}, &${template.datamodel.handleName}.${template.datamodel.varName}, "${dataset.structName}", &${template.datamodel.handleName}.ext_${template.datamodel.varName}.${dataset.structName}.value, sizeof(${template.datamodel.handleName}.ext_${template.datamodel.varName}.${dataset.structName}.value)));\n`;
            out += `    ${template.datamodel.handleName}.${dataset.varName}.user_context = NULL; //not used\n`;
            out += `    ${template.datamodel.handleName}.${dataset.varName}.user_tag = 0; //not used\n\n`;
        }
    }
    out += `    return &(${template.datamodel.handleName}.ext_${template.datamodel.varName});\n`;
    out += `}\n\n`;

   
    
    return out;
}

function genenerateLibHeader(fileName, typName, SUB, PUB) {
    let out = "";

    let template = configTemplate(fileName, typName);

    out += `#ifndef _${template.libHeaderName.toUpperCase().replace('.','_')}_\n`;
    out += `#define _${template.libHeaderName.toUpperCase().replace('.','_')}_\n\n`;

    out += `#include "${template.headerName}"\n\n`;

    out += `typedef void (*${template.datamodel.libStructName}_event_cb)(void);\n`;
    out += `typedef void (*${template.datamodel.libStructName}_method_fn)(void);\n`;
    out += `typedef int32_t (*${template.datamodel.libStructName}_get_nettime_fn)(void);\n\n`;

    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            out += `typedef struct ${dataset.libDataType}\n`;
            out += `{\n`;
            if (dataset.comment.includes(PUB)) {
                out += `    ${template.datamodel.libStructName}_method_fn publish;\n`;
            }
            out += `    ${template.datamodel.libStructName}_event_cb on_change;\n`;
            out += `    ${header.convertPlcType(dataset.dataType)} value;\n`;
            out += `    int32_t nettime;\n`;
            out += `} ${dataset.libDataType}_t;\n\n`;
        }
    }

    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB) && !dataset.comment.includes(SUB)) {
            out += `typedef struct ${dataset.libDataType}\n`;
            out += `{\n`;
            out += `    ${template.datamodel.libStructName}_method_fn publish;\n`;
            out += `    ${header.convertPlcType(dataset.dataType)} value;\n`;
            out += `} ${dataset.libDataType}_t;\n\n`;
        }
    }

    out += `typedef struct ${template.datamodel.libStructName}\n`;
    out += `{\n`;
    out += `    ${template.datamodel.libStructName}_method_fn connect;\n`;
    out += `    ${template.datamodel.libStructName}_method_fn disconnect;\n`;
    out += `    ${template.datamodel.libStructName}_method_fn process;\n`;
    out += `    ${template.datamodel.libStructName}_method_fn set_operational;\n`;
    out += `    ${template.datamodel.libStructName}_method_fn dispose;\n`;
    out += `    ${template.datamodel.libStructName}_get_nettime_fn get_nettime;\n`;

    out += `    ${template.datamodel.libStructName}_event_cb on_connected;\n`;
    out += `    ${template.datamodel.libStructName}_event_cb on_disconnected;\n`;
    out += `    ${template.datamodel.libStructName}_event_cb on_operational;\n`;
    out += `    bool is_connected;\n`;
    out += `    bool is_operational;\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB) || dataset.comment.includes(SUB)) {
            out += `    ${dataset.libDataType}_t ${dataset.structName};\n`;
        }
    }
    out += `} ${template.datamodel.libStructName}_t;\n\n`;

    out += `#ifdef __cplusplus\n`;
    out += `extern "C" {\n`;
    out += `#endif\n`;

    out += `${template.datamodel.libStructName}_t *${template.datamodel.libStructName}_init(void);\n`;
    
    out += `#ifdef __cplusplus\n`;
    out += `}\n`;
    out += `#endif\n`;

    out += `#endif // _${template.libHeaderName.toUpperCase().replace('.','_')}_\n`;


    return out;
}

function generateMainAR(fileName, typName, libName, SUB, PUB) {
    let out = "";
    let template = configTemplate(fileName, typName);

    out += `#include <string.h>\n`;
    out += `#include <bur/plctypes.h>\n`;
    out += `#include "../lib${libName}/${template.libHeaderName}"\n\n`;
    out += `#ifdef _DEFAULT_INCLUDES\n`;
    out += `	#include <AsDefault.h>\n`;
    out += `#endif\n\n`;

    out += `static ${template.datamodel.libStructName}_t *${template.datamodel.varName};\n\n`

    out += `static void on_connected_${template.datamodel.varName}(void)\n{\n}\n\n`;
    //out += `static void on_disconnected_${template.datamodel.varName}(void)\n{\n}\n\n`;
    //out += `static void on_operational_${template.datamodel.varName}(void)\n{\n}\n\n`;

    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            out += `static void on_change_${dataset.varName}(void)\n`;
            out += `{\n`;
            if(header.isScalarType(dataset.dataType) && dataset.arraySize == 0) {
                out += `    ${dataset.structName} = ${template.datamodel.varName}->${dataset.structName}.value;\n`;
            }
            else {
                out += `    memcpy(&${dataset.structName}, &(${template.datamodel.varName}->${dataset.structName}.value), sizeof(${dataset.structName}));\n`;
            }
            out += `}\n`;
        }
    }

    out += `void _INIT ProgramInit(void)\n`;
    out += `{\n`;
    out += `    //retrieve the ${template.datamodel.varName} structure\n`;
    out += `    ${template.datamodel.varName} = ${template.datamodel.libStructName}_init();\n\n`
    out += `    //setup callbacks\n`;
    out += `    ${template.datamodel.varName}->on_connected = on_connected_${template.datamodel.varName};\n`;
    out += `    // ${template.datamodel.varName}->on_disconnected = .. ;\n`;
    out += `    // ${template.datamodel.varName}->on_operational = .. ;\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            out += `    ${template.datamodel.varName}->${dataset.structName}.on_change = on_change_${dataset.varName};\n`;
        }
    }
    out += `}\n`;
    out += `\n`;
    out += `void _CYCLIC ProgramCyclic(void)\n`;
    out += `{\n`;
    out += `    if (Enable && !_Enable)\n`;
    out += `    {\n`;
    out += `        //connect to the server\n`;
    out += `        ${template.datamodel.varName}->connect();\n`;
    out += `    }\n`;
    out += `    if (!Enable && _Enable)\n`;
    out += `    {\n`;
    out += `        //disconnect from server\n`;
    out += `        ${template.datamodel.varName}->disconnect();\n`;
    out += `    }\n`;
    out += `    _Enable = Enable;\n\n`;
    out += `    //trigger callbacks\n`;
    out += `    ${template.datamodel.varName}->process();\n\n`;
    out += `    if (${template.datamodel.varName}->is_connected)\n`;
    out += `    {\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB)) {
            if(header.isScalarType(dataset.dataType)) {
                out += `        if (${template.datamodel.varName}->${dataset.structName}.value != ${dataset.structName})\n`;
                out += `        {\n`;
                out += `            ${template.datamodel.varName}->${dataset.structName}.value = ${dataset.structName};\n`;
                out += `            ${template.datamodel.varName}->${dataset.structName}.publish();\n`;
                out += `        }\n`;
            }
            else {
                out += `        if (memcmp(&(${template.datamodel.varName}->${dataset.structName}.value), &${dataset.structName}, sizeof(${dataset.structName})))\n`;
                out += `        {\n`;
                out += `            memcpy(&(${template.datamodel.varName}->${dataset.structName}.value), &${dataset.structName}, sizeof(${dataset.structName}));\n`;
                out += `            ${template.datamodel.varName}->${dataset.structName}.publish();\n`;
                out += `        }\n`;
            }
            out += "    \n";
        }
    }
    out += `    }\n`;
    out += `    Connected = ${template.datamodel.varName}->is_connected;\n`;
    out += `}\n\n`;
    out += `void _EXIT ProgramExit(void)\n`;
    out += `{\n`;
    out += `    //shutdown\n`;
    out += `    ${template.datamodel.varName}->dispose();\n\n`
    out += `}\n`;


    return out;
}

function generateMain(fileName, typName, SUB, PUB) {
    let out = "";

    let template = configTemplate(fileName, typName);

    out += `#include <unistd.h>\n`;
    out += `#include "${template.libHeaderName}"\n`
    out += `#include "termination.h"\n\n`;

    out += `static ${template.datamodel.libStructName}_t *${template.datamodel.varName};\n\n`

    out += `static void on_connected_${template.datamodel.varName}(void)\n{\n}\n\n`;
    //out += `static void on_disconnected_${template.datamodel.varName}(void)\n{\n}\n\n`;
    //out += `static void on_operational_${template.datamodel.varName}(void)\n{\n}\n\n`;

    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            out += `static void on_change_${dataset.varName}(void)\n`;
            out += `{\n`;
            out += `   // .. = ${template.datamodel.varName}->${dataset.structName}.value;\n`;
            out += `}\n`;
        }
    }

    out += `\nint main()\n{\n`
    out += `    //retrieve the ${template.datamodel.varName} structure\n`;
    out += `    ${template.datamodel.varName} = ${template.datamodel.libStructName}_init();\n\n`
    out += `    //setup callbacks\n`;
    out += `    ${template.datamodel.varName}->on_connected = on_connected_${template.datamodel.varName};\n`;
    out += `    // ${template.datamodel.varName}->on_disconnected = .. ;\n`;
    out += `    // ${template.datamodel.varName}->on_operational = .. ;\n`;
    
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            out += `    ${template.datamodel.varName}->${dataset.structName}.on_change = on_change_${dataset.varName};\n`;
        }
    }
    out += `\n    //connect to the server\n`;
    out += `    ${template.datamodel.varName}->connect();\n\n`;

    out += `    catch_termination();\n`;
    out += `    while (!is_terminated())\n    {\n`;
    out += `        //trigger callbacks\n`;
    out += `        ${template.datamodel.varName}->process();\n\n`;
    out += `        // if (${template.datamodel.varName}->is_connected)\n`;
    out += `        // {\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB)) {
            if(header.isScalarType(dataset.dataType)) {
                out += `        //     ${template.datamodel.varName}->${dataset.structName}.value = .. ;\n`;
            }
            else {
                out += `        //     ${template.datamodel.varName}->${dataset.structName}.value. .. = .. ;\n`;
            }
            out += `        //     ${template.datamodel.varName}->${dataset.structName}.publish();\n`;
            out += "        \n";
        }
    }
    out += `        // }\n`;

    out += `    }\n\n`;
    out += `    //shutdown\n`;
    out += `    ${template.datamodel.varName}->disconnect();\n`;
    out += `    ${template.datamodel.varName}->dispose();\n\n`;
    out += `    return 0;\n`
    out += `}\n`

    return out;
}

function configTemplate(fileName, typName) {
    var template = {
        headerName: "",
        libHeaderName: "",
        datamodel: {
            structName: "",
            varName: "",
            dataType: "",
            comment: "",
            libStructName: "",
            handleName: ""
        },
        datasets: [],
        logname: ""
    }

    if (fs.existsSync(fileName)) {

        var types = header.parseTypFile(fileName, typName);

        template.logname = "logger";
        template.headerName = `exos_${types.attributes.dataType.toLowerCase()}.h`
        template.libHeaderName = `lib${types.attributes.dataType.toLowerCase()}.h`

        template.datamodel.dataType = types.attributes.dataType;
        template.datamodel.structName = types.attributes.dataType;
        //check if toLowerCase is equal to datatype name, then extend it with _datamodel
        if (types.attributes.dataType == types.attributes.dataType.toLowerCase()) {
            template.datamodel.varName = types.attributes.dataType.toLowerCase() + "_datamodel";
        }
        else {
            template.datamodel.varName = types.attributes.dataType.toLowerCase();
        }

        template.datamodel.libStructName = "lib" + types.attributes.dataType;
        template.datamodel.handleName = "h_" + types.attributes.dataType;

        //check if toLowerCase is same as struct name, then extend it with _dataset
        for (let child of types.children) {
            if (child.attributes.name == child.attributes.name.toLowerCase()) {
                template.datasets.push({
                    structName: child.attributes.name,
                    varName: child.attributes.name.toLowerCase() + "_dataset",
                    dataType: child.attributes.dataType,
                    arraySize: child.attributes.arraySize,
                    comment: child.attributes.comment,
                    libDataType: template.datamodel.libStructName + child.attributes.name,
                });
            }
            else {
                template.datasets.push({
                    structName: child.attributes.name,
                    varName: child.attributes.name.toLowerCase(),
                    dataType: child.attributes.dataType,
                    arraySize: child.attributes.arraySize,
                    comment: child.attributes.comment,
                    libDataType: template.datamodel.libStructName + child.attributes.name
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

module.exports = {
    generateTemplate,
    generateMain,
    generateMainAR,
    genenerateLibHeader,
    configTemplate
}
