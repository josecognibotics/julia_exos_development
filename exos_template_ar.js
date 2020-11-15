#!/usr/bin/env node

const header = require('./exos_header');
const fs = require('fs');

function generateFun(typName) {
    let out = "";

    out += `FUNCTION_BLOCK ${typName}Init\n`;
    out += `	VAR_OUTPUT\n`;
    out += `		Handle : UDINT;\n`;
    out += `	END_VAR\n`;
    out += `	VAR\n`;
    out += `		_state : USINT;\n`;
    out += `	END_VAR\n`;
    out += `END_FUNCTION_BLOCK\n`;
    out += `\n`;

    out += `FUNCTION_BLOCK ${typName}Cyclic\n`;
    out += `	VAR_INPUT\n`;
    out += `		Enable : BOOL;\n`;
    out += `		Handle : UDINT;\n`;
    out += `		Start : BOOL;\n`;
    out += `	END_VAR\n`;
    out += `	VAR_OUTPUT\n`;
    out += `		Active : BOOL;\n`;
    out += `		Error : BOOL;\n`;
    out += `		Disconnected : BOOL;\n`;
    out += `		Connected : BOOL;\n`;
    out += `		Operational : BOOL;\n`;
    out += `		Aborted : BOOL;\n`;
    out += `	END_VAR\n`;
    out += `	VAR\n`;
    out += `		_state : USINT;\n`;
    out += `	END_VAR\n`;
    out += `END_FUNCTION_BLOCK\n`;
    out += `\n`;

    out += `FUNCTION_BLOCK ${typName}Exit\n`;
    out += `	VAR_INPUT\n`;
    out += `		Handle : UDINT;\n`;
    out += `	END_VAR\n`;
    out += `	VAR\n`;
    out += `		_state : USINT;\n`;
    out += `	END_VAR\n`;
    out += `END_FUNCTION_BLOCK\n`;

    return out;
}

function generateCLibrary(fileName, typName) {
    let out = "";

    let typfile = fileName;

    //remove possible directories from call of script.
    if (typfile.includes("/")) {
        typfile = typfile.split("/");
        typfile = typfile[typfile.length - 1];
    }

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio Version=4.6.3.55 SP?>\n`;
    out += `<Library SubType="ANSIC" xmlns="http://br-automation.co.at/AS/Library">\n`;
    out += `  <Files>\n`;
    out += `    <File Description="Artefact Interface">${typfile}</File>\n`;
    out += `    <File Description="Exported functions and function blocks">${typName.substring(0, 10)}.fun</File>\n`;
    out += `    <File Description="Generated exos headerfile">exos_${typName.toLowerCase()}.h</File>\n`;
    out += `    <File Description="Implementation">${typName.toLowerCase()}.c</File>\n`;
    out += `    <File Description="Enable dynamic heap">dynamic_heap.cpp</File>\n`;
    out += `  </Files>\n`;
    out += `  <Dependencies>\n`;
    out += `    <Dependency ObjectName="ExApi" />\n`;
    out += `  </Dependencies>\n`;
    out += `</Library>\n`;

    return out;
}

function generateExosIncludes(template) {
    let out = "";
    out += `#include <${template.artefact.dataType.substring(0, 10)}.h>\n\n`;
    out += `#define EXOS_ASSERT_LOG &${template.handle.name}->${template.logname}\n`;
    out += `#define EXOS_ASSERT_CALLBACK inst->_state = 255;\n`;
    out += `#include "exos_log.h"\n`;
    out += `#include "exos_${template.artefact.dataType.toLowerCase()}.h"\n`;
    out += `#include <string.h>\n`;
    out += `\n`;

    out += `#define SUCCESS(_format_, ...) exos_log_success(&${template.handle.name}->${template.logname}, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);\n`;
    out += `#define INFO(_format_, ...) exos_log_info(&${template.handle.name}->${template.logname}, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);\n`;
    out += `#define VERBOSE(_format_, ...) exos_log_debug(&${template.handle.name}->${template.logname}, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, _format_, ##__VA_ARGS__);\n`;
    out += `#define ERROR(_format_, ...) exos_log_error(&${template.handle.name}->${template.logname}, _format_, ##__VA_ARGS__);\n`;
    out += `\n`;
    return out;
}

