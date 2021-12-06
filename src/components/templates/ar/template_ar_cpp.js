/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const { Datamodel, GeneratedFileObj } = require('../../../datamodel');
const { Template, ApplicationTemplate } = require('../template')
const { TemplateCppLib } = require('../template_cpp_lib');
const {TemplateARHeap } = require('./template_ar_heap');

class TemplateARCpp extends TemplateCppLib {

    /** 
     * source code with all functionality for the libary
     * @type {GeneratedFileObj} 
     */
    librarySource;

    /** 
     * function block declaration for the AR library
     * @type {GeneratedFileObj} 
    */
    libraryFun;
    
    /** 
     * varaible declaration for the ST program
     * @type {GeneratedFileObj} 
     */
    iecProgramVar;

    /**
     * application implementation code in ST
     * @type {GeneratedFileObj} 
     */
    iecProgramST;

    /**
     * @type {TemplateARHeap}
     */
    heap;

    /**
     * {@linkcode TemplateARCpp} Generate source code for AR C++ library and IEC program
     * 
     * Generates following {@link GeneratedFileObj}
     * - {@linkcode librarySource}
     * - {@linkcode libraryFun}
     * - {@linkcode iecProgramVar} 
     * - {@linkcode iecProgramST}
     * 
     * Inherited from {@linkcode TemplateCppLib}
     * - {@linkcode datasetHeader} dataset class
     * - {@linkcode loggerHeader} datalogger class
     * - {@linkcode loggerSource} datalogger class implementation
     * - {@linkcode datamodelHeader} datamodel class
     * - {@linkcode datamodelSource} datamodel class implementation
     *
     * Using {@linkcode TemplateARHeap}
     * - `heap.heapSource` declaring the dynamic heap
     *  
     * @param {Datamodel} datamodel
     */
    constructor(datamodel) {

        /**
         * @param {ApplicationTemplate} template 
         */
        function generateMainAR(template, legend) {
        
            let out = "";
        
            out += `#include <string.h>\n`;
            out += `#include <stdbool.h>\n`;
            out += `#include "${template.datamodel.className}.hpp"\n`;
            out += `\n`;
            out += legend;
            out += `\n`;
            out += `_BUR_PUBLIC void ${template.datamodel.structName}Init(struct ${template.datamodel.structName}Init *inst)\n`;
            out += `{\n`;
            out += `    ${template.datamodel.className}* ${template.datamodel.varName} = new ${template.datamodel.className}();\n`;
            out += `    if (NULL == ${template.datamodel.varName})\n`;
            out += `    {\n`;
            out += `        inst->Handle = 0;\n`;
            out += `        return;\n`;
            out += `    }\n`;
            out += `    inst->Handle = (UDINT)${template.datamodel.varName};\n`;
            out += `}\n`;
            out += `\n`;
            out += `_BUR_PUBLIC void ${template.datamodel.structName}Cyclic(struct ${template.datamodel.structName}Cyclic *inst)\n`;
            out += `{\n`;
            out += `    // return error if reference to structure is not set on function block\n`;
            out += `    if(NULL == (void*)inst->Handle || NULL == inst->p${template.datamodel.structName})\n`;
            out += `    {\n`;
            out += `        inst->Operational = false;\n`;
            out += `        inst->Connected = false;\n`;
            out += `        inst->Error = true;\n`;
            out += `        return;\n`;
            out += `    }\n`;
            out += `    ${template.datamodel.className}* ${template.datamodel.varName} = static_cast<${template.datamodel.className}*>((void*)inst->Handle);\n`;
            out += `    if (inst->Enable && !inst->_Enable)\n`;
            out += `    {\n`;
            for (let dataset of template.datasets) {
                if (dataset.isSub) {
                    out += `        ${template.datamodel.varName}->${dataset.structName}.onChange([&] () {\n`;
                    
                    if(Datamodel.isScalarType(dataset) && (dataset.arraySize == 0)) {
                        out += `            inst->p${template.datamodel.structName}->${dataset.structName} = ${template.datamodel.varName}->${dataset.structName}.value;\n`;
                    }
                    else {
                        out += `            memcpy(&inst->p${template.datamodel.structName}->${dataset.structName}, &${template.datamodel.varName}->${dataset.structName}.value, sizeof(inst->p${template.datamodel.structName}->${dataset.structName}));\n`;
                    }
            
                    out += `        });\n`;
                }
            }
            out += `        ${template.datamodel.varName}->connect();\n`;
            out += `    }\n`;
            out += `    if (!inst->Enable && inst->_Enable)\n`;
            out += `    {\n`;
            out += `        ${template.datamodel.varName}->disconnect();\n`;
            out += `    }\n`;
            out += `    inst->_Enable = inst->Enable;\n`;
            out += `\n`;
            out += `    if(inst->Start && !inst->_Start && ${template.datamodel.varName}->isConnected)\n`;
            out += `    {\n`;
            out += `        ${template.datamodel.varName}->setOperational();\n`;
            out += `        inst->_Start = inst->Start;\n`;
            out += `    }\n`;
            out += `    if(!inst->Start)\n`;
            out += `    {\n`;
            out += `        inst->_Start = false;\n`;
            out += `    }\n`;
            out += `\n`;
            out += `    //trigger callbacks\n`;
            out += `    ${template.datamodel.varName}->process();\n`;
            out += `\n`;
            out += `    if (${template.datamodel.varName}->isConnected)\n`;
            out += `    {\n`;
            for (let dataset of template.datasets) {
                if (!dataset.isPrivate) {
                    if (dataset.isPub) {
                        if(Datamodel.isScalarType(dataset) && (dataset.arraySize == 0)) {
                            out += `        //publish the ${dataset.structName} dataset as soon as there are changes\n`;
                            out += `        if (inst->p${template.datamodel.structName}->${dataset.structName} != ${template.datamodel.varName}->${dataset.structName}.value)\n`;
                            out += `        {\n`;
                            out += `            ${template.datamodel.varName}->${dataset.structName}.value = inst->p${template.datamodel.structName}->${dataset.structName};\n`;
                            out += `            ${template.datamodel.varName}->${dataset.structName}.publish();\n`;
                            out += `        }\n`;
                        } 
                        else {
                            out += `        //publish the ${dataset.structName} dataset as soon as there are changes\n`;
                            out += `        if (0 != memcmp(&inst->p${template.datamodel.structName}->${dataset.structName}, &${template.datamodel.varName}->${dataset.structName}.value, sizeof(${template.datamodel.varName}->${dataset.structName}.value)))\n`;
                            out += `        {\n`;
                            out += `            memcpy(&${template.datamodel.varName}->${dataset.structName}.value, &inst->p${template.datamodel.structName}->${dataset.structName}, sizeof(${template.datamodel.varName}->${dataset.structName}.value));\n`;
                            out += `            ${template.datamodel.varName}->${dataset.structName}.publish();\n`;
                            out += `        }\n`;
                        }
                    }
                }
            }
            out += `        // Your code here...\n`;
            out += `    }\n`;
            out += `\n`;
            out += `    inst->Connected = ${template.datamodel.varName}->isConnected;\n`;
            out += `    inst->Operational = ${template.datamodel.varName}->isOperational;\n`;
            out += `}\n`;
            out += `\n`;
            out += `_BUR_PUBLIC void ${template.datamodel.structName}Exit(struct ${template.datamodel.structName}Exit *inst)\n`;
            out += `{\n`;
            out += `    ${template.datamodel.className}* ${template.datamodel.varName} = static_cast<${template.datamodel.className}*>((void*)inst->Handle);\n`;
            out += `    delete ${template.datamodel.varName};\n`;
            out += `}\n`;
            out += `\n`;
            
            return out;
        }

        /**
         * @param {ApplicationTemplate} template 
         */
        function generateFun(template) {

            let out = "";
            
            out += `FUNCTION_BLOCK ${template.datamodel.structName}Init\n`;
            out += `    VAR_OUTPUT\n`;
            out += `        Handle : UDINT;\n`;
            out += `    END_VAR\n`;
            out += `END_FUNCTION_BLOCK\n`;
            out += `\n`;
            out += `FUNCTION_BLOCK ${template.datamodel.structName}Cyclic\n`;
            out += `    VAR_INPUT\n`;
            out += `        Enable : BOOL;\n`;
            out += `        Start : BOOL;\n`;
            out += `        Handle : UDINT;\n`;
            out += `        p${template.datamodel.structName} : REFERENCE TO ${template.datamodel.structName};\n`;
            out += `    END_VAR\n`;
            out += `    VAR_OUTPUT\n`;
            out += `        Connected : BOOL;\n`;
            out += `        Operational : BOOL;\n`;
            out += `        Error : BOOL;\n`;
            out += `    END_VAR\n`;
            out += `    VAR\n`;
            out += `        _Start : BOOL;\n`;
            out += `        _Enable : BOOL;\n`;
            out += `    END_VAR\n`;
            out += `END_FUNCTION_BLOCK\n`;
            out += `\n`;
            out += `FUNCTION_BLOCK ${template.datamodel.structName}Exit\n`;
            out += `    VAR_INPUT\n`;
            out += `        Handle : UDINT;\n`;
            out += `    END_VAR\n`;
            out += `END_FUNCTION_BLOCK\n`;
            out += `\n`;
        
            return out;
        }

        /**
         * @param {ApplicationTemplate} template 
         */
        function generateIECProgramVar(template) {
            let out = "";
        
            out += `VAR\n`;
            out += `    ${template.datamodel.structName}Init_0 : ${template.datamodel.structName}Init;\n`;
            out += `    ${template.datamodel.structName}Cyclic_0 : ${template.datamodel.structName}Cyclic;\n`;
            out += `    ${template.datamodel.structName}Exit_0 : ${template.datamodel.structName}Exit;\n`;
            out += `    ${template.datamodel.structName}_0 : ${template.datamodel.structName};\n`;
            out += `    ExComponentInfo_0 : ExComponentInfo;\n`;
            out += `    ExDatamodelInfo_0 : ExDatamodelInfo;\n`;
            out += `END_VAR\n`;
        
            return out;
        }
        
        /**
         * @param {ApplicationTemplate} template 
         */
        function generateIECProgramST(template) {
            let out = "";
        
            out += `\n`;
            out += `PROGRAM _INIT\n`;
            out += `\n`;
            out += `    ${template.datamodel.structName}Init_0();\n`;
            out += `\n`;
            out += `END_PROGRAM\n`;
            out += `\n`;
            out += `PROGRAM _CYCLIC\n`;
            out += `    \n`;
            out += `    //Auto connect:\n`;
            out += `    //${template.datamodel.structName}Cyclic_0.Enable := ExComponentInfo_0.Operational;\n`;
            out += `    ${template.datamodel.structName}Cyclic_0(Handle := ${template.datamodel.structName}Init_0.Handle, p${template.datamodel.structName} := ADR(${template.datamodel.structName}_0));\n`;
            out += `    \n`;
            out += `    ExComponentInfo_0(ExTargetLink := ADR(${template.targetName}), ExComponentLink := ADR(${template.aliasName}), Enable := TRUE);\n`;
            out += `    \n`;
            out += `    ExDatamodelInfo_0(ExTargetLink := ADR(${template.targetName}), Enable := TRUE, InstanceName := '${template.datamodelInstanceName}');\n`;
            out += `    \n`;
            out += `END_PROGRAM\n`;
            out += `\n`;
            out += `PROGRAM _EXIT\n`;
            out += `\n`;
            out += `    ${template.datamodel.structName}Exit_0(Handle := ${template.datamodel.structName}Init_0.Handle);\n`;
            out += `\n`;
            out += `END_PROGRAM\n`;
        
            return out;
        }

        super(datamodel, false);

        this.librarySource = {name:`${this.datamodel.typeName.toLowerCase()}.cpp`, contents:generateMainAR(this.template,this.datamodelLegend), description:`${this.datamodel.typeName} library source`};
        this.libraryFun = {name:`${this.datamodel.typeName.substr(0,10)}.fun`, contents:generateFun(this.template), description:`${this.datamodel.typeName} function blocks`}; // Avoid Error in AS: The name of the .fun file is not equal to the name of the library.	(9348)
        this.iecProgramVar = {name:`${this.datamodel.typeName}.var`, contents:generateIECProgramVar(this.template), description:`${this.datamodel.typeName} variable declaration`};
        this.iecProgramST = {name:`${this.datamodel.typeName}.st`, contents:generateIECProgramST(this.template), description:`${this.datamodel.typeName} application`};

        this.heap = new TemplateARHeap(100000);
    }
}

module.exports = {TemplateARCpp};