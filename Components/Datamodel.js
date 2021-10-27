
const version = "1.1.0";

/**
 * Not yet implemented:
 * - multidimensional arrays
 * - value initialization of structures or structure members
 * 
 * Todos:
 * - create an error for multidimenstional arrays
 * - what happens if one of the types arent found??
 *  */


const fs = require('fs');
const path = require('path');

class Datamodel {

    #_types;
    #_infoId;
    #_nestingDepth;
    #_structNestingDepth;
    #_fileLines;
    #_sourceCode;
    #_dataTypeCode;
    #_dataTypeCodeSWIG;
    #_headerCode;

    //limit constants - generates error of exceeded
    static MAX_ARRAY_NEST = 10;
    static MAX_STRUCT_NEST = 32; // avoid infinite loops with cyclic declared types. Not sure what the AS limit is (There is a limit e.g. Error number: 5868)
    static SORT_STRUCT_MAX = 5000;
    static MAX_IDS = 256;
    static MAX_AREA_NAME_LENGTH = 256;
    static MAX_CONFIG_LENGTH = 60000;

    /**
     * 
     * @param {string} fileName name of the file to parse, e.g. ./SomeFolder/WaterTank.typ
     * @param {string} typName name of the structure, e.g. WaterTank
     * @param {string[]} SG4Includes (optional) list of include directives within the #ifdef _SG4 part. If left out, theres no #ifdef _SG4
     * 
     * PREVIOUSLY generateHeader
     */
    constructor(fileName, typeName, SG4Includes) {
        
        this.fileName = fileName;
        this.typeName = typeName;
        this.SG4Includes = SG4Includes;

        this.#_types = [];
        this.#_infoId = 0;
        this.#_nestingDepth = 0;
        this.#_structNestingDepth = 0;

        //read the file
        this.#_fileLines = fs.readFileSync(this.fileName).toString();
        //remove stuff we dont want to look at
        this.#_fileLines = this.#_fileLines.split("\r").join("");
        this.#_fileLines = this.#_fileLines.split(";").join("");
        this.#_fileLines = this.#_fileLines.split("{REDUND_UNREPLICABLE}").join("");
        //now split with line endings
        this.#_fileLines = this.#_fileLines.split("\n");

        //create the objects that the class exposes
        //the sequence of the calls cannot be changed
        this.#_types = this._makeJsonTypes();
        this.#_sourceCode = this._makeSource();
        this.#_dataTypeCode = this._makeDataTypes();
        this.#_dataTypeCodeSWIG = this._makeDataTypes(true);
        this.#_headerCode = this._makeHeader();
    }

    /**
     * @returns {object} the structure of the datatype `typeName` as JSON object.
     * 
     * PREVIOUSLY parseTypFile
     */
    get typeJsonObject() {
        return this.#_types;
    }

    /**
     * @returns {string} the exos_{typname}.h headerfile as ASCII string
     *  
     * PREVIOUSLY generateHeader
     */
    get headerCode() {
        return this.#_headerCode;
    }

    /**
     * @returns {string} the exos_{typname}.c source code as ASCII string
     *  
     * PREVIOUSLY generateHeader
     */
     get sourceCode() {
        return this.#_sourceCode;
    }


    /**
     * @returns {string} an ASCII string with C-datatype definitions of the datatype `typeName`
     * 
     * PREVIOUSLY convertTyp2Struct
     */
    get dataTypeCode() {
        return this.#_dataTypeCode;
    }

    /**
     * @returns {string} an ASCII string with C-datatype definitions of the datatype `typeName` adjusted to SWIG
     * 
     * PREVIOUSLY convertTyp2Struct(swig)
     */
    get dataTypeCodeSWIG() {
        return this.#_dataTypeCodeSWIG;
    }

    /**
     * @returns {string} datatype (BOOL, UDINT) as stdint.h/stdbool.h datatype (bool, uint32_t) or struct (unchanged)
     * @param {string} type IEC type, like BOOL or UDINT 
     * 
     * PREVIOUSLY convertPlcType
     */
     static getTypeFromIEC(type) {
        switch (type) {
            case "BOOL": return "bool";
            case "USINT": return "uint8_t";
            case "SINT": return "int8_t";
            case "UINT": return "uint16_t";
            case "INT": return "int16_t";
            case "UDINT": return "uint32_t";
            case "DINT": return "int32_t";
            case "REAL": return "float";
            case "LREAL": return "double";
            case "BYTE": return "int8_t";
            case "STRING": return "char";
            default: //returning the type makes the function valid even if you insert a struct
                return type;
        }
    }

