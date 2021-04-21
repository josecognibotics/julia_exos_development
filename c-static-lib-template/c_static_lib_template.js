const header = require('../exos_header');
const fs = require('fs');

function generateTemplate(fileName, typName, PubSubSwap, userAlias, dynamic) {
    let out = "";

    let template = configTemplate(fileName, typName);

    //includes

    out += `#include <string.h>\n`;

    out += `#define EXOS_ASSERT_LOG &${template.logname}\n`;
    out += `#include "exos_log.h"\n`;
    if (dynamic === undefined || dynamic == false) {
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
        if (dataset.isPub || dataset.isSub) {
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
        if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
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
        if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
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
        if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
            if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
                out += `    EXOS_ASSERT_OK(exos_dataset_connect(&(${template.datamodel.handleName}.${dataset.varName}), EXOS_DATASET_PUBLISH + EXOS_DATASET_SUBSCRIBE, ${template.datamodel.libStructName}_datasetEvent));\n`;
            }
            else {
                out += `    EXOS_ASSERT_OK(exos_dataset_connect(&(${template.datamodel.handleName}.${dataset.varName}), EXOS_DATASET_SUBSCRIBE, ${template.datamodel.libStructName}_datasetEvent));\n`;
            }
        }
        else {
            if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
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

    out += `static void ${template.datamodel.libStructName}_log_error(char* log_entry)\n`;
    out += `{\n`;
    out += `    exos_log_error(&${template.logname}, log_entry);\n`;
    out += `}\n\n`;

    out += `static void ${template.datamodel.libStructName}_log_warning(char* log_entry)\n`;
    out += `{\n`;
    out += `    exos_log_warning(&${template.logname}, EXOS_LOG_TYPE_USER, log_entry);\n`;
    out += `}\n\n`;

    out += `static void ${template.datamodel.libStructName}_log_success(char* log_entry)\n`;
    out += `{\n`;
    out += `    exos_log_success(&${template.logname}, EXOS_LOG_TYPE_USER, log_entry);\n`;
    out += `}\n\n`;

    out += `static void ${template.datamodel.libStructName}_log_info(char* log_entry)\n`;
    out += `{\n`;
    out += `    exos_log_info(&${template.logname}, EXOS_LOG_TYPE_USER, log_entry);\n`;
    out += `}\n\n`;

    out += `static void ${template.datamodel.libStructName}_log_debug(char* log_entry)\n`;
    out += `{\n`;
    out += `    exos_log_debug(&${template.logname}, EXOS_LOG_TYPE_USER, log_entry);\n`;
    out += `}\n\n`;

    out += `static void ${template.datamodel.libStructName}_log_verbose(char* log_entry)\n`;
    out += `{\n`;
    out += `    exos_log_warning(&${template.logname}, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, log_entry);\n`;
    out += `}\n\n`;

    out += `${template.datamodel.libStructName}_t *${template.datamodel.libStructName}_init(void)\n`;
    out += `{\n`;

    out += `    memset(&${template.datamodel.handleName},0,sizeof(${template.datamodel.handleName}));\n\n`;

    for (let dataset of template.datasets) {
        if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
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
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.log.error = ${template.datamodel.libStructName}_log_error;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.log.warning = ${template.datamodel.libStructName}_log_warning;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.log.success = ${template.datamodel.libStructName}_log_success;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.log.info = ${template.datamodel.libStructName}_log_info;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.log.debug = ${template.datamodel.libStructName}_log_debug;\n`;
    out += `    ${template.datamodel.handleName}.ext_${template.datamodel.varName}.log.verbose = ${template.datamodel.libStructName}_log_verbose;\n`;

    out += `    \n`;

    out += `    exos_log_init(&${template.logname}, "${userAlias}");\n\n`;
    out += `    SUCCESS("starting ${userAlias} application..");\n\n`;

    //initialization
    out += `    EXOS_ASSERT_OK(exos_datamodel_init(&${template.datamodel.handleName}.${template.datamodel.varName}, "${template.datamodel.structName}", "${userAlias}"));\n\n`;
    out += `    //set the user_context to access custom data in the callbacks\n`;
    out += `    ${template.datamodel.handleName}.${template.datamodel.varName}.user_context = NULL; //not used\n`;
    out += `    ${template.datamodel.handleName}.${template.datamodel.varName}.user_tag = 0; //not used\n\n`;

    for (let dataset of template.datasets) {
        if (dataset.isPub || dataset.isSub) {
            out += `    EXOS_ASSERT_OK(exos_dataset_init(&${template.datamodel.handleName}.${dataset.varName}, &${template.datamodel.handleName}.${template.datamodel.varName}, "${dataset.structName}", &${template.datamodel.handleName}.ext_${template.datamodel.varName}.${dataset.structName}.value, sizeof(${template.datamodel.handleName}.ext_${template.datamodel.varName}.${dataset.structName}.value)));\n`;
            out += `    ${template.datamodel.handleName}.${dataset.varName}.user_context = NULL; //not used\n`;
            out += `    ${template.datamodel.handleName}.${dataset.varName}.user_tag = 0; //not used\n\n`;
        }
    }
    out += `    return &(${template.datamodel.handleName}.ext_${template.datamodel.varName});\n`;
    out += `}\n\n`;



    return out;
}

function genenerateLibHeader(fileName, typName, PubSubSwap) {
    let out = "";

    let template = configTemplate(fileName, typName);

    out += `#ifndef _${template.libHeaderName.toUpperCase().replace('.', '_')}_\n`;
    out += `#define _${template.libHeaderName.toUpperCase().replace('.', '_')}_\n\n`;

    out += `#include "${template.headerName}"\n\n`;

    out += `typedef void (*${template.datamodel.libStructName}_event_cb)(void);\n`;
    out += `typedef void (*${template.datamodel.libStructName}_method_fn)(void);\n`;
    out += `typedef int32_t (*${template.datamodel.libStructName}_get_nettime_fn)(void);\n`;
    out += `typedef void (*${template.datamodel.libStructName}_log_fn)(char *log_entry);\n\n`;

    for (let dataset of template.datasets) {
        if (dataset.isSub || dataset.isPub) {
            out += `typedef struct ${dataset.libDataType}\n`;
            out += `{\n`;
            if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
                out += `    ${template.datamodel.libStructName}_method_fn publish;\n`;
            }
            if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
                out += `    ${template.datamodel.libStructName}_event_cb on_change;\n`;
                out += `    int32_t nettime;\n`;
            }
            out += `    ${header.convertPlcType(dataset.dataType)} value`;
            if (dataset.arraySize > 0) { // array comes before string length in c (unlike AS typ editor where it would be: STRING[80][0..1])
                out += `[${parseInt(dataset.arraySize)}]`;
            }
            if (dataset.dataType.includes("STRING")) {
                out += `[${parseInt(dataset.stringLength)}];\n`;
            } else {
                out += `;\n`;
            }
            out += `} ${dataset.libDataType}_t;\n\n`;
        }
    }
    out += `typedef struct ${template.datamodel.libStructName}_log\n`;
    out += `{\n`;
    out += `    ${template.datamodel.libStructName}_log_fn error;\n`;
    out += `    ${template.datamodel.libStructName}_log_fn warning;\n`;
    out += `    ${template.datamodel.libStructName}_log_fn success;\n`;
    out += `    ${template.datamodel.libStructName}_log_fn info;\n`;
    out += `    ${template.datamodel.libStructName}_log_fn debug;\n`;
    out += `    ${template.datamodel.libStructName}_log_fn verbose;\n`;  
    out += `} ${template.datamodel.libStructName}_log_t;\n\n`;

    out += `typedef struct ${template.datamodel.libStructName}\n`;
    out += `{\n`;
    out += `    ${template.datamodel.libStructName}_method_fn connect;\n`;
    out += `    ${template.datamodel.libStructName}_method_fn disconnect;\n`;
    out += `    ${template.datamodel.libStructName}_method_fn process;\n`;
    out += `    ${template.datamodel.libStructName}_method_fn set_operational;\n`;
    out += `    ${template.datamodel.libStructName}_method_fn dispose;\n`;
    out += `    ${template.datamodel.libStructName}_get_nettime_fn get_nettime;\n`;
    out += `    ${template.datamodel.libStructName}_log_t log;\n`;  
    out += `    ${template.datamodel.libStructName}_event_cb on_connected;\n`;
    out += `    ${template.datamodel.libStructName}_event_cb on_disconnected;\n`;
    out += `    ${template.datamodel.libStructName}_event_cb on_operational;\n`;
    out += `    bool is_connected;\n`;
    out += `    bool is_operational;\n`;
    for (let dataset of template.datasets) {
        if (dataset.isPub || dataset.isSub) {
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

    out += `#endif // _${template.libHeaderName.toUpperCase().replace('.', '_')}_\n`;


    return out;
}

function generateMainAR(fileName, typName, libName, PubSubSwap) {
    let out = "";
    let template = configTemplate(fileName, typName);

    out += `#include <string.h>\n`;
    out += `#include <stdbool.h>\n`;
    out += `#include "${template.libHeaderName}"\n\n`;

    out += `static ${template.datamodel.libStructName}_t *${template.datamodel.varName};\n`;
    out += `static struct ${template.datamodel.structName}Cyclic *cyclic_inst;\n\n`;

    out += `static void on_connected_${template.datamodel.varName}(void)\n{\n}\n\n`;

    for (let dataset of template.datasets) {
        if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
            out += `static void on_change_${dataset.varName}(void)\n`;
            out += `{\n`;
            if (header.isScalarType(dataset.dataType) && dataset.arraySize == 0) {
                out += `    cyclic_inst->p${template.datamodel.structName}->${dataset.structName} = ${template.datamodel.varName}->${dataset.structName}.value;\n`;
            }
            else {
                out += `    memcpy(&(cyclic_inst->p${template.datamodel.structName}->${dataset.structName}), &(${template.datamodel.varName}->${dataset.structName}.value), sizeof(cyclic_inst->p${template.datamodel.structName}->${dataset.structName}));\n`;
            }
            out += `    \n`;
            out += `    // Your code here...\n`;
            out += `}\n`;
        }
    }

    out += `_BUR_PUBLIC void ${template.datamodel.structName}Cyclic(struct ${template.datamodel.structName}Cyclic *inst)\n`;
    out += `{\n`;
    out += `    // check if function block has been created before\n`;
    out += `    if(cyclic_inst != NULL)\n`;
    out += `    {\n`;
    out += `        // return error if more than one function blocks have been created\n`;
    out += `        if(inst != cyclic_inst)\n`;
    out += `        {\n`;
    out += `            inst->Operational = false;\n`;
    out += `            inst->Connected = false;\n`;
    out += `            inst->Error = true;\n`;
    out += `            return;\n`;
    out += `        }\n`;
    out += `    }\n`;
    out += `    cyclic_inst = inst;\n`;
    out += `    // initialize library\n`;
    out += `    if((${template.datamodel.libStructName}_t *)inst->_Handle == NULL || (${template.datamodel.libStructName}_t *)inst->_Handle != ${template.datamodel.varName})\n`;
    out += `    {\n`;
    out += `        //retrieve the ${template.datamodel.varName} structure\n`;
    out += `        ${template.datamodel.varName} = ${template.datamodel.libStructName}_init();\n\n`
    out += `        //setup callbacks\n`;
    out += `        ${template.datamodel.varName}->on_connected = on_connected_${template.datamodel.varName};\n`;
    out += `        // ${template.datamodel.varName}->on_disconnected = .. ;\n`;
    out += `        // ${template.datamodel.varName}->on_operational = .. ;\n`;
    for (let dataset of template.datasets) {
        if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
            out += `        ${template.datamodel.varName}->${dataset.structName}.on_change = on_change_${dataset.varName};\n`;
        }
    }
    out += `\n`;
    out += `        inst->_Handle = (UDINT)${template.datamodel.varName};\n`;
    out += `    }\n`;

    out += `    // return error if reference to structure is not set on function block\n`;
    out += `    if(inst->p${template.datamodel.structName} == NULL)\n`;
    out += `    {\n`;
    out += `        inst->Operational = false;\n`;
    out += `        inst->Connected = false;\n`;
    out += `        inst->Error = true;\n`;
    out += `        return;\n`;
    out += `    }\n`;

    out += `    if (inst->Enable && !inst->_Enable)\n`;
    out += `    {\n`;
    out += `        //connect to the server\n`;
    out += `        ${template.datamodel.varName}->connect();\n`;
    out += `    }\n`;
    out += `    if (!inst->Enable && inst->_Enable)\n`;
    out += `    {\n`;
    out += `        //disconnect from server\n`;
    out += `        cyclic_inst = NULL;\n`;
    out += `        ${template.datamodel.varName}->disconnect();\n`;
    out += `    }\n`;
    out += `    inst->_Enable = inst->Enable;\n\n`;

    out += `    if(inst->Start && !inst->_Start && ${template.datamodel.varName}->is_connected)\n`;
    out += `    {\n`;
    out += `        ${template.datamodel.varName}->set_operational();\n`;
    out += `        inst->_Start = inst->Start;\n`;
    out += `    }\n`;
    out += `    if(!inst->Start)\n`;
    out += `    {\n`;
    out += `        inst->_Start = false;\n`;
    out += `    }\n`;
    out += `\n`;

    out += `    //trigger callbacks\n`;
    out += `    ${template.datamodel.varName}->process();\n\n`;
    out += `    if (${template.datamodel.varName}->is_connected)\n`;
    out += `    {\n`;
    for (let dataset of template.datasets) {
        if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
            if (header.isScalarType(dataset.dataType) && dataset.arraySize == 0) {
                out += `        if (${template.datamodel.varName}->${dataset.structName}.value != inst->p${template.datamodel.structName}->${dataset.structName})\n`;
                out += `        {\n`;
                out += `            ${template.datamodel.varName}->${dataset.structName}.value = inst->p${template.datamodel.structName}->${dataset.structName};\n`;
                out += `            ${template.datamodel.varName}->${dataset.structName}.publish();\n`;
                out += `        }\n`;
            }
            else {
                out += `        if (memcmp(&(${template.datamodel.varName}->${dataset.structName}.value), &(inst->p${template.datamodel.structName}->${dataset.structName}), sizeof(inst->p${template.datamodel.structName}->${dataset.structName})))\n`;
                out += `        {\n`;
                out += `            memcpy(&(${template.datamodel.varName}->${dataset.structName}.value), &(inst->p${template.datamodel.structName}->${dataset.structName}), sizeof(${template.datamodel.varName}->${dataset.structName}.value));\n`;
                out += `            ${template.datamodel.varName}->${dataset.structName}.publish();\n`;
                out += `        }\n`;
            }
            out += "    \n";
        }
    }
    out += `        // Your code here...\n`;
    out += `    }\n`;
    out += `    inst->Connected = ${template.datamodel.varName}->is_connected;\n`;
    out += `    inst->Operational = ${template.datamodel.varName}->is_operational;\n`;
    out += `}\n\n`;

    out += `UINT _EXIT ProgramExit(unsigned long phase)\n`;
    out += `{\n`;
    out += `    //shutdown\n`;
    out += `    ${template.datamodel.varName}->dispose();\n`
    out += `    cyclic_inst = NULL;\n`;
    out += `    return 0;\n`;
    out += `}\n`;

    return out;
}

