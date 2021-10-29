const { Template, ApplicationTemplate } = require('../template')
const { Datamodel } = require('../../../datamodel');

class TemplateLinuxC extends Template {
    constructor(datamodel) {
        super(datamodel,true);
    }

    generateSource() {
        /**
         * @param {ApplicationTemplate} template 
         * @returns {string}
         */
        function generateIncludes(template) {
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
        
        /**
         * @param {ApplicationTemplate} template 
         * @returns {string}
         */
        function generateCallbacks(template) {
            let out = "";
            out += `static void datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info)\n{\n`;
            out += `    switch (event_type)\n    {\n`;
            out += `    case EXOS_DATASET_EVENT_UPDATED:\n`;
            out += `        VERBOSE("dataset %s updated! latency (us):%i", dataset->name, (exos_datamodel_get_nettime(dataset->datamodel) - dataset->nettime));\n`;
            out += `        //handle each subscription dataset separately\n`;
            var atleastone = false;
            for (let dataset of template.datasets) {
                if (dataset.isPub) {
                    if (atleastone) {
                        out += `        else `;
                    }
                    else {
                        out += `        `;
                        atleastone = true;
                    }
                    out += `if(0 == strcmp(dataset->name,"${dataset.structName}"))\n`;
                    out += `        {\n`;
                    out += `            ${Datamodel.getTypeFromIEC(dataset.dataType)} *${dataset.varName} = (${Datamodel.getTypeFromIEC(dataset.dataType)} *)dataset->data;\n`;
                    out += `        }\n`;
                }
            }
            out += `        break;\n\n`;
        
            out += `    case EXOS_DATASET_EVENT_PUBLISHED:\n`;
            out += `        VERBOSE("dataset %s published to local server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);\n`;
            out += `        //handle each published dataset separately\n`;
            atleastone = false;
            for (let dataset of template.datasets) {
                if (dataset.isSub) {
                    if (atleastone) {
                        out += `        else `;
                    }
                    else {
                        out += `        `;
                        atleastone = true;
                    }
                    out += `if(0 == strcmp(dataset->name, "${dataset.structName}"))\n`;
                    out += `        {\n`;
                    out += `            ${Datamodel.getTypeFromIEC(dataset.dataType)} *${dataset.varName} = (${Datamodel.getTypeFromIEC(dataset.dataType)} *)dataset->data;\n`;
                    out += `        }\n`;
                }
            }
            out += `        break;\n\n`;
        
            out += `    case EXOS_DATASET_EVENT_DELIVERED:\n`;
            out += `        VERBOSE("dataset %s delivered to remote server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);\n`;
            out += `        //handle each published dataset separately\n`;
            atleastone = false;
            for (let dataset of template.datasets) {
                if (dataset.isSub) {
                    if (atleastone) {
                        out += `        else `;
                    }
                    else {
                        out += `        `;
                        atleastone = true;
                    }
                    out += `if(0 == strcmp(dataset->name, "${dataset.structName}"))\n`;
                    out += `        {\n`;
                    out += `            ${Datamodel.getTypeFromIEC(dataset.dataType)} *${dataset.varName} = (${Datamodel.getTypeFromIEC(dataset.dataType)} *)dataset->data;\n`;
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
            out += `        break;\n`;
            out += `    case EXOS_DATAMODEL_EVENT_SYNC_STATE_CHANGED:\n`;
            out += `        break;\n\n`;
            out += `    default:\n`;
            out += `        break;\n\n`;
            out += `}\n\n`;
        
            return out;
        }

        /**
         * @param {ApplicationTemplate} template 
         * @returns {string}
         */
        function generateInit(template) {
            let out = "";
        
            out += `    ${template.datamodel.structName} data;\n\n`;
            out += `    exos_datamodel_handle_t ${template.datamodel.varName};\n\n`;
            for (let dataset of template.datasets) {
                if (dataset.isPub || dataset.isSub) {
                    out += `    exos_dataset_handle_t ${dataset.varName};\n`;
                }
            }
            out += `    \n`;
            out += `    exos_log_init(&${template.logname}, "${template.datamodel.structName}_0");\n\n`;
            out += `    SUCCESS("starting ${template.datamodel.structName} application..");\n\n`;
        
            //initialization
            out += `    EXOS_ASSERT_OK(exos_datamodel_init(&${template.datamodel.varName}, "${template.datamodel.structName}", "${template.datamodel.structName}_0"));\n\n`;
            out += `    //set the user_context to access custom data in the callbacks\n`;
            out += `    ${template.datamodel.varName}.user_context = NULL; //user defined\n`;
            out += `    ${template.datamodel.varName}.user_tag = 0; //user defined\n\n`;
        
            for (let dataset of template.datasets) {
                if (dataset.isPub || dataset.isSub) {
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
                if (dataset.isPub) {
                    if (dataset.isSub) {
                        out += `    EXOS_ASSERT_OK(exos_dataset_connect(&${dataset.varName}, EXOS_DATASET_PUBLISH + EXOS_DATASET_SUBSCRIBE, datasetEvent));\n`;
                    }
                    else {
                        out += `    EXOS_ASSERT_OK(exos_dataset_connect(&${dataset.varName}, EXOS_DATASET_SUBSCRIBE, datasetEvent));\n`;
                    }
                }
                else if (dataset.isSub) {
                    out += `    EXOS_ASSERT_OK(exos_dataset_connect(&${dataset.varName}, EXOS_DATASET_PUBLISH, datasetEvent));\n`;
                }
            }
            out += `    \n`;
        
            return out;
        }

        /**
         * @param {ApplicationTemplate} template 
         * @returns {string}
         */
        function generateCyclic(template) {
            var out = "";
            out += `        EXOS_ASSERT_OK(exos_datamodel_process(&${template.datamodel.varName}));\n`;
            out += `        exos_log_process(&${template.logname});\n\n`;
            out += `        //put your cyclic code here!\n\n`;
        
            return out;
        }
        
        /**
         * @param {ApplicationTemplate} template 
         * @returns {string}
         */
        function generateExit(template) {
            var out = "";
        
            out += `\n`;
            out += `    EXOS_ASSERT_OK(exos_datamodel_delete(&${template.datamodel.varName}));\n\n`;
        
            out += `    //finish with deleting the log\n`;
            out += `    exos_log_delete(&${template.logname});\n`;
        
            return out;
        }


        let out = "";
        out += `#include <unistd.h>\n`;
        out += `#include <string.h>\n`;
        out += `#include "termination.h"\n\n`;
        out += generateIncludes(this.template);
    
        out += generateCallbacks(this.template);
    
        //declarations
        out += `int main()\n{\n`
    
        out += generateInit(this.template);
    
        out += `    catch_termination();\n`;
    
        //main loop
        out += `    while (true)\n    {\n`;
    
        out += generateCyclic(this.template);
        out += `        if (is_terminated())\n`;
        out += `        {\n`;
        out += `            SUCCESS("${this.template.datamodel.structName} application terminated, closing..");\n`;
        out += `            break;\n`;
        out += `        }\n`;
        out += `    }\n\n`;
    
        //unregister
    
        out += generateExit(this.template);
    
        out += `    return 0;\n`
        out += `}\n`
    
        return out;


    }

    generateTerminationHeader() {
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
        return generateTerminationHeader();
    }

    generateTerminationSource() {
        function generateTerminationSource() {
            let out = "";
        
            out += `#include "termination.h"\n`;
            out += `#include <stdio.h>\n`;
            out += `#include <execinfo.h>\n`;
            out += `#include <signal.h>\n`;
            out += `#include <stdlib.h>\n`;
            out += `#include <unistd.h>\n`;
            out += `\n`;
            out += `static bool terminate_process = false;\n`;
            out += `\n`;
            out += `bool is_terminated()\n`;
            out += `{\n`;
            out += `    return terminate_process;\n`;
            out += `}\n`;
            out += `\n`;
            out += `static void handle_segfault(int sig) {\n`;
            out += `	void *array[10];\n`;
            out += `	size_t size;\n`;
            out += `	\n`;
            out += `	// get void*'s for all entries on the stack\n`;
            out += `	size = backtrace(array, 10);\n`;
            out += `\n`;
            out += `	// print out all the frames to stderr\n`;
            out += `	fprintf(stderr, "Error: segfault\\n");\n`;
            out += `	backtrace_symbols_fd(array, size, STDERR_FILENO);\n`;
            out += `	exit(1);\n`;
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
            out += `\n`;
            out += `    // Print backtrace to stderr and exit() on segfault\n`;
            out += `	signal(SIGSEGV, handle_segfault); \n`;
            out += `}\n`;
        
            return out;
        }
        return generateTerminationSource();
    }
    
}
module.exports = {TemplateLinuxC};