    /**
     * @returns {boolean} true if the type is scalar (BOOL, UDINT..) or false if it is a structure
     * @param {string} type IEC type, like BOOL or UDINT 
     * @param {boolean} includeString 
     */
    static isScalarType(type, includeString) {
        switch (type) {
            case "BOOL":
            case "USINT":
            case "SINT":
            case "UINT":
            case "INT":
            case "UDINT":
            case "DINT":
            case "REAL":
            case "LREAL":
            case "BYTE":
            case "STRING":
                if (type === "STRING") {
                    if ((includeString === undefined) || (includeString === false)) { return false; }
                    if ((includeString === true)) { return true; }
                    return false;
                }
                return true;
            default:
                return false;
        }
    }

    /**
     * @returns {string} the printf format string for the given IEC type, like %u for UDINT or %s for STRING
     * 
     * @param {string} type IEC type, like BOOL or UDINT  
     * 
     * PREVIOUSLY convertPlcTypePrintf
     */
    static getFormatString(type) {
        switch (type) {
            case "BOOL": return "%i";
            case "USINT": return "%u";
            case "SINT": return "%i";
            case "UINT": return "%u";
            case "INT": return "%i";
            case "UDINT": return "%u";
            case "DINT": return "%i";
            case "REAL": return "%f";
            case "LREAL": return "%f";
            case "BYTE": return "%i";
            case "STRING": return "%s";
            default: // inserting a struct will give you the address in hex
                return "0x%.8x";
        }
    }

