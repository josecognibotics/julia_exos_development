const { Template, ApplicationTemplate } = require('../template');
const { TemplateLinuxTermination } = require('./template_linux_termination');
const {TemplateStaticCLib} = require('../template_static_c_lib');
const { Datamodel } = require('../../../datamodel');

class TemplateLinuxStaticCLib extends Template {

    /**
     * {@linkcode TemplateLinuxStaticCLib} Generate code for static c-library wrapper and main function for Linux applications
     * 
     * - `{main}.c`: {@linkcode generateSource} main Linux application
     * 
     * Using {@linkcode TemplateLinuxTermination}:
     * - `termination.h`: {@linkcode generateTerminationHeader} termination handling header
     * - `termination.c`: {@linkcode generateTerminationSource} termination handling source code
     * 
     * Using {@linkcode TemplateStaticCLib}
     * 
     * - `{libName}.c`: {@linkcode generateLibSource} library source code
     * - `{libName}.h`: {@linkcode generateLibHeader} library header
     * 
     * @param {Datamodel} datamodel
     */

    constructor(datamodel) {
        super(datamodel, true);
        this._templateStaticLib = new TemplateStaticCLib(datamodel, true);
        this._templateTermination = new TemplateLinuxTermination();
    }

    generateSource() {

        /**
         * 
         * @param {ApplicationTemplate} template 
         * @param {boolean} PubSubSwap 
         * @param {string} legend 
         * @returns 
         */
        function generateMain(template, PubSubSwap, legend) {
            let out = "";
            let prepend = "// ";
            if(process.env.VSCODE_DEBUG_MODE) {
                prepend = "";
            }
        
            out += `#include <unistd.h>\n`;
            out += `#include "${template.libHeaderName}"\n`
            out += `#include "termination.h"\n`;
            out += `#include <stdio.h>\n\n`;
        
            out += legend;
        
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
                    if (dataset.arraySize == 0) {
                        out += `   ${prepend}printf("on_change: ${template.datamodel.varName}->${dataset.structName}: ${Datamodel.convertPlcTypePrintf(dataset.dataType)}\\n", ${template.datamodel.varName}->${dataset.structName}.value);\n\n`;
                    } else {
                        out += `   ${prepend}uint32_t i;\n`;
                        out += `   ${prepend}printf("on_change: ${template.datamodel.varName}->${dataset.structName}: Array of ${Datamodel.convertPlcType(dataset.dataType)}${dataset.dataType.includes("STRING") ? "[]" : ""}:\\n");\n`;
                        out += `   ${prepend}for(i = 0; i < sizeof(${template.datamodel.varName}->${dataset.structName}.value) / sizeof(${template.datamodel.varName}->${dataset.structName}.value[0]); i++ )\n`;
                        out += `   ${prepend}{\n`;
                        out += `   ${prepend}    printf("  Index %i: ${Datamodel.convertPlcTypePrintf(dataset.dataType)}\\n", i, ${Datamodel.isScalarType(dataset.dataType,true)?"":"&"}${template.datamodel.varName}->${dataset.structName}.value[i]);\n`; 
                        out += `   ${prepend}}\n\n`;
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
                    out += `        //     ${template.datamodel.varName}->${dataset.structName}.value${dataset.arraySize > 0 ? "[..]" : ""}${Datamodel.isScalarType(dataset.dataType) ? "" : ". .."} = .. ;\n`;
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

        return generateMain(this.template,this.isLinux, this._templateStaticLib.generateLegend())
    }

    /**
     * @returns {string} `{libName}.c`: static library source code
     */
    generateLibSource() {
        return this._templateStaticLib.generateLibSource();
    }

    /**
     * @returns {string} `{libName}.h`: static library header
     */
    generateLibHeader() {
        return this._templateStaticLib.generateLibHeader();
    }

    /**
     * @returns {string} `termination.c`: termination handling source code
     */
    generateTerminationSource() {
        return this._templateTermination.generateTerminationSource();
    }

    /**
     * @returns {string} `termination.h`: termination handling header
     */
    generateTerminationHeader() {
        return this._templateTermination.generateTerminationHeader();
    }
}

module.exports = {TemplateLinuxStaticCLib};