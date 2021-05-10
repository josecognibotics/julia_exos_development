/**
 * The swig generator uses a lot from c-static-lib-template, and we therefore have some direct dependencies.
 * This template puts a layer on top of c_static_lib_template, in that it adds the needed swig interface file to it.
*/
const c_static_lib_template = require('../c-static-lib-template/c_static_lib_template')
const header = require('../exos_header');

function generateSwigArrayinfoPre(json) {
    let out = ``;
    for(let info of json.swiginfo) {
        out += `%immutable;\n`;
        out += `%inline %{\n`;
        out += `struct ${info.structname}_${info.membername}_wrapped_array {\n`;
        out += `    ${info.datatype} (&data)[${info.arraysize}];\n`;
        out += `    ${info.structname}_${info.membername}_wrapped_array(${info.datatype} (&data)[${info.arraysize}]) : data(data) { }\n`;
        out += `};\n`;
        out += `%}\n`;
        out += `%mutable;\n\n`;

        out += `%extend ${info.structname}_${info.membername}_wrapped_array {\n`;
        out += `    inline size_t __len__() const { return ${info.arraysize}; }\n\n`;

        out += `    inline const ${info.datatype}& __getitem__(size_t i) const throw(std::out_of_range) {\n`;
        out += `        if (i >= ${info.arraysize} || i < 0)\n`;
        out += `            throw std::out_of_range("out of bounds");\n`;
        out += `        return $self->data[i];\n`;
        out += `    }\n\n`;

        out += `    inline void __setitem__(size_t i, const ${info.datatype}& v) throw(std::out_of_range) {\n`;
        out += `        if (i >= ${info.arraysize} || i < 0)\n`;
        out += `            throw std::out_of_range("out of bounds");\n`;
        out += `        $self->data[i] = v; \n`;
        out += `    }\n`;
        out += `}\n\n`;
    }
    return out;
}

function generateSwigArrayinfo(json) {
    let out = ``;
    for(let info of json.swiginfo) {
        out += `%extend ${info.structname} {\n`;
        out += `    ${info.structname}_${info.membername}_wrapped_array get_${info.structname}_${info.membername}(){\n`;
        out += `        return ${info.structname}_${info.membername}_wrapped_array($self->${info.membername});\n`;
        out += `    }\n`;
        out += `    void set_${info.structname}_${info.membername}(${info.structname}_${info.membername}_wrapped_array val) throw (std::invalid_argument) {\n`;
        out += `        throw std::invalid_argument("cant set array, use [] instead");\n`;
        out += `    }\n\n`;

        out += `    %pythoncode %{\n`;
        out += `        __swig_getmethods__["${info.membername}"] = get_${info.structname}_${info.membername}\n`;
        out += `        __swig_setmethods__["${info.membername}"] = set_${info.structname}_${info.membername}\n`;
        out += `        if _newclass: ${info.membername} = property(get_${info.structname}_${info.membername}, set_${info.structname}_${info.membername})\n`;
        out += `    %}\n`;
        out += `}\n\n`;
    }
    return out;
}

