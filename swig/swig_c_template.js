/**
 * The swig generator uses a lot from c-static-lib-template, and we therefore have some direct dependencies.
 * This template puts a layer on top of c_static_lib_template, in that it adds the needed swig interface file to it.
*/
const c_static_lib_template = require('../c-static-lib-template/c_static_lib_template')
const header = require('../exos_header');

function generateSwigInclude(fileName, typName, SUB, PUB) {
    let out = "";


    let template = c_static_lib_template.configTemplate(fileName, typName);

    out += `%module(directors="1") ${template.datamodel.libStructName}\n`;
    out += `%{\n`;
    out += `#define EXOS_INCLUDE_ONLY_DATATYPE\n`;
    out += `#include <stddef.h>\n`;
    out += `#include <stdint.h>\n`;
    out += `#include <stdbool.h>\n`;
    out += `#include "${template.headerName}"\n`;
    out += `#include "${template.libHeaderName}"\n`;
    out += `%}\n`;
    out += `\n`;
    out += `%feature("director") ${template.datamodel.dataType}EventHandler;\n`;
    out += `%inline %{\n`;
    out += `struct ${template.datamodel.dataType}EventHandler\n`;
    out += `{\n`;
    out += `    virtual void on_connected(void) {}\n`;
    out += `    virtual void on_disconnected(void) {}\n`;
    out += `    virtual void on_operational(void) {}\n\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            out += `    virtual void on_change_${dataset.structName}() {}\n`;
        }
    }
    out += `\n`;
    out += `    virtual ~${template.datamodel.dataType}EventHandler() {}\n`;
    out += `    ${template.datamodel.libStructName}_t *${template.datamodel.varName};\n`;
    out += `};\n`;
    out += `%}\n`;
    out += `\n`;
    out += `%{\n`;
    out += `static ${template.datamodel.dataType}EventHandler *p${template.datamodel.dataType}EventHandler = NULL;\n`;
    out += `\n`;

    out += `static void ${template.datamodel.libStructName}_on_connected()\n`;
    out += `{\n`;
    out += `    p${template.datamodel.dataType}EventHandler->on_connected();\n`;
    out += `}\n\n`;
    out += `static void ${template.datamodel.libStructName}_on_disconnected()\n`;
    out += `{\n`;
    out += `    p${template.datamodel.dataType}EventHandler->on_disconnected();\n`;
    out += `}\n\n`;
    out += `static void ${template.datamodel.libStructName}_on_operational()\n`;
    out += `{\n`;
    out += `    p${template.datamodel.dataType}EventHandler->on_operational();\n`;
    out += `}\n\n`;

    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            out += `static void ${template.datamodel.libStructName}_on_change_${dataset.structName}()\n`;
            out += `{\n`;
            out += `    p${template.datamodel.dataType}EventHandler->on_change_${dataset.structName}();\n`;
            out += `}\n`;
        }
    }
    out += `%}\n`;
    out += `\n`;
    out += `%inline %{\n`;
    out += `void add_event_handler(${template.datamodel.libStructName}_t *${template.datamodel.varName}, ${template.datamodel.dataType}EventHandler *handler)\n`;
    out += `{\n`;
    out += `    p${template.datamodel.dataType}EventHandler = handler;\n`;
    out += `\n`;
    out += `    ${template.datamodel.varName}->on_connected = &${template.datamodel.libStructName}_on_connected;\n`;
    out += `    ${template.datamodel.varName}->on_disconnected = &${template.datamodel.libStructName}_on_disconnected;\n`;
    out += `    ${template.datamodel.varName}->on_operational = &${template.datamodel.libStructName}_on_operational;\n`;
    out += `    \n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            out += `    ${template.datamodel.varName}->${dataset.structName}.on_change = &${template.datamodel.libStructName}_on_change_${dataset.structName};\n`;
        }
    }
    out += `    \n`;
    out += `    p${template.datamodel.dataType}EventHandler->${template.datamodel.varName} = ${template.datamodel.varName};\n`;
    out += `    handler = NULL;\n`;
    out += `}\n`;
    out += `%}\n`;
    out += `\n`;
    out += `#define EXOS_INCLUDE_ONLY_DATATYPE\n`;
    out += `%include "stdint.i"\n`;
    out += `%include "${template.headerName}"\n`;
    out += `\n`;

    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            out += `typedef struct ${dataset.libDataType}\n`;
            out += `{\n`;
            if (dataset.comment.includes(PUB)) {
                out += `    void publish(void);\n`;
            }
            out += `    void on_change(void);\n`;
            if (dataset.dataType.includes("STRING")) {
                out += `    ${header.convertPlcType(dataset.dataType)} value[${parseInt(dataset.stringLength)}];\n`;
            } else {
                out += `    ${header.convertPlcType(dataset.dataType)} value;\n`;
            }
            out += `    int32_t nettime;\n`;
            out += `} ${dataset.libDataType}_t;\n\n`;
        }
    }

    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB) && !dataset.comment.includes(SUB)) {
            out += `typedef struct ${dataset.libDataType}\n`;
            out += `{\n`;
            out += `    void publish(void);\n`;
            if (dataset.dataType.includes("STRING")) {
                out += `    ${header.convertPlcType(dataset.dataType)} value[${parseInt(dataset.stringLength)}];\n`;
            } else {
                out += `    ${header.convertPlcType(dataset.dataType)} value;\n`;
            }
            out += `} ${dataset.libDataType}_t;\n\n`;
        }
    }

    out += `typedef struct ${template.datamodel.libStructName}\n`;
    out += `{\n`;
    out += `    void connect(void);\n`;
    out += `    void disconnect(void);\n`;
    out += `    void process(void);\n`;
    out += `    void set_operational(void);\n`;
    out += `    void dispose(void);\n`;
    out += `    int32_t get_nettime(void);\n`;

    out += `    void on_connected(void);\n`;
    out += `    void on_disconnected(void);\n`;
    out += `    void on_operational(void);\n`;
    out += `    bool is_connected;\n`;
    out += `    bool is_operational;\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB) || dataset.comment.includes(SUB)) {
            out += `    ${dataset.libDataType}_t ${dataset.structName};\n`;
        }
    }
    out += `} ${template.datamodel.libStructName}_t;\n\n`;

    out += `${template.datamodel.libStructName}_t *${template.datamodel.libStructName}_init(void);\n`;

    return out;
}

function generatePythonMain(fileName, typName, SUB, PUB) {
    let out = "";

    let template = c_static_lib_template.configTemplate(fileName, typName);

    out += `import ${template.datamodel.libStructName}\n`;
    out += `\n`;
    out += `class ${template.datamodel.dataType}EventHandler(${template.datamodel.libStructName}.${template.datamodel.dataType}EventHandler):\n`;
    out += `\n`;
    out += `    def __init__(self):\n`;
    out += `        ${template.datamodel.libStructName}.${template.datamodel.dataType}EventHandler.__init__(self)\n`;
    out += `\n`;
    out += `    # def on_connected(self):\n`;
    out += `    #     self.${template.datamodel.varName}. ..\n`;
    out += `\n`;
    out += `    # def on_disconnected(self):\n`;
    out += `    #     self.${template.datamodel.varName}. ..\n`;
    out += `\n`;
    out += `    # def on_operational(self):\n`;
    out += `    #     self.${template.datamodel.varName}. ..\n`;
    out += `\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(SUB)) {
            out += `    # def on_change_${dataset.structName}(self):\n`;
            out += `    #     .. = self.${template.datamodel.varName}.${dataset.structName}.value\n`;
            out += "    \n";
        }
    }
    out += `\n`;
    out += `${template.datamodel.varName} = ${template.datamodel.libStructName}.${template.datamodel.libStructName}_init()\n`;
    out += `\n`;
    out += `handler = ${template.datamodel.dataType}EventHandler()\n`;
    out += `${template.datamodel.libStructName}.add_event_handler(${template.datamodel.varName}, handler)\n`;
    out += `\n`;
    out += `try:\n`;
    out += `    ${template.datamodel.varName}.connect()\n`;
    out += `    while True:\n`;
    out += `        ${template.datamodel.varName}.process()\n`;
    out += `        # if ${template.datamodel.varName}.is_connected:\n`;

    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB)) {
            out += `            # ${template.datamodel.varName}.${dataset.structName}.value = .. \n`;
            out += `            # ${template.datamodel.varName}.${dataset.structName}.publish()\n`;
            out += "            \n";
        }
    }
    out += `except(KeyboardInterrupt, SystemExit):\n`;
    out += `    print('Application terminated, shutting down')\n`;
    out += `\n`;
    out += `${template.datamodel.varName}.disconnect()\n`;
    out += `${template.datamodel.varName}.dispose()\n`;
    out += `\n`;

    return out;
}