function generateExosHandle(template) {
    let out = "";

    out += `typedef struct\n{\n`;
    out += `    void *self;\n`
    out += `    exos_log_handle_t ${template.logname};\n`;
    out += `    ${template.artefact.structName} data;\n\n`;
    out += `    exos_artefact_handle_t ${template.artefact.varName};\n\n`;
    for (let value of template.values) {
        // initialize non-string comments to "" to avoid crashes in the next if...
        if (typeof value.comment !== 'string') {
            value.comment = "";
        }

        if (value.comment.includes("SUB") || value.comment.includes("PUB")) {
            out += `    exos_value_handle_t ${value.varName};\n`;
        }
    }

    out += `} ${template.handle.dataType};\n\n`;
    return out;
}

function generateExosCallbacks(template) {
    let out = "";

    out += `static void valueChanged(exos_value_handle_t *value)\n{\n`;
    out += `    struct ${template.artefact.structName}Cyclic *inst = (struct ${template.artefact.structName}Cyclic *)value->artefact->user_context;\n`;
    out += `    ${template.handle.dataType} *${template.handle.name} = (${template.handle.dataType} *)inst->Handle;\n\n`;
    out += `    VERBOSE("value %s changed!", value->name);\n`;
    out += `    //handle each subscription value separately\n`;
    var atleastone = false;
    for (let value of template.values) {
        if (value.comment.includes("PUB")) {
            if (atleastone) {
                out += `    else `;
            }
            else {
                out += `    `;
                atleastone = true;
            }
            out += `if(0 == strcmp(value->name,"${value.structName}"))\n`;
            out += `    {\n`;
            out += `        // ${value.dataType} *${value.varName} = (${value.dataType} *)value->data;\n`;
            out += `    }\n`;
        }
    }
    out += `}\n\n`;

    out += `static void valuePublished(exos_value_handle_t *value, uint32_t queue_items)\n{\n`;
    out += `    struct ${template.artefact.structName}Cyclic *inst = (struct ${template.artefact.structName}Cyclic *)value->artefact->user_context;\n`;
    out += `    ${template.handle.dataType} *${template.handle.name} = (${template.handle.dataType} *)inst->Handle;\n\n`;
    out += `    VERBOSE("value %s published! queue size:%i", value->name, queue_items);\n`;
    out += `    //handle each published value separately\n`;
    atleastone = false;
    for (let value of template.values) {
        if (value.comment.includes("SUB")) {
            if (atleastone) {
                out += `    else `;
            }
            else {
                out += `    `;
                atleastone = true;
            }
            out += `if(0 == strcmp(value->name,"${value.structName}"))\n`;
            out += `    {\n`;
            out += `        // ${value.dataType} *${value.varName} = (${value.dataType} *)value->data;\n`;
            out += `    }\n`;
        }
    }
    out += `}\n\n`;

    out += `static void valueConnectionChanged(exos_value_handle_t *value)\n{\n`;
    out += `    struct ${template.artefact.structName}Cyclic *inst = (struct ${template.artefact.structName}Cyclic *)value->artefact->user_context;\n`;
    out += `    ${template.handle.dataType} *${template.handle.name} = (${template.handle.dataType} *)inst->Handle;\n\n`;
    out += `    INFO("value %s changed state to %s", value->name, exos_state_string(value->connection_state));\n\n`;
    out += `    switch (value->connection_state)\n`;
    out += `    {\n`;
    out += `    case EXOS_STATE_DISCONNECTED:\n`;
    out += `        break;\n`;
    out += `    case EXOS_STATE_CONNECTED:\n`;
    out += `        //call the value changed event to update the value\n`;
    out += `        valueChanged(value);\n`;
    out += `        break;\n`;
    out += `    case EXOS_STATE_OPERATIONAL:\n`;
    out += `        break;\n`;
    out += `    case EXOS_STATE_ABORTED:\n`;
    out += `        ERROR("value error %d (%s) occured", value->error, exos_error_string(value->error));\n`;
    out += `        break;\n`;
    out += `    }\n`;

    out += `}\n\n`;

    out += `static void connectionChanged(exos_artefact_handle_t *artefact)\n{\n`;
    out += `    struct ${template.artefact.structName}Cyclic *inst = (struct ${template.artefact.structName}Cyclic *)artefact->user_context;\n`;
    out += `    ${template.handle.dataType} *${template.handle.name} = (${template.handle.dataType} *)inst->Handle;\n\n`;
    out += `    INFO("application changed state to %s", exos_state_string(artefact->connection_state));\n\n`;
    out += `    inst->Disconnected = 0;\n`;
    out += `    inst->Connected = 0;\n`;
    out += `    inst->Operational = 0;\n`;
    out += `    inst->Aborted = 0;\n\n`;
    out += `    switch (artefact->connection_state)\n`;
    out += `    {\n`;
    out += `    case EXOS_STATE_DISCONNECTED:\n`;
    out += `        inst->Disconnected = 1;\n`;
    out += `        break;\n`;
    out += `    case EXOS_STATE_CONNECTED:\n`;
    out += `        inst->Connected = 1;\n`;
    out += `        break;\n`;
    out += `    case EXOS_STATE_OPERATIONAL:\n`;
    out += `        SUCCESS("${template.artefact.structName} operational!");\n`
    out += `        inst->Operational = 1;\n`;
    out += `        break;\n`;
    out += `    case EXOS_STATE_ABORTED:\n`;
    out += `        ERROR("application error %d (%s) occured", artefact->error, exos_error_string(artefact->error));\n`;
    out += `        inst->Aborted = 1;\n`;
    out += `        break;\n`;
    out += `    }\n`;
    out += `}\n\n`;

    return out;
}