function generateSwigInclude(fileName, typName, PubSubSwap) {
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

    out += `%include "typemaps.i"\n`;
    out += `%include "std_except.i"\n\n`;

    out += `%feature("director") ${template.datamodel.dataType}EventHandler;\n`;
    out += `%inline %{\n`;
    out += `struct ${template.datamodel.dataType}EventHandler\n`;
    out += `{\n`;
    out += `    virtual void on_connected(void) {}\n`;
    out += `    virtual void on_disconnected(void) {}\n`;
    out += `    virtual void on_operational(void) {}\n\n`;
    for (let dataset of template.datasets) {
        if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
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
        if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
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
        if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
            out += `    ${template.datamodel.varName}->${dataset.structName}.on_change = &${template.datamodel.libStructName}_on_change_${dataset.structName};\n`;
        }
    }
    out += `    \n`;
    out += `    p${template.datamodel.dataType}EventHandler->${template.datamodel.varName} = ${template.datamodel.varName};\n`;
    out += `    handler = NULL;\n`;
    out += `}\n`;
    out += `%}\n\n`;

    out += `%include "stdint.i"\n\n`;


    out += `/* Handle arrays in substructures, structs could be exposed using these two lines:\n`;
    out += `     #define EXOS_INCLUDE_ONLY_DATATYPE\n`;
    out += `     %include "${template.headerName}"\n`;
    out += `   But we need to disable the array members and add them again with the wrapped_array\n`;
    out += `*/\n`;

    let headerStructs = header.convertTyp2Struct(fileName, swig=true)
    let idx = headerStructs.indexOf("<sai>")
    if (idx > 0) {
        do {
            tmpOut = headerStructs.substring(0, idx); // TODO: not really important, but more struct could be in this substring and SwigArrayInfoPre could thereby be further away from its true struct than necessary
            headerStructs = headerStructs.substring(idx + 5); // skip <sai>
            let endIdx = headerStructs.indexOf("</sai>");
            let arrayInfoStr = headerStructs.substring(0, endIdx);
            let arrayInfo = JSON.parse(arrayInfoStr)

            out += generateSwigArrayinfoPre(arrayInfo)
            out += tmpOut;
            out += generateSwigArrayinfo(arrayInfo);

            headerStructs = headerStructs.substring(endIdx + 6); // skip </sai>

        } while ((idx=headerStructs.indexOf("<sai>")) > 0)
    }
    else {
        out += headerStructs;
    }
    

    for (let dataset of template.datasets) {
        if (dataset.isSub || dataset.isPub ) {
            let valueDatatype = header.convertPlcType(dataset.dataType);
            let valueArraysizeStr = parseInt(dataset.arraySize);
            let arrayInfo = {"swiginfo": [{"structname": `${dataset.libDataType}`, "membername": "value", "datatype": `${valueDatatype}`, "arraysize": `${valueArraysizeStr}`}]};

            if (dataset.arraySize > 0) {
                // array helpers:
                out += generateSwigArrayinfoPre(arrayInfo);
            }

            out += `typedef struct ${dataset.libDataType}\n`;
            out += `{\n`;
            if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
                out += `    void publish(void);\n`;
            }
            if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
                out += `    void on_change(void);\n`;
                out += `    int32_t nettime;\n`;
            }
            if (dataset.arraySize > 0) {
                out += `    // array not exposed directly:`;
            }
            out += `    ${valueDatatype} value`;
            if (dataset.arraySize > 0) { // array comes before string length in c (unlike AS typ editor where it would be: STRING[80][0..1])
                out += `[${valueArraysizeStr}]`;
            }
            if (dataset.dataType.includes("STRING")) {
                out += `[${parseInt(dataset.stringLength)}];\n`;
            } else {
                out += `;\n`;
            }
            out += `} ${dataset.libDataType}_t;\n\n`;

            if (dataset.arraySize > 0) {
                // array helpers:
                out += generateSwigArrayinfo(arrayInfo);
            }
        }
    }

    out += `typedef struct ${template.datamodel.libStructName}_log\n`;
    out += `{\n`;
    out += `    void error(char *log_entry);\n`;
    out += `    void warning(char *log_entry);\n`;
    out += `    void success(char *log_entry);\n`;
    out += `    void info(char *log_entry);\n`;
    out += `    void debug(char *log_entry);\n`;
    out += `    void verbose(char *log_entry);\n`; 
    out += `} ${template.datamodel.libStructName}_log_t;\n\n`;

    out += `typedef struct ${template.datamodel.libStructName}\n`;
    out += `{\n`;
    out += `    void connect(void);\n`;
    out += `    void disconnect(void);\n`;
    out += `    void process(void);\n`;
    out += `    void set_operational(void);\n`;
    out += `    void dispose(void);\n`;
    out += `    int32_t get_nettime(void);\n`;
    out += `    ${template.datamodel.libStructName}_log_t log;\n`;
    out += `    void on_connected(void);\n`;
    out += `    void on_disconnected(void);\n`;
    out += `    void on_operational(void);\n`;
    out += `    bool is_connected;\n`;
    out += `    bool is_operational;\n`;
    for (let dataset of template.datasets) {
        if (dataset.isPub || dataset.isSub) {
            out += `    ${dataset.libDataType}_t ${dataset.structName};\n`;
        }
    }
    out += `} ${template.datamodel.libStructName}_t;\n\n`;

    out += `${template.datamodel.libStructName}_t *${template.datamodel.libStructName}_init(void);\n`;

    return out;
}

