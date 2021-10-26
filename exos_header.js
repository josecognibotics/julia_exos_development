
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

class HeaderGenerator
{
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
    constructor(fileName, typName, SG4Includes)
    {
        this.fileName = fileName;
        this.typName = typName;
        this.SG4Includes = SG4Includes;
        this._types = [];
        this._infoId = 0;
        this._fileLines = fs.readFileSync(this.fileName).toString();
        this._prepLines();
        this._nestingDepth = 0;
        this._structNestingDepth = 0;
    }

    /**
     * @returns the children of the datatype (typName) as JSON array.
     * 
     * PREVIOUSLY parseTypFile
     */
    getJsonConfigString() {

        return this._parseTyp("", this.typName, "", 0, true);
    }

    /**
     * @returns the exos_{typname}.h as ASCII string
     *  
     * PREVIOUSLY generateHeader
     */
    getHeaderFile() {

        this._nestingDepth = 0;
        this._structNestingDepth = 0;
        this._infoId = 0;
    
        this._types = this.getJsonConfigString();
    
        this._types.attributes.info = "<infoId" + this._infoId + ">"; // top level
        let info = this._infoChildren(this._types.children, "", ""); // needs to be called before JSON.stringify to generate infoId
    
        let out = "";
        out = `/*Automatically generated header file from ${path.basename(this.fileName)}*/\n\n`;
    
        out += `#ifndef _EXOS_COMP_${this.typName.toUpperCase()}_H_\n`;
        out += `#define _EXOS_COMP_${this.typName.toUpperCase()}_H_\n\n`;
        out += `#ifndef EXOS_INCLUDE_ONLY_DATATYPE\n`;
        out += `#include "exos_api.h"\n`;
        out += `#endif\n\n`;
    
        if (Array.isArray(this.SG4Includes)) {
            out += `#if defined(_SG4) && !defined(EXOS_STATIC_INCLUDE)\n`;
            for (let SG4Include of this.SG4Includes) {
                out += `#include <${SG4Include}>\n`;
            }
            out += `#else\n`;
        }
        out += `#include <stddef.h>\n`;
        out += `#include <stdint.h>\n`;
        out += `#include <stdbool.h>\n\n`;
    
        out += this.getDataTypes();
    
        if (Array.isArray(this.SG4Includes)) {
            out += `#endif // _SG4 && !EXOS_STATIC_INCLUDE\n\n`;
        }
    
        // Replacer function to clean out unecessary thing when stringifying
        function replacer(key, value) {
            if ((key == 'arraySize' && value == 0)
                || (key == 'nodeId' && value == '')
                || (key == 'comment' && value == '')) {
              return undefined; // return undefined so JSON.stringify will omitt it
            }
            return value; // otherwise return the value as it is
        }
        let jsonConfig = JSON.stringify(this._types, replacer).split('"').join('\\"');
        if (jsonConfig.length > HeaderGenerator.MAX_CONFIG_LENGTH) throw (`JSON config (${jsonConfig.length} chars) is longer than maximum (${HeaderGenerator.MAX_CONFIG_LENGTH}).`);
    
        out += `#ifndef EXOS_INCLUDE_ONLY_DATATYPE\n`;
        out += `#ifdef EXOS_STATIC_INCLUDE\n`;
        out += `EXOS_ERROR_CODE exos_datamodel_connect_${this.typName.toLowerCase()}(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback);\n`;
        out += `#else\n`;
        out += `const char config_${this.typName.toLowerCase()}[] = "${jsonConfig}";\n\n`; // one liner with escapes on "
        //out += `const char config_${typName.toLowerCase()}[] = "${JSON.stringify(types,null,4).split('"').join('\\"').split('\n').join(' \\\n')}";\n\n`; // pretty print with escapes on " and \ for multiline string
        //out += `const char config_${typName.toLowerCase()}[] = "${JSON.stringify(types,null,4)}";\n\n`; // pretty print without escapes (wont compile)
    
        out += `/*Connect the ${this.typName} datamodel to the server*/\n`;
        out += `EXOS_ERROR_CODE exos_datamodel_connect_${this.typName.toLowerCase()}(exos_datamodel_handle_t *datamodel, exos_datamodel_event_cb datamodel_event_callback)\n{\n`;
        out += `    ${this.typName} data;\n`;
        out += `    exos_dataset_info_t datasets[] = {\n`;
        out += `        {EXOS_DATASET_BROWSE_NAME_INIT,{}},\n`;
        out += info;
        out = out.slice(0, -2); //remove the last ,\n
        out += `\n`;
        out += `    };\n\n`;
    
    
        out += `    exos_datamodel_calc_dataset_info(datasets,sizeof(datasets));\n\n`;
    
        out += `    return exos_datamodel_connect(datamodel, config_${this.typName.toLowerCase()}, datasets, sizeof(datasets), datamodel_event_callback);\n`;
        out += `}\n\n`;
    
        out += `#endif // EXOS_STATIC_INCLUDE\n`
        out += `#endif // EXOS_INCLUDE_ONLY_DATATYPE\n`;
        out += `#endif // _EXOS_COMP_${this.typName.toUpperCase()}_H_\n`
    
        return out;
    }
    