function generateExosInit(template) {
    let out = "";

    out += `_BUR_PUBLIC void ${template.artefact.structName}Init(struct ${template.artefact.structName}Init *inst)\n{\n`;
    out += `    ${template.handle.dataType} *${template.handle.name};\n`;
    out += `    TMP_alloc(sizeof(${template.handle.dataType}), (void **)&${template.handle.name});\n`;
    out += `    if (NULL == handle)\n`;
    out += `    {\n`;
    out += `        inst->Handle = 0;\n`;
    out += `        return;\n`;
    out += `    }\n\n`;
    out += `    memset(&${template.handle.name}->data, 0, sizeof(${template.handle.name}->data));\n`;
    out += `    ${template.handle.name}->self = ${template.handle.name};\n\n`;
    out += `    exos_log_init(&${template.handle.name}->${template.logname}, "${template.artefact.structName}");\n\n`;
    out += `    \n`;
    out += `    \n`;
    out += `    exos_artefact_handle_t *${template.artefact.varName} = &${template.handle.name}->${template.artefact.varName};\n`;
    for (let value of template.values) {
        if (value.comment.includes("SUB") || value.comment.includes("PUB")) {
            out += `    exos_value_handle_t *${value.varName} = &${template.handle.name}->${value.varName};\n`;
        }
    }

    //initialization
    out += `    EXOS_ASSERT_OK(exos_artefact_init(${template.artefact.varName}, "${template.artefact.structName}"));\n\n`;
    for (let value of template.values) {
        if (value.comment.includes("SUB") || value.comment.includes("PUB")) {
            out += `    EXOS_ASSERT_OK(exos_value_init(${value.varName}, ${template.artefact.varName}, "${value.structName}", &${template.handle.name}->data.${value.structName}, sizeof(${template.handle.name}->data.${value.structName})));\n`;
        }
    }
    out += `    \n`;
    out += `    inst->Handle = (UDINT)${template.handle.name};\n`;
    out += `}\n\n`;

    return out;
}

