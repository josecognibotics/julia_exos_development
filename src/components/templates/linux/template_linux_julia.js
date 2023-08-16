/*
 * Copyright (C) 2021 B&R Danmark
 * All rights reserved
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const { Template, ApplicationTemplate } = require('../template')
const { Datamodel, GeneratedFileObj } = require('../../../datamodel');

class TemplateLinuxJulia extends Template {
    
    /**
     * main sourcefile for the application
     * @type {GeneratedFileObj}
     */
    mainSource;

    /**
     * {@linkcode TemplateLinuxJulia} Generates code for a Linux Julia
     * 
     * - {@linkcode mainSource} main sourcefile for the application
     * 
     * @param {Datamodel} datamodel
     */

    constructor(datamodel) {
        super(datamodel, true);
        if (datamodel == undefined) {
            this.mainSource = {name:`main.jl`, contents:this._generateSourceNoDatamodel(false), description:"Linux application"};
        }
        else {
            this.mainSource = {name:`${this.datamodel.typeName.toLowerCase()}.jl`, contents:this._generateJuliaMain(), description:"Linux application"};
        }
    }

    /**
     * It create the first part of the Julia file. Here you import and use any desire module also it creates a string that contains the different structures names
     * @param {ApplicationTemplate} template 
     * @returns {string}
     */
    generateInit(template) {
        let out = "";
        out += `module exos_${this.datamodel.typeName.toLowerCase()}\n\n`;
        
        out += `using StaticArrays\n\n`;

        out += `const libexos_api = "/usr/lib/libexos-api.so"\n`
        out += `const EXOS_ARRAY_DEPTH = 10\n`
        out += `const config_${this.datamodel.typeName.toLowerCase()} = ${this.JSONString()}\n\n`;

        out += `export\n`;

        for (let dataset of template.datasets) {
                out += `\t${dataset.structName},\n`;
            }

        out = out.slice(0, -2);
        out += `\n\n`;

        return out;
    }

    JSONString(){
        let out = "";
        out += `STATE 1\n`;

        out += `${this.datamodel.sourceFile.contents}\n`;
        out = out.split("=")[1].trim();
        out = out.split(";")[0].trim();
        return out      
    }

    /**
     * @returns `{main}.jl`: main sourcefile for the application when creating without datamodel
     */
    _generateSourceNoDatamodel() {
        let out = "\t";
        out += `#include <stdio.h>\n`;
    
        //declarations
        out += `int main()\n{\n`
        out += `    catch_termination();\n\n`;

        //main loop
        out += `    while (true)\n    {\n`;
        out += `        //put your cyclic code here!\n\n`;
        out += `        if (is_terminated())\n`;
        out += `        {\n`;
        out += `            printf("Application terminated, closing..");\n`;
        out += `            break;\n`;
        out += `        }\n`;
        out += `    }\n\n`;

        out += `    return 0;\n`
        out += `}\n`
    
        return out;
    }
    /**
     * @returns {string} datatype (BOOL, UDINT) as stdint.h/stdbool.h datatype (bool, uint32_t) or struct/enum (unchanged)
     * @param {string} type IEC type, like BOOL or UDINT 
     */
    convertPlcType(type) {
        switch (type) {
            case "BOOL": return "Bool";
            case "CHAR": return "Char";
            case "USINT": return "UInt8";
            case "SINT": return "Int8";
            case "UINT": return "UInt16";
            case "INT": return "Int16";
            case "UDINT": return "UInt32";
            case "DINT": return "Int32";
            case "REAL": return "Float32";
            case "LREAL": return "Float64";
            case "BYTE": return "UInt8";
            case "STRING": return "String";
            default: //returning the type makes the function valid even if you insert a struct or enum
                return type;
        }
    }
    
    _makeDataTypes(swig) {

        let fileLines = this.datamodel.fileLines;
        let sortedStructs = this.datamodel.sortedStructs;

        /**return the code for a datatype member with the given properties */
        function _outputMember(type, name, arrays, comment) {
            let out = "\t";

            if ((arrays == 0) && (arrays.length == 1)) {
                out += `\t${name}::${type}`;
                }

            if ((arrays != 0) && (arrays.length > 0)) {
                out += `\t${name}::MVector{${arrays[0]}, ${type}}`;
                }
    
            
            out += ``;

            if (comment != "") out += ` #${comment}`;
            out += `\r\n`;
            return out;
        }


        /**search the fileLines to see if name is a structure, returns true if name is a structure*/
        function _isStructType(fileLines, name) {
            for (let line of fileLines) {
                if (line.includes("STRUCT") && line.includes(":")) {
                    if (name == line.split(":")[0].trim()) return true;
                }
            }
            return false;
        }

        /** return the string between two delimiters (start,end) of a given line. return null if one of the delimiters isn't found*/
        function _takeout(line, start, end) {
            if (line.includes(start) && line.includes(end)) {
                return line.split(start)[1].split(end)[0];
            }
            else return null;
        }

        let out = ``;
        let structname = "";
        let members = 0;
        let cmd = "find_struct_enum";
        let structs = [];

        for (let line of fileLines) {
            
            let comment = ""
            if (line.includes("(*")) {
                comment = _takeout(line, "(*", "*)");
            }

            switch (cmd) {
                case "find_struct_enum":
                    //analyze row check for struct, enum and directly derived types

                    line = line.split("(*")[0];
                    line = line.split(":");
                    for (let i = 0; i < line.length; i++) line[i] = line[i].trim();

                    if (line[1] == ("STRUCT")) {
                        cmd = "read_struct";
                        if (comment != "") out += "#" + comment + "\r\n";
                        structname = line[0];
                        out += `\tstruct ${structname}\r\n`;
                        structs.push({ name: structname, out: "", depends: [] });
                    }
                    else if (line[1] == ("")) {
                        cmd = "read_enum";
                        if (comment != "") out += "#" + comment + "\r\n";
                        structname = line[0];
                        out += `\t@enum ${structname} `;
                        members = 0;
                        structs.push({ name: structname, out: "", depends: [] });
                    }
                    //"else" line[1] is not "" (enum) and not "STRUCT" then it have to be a derived type = do nothing
                    break;

                case "read_enum":
                    if (line.includes(")")) {
                        cmd = "find_struct_enum";
                        if (members > 0) {
                            out = out.slice(0, -1); //remove the last ,\r\n STATE
                            out += `\t\r\n`;
                        }
                        out += `\r\n`;
                        structs[structs.length - 1].out = out;
                        out = "";
                    }
                    else if (!line.includes("(")) {
                        if (line.includes(":=")) {
                            let name = line.split(":=")[0].trim();
                            let enumValue = line.split(":=")[1].trim();
                            enumValue = parseInt(enumValue.split(",")[0].trim());
                            out += `\t${name} = ${enumValue}\r\n`;
                        }
                        else {
                            let name = line.split(",")[0].trim();
                            out += `${name.toUpperCase()} `;
                        }
                        members++;
                    }
                    break;

                case "read_struct":
                    if (line.includes("END_STRUCT")) {
                        cmd = "find_struct_enum";
                        out += `\tend\r\n\r\n`;
                        structs[structs.length - 1].out = out;
                        out = "";
                    }
                    else {
                        let arraySize = 0;
                        let stringSize = 0;
                        if (line.includes("ARRAY")) {
                            let range = _takeout(line, "[", "]")
                            if (range != null) {
                                let from = parseInt(range.split("..")[0].trim());
                                let to = parseInt(range.split("..")[1].trim());
                                arraySize = to - from + 1;
                            }
                        }
                        if (line.includes(":")) {
                            let name = line.split(":")[0].trim();
                            let type = "";
                            if (arraySize > 0) {
                                type = line.split(":")[1].split("OF")[1].trim();
                            }
                            else {
                                type = line.split(":")[1].trim();
                            }
                            //let comment = "";
                            if (type.includes("(*")) {
                                //comment = _takeout(type, "(*", "*)");
                                type = type.split("(*")[0].trim();
                            }

                            if (arraySize > 0 && swig !== undefined && swig) {
                                out += `\t# array not exposed directly:`
                            }

                            let typeForSwig = "";
                            let dataset = {dataType: type, type: "notenum"};
                            if (type.includes("STRING")) {
                                let length = _takeout(type, "[", "]");
                                if (length != null) {
                                    typeForSwig = "char";
                                    stringSize = parseInt(length) + 1;
                                    out += _outputMember("String", name, [arraySize, stringSize], comment);
                                }
                            }
                            else if (Datamodel.isScalarType(dataset)) {
                                let stdtype = this.convertPlcType(type);
                                typeForSwig = stdtype;
                                out += _outputMember(stdtype, name, [arraySize], comment);
                            }
                            else {
                                structs[structs.length - 1].depends.push(type); // push before adding "struct "
                                typeForSwig = type;
                                if (_isStructType(fileLines, type)) {
                                    typeForSwig = type;
                                    type = "" + type;
                                }
                                out += _outputMember(type, name, [arraySize], comment);
                            }

                            if (arraySize > 0 && swig !== undefined && swig) {
                                // add sai=swig array info
                                out += `<sai>{"structname": "${structname}", "membername": "${name}", "datatype": "${typeForSwig}", "arraysize": "${arraySize}", "stringsize": "${stringSize}"}</sai>`
                            }
                        }
                    }
                    break;
            }
        }

        //output the sorted structures
        out = "";

        for(let i=0; i<sortedStructs.length; i++) {
            for (let struct of structs) {
                if(sortedStructs[i].name ==struct.name) {
                    sortedStructs[i].dependencies = struct.depends;
                    // find and extract all swig array info stuff and add them last to be able to replace it correctly in swig template generator
                    if (swig !== undefined && swig) {
                        // do not include the last one (top-level struct) as it already exists as struct lib<typname>
                        if(i < sortedStructs.length-1) {
                            let swigInfo = ""
                            let matches = struct.out.matchAll(/<sai>(.*)<\/sai>/g);
                            let swigInfoResult = Array.from(matches, x => x[1]);
                            if (swigInfoResult.length > 0)
                                swigInfo = `<sai>{"swiginfo": [` + swigInfoResult.join(",") + `]}</sai>`;
                            out += struct.out.replace(/<sai>.*<\/sai>/g, "") + swigInfo;
                        }
                    }
                    else {
                        out += struct.out;
                    } 
                }
            }
        }

        return out;
        }

    /**
     * Creates the script for the enums that will be used in the structures
     */
    _generateStructsAndEnums() {
        let out = "";
        out += `# ----------------------------- DECLARATIONS ----------------------------- #\n`;
        out += `\n`;

        out += `struct julia_exos_dataset_info\n`;
        out += `\tname::Ptr{UInt8}\n`;
        out += `\tadr::Ptr{Cvoid}\n`;
        out += `\tsize::Csize_t\n`;
        out += `\toffset::Clong\n`;
        out += `\tarrayItems::NTuple{EXOS_ARRAY_DEPTH, UInt32}\n`;
        out += `end\n`;
        out += `\n`;

        out += `# INITIALIZATION: julia_exos_dataset_info #\n`;
        out += `dataset_info = julia_exos_dataset_info(\n`;
        out += `\tC_NULL,\n`;
        out += `\tC_NULL,\n`;
        out += `\t0,\n`;
        out += `\t0,\n`;
        out += `\t(UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0))\n`;
        out += `)\n`;

        out += `@enum EXOS_ERROR_CODE begin\n`;
        out += `\tEXOS_ERROR_OK = 0\n`;
        out += `\tEXOS_ERROR_NOT_IMPLEMENTED = 5000\n`;
        out += `\tEXOS_ERROR_PARAMETER_NULL\n`;
        out += `\tEXOS_ERROR_BAD_DATAMODEL_HANDLE\n`;
        out += `\tEXOS_ERROR_BAD_DATASET_HANDLE\n`;
        out += `\tEXOS_ERROR_BAD_LOG_HANDLE\n`;
        out += `\tEXOS_ERROR_BAD_SYNC_HANDLE\n`;
        out += `\tEXOS_ERROR_NOT_ALLOWED\n`;
        out += `\tEXOS_ERROR_NOT_FOUND\n`;
        out += `\tEXOS_ERROR_STRING_FORMAT\n`;
        out += `\tEXOS_ERROR_MESSAGE_FORMAT\n`;
        out += `\tEXOS_ERROR_NO_DATA\n`;
        out += `\tEXOS_ERROR_BUFFER_OVERFLOW\n`;
        out += `\tEXOS_ERROR_TIMEOUT\n`;
        out += `\tEXOS_ERROR_BAD_DATASET_SIZE\n`;
        out += `\tEXOS_ERROR_USER\n`;
        out += `\tEXOS_ERROR_SYSTEM\n`;
        out += `\tEXOS_ERROR_SYSTEM_SOCKET\n`;
        out += `\tEXOS_ERROR_SYSTEM_SOCKET_USAGE\n`;
        out += `\tEXOS_ERROR_SYSTEM_MALLOC\n`;
        out += `\tEXOS_ERROR_SYSTEM_LXI\n`;
        out += `\tEXOS_ERROR_DMR_NOT_READY\n`;
        out += `\tEXOS_ERROR_DMR_SHUTDOWN\n`;
        out += `\tEXOS_ERROR_BAD_STATE\n`;
        out += `end\n`;
        out += `\n`;

        out += `@enum EXOS_CONNECTION_STATE begin\n`;
        out += `\tEXOS_STATE_DISCONNECTED\n`;
        out += `\tEXOS_STATE_CONNECTED\n`;
        out += `\tEXOS_STATE_OPERATIONAL\n`;
        out += `\tEXOS_STATE_ABORTED\n`;
        out += `end\n`;
        out += `\n`;

        out += `@enum EXOS_DATAMODEL_EVENT_TYPE begin\n`;
        out += `\tEXOS_DATAMODEL_EVENT_CONNECTION_CHANGED\n`;
        out += `\tEXOS_DATAMODEL_EVENT_SYNC_STATE_CHANGED\n`;
        out += `end\n`;
        out += `\n`;
        
        out += `struct julia_exos_datamodel_sync_info\n`;
        out += `\tin_sync::Cint\n`;
        out += `\t_reserved_bool::NTuple{8, Cint}\n`;
        out += `\tmissed_dmr_cycles::UInt32\n`;
        out += `\tmissed_ar_cycles::UInt32\n`;
        out += `\t_reserved_uint32::NTuple{7, UInt32}\n`;
        out += `end\n`;
        out += `\n`;

        out += `# INITIALIZATION: julia_exos_datamodel_sync_info #\n`;
        out += `datamodel_sync_info = julia_exos_datamodel_sync_info(\n`;
        out += `\t0,\n`;
        out += `\t(Cint(0), Cint(0), Cint(0), Cint(0), Cint(0), Cint(0), Cint(0), Cint(0)),\n`;
        out += `\t0,\n`;
        out += `\t0,\n`;
        out += `\t(UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0))\n`;
        out += `)\n`;
        out += `\n`;

        out += `struct julia_exos_datamodel_private\n`;
        out += `\t_magic::UInt32\n`;
        out += `\t_artefact::Ptr{Cvoid}\n`;
        out += `\t_reserved::NTuple{8, Ptr{Cvoid}}\n`;
        out += `end\n`;
        out += `\n`;

        out += `# INITIALIZATION: julia_exos_datamodel_private #\n`;
        out += `datamodel_private = julia_exos_datamodel_private(\n`;
        out += `\t0,\n`;
        out += `\tC_NULL,\n`;
        out += `\t(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),\n`;
        out += `)\n`;
        out += `\n`;

        //out += `const exos_datamodel_event_cb = Function[[Ptr{julia_exos_datamodel_handle}, EXOS_DATAMODEL_EVENT_TYPE, Ptr{Cvoid}]]\n\n`;

        out += `struct julia_exos_datamodel_handle\n`;
        out += `\tname::Ptr{UInt8}\n`;
        out += `\tconnection_state::EXOS_CONNECTION_STATE\n`;
        out += `\terror::EXOS_ERROR_CODE\n`;
        out += `\tuser_context::Ptr{Cvoid}\n`;
        out += `\tuser_tag::Clong\n`;
        out += `\tuser_alias::Ptr{Cchar}\n`;
        out += `\tdatamodel_event_callback::Function\n`;
        out += `\tsync_info::julia_exos_datamodel_sync_info\n`;
        out += `\t_reserved_bool::NTuple{8, Cint}\n`;
        out += `\t_reserved_uint32::NTuple{8, UInt32}\n`;
        out += `\t_reserved_void::NTuple{8, Ptr{Cvoid}}\n`;
        out += `\t_private::julia_exos_datamodel_private\n`;
        out += `end\n`;
        out += `\n`;

        out += `state = EXOS_CONNECTION_STATE(0)\n`;
        out += `err = EXOS_ERROR_CODE(0)\n`;
        out += `\n`;
        out += `function test()\n`;
        out += `\tprintln("HELLO")\n`;
        out += `end\n`;
        out += `\n`;

        out += `# INITIALIZATION: julia_exos_datamodel_handle #\n`;
        out += `datamodel_handle = julia_exos_datamodel_handle(\n`;
        out += `\tC_NULL,\n`;
        out += `\tstate,\n`;
        out += `\terr,\n`;
        out += `\tC_NULL,\n`;
        out += `\t0,\n`;
        out += `\tC_NULL,\n`;
        out += `\ttest,\n`;
        out += `\tdatamodel_sync_info,\n`;
        out += `\t(Cint(0), Cint(0), Cint(0), Cint(0), Cint(0), Cint(0), Cint(0), Cint(0)),\n`;
        out += `\t(UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0)),\n`;
        out += `\t(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),\n`;
        out += `\tdatamodel_private\n`;
        out += `)\n`;
        out += `\n`;

        out += `@enum EXOS_DATASET_EVENT_TYPE begin\n`;
        out += `\tEXOS_DATASET_EVENT_CONNECTION_CHANGED\n`;
        out += `\tEXOS_DATASET_EVENT_UPDATED\n`;
        out += `\tEXOS_DATASET_EVENT_PUBLISHED\n`;
        out += `\tEXOS_DATASET_EVENT_DELIVERED\n`;
        out += `\t#EXOS_DATASET_RECIEVED\n`;
        out += `end\n`;
        out += `\n`;

        out += `struct julia_exos_buffer_info\n`;
        out += `\tsize::UInt32\n`;
        out += `\tfree::UInt32\n`;
        out += `\tused::UInt32\n`;
        out += `end\n`;
        out += `\n`;

        out += `# INITIALIZATION: julia_exos_buffer_info #\n`;
        out += `buffer_info = julia_exos_buffer_info(\n`;
        out += `\t0,\n`;
        out += `\t0,\n`;
        out += `\t0\n`;
        out += `)\n`;
        out += `\n`;

        out += `@enum EXOS_DATASET_TYPE begin\n`;
        out += `\tEXOS_DATASET_SUBSCRIBE = 1\n`;
        out += `\tEXOS_DATASET_PUBLISH = 16\n`;
        out += `end\n`;
        out += `\n`;

        out += `struct julia_exos_dataset_private\n`;
        out += `\t_magic::UInt32\n`;
        out += `\t_value::Ptr{Cvoid}\n`;
        out += `\t_reserved::NTuple{8, Ptr{Cvoid}}\n`;
        out += `end\n`;
        out += `\n`;

        out += `# INITIALIZATION: julia_exos_dataset_private #\n`;
        out += `dataset_private = julia_exos_dataset_private(\n`;
        out += `\t0,\n`;
        out += `\tC_NULL,\n`;
        out += `\t(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),\n`;
        out += `)\n`;
        out += `\n`;

        out += `struct julia_exos_dataset_handle\n`;
        out += `\tname::Ptr{Cchar}\n`;
        out += `\ttype::EXOS_DATASET_TYPE\n`;
        out += `\tdatamodel::julia_exos_datamodel_handle\n`;
        out += `\tdata::Ptr{Cvoid}\n`;
        out += `\tsize::Csize_t\n`;
        out += `\terror::EXOS_ERROR_CODE\n`;
        out += `\tconnection_state::EXOS_CONNECTION_STATE\n`;
        out += `\tsend_buffer::julia_exos_buffer_info\n`;
        out += `\tnettime::Int32\n`;
        out += `\tuser_tag::Int32\n`;
        out += `\tuser_context::Ptr{Cvoid}\n`;
        out += `\tdataset_event_callback::Function\n`;
        out += `\t_reserved_bool::NTuple{8, Cint}\n`;
        out += `\t_reserved_uint32::NTuple{8, UInt32}\n`;
        out += `\t_reserved_void::NTuple{8, Ptr{Cvoid}}\n`;
        out += `\t_private::julia_exos_dataset_private\n`;
        out += ` end\n`;
        out += `\n`;

        out += `type = EXOS_DATASET_TYPE(1)\n`;
        out += `\n`;

        out += `# INITIALIZATION: julia_exos_dataset_handle #\n`;
        out += `dataset_handle = julia_exos_dataset_handle(\n`;
        out += `\tC_NULL,\n`;
        out += `\ttype,\n`;
        out += `\tdatamodel_handle,\n`;
        out += `\tC_NULL,\n`;
        out += `\t0,\n`;
        out += `\terr,\n`;
        out += `\tstate,\n`;
        out += `\tbuffer_info,\n`;
        out += `\t0,\n`;
        out += `\t0,\n`;
        out += `\tC_NULL,\n`;
        out += `\ttest,\n`;
        out += `\t(Cint(0), Cint(0), Cint(0), Cint(0), Cint(0), Cint(0), Cint(0), Cint(0)),\n`;
        out += `\t(UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0), UInt32(0)),\n`;
        out += `\t(Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL), Ptr{Cvoid}(C_NULL)),\n`;
        out += `\tdataset_private\n`;
        out += `)\n`;
        out += `\n`;

        out += `@enum EXOS_DATAMODEL_PROCESS_MODE begin\n`;
        out += `\tEXOS_DATAMODEL_PROCESS_BLOCKING\n`;
        out += `\tEXOS_DATAMODEL_PROCESS_NON_BLOCKING\n`;
        out += `end\n`;
        out += `\n`;

        return out;
    }


    /**
     * Creates the script for the callbacks
     */
    _generateCallBacks() {

        let out = "";
        
        out += `# ------------------------------------ Julia FUNCTIONS: ------------------------------------ #\n\n`;

        out += `get_error_string = @ccall libexos_api.exos_get_error_string(err::EXOS_ERROR_CODE)::Ptr{Cchar}\n`;
        out += `@show unsafe_string(get_error_string)\n\n`;

        out += `get_state_string = @ccall libexos_api.exos_get_state_string(state::EXOS_CONNECTION_STATE)::Ptr{Cchar}\n`;
        out += `@show unsafe_string(get_state_string)\n\n`;

        out += `println("\\n---------------- DATAMODEL FUNCTION CALLS ----------------\\n")\n`;
        out += `datamodel_init = @ccall libexos_api.exos_datamodel_init(datamodel_handle::Ref{julia_exos_datamodel_handle}, C_NULL::Ref{Cchar}, C_NULL::Ref{Cchar})::Cint\n`;
        out += `datamodel_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_init)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("datamodel_init\\t\\t\\t-> ERROR_CODE: $datamodel_init_string")\n`;
        out += `\n`;
        out += `datamodel_calc_dataset_info = @ccall libexos_api.exos_datamodel_calc_dataset_info(dataset_info::Ref{julia_exos_dataset_info}, 0::Csize_t)::Cint\n`;
        out += `datamodel_calc_dataset_info_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_calc_dataset_info)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("datamodel_calc_dataset_info\\t-> ERROR_CODE: $datamodel_calc_dataset_info_string")\n`;
        out += `\n`;
        out += `datamodel_connect = @ccall libexos_api.exos_datamodel_connect(datamodel_handle::Ref{julia_exos_datamodel_handle}, C_NULL::Ref{Cchar}, dataset_info::Ref{julia_exos_dataset_info}, 0::Csize_t, test::Function)::Cint\n`;
        out += `datamodel_connect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_connect)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("datamodel_connect\\t\\t-> ERROR_CODE: $datamodel_connect_string")\n`;
        out += `\n`;
        out += `datamodel_set_operational = @ccall libexos_api.exos_datamodel_set_operational(datamodel_handle::Ref{julia_exos_datamodel_handle})::Cint\n`;
        out += `datamodel_set_operational_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_set_operational)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("datamodel_set_operational\\t-> ERROR_CODE: $datamodel_set_operational_string")\n`;
        out += `\n`;
        out += `datamodel_disconnect = @ccall libexos_api.exos_datamodel_disconnect(datamodel_handle::Ref{julia_exos_datamodel_handle})::Cint\n`;
        out += `datamodel_disconnect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_disconnect)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("datamodel_disconnect\\t\\t-> ERROR_CODE: $datamodel_disconnect_string")\n`;
        out += `\n`;
        out += `datamodel_delete = @ccall libexos_api.exos_datamodel_disconnect(datamodel_handle::Ref{julia_exos_datamodel_handle})::Cint\n`;
        out += `datamodel_delete_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_delete)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("datamodel_delete\\t\\t-> ERROR_CODE: $datamodel_delete_string")\n`;
        out += `\n`;
        out += `datamodel_process = @ccall libexos_api.exos_datamodel_process(datamodel_handle::Ref{julia_exos_datamodel_handle})::Cint\n`;
        out += `datamodel_process_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(datamodel_process)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("datamodel_process\\t\\t-> ERROR_CODE: $datamodel_process_string")\n`;
        out += `\n`;
        out += `datamodel_get_nettime = @ccall libexos_api.exos_datamodel_get_nettime(datamodel_handle::Ref{julia_exos_datamodel_handle})::Int32\n`;
        out += `println("datamodel_get_nettime\\t\\t-> AR NETTIME: $datamodel_get_nettime")\n`;
        out += `\n`;
        out += `println("\\n---------------- DATASET FUNCTION CALLS ----------------\\n")\n`;
        out += `dataset_init = @ccall libexos_api.exos_dataset_init(dataset_handle::Ref{julia_exos_dataset_handle}, datamodel_handle::Ref{julia_exos_datamodel_handle}, C_NULL::Ref{Cchar}, C_NULL::Ref{Cvoid}, 0::Csize_t)::Cint\n`;
        out += `dataset_init_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_init)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("dataset_init\\t\\t\\t-> ERROR_CODE: $dataset_init_string")\n`;
        out += `\n`;
        out += `dataset_connect = @ccall libexos_api.exos_dataset_connect(dataset_handle::Ref{julia_exos_dataset_handle}, type::EXOS_DATASET_TYPE, test::Function)::Cint\n`;
        out += `dataset_connect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_connect)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("dataset_connect\\t\\t\\t-> ERROR_CODE: $dataset_connect_string")\n`;
        out += `\n`;
        out += `dataset_publish = @ccall libexos_api.exos_dataset_publish(dataset_handle::Ref{julia_exos_dataset_handle})::Cint\n`;
        out += `dataset_publish_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_publish)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("dataset_publish\\t\\t\\t-> ERROR_CODE: $dataset_publish_string")\n`;
        out += `\n`;
        out += `dataset_disconnect = @ccall libexos_api.exos_dataset_disconnect(dataset_handle::Ref{julia_exos_dataset_handle})::Cint\n`;
        out += `dataset_disconnect_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_disconnect)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("dataset_disconnect\\t\\t-> ERROR_CODE: $dataset_disconnect_string")\n`;
        out += `\n`;
        out += `dataset_delete = @ccall libexos_api.exos_dataset_disconnect(dataset_handle::Ref{julia_exos_dataset_handle})::Cint\n`;
        out += `dataset_delete_string = unsafe_string(@ccall libexos_api.exos_get_error_string(EXOS_ERROR_CODE(dataset_delete)::EXOS_ERROR_CODE)::Ptr{Cchar})\n`;
        out += `println("dataset_delete\\t\\t\\t-> ERROR_CODE: $dataset_delete_string")\n`;
        out += `println("")\n`;

        return out;
    }
    
    /**
     * @returns `{main}.jl`: main Julia file for the application
     */
    _generateJuliaMain() {

        let out = "";
        out += this.generateInit(this.template);
        out += this._makeDataTypes(false);
        out += this._generateStructsAndEnums();
        out += this._generateCallBacks();

        out += `end\n`

    
        return out;
    }

}
module.exports = {TemplateLinuxJulia};