    /**
     * @returns an ASCII string with C-datatype definitions of the datatype (typName)
     * @param {*} swig optional
     * 
     * PREVIOUSLY convertTyp2Struct
     */
    getDataTypes(swig) {
    
        let out = ``;
        let structname = "";
        let members = 0;
        let cmd = "find_struct_enum";
        let structs = [];
        for (let line of this._fileLines) {
    
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
                            let range = this._takeout(line, "[", "]")
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
                                comment = this._takeout(type, "(*", "*)");
                                type = type.split("(*")[0].trim();
                            }
    
                            if (arraySize > 0 && swig !== undefined && swig) {
                                out += `    // array not exposed directly:`
                            }
    
                            let typeForSwig = "";
                            if (type.includes("STRING")) {
                                let length = this._takeout(type, "[", "]");
                                if (length != null) {
                                    typeForSwig = "char";
                                    stringSize = parseInt(length) + 1;
                                    out += this._outputMember("char", name, [arraySize, stringSize], comment);
                                }
                            }
                            else if (HeaderGenerator.isScalarType(type)) {
                                let stdtype = HeaderGenerator.getTypeFromIEC(type);
                                typeForSwig = stdtype;
                                out += this._outputMember(stdtype, name, [arraySize], comment);
                            }
                            else {
                                structs[structs.length - 1].depends.push(type); // push before adding "struct "
                                typeForSwig = type;
                                if (this._isStructType(type)) {
                                    typeForSwig = type;
                                    type = "struct " + type;
                                }
                                out += this._outputMember(type, name, [arraySize], comment);
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
                if(loopIdx > HeaderGenerator.SORT_STRUCT_MAX)
                {
                    throw(`Sorting the structs from '${path.basename(this.fileName)}' has looped more than ${HeaderGenerator.SORT_STRUCT_MAX} times. You might experience problems when compiling`);
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

    //STATIC

    /**
     * @returns datatype (BOOL, UDINT) as stdint.h/stdbool.h datatype (bool, uint32_t) or struct (unchanged)
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
     * @returns true if the type is scalar (BOOL, UDINT..) or false if it is a structure
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
     * @returns the printf format string for the given IEC type, like %u for UDINT or %s for STRING
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
    

    //PRIVATE

    _infoChildren(children, parent, parentArray) {
        let out = "";
    
        if (Array.isArray(children)) {
            for (let child of children) {
    
                this._infoId++; // start by increasing to reserve 0 for top level structure
    
                if (this._infoId > HeaderGenerator.MAX_IDS) throw (`Too many infoId indexes needed. Max ${HeaderGenerator.MAX_IDS} can be used.`);
    
                child.attributes.info = "<infoId" + this._infoId + ">";
    
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
                    if (area.length > HeaderGenerator.MAX_AREA_NAME_LENGTH) throw (`Area name "${area}" longer than max (${HeaderGenerator.MAX_AREA_NAME_LENGTH})`);
                    return call;
                }
    
                if (child.name == "variable" || child.name == "enum") {
                    if (parent == "") {
                        if (child.attributes.arraySize > 0) {
                            out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${child.attributes.name}),{${parentArray}}},\n`);
                            this._infoId++;
                            child.attributes.info2 = "<infoId" + this._infoId + ">";
                            out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${child.attributes.name}[0]),{${arrayStr}}},\n`);
                        }
                        else {
                            out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${child.attributes.name}),{${arrayStr}}},\n`);
                        }
                    }
                    else {
                        if (child.attributes.arraySize > 0) {
                            out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${parent}.${child.attributes.name}),{${parentArray}}},\n`);
                            this._infoId++;
                            child.attributes.info2 = "<infoId" + this._infoId + ">";
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
                            this._infoId++;
                            child.attributes.info2 = "<infoId" + this._infoId + ">";
                            out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${child.attributes.name}[0]),{${arrayStr}}},\n`);
                            out += this._infoChildren(child.children, `${child.attributes.name}[0]`, arrayStr);
                        }
                        else {
                            out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${child.attributes.name}),{${arrayStr}}},\n`);
                            out += this._infoChildren(child.children, child.attributes.name, arrayStr);
                        }
                    }
                    else {
                        if (child.attributes.arraySize > 0) {
    
                            out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${parent}.${child.attributes.name}),{${parentArray}}},\n`);
                            this._infoId++;
                            child.attributes.info2 = "<infoId" + this._infoId + ">";
                            out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${parent}.${child.attributes.name}[0]),{${arrayStr}}},\n`);
                            out += this._infoChildren(child.children, `${parent}.${child.attributes.name}[0]`, arrayStr);
    
                        }
                        else {
                            out += checkExosInfoCallParam(`        {EXOS_DATASET_BROWSE_NAME(${parent}.${child.attributes.name}),{${arrayStr}}},\n`);
                            out += this._infoChildren(child.children, `${parent}.${child.attributes.name}`, arrayStr);
                        }
                    }
                }
            }
        }
        return out;
    }
    
    _prepLines() {
        //remove stuff we dont want to look at
        this._fileLines = this._fileLines.split("\r").join("");
        this._fileLines = this._fileLines.split(";").join("");
        this._fileLines = this._fileLines.split("{REDUND_UNREPLICABLE}").join("");
        //now split with line endings
        this._fileLines = this._fileLines.split("\n");
    }

    _isStructType(name) {
        for (let line of this._fileLines) {
            if (line.includes("STRUCT") && line.includes(":")) {
                if (name == line.split(":")[0].trim()) return true;
            }
        }
        return false;
    }

    _parseTyp(name, type, comment, arraySize, init) {
        let children = [];
        let start;
    
        //set root type properties and inits
        if (init) {
            this._nestingDepth = 0;
            this._structNestingDepth = 0;
            name = "<NAME>";
        }
    
        start = this._findStructTyp(type);
        //this is a structure
        if (start != -1) {
            let i = 1;
            while (!this._fileLines[start + i].includes("END_STRUCT")) {
                if (this._structNestingDepth > HeaderGenerator.MAX_STRUCT_NEST)
                {
                    throw (`Member "${name} : ${type}" has struct nesting depth of ${this._structNestingDepth} which exceeds the maximum of ${HeaderGenerator.MAX_STRUCT_NEST} nests (possible recursion)`);
                }
                let member = this._parseStructMember(start + i);
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
            start = this._findEnumTyp(type);
            if (start != -1) {
                let i = 1;
                let enumValue = 0;
                while (!this._fileLines[start + i].includes(")")) {
                    let member = this._parseEnumMember(start + i, enumValue);
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
    
                if (this._findDirectlyDerivedType(type) >= 0) {
                    //datatype was not found,in .typ file, if not kill with error
                    throw (`Datatype '${type}' is a directly derived type. Not supported!`);
                } else {
                    //datatype was not found,in .typ file, if not kill with error
                    throw (`Datatype '${type}' not defined in .typ file`);
                }
            }
        }
    }

    _parseStructMember(index) {
        let arraySize = 0;
        let dimensions = [0];
    
    
        if (this._fileLines[index].includes(":")) {
            let name = this._fileLines[index].split(":")[0].trim();
    
            if (this._fileLines[index].includes("ARRAY")) {
                let ranges = this._takeout(this._fileLines[index], "[", "]")
                dimensions = ranges.split(",");
    
                if (dimensions.length > 1) {
                    throw (`multi dimensional arrays are not supported -> member "${name}"`);
                }
                if (ranges != null) {
                    let from = parseInt(ranges.split("..")[0].trim());
                    let to = parseInt(ranges.split("..")[1].trim());
                    arraySize = to - from + 1;
                    this._nestingDepth += dimensions.length; //add a nesting depth for each dimention in multi-dim arrays
                    if (this._nestingDepth > HeaderGenerator.MAX_ARRAY_NEST) throw (`Member "${name}" has array nesting depth of ${this._nestingDepth} deeper than ${HeaderGenerator.MAX_ARRAY_NEST} nests`);
                }
            }
    
            let type = "";
            if (arraySize > 0) {
                type = this._fileLines[index].split(":")[1].split("OF")[1].trim();
            }
            else {
                type = this._fileLines[index].split(":")[1].trim();
            }
            if (type.includes("(*")) {
                type = type.split("(*")[0].trim();
            }
    
            let comment = "";
            if (this._fileLines[index].includes("(*")) {
                comment = this._takeout(this._fileLines[index], "(*", "*)");
            }
    
            if (type.includes("STRING")) {
                if (arraySize > 0) this._nestingDepth -= dimensions.length;
                let length = this._takeout(type, "[", "]");
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
            else if (HeaderGenerator.isScalarType(type)) {
                if (arraySize > 0) this._nestingDepth -= dimensions.length;
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
                this._structNestingDepth++;
                let result = this._parseTyp(name, type, comment, arraySize, false);
                this._structNestingDepth--;
                if (arraySize > 0) this._nestingDepth -= dimensions.length;
                return result
            }
        }
        return null;
    }

    _parseEnumMember(index, enumValue) {

        let name = "";
        if (this._fileLines[index].includes("(")) {
            return null;
        }
        else if (this._fileLines[index].includes(":=")) {
            name = this._fileLines[index].split(":=")[0].trim();
            enumValue = this._fileLines[index].split(":=")[1].trim()
            enumValue = parseInt(enumValue.split(",")[0].trim());
        }
        else {
            name = this._fileLines[index].split(",")[0].trim();
        }
    
        return {
            name: "value",
            attributes: {
                name: name,
                value: enumValue
            }
        }
    }
    
    _outputMember(type, name, arrays, comment) {
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
    
    _takeout(line, start, end) {
        if (line.includes(start) && line.includes(end)) {
            return line.split(start)[1].split(end)[0];
        }
        else return null;
    }

    _findDirectlyDerivedType(typName) {
        let i = 0;
        for (let line of this._fileLines) {
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

    _findStructTyp(typName) {
        let i = 0;
        for (let line of this._fileLines) {
            //trim down to match the type name EXACTLY to specified name, includes() is also true for "myStruct" == "myStructSomething"
            let l = line.split(":")[0].trim();
            if ((l == typName) && (line.includes("STRUCT"))) {
                return i;
            }
            i++;
        }
        return -1;
    }

    _findEnumTyp(typName) {
        let i = 0;
        for (let line of this._fileLines) {
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
}



if (require.main === module) {

    process.stdout.write(`exos_header version ${version}\n`);

    if (process.argv.length > 3) {
        let outPath = process.argv[4];
        if (outPath == "" || outPath === undefined) {
            outPath = ".";
        }

        let fileName = process.argv[2];
        let structName = process.argv[3];

        if (fs.existsSync(fileName)) {

            try {
                let generator = new HeaderGenerator(fileName, structName);
                let out = generator.getHeaderFile();

                fs.writeFileSync(`${outPath}/exos_${structName.toLowerCase()}.h`, out);
                process.stdout.write(`${outPath}/exos_${structName.toLowerCase()}.h generated`);

            } catch (error) {
                process.stderr.write(error);
            }

        } else {
            process.stderr.write(`file '${fileName}' not found.`);
        }

    }
    else {
        process.stderr.write("usage: ./exos_header.js <filename.typ> <structname> <header output path>\n");
    }
}

module.exports = {HeaderGenerator}