function generateExosCyclic(template) {
    let out = "";

    out += `_BUR_PUBLIC void ${template.artefact.structName}Cyclic(struct ${template.artefact.structName}Cyclic *inst)\n{\n`;

    out += `    ${template.handle.dataType} *${template.handle.name} = (${template.handle.dataType} *)inst->Handle;\n\n`;
    out += `    inst->Error = false;\n`;
    out += `    if (NULL == handle)\n`;
    out += `    {\n`;
    out += `        inst->Error = true;\n`;
    out += `        return;\n`;
    out += `    }\n`;
    out += `    if ((void *)handle != handle->self)\n`;
    out += `    {\n`;
    out += `        inst->Error = true;\n`;
    out += `        return;\n`;
    out += `    }\n\n`;

    out += `    // ${template.artefact.dataType} *data = &${template.handle.name}->data;\n`;
    out += `    exos_artefact_handle_t *${template.artefact.varName} = &${template.handle.name}->${template.artefact.varName};\n`;
    for (let value of template.values) {
        if (value.comment.includes("SUB") || value.comment.includes("PUB")) {
            out += `    exos_value_handle_t *${value.varName} = &${template.handle.name}->${value.varName};\n`;
        }
    }
    out += `    //unregister on disable\n`;
    out += `    if (inst->_state && !inst->Enable)\n`;
    out += `    {\n`;
    out += `        inst->_state = 255;\n`;
    out += `    }\n\n`;
    out += `    switch (inst->_state)\n`;
    out += `    {\n`;
    out += `    case 0:\n`;
    out += `        inst->Disconnected = 1;\n`;
    out += `        inst->Connected = 0;\n`;
    out += `        inst->Operational = 0;\n`;
    out += `        inst->Aborted = 0;\n\n`;
    out += `        if (inst->Enable)\n`;
    out += `        {\n`;
    out += `            //the user context of the artefact points to the ${template.artefact.structName}Cyclic instance\n`;
    out += `            ${template.artefact.varName}->user_context = inst;\n`;
    out += `            inst->_state = 10;\n`;
    out += `        }\n`;
    out += `        break;\n\n`;
    out += `    case 10:\n`;
    out += `        inst->_state = 100;\n`;
    out += `        //register the artefact, then the values\n`;
    out += `        EXOS_ASSERT_OK(exos_artefact_register_${template.artefact.structName.toLowerCase()}(${template.artefact.varName}, connectionChanged));\n`;
    for (let value of template.values) {
        if (value.comment.includes("SUB")) {
            out += `        EXOS_ASSERT_OK(exos_value_register_publisher(${value.varName}, valueConnectionChanged, valuePublished));\n`;
        }
    }
    for (let value of template.values) {
        if (value.comment.includes("PUB")) {
            if (value.comment.includes("SUB")) {
                out += `        EXOS_ASSERT_OK(exos_value_register_subscription(${value.varName}, NULL, valueChanged));\n`;
            }
            else {
                out += `        EXOS_ASSERT_OK(exos_value_register_subscription(${value.varName}, valueConnectionChanged, valueChanged));\n`;
            }
        }
    }
    out += `\n        SUCCESS("starting ${template.artefact.structName} application..");\n\n`;
    out += `        inst->Active = true;\n`;
    out += `        break;\n\n`;

    out += `    case 100:\n`;
    out += `    case 101:\n`;
    out += `        if (inst->Start)\n`;
    out += `        {\n`;
    out += `            if (inst->_state == 100)\n`;
    out += `            {\n`;
    out += `                EXOS_ASSERT_OK(exos_artefact_set_operational(${template.artefact.varName}));\n`;
    out += `                inst->_state = 101;\n`;
    out += `            }\n`;
    out += `        }\n`;
    out += `        else\n`;
    out += `        {\n`;
    out += `            inst->_state = 100;\n`;
    out += `        }\n\n`;
    out += `        //put your cyclic code here!\n\n`;
    out += `        EXOS_ASSERT_OK(exos_artefact_cyclic(${template.artefact.varName}));\n`;
    out += `        break;\n\n`;
    out += `    case 255:\n`;
    out += `        //first unregister the values, then the artefact\n`;
    for (let value of template.values) {
        if (value.comment.includes("SUB")) {
            out += `        EXOS_ASSERT_OK(exos_value_unregister_publisher(${value.varName}));\n`;
        }
    }
    for (let value of template.values) {
        if (value.comment.includes("PUB")) {
            out += `        EXOS_ASSERT_OK(exos_value_unregister_subscription(${value.varName}));\n`;
        }
    }
    out += `        \n`;
    out += `        EXOS_ASSERT_OK(exos_artefact_unregister(${template.artefact.varName}));\n\n`;
    out += `        inst->Active = false;\n`;
    out += `        inst->_state = 254;\n`;
    out += `        //no break\n\n`;
    out += `    case 254:\n`;
    out += `        if (!inst->Enable)\n`;
    out += `            inst->_state = 0;\n`;
    out += `        break;\n`;
    out += `    }\n\n`;
    out += `    exos_log_cyclic(&${template.handle.name}->${template.logname});\n\n`;
    out += `}\n\n`;

    return out;
}

