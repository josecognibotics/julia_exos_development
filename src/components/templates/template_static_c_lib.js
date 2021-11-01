const { Datamodel } = require('../../datamodel');
const { TemplateLinuxTermination } = require('./linux/template_linux_termination');
const { Template, ApplicationTemplate } = require('./template')

class TemplateStaticCLib extends Template {

    /**
     * {@linkcode TemplateStaticCLib} Generate static C library for Linux and AR
     * 
     * This class creates a static wrapper library for simplified use of exos in C
     * 
     * - `{libName}.c` - {@linkcode generateLibSource} library source code
     * - `{libName}.h` - {@linkcode generateLibHeader} library header
     * - {@linkcode generateLegend} code comment to be added to the implementing source code - describing the library interface
     * 
     * @param {Datamodel} datamodel 
     * @param {boolean} Linux true if generated for Linux, false for AR
     */
    constructor(datamodel, Linux) {
        super(datamodel,Linux);
        this._templateLinuxTermination = new TemplateLinuxTermination();
    }

    generateLibSource() {

        /**
         * 
         * @param {ApplicationTemplate} template 
         * @param {boolean} PubSubSwap set to true if Linux (swap the pub and sub)
         * @returns {string} generated static library c code
         */
        function generateTemplate(template, PubSubSwap) {
            let out = "";
                
            //includes
        
            out += `#include <string.h>\n`;
        
            out += `#define EXOS_ASSERT_LOG &${template.logname}\n`;
            out += `#include "exos_log.h"\n`;
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
            out += `        VERBOSE("dataset %s updated! latency (us):%i", dataset->name, (exos_datamodel_get_nettime(dataset->datamodel) - dataset->nettime));\n`;
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
                    out += `if (0 == strcmp(dataset->name, "${dataset.structName}"))\n`;
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
            out += `        break;\n`;
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
            out += `        break;\n`;
            out += `    case EXOS_DATAMODEL_EVENT_SYNC_STATE_CHANGED:\n`;
            out += `        break;\n\n`;
            out += `    default:\n`;
            out += `        break;\n\n`;
            out += `    }\n`;
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
            out += `    return exos_datamodel_get_nettime(&(${template.datamodel.handleName}.${template.datamodel.varName}));\n`;
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
        
            out += `    memset(&${template.datamodel.handleName}, 0, sizeof(${template.datamodel.handleName}));\n\n`;
        
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
        
            out += `    exos_log_init(&${template.logname}, "${template.aliasName}");\n\n`;
            out += `    SUCCESS("starting ${template.aliasName} application..");\n\n`;
        
            //initialization
            out += `    EXOS_ASSERT_OK(exos_datamodel_init(&${template.datamodel.handleName}.${template.datamodel.varName}, "${template.datamodelInstanceName}", "${template.aliasName}"));\n\n`;
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
            out += `}\n`;
        
        
        
            return out;
        }

        return generateTemplate(this.template, this.isLinux);

    }

    generateLibHeader() {

        /**
         * 
         * @param {ApplicationTemplate} template 
         * @param {boolean} PubSubSwap set to true if Linux (swap the pub and sub)
         * @returns {string} generated static library header
         */
        function genenerateLibHeader(template, PubSubSwap) {
            let out = "";
        
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
                    out += `    ${Datamodel.convertPlcType(dataset.dataType)} value`;
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

        return genenerateLibHeader(this.template, this.isLinux);
    }

    generateLegend() {
        /**
         * 
         * @param {ApplicationTemplate} template 
         * @param {boolean} PubSubSwap set to true if Linux (swap the pub and sub)
         * @returns {string} comment section with help for programmers
         */
        function genenerateLegend(template, PubSubSwap) {
            let out = "";
        
            out += `/* ${template.datamodel.libStructName}_t datamodel features:\n`;
        
            out += `\nmain methods:\n`
            out += `    ${template.datamodel.varName}->connect()\n`;
            out += `    ${template.datamodel.varName}->disconnect()\n`;
            out += `    ${template.datamodel.varName}->process()\n`;
            out += `    ${template.datamodel.varName}->set_operational()\n`;
            out += `    ${template.datamodel.varName}->dispose()\n`;
            out += `    ${template.datamodel.varName}->get_nettime() : (int32_t) get current nettime\n`;
            out += `\nvoid(void) user callbacks:\n`
            out += `    ${template.datamodel.varName}->on_connected\n`;
            out += `    ${template.datamodel.varName}->on_disconnected\n`;
            out += `    ${template.datamodel.varName}->on_operational\n`;
            out += `\nboolean values:\n`
            out += `    ${template.datamodel.varName}->is_connected\n`;
            out += `    ${template.datamodel.varName}->is_operational\n`;
            out += `\nlogging methods:\n`
            out += `    ${template.datamodel.varName}->log.error(char *)\n`;
            out += `    ${template.datamodel.varName}->log.warning(char *)\n`;
            out += `    ${template.datamodel.varName}->log.success(char *)\n`;
            out += `    ${template.datamodel.varName}->log.info(char *)\n`;
            out += `    ${template.datamodel.varName}->log.debug(char *)\n`;
            out += `    ${template.datamodel.varName}->log.verbose(char *)\n`;  
            for (let dataset of template.datasets) {
                if (dataset.isSub || dataset.isPub) {
                    out += `\ndataset ${dataset.structName}:\n`;
                    
                    if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
                        out += `    ${template.datamodel.varName}->${dataset.structName}.publish()\n`;
                    }
                    if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
                        out += `    ${template.datamodel.varName}->${dataset.structName}.on_change : void(void) user callback function\n`;
                        out += `    ${template.datamodel.varName}->${dataset.structName}.nettime : (int32_t) nettime @ time of publish\n`;
                    }
                    out += `    ${template.datamodel.varName}->${dataset.structName}.value : (${Datamodel.convertPlcType(dataset.dataType)}`;
                    if (dataset.arraySize > 0) { // array comes before string length in c (unlike AS typ editor where it would be: STRING[80][0..1])
                        out += `[${parseInt(dataset.arraySize)}]`;
                    }
                    if (dataset.dataType.includes("STRING")) {
                        out += `[${parseInt(dataset.stringLength)}]) `;
                    } else {
                        out += `) `;
                    }
                    out += ` actual dataset value`;
                    if(Datamodel.isScalarType(dataset.dataType, true)) {
                        out += `\n`;
                    }
                    else {
                        out += `s\n`;
                    }
                }
            }
            out += `*/\n\n`;
        
            return out;
        }
        return genenerateLegend(this.template, this.isLinux);
    }
}

module.exports = {TemplateStaticCLib};