function generateNodeJSMain(fileName, typName, SUB, PUB) {
    let out = "";
    let template = c_static_lib_template.configTemplate(fileName, typName);

    out += `const process = require("process");\n`;
    out += `const lib${typName} = require("./l_${typName.toLowerCase()}");\n`;
    out += `\n`;
    out += `let ${typName.toLowerCase()} = lib${typName}.lib${typName}_init();\n`;
    out += `\n`;
    out += `try {\n`;
    out += `    ${typName.toLowerCase()}.connect();\n`;
    out += `} catch (e) {\n`;
    out += `    console.error(e);\n`;
    out += `    process.exit(1);\n`;
    out += `}\n`;
    out += `\n`;
    out += `setInterval(() => {\n`;
    out += `    try {\n`;
    out += `        ${typName.toLowerCase()}.process()\n`;
    out += `\n`;
    out += `        if (${typName.toLowerCase()}.is_connected) { // && ${typName.toLowerCase()}.is_operational) {\n`;
    for (let dataset of template.datasets) {
        if (dataset.comment.includes(PUB)) {
            out += `            //${template.datamodel.varName}.${dataset.structName}.value = .. \n`;
            out += `            //${template.datamodel.varName}.${dataset.structName}.publish();\n`;
        }
    }
    out += `        }\n`;
    out += `    } catch (e) {\n`;
    out += `        console.error(e);\n`;
    out += `        process.exit(2);\n`;
    out += `    }\n`;
    out += `}, 0);\n`;
    out += `\n`;
    out += `process.on('exit', (code) => {\n`;
    out += `    ${typName.toLowerCase()}.disconnect()\n`;
    out += `    ${typName.toLowerCase()}.dispose()\n`;
    out += `    console.log("Exiting with code: " + code);\n`;
    out += `});\n`;

    return out;
}

module.exports = {
    generateSwigInclude,
    generatePythonMain,
    generateNodeJSMain
}