function generateExosExit(template) {
    let out = "";
    out += `_BUR_PUBLIC void ${template.artefact.structName}Exit(struct ${template.artefact.structName}Exit *inst)\n{\n`;

    out += `    ${template.handle.dataType} *${template.handle.name} = (${template.handle.dataType} *)inst->Handle;\n\n`;
    out += `    if (NULL == handle)\n`;
    out += `    {\n`;
    out += `        ERROR("${template.artefact.structName}Exit: NULL handle, cannot delete resources");\n`;
    out += `        return;\n`;
    out += `    }\n`;
    out += `    if ((void *)handle != handle->self)\n`;
    out += `    {\n`;
    out += `        ERROR("${template.artefact.structName}Exit: invalid handle, cannot delete resources");\n`;
    out += `        return;\n`;
    out += `    }\n\n`;

    out += `    exos_artefact_handle_t *${template.artefact.varName} = &${template.handle.name}->${template.artefact.varName};\n`;
    for (let value of template.values) {
        if (value.comment.includes("SUB") || value.comment.includes("PUB")) {
            out += `    exos_value_handle_t *${value.varName} = &${template.handle.name}->${value.varName};\n`;
        }
    }

    out += `    //first unregister the values, then the artefact\n`;
    for (let value of template.values) {
        if (value.comment.includes("SUB")) {
            out += `    EXOS_ASSERT_OK(exos_value_unregister_publisher(${value.varName}));\n`;
        }
    }
    for (let value of template.values) {
        if (value.comment.includes("PUB")) {
            out += `    EXOS_ASSERT_OK(exos_value_unregister_subscription(${value.varName}));\n`;
        }
    }
    out += `\n`;
    out += `    EXOS_ASSERT_OK(exos_artefact_unregister(${template.artefact.varName}));\n\n`;

    out += `    //first delete the values, then the artefact\n`;
    for (let value of template.values) {
        if (value.comment.includes("SUB") || value.comment.includes("PUB")) {
            out += `    EXOS_ASSERT_OK(exos_value_delete(${value.varName}));\n`;
        }
    }

    out += `    \n`;
    out += `    EXOS_ASSERT_OK(exos_artefact_delete(${template.artefact.varName}));\n\n`;

    out += `    //finish with deleting the log\n`;
    out += `    exos_log_delete(&${template.handle.name}->${template.logname});\n`;

    out += `    //free the allocated handle\n`;
    out += `    TMP_free(sizeof(${template.handle.dataType}), (void *)handle);\n`;
    out += `}\n\n`;

    return out;
}

function generateTemplate(fileName, typName) {
    let out = "";

    let template = configTemplate(fileName, typName);

    out += generateExosIncludes(template);

    out += generateExosHandle(template);

    out += generateExosCallbacks(template);

    out += generateExosInit(template);

    out += generateExosCyclic(template);

    out += generateExosExit(template);

    return out;
}

function configTemplate(fileName, typName) {

    let template = {
        headerName: "",
        handle: {
            dataType: "",
            name: "",
        },
        artefact: {
            structName: "",
            varName: "",
            dataType: "",
            comment: ""
        },
        values: [],
        logname: ""
    };

    if (fs.existsSync(fileName)) {

        let types = header.parseTypFile(fileName, typName);

        template.logname = "logger";
        template.headerName = `exos_${types.attributes.dataType.toLowerCase()}.h`
        template.handle.dataType = `${types.attributes.dataType}Handle_t`;
        template.handle.name = "handle";

        template.artefact.dataType = types.attributes.dataType;
        template.artefact.structName = types.attributes.dataType;
        //check if toLowerCase is equal to datatype name, then extend it with _artefact
        if (types.attributes.dataType == types.attributes.dataType.toLowerCase()) {
            template.artefact.varName = types.attributes.dataType.toLowerCase() + "_artefact";
        }
        else {
            template.artefact.varName = types.attributes.dataType.toLowerCase();
        }

        //check if toLowerCase is same as struct name, then extend it with _value
        for (let child of types.children) {
            if (child.attributes.name == child.attributes.name.toLowerCase()) {
                template.values.push({
                    structName: child.attributes.name,
                    varName: child.attributes.name.toLowerCase() + "_value",
                    dataType: child.attributes.dataType,
                    comment: child.attributes.comment
                });
            }
            else {
                template.values.push({
                    structName: child.attributes.name,
                    varName: child.attributes.name.toLowerCase(),
                    dataType: child.attributes.dataType,
                    comment: child.attributes.comment
                });
            }

        }
    }
    else {
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
            fs.writeFileSync(`${outPath}/exos_template_${structName.toLowerCase()}_ar.c`, out);
            process.stdout.write(`${outPath}/exos_template_${structName.toLowerCase()}_ar.c generated`);            
        } catch (error) {
            process.stderr.write(error);    
        }
    }
    else {
        process.stderr.write("usage: ./exos_template_ar.js <filename.typ> <structname> <template output folder>\n");
    }

}

module.exports = {
    generateTemplate,
    generateCLibrary,
    generateFun
}