function generatePythonMain(fileName, typName, PubSubSwap) {
    let out = "";
    let prepend = "# ";
    if(process.env.VSCODE_DEBUG_MODE) {
        prepend = "";
    }

    let template = c_static_lib_template.configTemplate(fileName, typName);

    out += `# Use import and sys.path.insert if this py file is moved.\n`;
    out += `# The path should point to the directory containing _lib${typName}.so\n`;
    out += `${prepend}import sys\n`;
    out += `${prepend}sys.path.insert(1, '${template.datamodel.dataType}_py/Linux')\n`;
    out += `import ${template.datamodel.libStructName}\n`;
    out += `\n`;
    out += `class ${template.datamodel.dataType}EventHandler(${template.datamodel.libStructName}.${template.datamodel.dataType}EventHandler):\n`;
    out += `\n`;
    out += `    def __init__(self):\n`;
    out += `        ${template.datamodel.libStructName}.${template.datamodel.dataType}EventHandler.__init__(self)\n`;
    out += `\n`;
    out += `    def on_connected(self):\n`;
    out += `        self.${template.datamodel.varName}.log.success("python ${template.datamodel.varName} connected!")\n`;
    out += `\n`;
    out += `    # def on_disconnected(self):\n`;
    out += `    #     self.${template.datamodel.varName}. ..\n`;
    out += `\n`;
    out += `    # def on_operational(self):\n`;
    out += `    #     self.${template.datamodel.varName}. ..\n`;
    out += `\n`;
    for (let dataset of template.datasets) {
        if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
            out += `    def on_change_${dataset.structName}(self):\n`;
            out += `        self.${template.datamodel.varName}.log.verbose("python dataset ${dataset.structName} changed!")\n`;

            if(dataset.arraySize == 0) {
                if(header.isScalarType(dataset.dataType, false)) {
                    out += `        ${prepend}print("on_change: ${template.datamodel.varName}.${dataset.structName}: " + str(self.${template.datamodel.varName}.${dataset.structName}.value))\n`;
                } else {
                    out += `        ${prepend}print("on_change: ${template.datamodel.varName}.${dataset.structName}: " + self.${template.datamodel.varName}.${dataset.structName}.value)\n`;
                }
            } else {
                out += `        ${prepend}print("on_change: ${template.datamodel.varName}.${dataset.structName}: Array of ${header.convertPlcType(dataset.dataType)}${dataset.dataType.includes("STRING")?"[]":""}")\n`;
                out += `        ${prepend}for index in range(len(self.${template.datamodel.varName}.${dataset.structName}.value)):\n`;
                out += `        ${prepend}    print(str(index) + ": " + str(self.${template.datamodel.varName}.${dataset.structName}.value[index]))\n`;
                out += `        ## alternatively:\n`;
                out += `        ## for item in self.${template.datamodel.varName}.${dataset.structName}.value:\n`;
                out += `        ##    print("  " + str(item))\n`;
            }
            out += `        \n`;
            out += `        # Your code here...\n`;
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
        if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
            out += `            # ${template.datamodel.varName}->${dataset.structName}.value${dataset.arraySize > 0 ? "[..]" : ""}${header.isScalarType(dataset.dataType) ? "" : ". .."} = .. \n`;
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

function generateNodeJSMain(fileName, typName, PubSubSwap) {
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
        if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
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