function generateMain(fileName, typName, PubSubSwap) {
    let out = "";

    let template = configTemplate(fileName, typName);

    out += `#include <unistd.h>\n`;
    out += `#include "${template.libHeaderName}"\n`
    out += `#include "termination.h"\n`;
    out += `#include <stdio.h>\n\n`;

    out += `static ${template.datamodel.libStructName}_t *${template.datamodel.varName};\n\n`

    out += `static void on_connected_${template.datamodel.varName}(void)\n{\n`;
    out += `   ${template.datamodel.varName}->log.success("${template.datamodel.varName} connected!");\n`;
    out += `}\n\n`;

    //out += `static void on_disconnected_${template.datamodel.varName}(void)\n{\n}\n\n`;
    //out += `static void on_operational_${template.datamodel.varName}(void)\n{\n}\n\n`;

    for (let dataset of template.datasets) {
        if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
            out += `static void on_change_${dataset.varName}(void)\n`;
            out += `{\n`;
            out += `   ${template.datamodel.varName}->log.verbose("${template.datamodel.varName}->${dataset.structName} changed!");\n`;
            if(process.env.VSCODE_DEBUG_MODE) {    
                if (dataset.arraySize == 0) {
                    out += `   printf("on_change: ${template.datamodel.varName}->${dataset.structName}: ${header.convertPlcTypePrintf(dataset.dataType)}\\n", ${template.datamodel.varName}->${dataset.structName}.value);\n`;
                } else {
                    out += `   uint32_t i;\n`;
                    out += `   printf("on_change: ${template.datamodel.varName}->${dataset.structName}: Array of ${header.convertPlcType(dataset.dataType)}${dataset.dataType.includes("STRING") ? "[]" : ""}:\\n");\n`;
                    out += `   for(i = 0; i < sizeof(${template.datamodel.varName}->${dataset.structName}.value) / sizeof(${template.datamodel.varName}->${dataset.structName}.value[0]); i++ )\n`;
                    out += `   {\n`;
                    out += `       printf("  Index %i: ${header.convertPlcTypePrintf(dataset.dataType)}\\n", i, ${template.datamodel.varName}->${dataset.structName}.value[i]);\n`;
                    out += `   }\n`;
                }
                out += `   \n`;
            }
            out += `   // Your code here...\n`;
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
        if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
            out += `    ${template.datamodel.varName}->${dataset.structName}.on_change = on_change_${dataset.varName};\n`;
        }
    }
    out += `\n    //connect to the server\n`;
    out += `    ${template.datamodel.varName}->connect();\n\n`;

    out += `    catch_termination();\n`;
    out += `    while (!is_terminated())\n    {\n`;
    out += `        //trigger callbacks and synchronize with AR\n`;
    out += `        ${template.datamodel.varName}->process();\n\n`;
    out += `        // if (${template.datamodel.varName}->is_connected)\n`;
    out += `        // {\n`;
    for (let dataset of template.datasets) {
        if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
            out += `        //     ${template.datamodel.varName}->${dataset.structName}.value${dataset.arraySize > 0 ? "[..]" : ""}${header.isScalarType(dataset.dataType) ? "" : ". .."} = .. ;\n`;
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

        for (let child of types.children) {
            let object = {};
            object["structName"] = child.attributes.name;
            object["varName"] = child.attributes.name.toLowerCase() + (child.attributes.name == child.attributes.name.toLowerCase() ? "_dataset" : "");
            object["dataType"] = child.attributes.dataType;
            object["libDataType"] = "lib" + child.attributes.name;
            if (typeof child.attributes.arraySize === "number") {
                object["arraySize"] = child.attributes.arraySize;
            } else {
                object["arraySize"] = 0;
            }
            object["comment"] = child.attributes.comment;
            if (typeof child.attributes.comment === "string") {
                object["isPub"] = child.attributes.comment.includes("PUB");
                object["isSub"] = child.attributes.comment.includes("SUB");
                object["isPrivate"] = child.attributes.comment.includes("private");
            } else {
                object["comment"] = "";
                object["isPub"] = false;
                object["isSub"] = false;
                object["isPrivate"] = false;
            }
            if (child.attributes.hasOwnProperty("stringLength")) { object["stringLength"] = child.attributes.stringLength; }
            template.datasets.push(object);
        }
    } else {
        throw (`file '${fileName}' not found.`);
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
