const { Template, ApplicationTemplate } = require('../template');
const {TemplateStaticCLib} = require('../template_static_c_lib');
const { Datamodel, GeneratedFileObj } = require('../../../datamodel');
const {TemplateARHeap } = require('./template_ar_heap');

class TemplateARStaticCLib extends TemplateStaticCLib {

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
     * {@linkcode TemplateARStaticCLib} Generate code for static c-library wrapper and main function for Linux applications
     *
     * Generates following {@link GeneratedFileObj} objects 
     * - {@linkcode librarySource}
     * - {@linkcode libraryFun}
     * - {@linkcode iecProgramVar}
     * - {@linkcode iecProgramST}
     * 
     * inherited from {@linkcode TemplateStaticCLib}
     * 
     * - {@linkcode staticLibrarySource} static library source code
     * - {@linkcode staticLibraryHeader} static library header
     * 
     * Using {@linkcode TemplateARHeap}
     * - `heap.heapSource` declaring the dynamic heap
     * 
     * @param {Datamodel} datamodel
     */
    constructor(datamodel) {
        super(datamodel,false);

        this.librarySource = {name:`${this.datamodel.typeName.toLowerCase()}.c`, contents:this._generateSource(), description:`${this.datamodel.typeName} library source`};
        this.libraryFun = {name:`${this.datamodel.typeName}.fun`, contents:this._generateFun(), description:`${this.datamodel.typeName} function blocks`};
        this.iecProgramVar = {name:`${this.datamodel.typeName}.var`, contents:this._generateIECProgramVar(), description:`${this.datamodel.typeName} variable declaration`};
        this.iecProgramST = {name:`${this.datamodel.typeName}.st`, contents:this._generateIECProgramST(), description:`${this.datamodel.typeName} application`};
        this.heap = new TemplateARHeap(100000);
    }

    /**
     * @returns {string} `{Library}.fun`: Library function block declaration
     */
    _generateFun() {

        /**
         * @param {ApplicationTemplate} template 
         * @returns {string}
         */
        function generateFun(template) {

            let out = "";
        
            out += `FUNCTION_BLOCK ${template.datamodel.structName}Cyclic\n`;
            out += `	VAR_INPUT\n`;
            out += `		Enable : BOOL;\n`;
            out += `		Start : BOOL;\n`;
            out += `		p${template.datamodel.structName} : REFERENCE TO ${template.datamodel.structName};`;
            out += `	END_VAR\n`;
            out += `	VAR_OUTPUT\n`;
            out += `		Connected : BOOL;\n`;
            out += `		Operational : BOOL;\n`;
            out += `		Error : BOOL;\n`;
            out += `	END_VAR\n`;
            out += `	VAR\n`;
            out += `		_Handle : UDINT;\n`;
            out += `		_Start : BOOL;\n`;
            out += `		_Enable : BOOL;\n`;
            out += `	END_VAR\n`;
            out += `END_FUNCTION_BLOCK\n`;
            out += `\n`;
        
            return out;
        }
        return generateFun(this.template);
    }

    /**
     * @returns {string} `{ProgramName}.var`: varaible declaration for the ST program
     */
    _generateIECProgramVar() {

        /**
         * @param {ApplicationTemplate} template 
         * @returns {string}
         */
        function generateIECProgramVar(template) {
            let out = "";
        
            out += `VAR\n`;
            out += `    ${template.datamodel.structName}_0 : ${template.datamodel.structName};\n`;
            out += `    ${template.datamodel.structName}Cyclic_0 : ${template.datamodel.structName}Cyclic;\n`;
            out += `END_VAR\n`;
        
            return out;
        }

        return generateIECProgramVar(this.template);
    }
    
    /**
     * @returns {string} `{ProgramName}.st`: application implementation code in ST
     */
    _generateIECProgramST()
    {
        /**
         * @param {ApplicationTemplate} template 
         * @returns {string}
         */
        function generateIECProgramST(template) {
            let out = "";
        
            out += `\n`;
            out += `PROGRAM _INIT\n`;
            out += `\n`;
            out += `END_PROGRAM\n`;
            out += `\n`;
            out += `PROGRAM _CYCLIC\n`;
            out += `\n`;
            out += `    ${template.datamodel.structName}Cyclic_0.p${template.datamodel.structName} := ADR(${template.datamodel.structName}_0);\n`;
            out += `    ${template.datamodel.structName}Cyclic_0();\n`;
            out += `\n`;
            out += `END_PROGRAM\n`;
            out += `\n`;
            out += `PROGRAM _EXIT\n`;
            out += `\n`;
            out += `    ${template.datamodel.structName}Cyclic_0.Enable := FALSE;\n`;
            out += `    ${template.datamodel.structName}Cyclic_0();\n`;
            out += `\n`;
            out += `END_PROGRAM\n`;
        
            return out;
        }

        return generateIECProgramST(this.template);
    }

    /**
     * @returns {string} `{main}.c`: main AR library function
     */
    _generateSource() {

        /**
         * 
         * @param {ApplicationTemplate} template 
         * @param {boolean} PubSubSwap 
         * @param {string} legend 
         * @returns 
         */
        function generateMainAR(template, PubSubSwap, legend) {
            
            let out = "";
            
            out += `#include <string.h>\n`;
            out += `#include <stdbool.h>\n`;
            out += `#include "${template.libHeaderName}"\n\n`;
        
            out += legend;
        
            out += `static ${template.datamodel.libStructName}_t *${template.datamodel.varName};\n`;
            out += `static struct ${template.datamodel.structName}Cyclic *cyclic_inst;\n\n`;
        
            out += `static void on_connected_${template.datamodel.varName}(void)\n{\n}\n\n`;
        
            for (let dataset of template.datasets) {
                if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
                    out += `static void on_change_${dataset.varName}(void)\n`;
                    out += `{\n`;
                    if (Datamodel.isScalarType(dataset.dataType) && dataset.arraySize == 0) {
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
                    if (Datamodel.isScalarType(dataset.dataType) && dataset.arraySize == 0) {
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

        return generateMainAR(this.template, this.isLinux, this.staticLibraryLegend);

    }
}

module.exports = {TemplateARStaticCLib};