    /** 
     * internal function to generate the c-source file that can be accessed via the `Datamodel.sourceCode` property. `_makeJsonTypes()` must have been called prior to this method 
     * @returns {string}
    */
    _makeSource() {
        
        /** adds the .info attributes to all children, containing the <infoId{infoId}> tag and returns the EXOS_DATASET_BROWSE_NAME list for these infoIds*/
        function _infoChildren(children, parent, parentArray, infoId) {
            let out = "";
        
            if (Array.isArray(children)) {
                for (let child of children) {
        
                    infoId++; // start by increasing to reserve 0 for top level structure
        
                    if (infoId > Datamodel.MAX_IDS) throw (`Too many infoId indexes needed. Max ${Datamodel.MAX_IDS} can be used.`);
        
                    child.attributes.info = "<infoId" + infoId + ">";
        
                    let arrayStr = "";
                    if (child.attributes.arraySize > 0) {
                        if (parentArray != "") {
                            arrayStr = `${parentArray},${child.attributes.arraySize}`;
                        }
                        else {
                            arrayStr = `${child.attributes.arraySize}`;
                        }
                    }
                    else {
                        arrayStr = `${parentArray}`;
                    }
        
                    function checkExosInfoCallParam(call) {
                        let area = call.split("(")[1].split(")")[0].trim();
                        if (area.length > Datamodel.MAX_AREA_NAME_LENGTH) throw (`Area name "${area}" longer than max (${Datamodel.MAX_AREA_NAME_LENGTH})`);
                        return call;
                    }
        
                    if (child.name == "variable" || child.name == "enum") {
                        if (parent == "") {
                            if (child.attributes.arraySize > 0) {
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${child.attributes.name}),{${parentArray}}},\n`);
                                infoId++;
                                child.attributes.info2 = "<infoId" + infoId + ">";
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${child.attributes.name}[0]),{${arrayStr}}},\n`);
                            }
                            else {
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${child.attributes.name}),{${arrayStr}}},\n`);
                            }
                        }
                        else {
                            if (child.attributes.arraySize > 0) {
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${parent}.${child.attributes.name}),{${parentArray}}},\n`);
                                infoId++;
                                child.attributes.info2 = "<infoId" + infoId + ">";
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${parent}.${child.attributes.name}[0]),{${arrayStr}}},\n`);
                            }
                            else {
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${parent}.${child.attributes.name}),{${arrayStr}}},\n`);
                            }
                        }
                    }
                    else if (child.name == "struct" && child.hasOwnProperty("children")) {
                        if (parent == "") {
                            if (child.attributes.arraySize > 0) {
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${child.attributes.name}),{${parentArray}}},\n`);
                                infoId++;
                                child.attributes.info2 = "<infoId" + infoId + ">";
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${child.attributes.name}[0]),{${arrayStr}}},\n`);
                                out += _infoChildren(child.children, `${child.attributes.name}[0]`, arrayStr, infoId);
                            }
                            else {
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${child.attributes.name}),{${arrayStr}}},\n`);
                                out += _infoChildren(child.children, child.attributes.name, arrayStr, infoId);
                            }
                        }
                        else {
                            if (child.attributes.arraySize > 0) {
        
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${parent}.${child.attributes.name}),{${parentArray}}},\n`);
                                infoId++;
                                child.attributes.info2 = "<infoId" + infoId + ">";
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${parent}.${child.attributes.name}[0]),{${arrayStr}}},\n`);
                                out += _infoChildren(child.children, `${parent}.${child.attributes.name}[0]`, arrayStr, infoId);
        
                            }
                            else {
                                out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${parent}.${child.attributes.name}),{${arrayStr}}},\n`);
                                out += _infoChildren(child.children, `${parent}.${child.attributes.name}`, arrayStr, infoId);
                            }
                        }
                    }
                }
            }
            return out;
        }

        
        /** Replacer function to clean out unecessary thing when stringifying */ 
        function replacer(key, value) {
            if ((key == 'arraySize' && value == 0)
                || (key == 'nodeId' && value == '')
                || (key == 'comment' && value == '')) {
              return undefined; // return undefined so JSON.stringify will omitt it
            }
            return value; // otherwise return the value as it is
        }
        
        this.#_nestingDepth = 0;
        this.#_structNestingDepth = 0;
        this.#_infoId = 0;

        this.#_types.attributes.info = "<infoId" + this.#_infoId + ">"; // top level
        let info = _infoChildren(this.#_types.children, "", "", this.#_infoId); // needs to be called before JSON.stringify to generate infoId
        let out = "";
        
        let jsonConfig = JSON.stringify(this.#_types, replacer).split('"').join('\\"'); // one liner with escapes on "
        if (jsonConfig.length > Datamodel.MAX_CONFIG_LENGTH) throw (`JSON config (${jsonConfig.length} chars) is longer than maximum (${Datamodel.MAX_CONFIG_LENGTH}).`);
    
        out += `/*Automatically generated c file from ${path.basename(this.fileName)}*/\n\n`;
        
        out += `#include "exos_${this.typeName.toLowerCase()}.h"\n\n`;

        out += `const char config_${this.typeName.toLowerCase()}[] = "${jsonConfig}";\n\n`; 

        out += `/*Connect the ${this.typeName} datamodel to the server*/\n`;
        out += `EXOS_ERROR_CODE exos_datamodel_connect_${this.typeName.toLowerCase()}(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback)\n{\n`;
        out += `    ${this.typeName} data;\n`;
        out += `    exos_dataset_info_t datasets[] = {\n`;
        out += `        {EXOS_DATASET_BROWSE_NAME_INIT,{}},\n`;
        out += info;
        out = out.slice(0, -2); //remove the last ,\n
        out += `\n`;
        out += `    };\n\n`;
    
        out += `    exos_datamodel_calc_dataset_info(datasets,sizeof(datasets));\n\n`;
    
        out += `    return exos_datamodel_connect(datamodel, config_${this.typeName.toLowerCase()}, datasets, sizeof(datasets), datamodel_event_callback);\n`;
        out += `}\n`;

        return out;
    }

    /**
     * Internal function to generate the headerfile accessible via the `Datamodel.headerCode`. The `_makeDataTypes()` method must have been called prior to this method. 
     * @returns {string}
     */
    _makeHeader() {
    
        let out = "";
        out = `/*Automatically generated header file from ${path.basename(this.fileName)}*/\n\n`;
    
        out += `#ifndef _EXOS_COMP_${this.typeName.toUpperCase()}_H_\n`;
        out += `#define _EXOS_COMP_${this.typeName.toUpperCase()}_H_\n\n`;
        out += `#include "exos_api.h"\n`;
    
        if (Array.isArray(this.SG4Includes)) {
            out += `#if defined(_SG4)\n`;
            for (let SG4Include of this.SG4Includes) {
                out += `#include <${SG4Include}>\n`;
            }
            out += `#else\n`;
        }
        out += `#include <stddef.h>\n`;
        out += `#include <stdint.h>\n`;
        out += `#include <stdbool.h>\n\n`;
    
        out += this.#_dataTypeCode;
    
        if (Array.isArray(this.SG4Includes)) {
            out += `#endif // _SG4\n\n`;
        }
 
        out += `EXOS_ERROR_CODE exos_datamodel_connect_${this.typeName.toLowerCase()}(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback);\n\n`;
    
        out += `#endif // _EXOS_COMP_${this.typeName.toUpperCase()}_H_\n`
    
        return out;
    }
    
    /**
     * Internal function to generate the C-declaration of the IEC datatype `typeName`, that can be accessible via `Datamodel.dataTypeCode` or `Datamodel.dataTypeCodeSWIG` properties.
     * 
     * @param {boolean} swig create additional swig datatype information
     * @returns {string}
     */
    _makeDataTypes(swig) {
    
        /**return the code for a datatype member with the given properties */
        function _outputMember(type, name, arrays, comment) {
            let out = "";
            out += `    ${type} ${name}`
        
            if (arrays.length > 0) {
                for (let arr of arrays) {
                    if (arr > 0) {
                        out += `[${arr}]`
                    }
                }
            }
            out += `;`
        
            if (comment != "") out += ` //${comment}`;
            out += `\n`;
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
        for (let line of this.#_fileLines) {
    
            switch (cmd) {
                case "find_struct_enum":
                    //analyze row check for struct, enum and directly derived types
                    let comment = line.split("(*");
                    if (comment.length > 1) {
                        comment = comment[1].split("*)");
                        comment = comment[0].trim();
                    } else comment = "";
    
                    line = line.split("(*")[0];
                    line = line.split(":");
                    for (let i = 0; i < line.length; i++) line[i] = line[i].trim();
    
                    if (line[1] == ("STRUCT")) {
                        cmd = "read_struct";
                        if (comment != "") out += "//" + comment + "\n";
                        structname = line[0];
                        out += `typedef struct ${structname}\n{\n`;
                        structs.push({ name: structname, out: "", depends: [] });
                    }
                    else if (line[1] == ("")) {
                        cmd = "read_enum";
                        if (comment != "") out += "//" + comment + "\n";
                        structname = line[0];
                        out += `typedef enum ${structname}\n{\n`;
                        members = 0;
                        structs.push({ name: structname, out: "", depends: [] });
                    }
                    //"else" line[1] is not "" (enum) and not "STRUCT" then it have to be a derived type = do nothing
                    break;
    
                case "read_enum":
                    if (line.includes(")")) {
                        cmd = "find_struct_enum";
                        if (members > 0) {
                            out = out.slice(0, -2); //remove the last ,\n
                            out += `\n`;
                        }
                        out += `\n} ${structname};\n\n`;
                        structs[structs.length - 1].out = out;
                        out = "";
                    }
                    else if (!line.includes("(")) {
                        if (line.includes(":=")) {
                            let name = line.split(":=")[0].trim();
                            let enumValue = line.split(":=")[1].trim();
                            enumValue = parseInt(enumValue.split(",")[0].trim());
                            out += `    ${name} = ${enumValue},\n`;
                        }
                        else {
                            let name = line.split(",")[0].trim();
                            out += `    ${name},\n`;
                        }
                        members++;
                    }
                    break;
    
                case "read_struct":
                    if (line.includes("END_STRUCT")) {
                        cmd = "find_struct_enum";
                        out += `\n} ${structname};\n\n`;
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
                            let comment = "";
                            if (type.includes("(*")) {
                                comment = _takeout(type, "(*", "*)");
                                type = type.split("(*")[0].trim();
                            }
    
                            if (arraySize > 0 && swig !== undefined && swig) {
                                out += `    // array not exposed directly:`
                            }
    
                            let typeForSwig = "";
                            if (type.includes("STRING")) {
                                let length = _takeout(type, "[", "]");
                                if (length != null) {
                                    typeForSwig = "char";
                                    stringSize = parseInt(length) + 1;
                                    out += _outputMember("char", name, [arraySize, stringSize], comment);
                                }
                            }
                            else if (Datamodel.isScalarType(type)) {
                                let stdtype = Datamodel.getTypeFromIEC(type);
                                typeForSwig = stdtype;
                                out += _outputMember(stdtype, name, [arraySize], comment);
                            }
                            else {
                                structs[structs.length - 1].depends.push(type); // push before adding "struct "
                                typeForSwig = type;
                                if (_isStructType(this.#_fileLines, type)) {
                                    typeForSwig = type;
                                    type = "struct " + type;
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
    
        //sort the structs according to their dependencies
        if (structs.length > 1) {
            let recheck = 1;
            let loopIdx = 0;
            while(recheck == 1){
                recheck = 0
                for (let i = 0; i < structs.length; i++) {
                    let maxindex = -1;
                    // loop through the depend to find the one with the largest index in the struct list
                    // we need to put our self below all the depends for it to compile
                    for (let depend of structs[i].depends) {
                        for (let j = i+1; j < structs.length; j++) { // start from own position
                            if (structs[j].name == depend) {
                                if (j > maxindex) {
                                    maxindex = j;
                                }
                            }
                        }
                    }
                    if (maxindex != -1) {
                        let tmpstructs = structs.splice(i, 1)[0];
                        structs.splice(maxindex, 0, tmpstructs); // we just removed our self, so maxindex is already +1 in the spliced structs
                        recheck = 1;
                        break; // restart
                    }
                }
                // cyclic declaration of structs are handled in _parseStructMember and _parseTyp
                // this is just to be sure
                loopIdx++;
                if(loopIdx > Datamodel.SORT_STRUCT_MAX)
                {
                    throw(`Sorting the structs from '${path.basename(this.fileName)}' has looped more than ${Datamodel.SORT_STRUCT_MAX} times. You might experience problems when compiling`);
                }
            }
        }
    
        //output the sorted structures
        out = "";
        if (swig !== undefined && swig) {
            for (let struct of structs.slice(0, -1)) { // do not include the last one (top-level struct) as it already exists as struct lib<typname>
                // find and extract all swig array info stuff and add them last to be able to replace it correctly in swig template generator
                let swigInfo = ""
                let matches = struct.out.matchAll(/<sai>(.*)<\/sai>/g);
                let swigInfoResult = Array.from(matches, x => x[1]);
                if (swigInfoResult.length > 0)
                    swigInfo = `<sai>{"swiginfo": [` + swigInfoResult.join(",") + `]}</sai>`;
                out += struct.out.replace(/<sai>.*<\/sai>/g, "") + swigInfo;
            }
        } 
        else {
            for (let struct of structs) {
                out += struct.out;
            }
        }
        return out;
    }

    /**
     * Internal function which parses the IEC datatype `typeName` and generates a JSON structure for further usage.
     * @returns {object} JSON object representation of the datatype `typeName` structure
     */
    _makeJsonTypes() {
 
        /**
         * return a json object with members of the given structure (name, type) going through fileLines including comment and arraysize of this structure
         * the search continues until scalar types or enumerators are found. nestingDepth and structuNEstingDepth are control variables to make sure it
         * doesnt go too far (e.g. circular dependencies)
        */
        function _parseTyp(fileLines, name, type, comment, arraySize, nestingDepth, structNestingDepth) {

            /**find a structure (typName) within the fileLines[] and return the line index. return -1 if not found*/
            function _findStructTyp(fileLines, typName) {
                let i = 0;
                for (let line of fileLines) {
                    //trim down to match the type name EXACTLY to specified name, includes() is also true for "myStruct" == "myStructSomething"
                    let l = line.split(":")[0].trim();
                    if ((l == typName) && (line.includes("STRUCT"))) {
                        return i;
                    }
                    i++;
                }
                return -1;
            }

            /**find an enum (typName) within fileLines and return the line index. return -1 if not found */
            function _findEnumTyp(fileLines, typName) {
                let i = 0;
                for (let line of fileLines) {
                    //trim down to match the type name EXACTLY to specified name, includes() is also true for "myStruct" == "myStructSomething"
                    let l = line.split(":");
                    if(l.length > 1)
                    {
                        if ((l[0].trim() == typName) && (l[1].trim() == "") && (!line.includes("STRUCT"))) {
                            return i;
                        }
                    }
                    i++;
                }
                return -1;
            }

            /**find a directly derived type (typName) within the fileLines[] and return the line index. return -1 if not found*/
            function _findDirectlyDerivedType(fileLines, typName) {
                let i = 0;
                for (let line of fileLines) {
                    //trim down to match the type name EXACTLY to specified name, includes() is also true for "myStruct" == "myStructSomething"
                    let l = line.split(":");
                    if(l.length > 1)
                    {
                        if ((l[0].trim() == typName) && (l[1].trim() != "") && (!line.includes("STRUCT"))) {
                            return i;
                        }
                    }
                    i++;
                }
                return -1;
            }

            /**return a json representation of an enum value at the given fileLines[index] and store its value (if assigned) to enumValue*/
            function _parseEnumMember(fileLines, index, enumValue) {

                let name = "";
                if (fileLines[index].includes("(")) {
                    return null;
                }
                else if (fileLines[index].includes(":=")) {
                    name = fileLines[index].split(":=")[0].trim();
                    enumValue = fileLines[index].split(":=")[1].trim()
                    enumValue = parseInt(enumValue.split(",")[0].trim());
                }
                else {
                    name = fileLines[index].split(",")[0].trim();
                }
            
                return {
                    name: "value",
                    attributes: {
                        name: name,
                        value: enumValue
                    }
                }
            }

            /** return a json object of the member at the given line, returns a 'variable' object for scalar types and calls _parseTyp (recursively) if a structure is found*/
            function _parseStructMember(fileLines, index, nestingDepth, structNestingDepth) {
                
                function _takeout(line, start, end) {
                    if (line.includes(start) && line.includes(end)) {
                        return line.split(start)[1].split(end)[0];
                    }
                    else return null;
                }
                
                let arraySize = 0;
                let dimensions = [0];
            
                if (fileLines[index].includes(":")) {
                    let name = fileLines[index].split(":")[0].trim();
            
                    if (fileLines[index].includes("ARRAY")) {
                        let ranges = _takeout(fileLines[index], "[", "]")
                        dimensions = ranges.split(",");
            
                        if (dimensions.length > 1) {
                            throw (`multi dimensional arrays are not supported -> member "${name}"`);
                        }
                        if (ranges != null) {
                            let from = parseInt(ranges.split("..")[0].trim());
                            let to = parseInt(ranges.split("..")[1].trim());
                            arraySize = to - from + 1;
                            nestingDepth += dimensions.length; //add a nesting depth for each dimention in multi-dim arrays
                            if (nestingDepth > Datamodel.MAX_ARRAY_NEST) throw (`Member "${name}" has array nesting depth of ${nestingDepth} deeper than ${Datamodel.MAX_ARRAY_NEST} nests`);
                        }
                    }
            
                    let type = "";
                    if (arraySize > 0) {
                        type = fileLines[index].split(":")[1].split("OF")[1].trim();
                    }
                    else {
                        type = fileLines[index].split(":")[1].trim();
                    }
                    if (type.includes("(*")) {
                        type = type.split("(*")[0].trim();
                    }
            
                    let comment = "";
                    if (fileLines[index].includes("(*")) {
                        comment = _takeout(fileLines[index], "(*", "*)");
                    }
            
                    if (type.includes("STRING")) {
                        if (arraySize > 0) nestingDepth -= dimensions.length;
                        let length = _takeout(type, "[", "]");
                        if (length != null) {
                            return {
                                name: "variable",
                                attributes: {
                                    name: name,
                                    nodeId: "",
                                    dataType: "STRING",
                                    stringLength: parseInt(length) + 1,
                                    comment: comment,
                                    arraySize: arraySize
                                }
                            }
                        }
                    }
                    else if (Datamodel.isScalarType(type)) {
                        if (arraySize > 0) nestingDepth -= dimensions.length;
                        return {
                            name: "variable",
                            attributes: {
                                name: name,
                                nodeId: "",
                                dataType: type,
                                comment: comment,
                                arraySize: arraySize
                            }
                        }
                    }
                    else {
                        //datatype detected = dig deeper
                        structNestingDepth++;
                        let result = _parseTyp(fileLines, name, type, comment, arraySize, nestingDepth, structNestingDepth);
                        structNestingDepth--;
                        if (arraySize > 0) nestingDepth -= dimensions.length;
                        return result
                    }
                }
                return null;
            }

            let children = [];
            let start;
        
            start = _findStructTyp(fileLines, type);
            //this is a structure
            if (start != -1) {
                let i = 1;
                while (!fileLines[start + i].includes("END_STRUCT")) {
                    if (structNestingDepth > Datamodel.MAX_STRUCT_NEST)
                    {
                        throw (`Member "${name} : ${type}" has struct nesting depth of ${structNestingDepth} which exceeds the maximum of ${Datamodel.MAX_STRUCT_NEST} nests (possible recursion)`);
                    }
                    let member = _parseStructMember(fileLines, start + i, nestingDepth, structNestingDepth);
                    if (member != null) {
                        children.push(member);
                    }
                    i++;
                }
                return {
                    name: "struct",
                    attributes: {
                        name: name,
                        nodeId: "",
                        dataType: type,
                        comment: comment,
                        arraySize: arraySize
                    },
                    children: children
                }
            }
            //this is an enum
            else {
                start = _findEnumTyp(fileLines, type);
                if (start != -1) {
                    let i = 1;
                    let enumValue = 0;
                    while (!fileLines[start + i].includes(")")) {
                        let member = _parseEnumMember(fileLines, start + i, enumValue);
                        if (member != null) {
                            children.push(member);
                            enumValue = member.attributes.value + 1;
                        }
                        i++;
                    }
                    return {
                        name: "enum",
                        attributes: {
                            name: name,
                            nodeId: "",
                            dataType: type,
                            comment: comment,
                            arraySize: 0
                        },
                        children: children
                    }
                } else {
        
                    if (_findDirectlyDerivedType(fileLines, type) >= 0) {
                        //datatype was not found,in .typ file, if not kill with error
                        throw (`Datatype '${type}' is a directly derived type. Not supported!`);
                    } else {
                        //datatype was not found,in .typ file, if not kill with error
                        throw (`Datatype '${type}' not defined in .typ file`);
                    }
                }
            }
        }

        this.#_nestingDepth = 0;
        this.#_structNestingDepth = 0;
        return _parseTyp(this.#_fileLines, "<NAME>", this.typeName, "", 0, this.#_nestingDepth, this.#_structNestingDepth);
    }

}



if (require.main === module) {

    process.stdout.write(`exos_header version ${version}\n`);

    if (process.argv.length > 3) {

        let fileName = process.argv[2];
        let structName = process.argv[3];

        if (fs.existsSync(fileName)) {

            try {
                let datamodel = new Datamodel(fileName, structName, [`${structName}.h`]);
            
                let outDir = path.join(__dirname,path.dirname(fileName));

                process.stdout.write(`Writing ${structName} to folder: ${outDir}\n`);

                fs.writeFileSync(path.join(outDir,`exos_${structName.toLowerCase()}.h`),datamodel.headerCode);
                fs.writeFileSync(path.join(outDir,`exos_${structName.toLowerCase()}.c`),datamodel.sourceCode);
                fs.writeFileSync(path.join(outDir,`exos_${structName.toLowerCase()}.json`),JSON.stringify(datamodel.typeJsonObject,null,4));

            } catch (error) {
                process.stderr.write(error);
            }

        } else {
            process.stderr.write(`file '${fileName}' not found.`);
        }

    }
    else {
        process.stderr.write("usage: ./Datamodel.js <filename.typ> <structname>\n");
    }
}

module.exports = {Datamodel}
