const {Datamodel, Dataset} = require('./datamodel');

/**
 * Class used to generate a template object for code-generators
 * 
 * It has the same constructor as the `Datamodel` class, as this is the base for the `ApplicationTemplate` object
 * The `Datamodel` that is created can be accessed via the `Template.datamodel` property
 * 
 * Structure of the `ApplicationTemplate` object:
 * 
 * @typedef {Object} ApplicationTemplateHandle 
 * @property {string} dataType typename of a handle structure => `MyApplicationHandle_t`
 * @property {string} name name of a handle instance, hardcoded => `handle`
 * 
 * @typedef {Object} ApplicationTemplateDatamodel
 * @property {string} dataType typename of the datamodel structure or enum => `MyApplication`
 * @property {string} varName name of a datamodel instance, as lowercase => `myapplication` or `myapplication_datamodel` if the dataType is all lowercase
 * @property {string} structName typename of the datamodel structure or enum, same as dataType => `MyApplication`
 * @property {string} libStructName typename of a library wrapper datamodel - same as dataType with a "lib" prefix => `libMyApplication`
 * @property {string} handleName name of a handle used for the datamodel in the library wrapper => `h_MyApplication`
 * 
 * @typedef {Object} ApplicationTemplateDataset
 * @property {string} dataType typename of the dataset structure enum or variable, => `MyConfig`, `BOOL` or `USINT`
 * @property {string} structName name of the dataset structure enum or variable, => `Config`, `Enable` or `Buffer`
 * @property {string} varName name of a dataset instance, in lowercase => `config`, `enable` or `config_dataset`, `enable_dataset` if the dataType is all lowercase
 * @property {string} libDataType typename of a library wrapper dataset structure enum or variable => `libMyApplicationConfig` or `libMyApplicationEnable`
 * @property {number} arraySize number of array elements if the dataset is an array, otherwise 0. => `Config:0`, `Enable:0`, `Buffer:10`
 * @property {number} stringLength for `STRING` datatypes, this is the allocated size for a string. e.g. `81` for a `STRING[80]`
 * @property {string} comment comment as it appears in the TYPE declaration file => `(*PUB*)` or `(*PUB SUB*)` or `(*this is a counter SUB*)`
 * @property {boolean} isPub set via the comment to `true` if the dataset should be published. (platform dependent - this is `(*PUB*)` for AR and `(*SUB*)` for GPOS)
 * @property {boolean} isSub set via the comment to `true` if the dataset should be subscribed to. (platform dependent - this is `(*SUB*)` for AR and `(*PUB*)`for GPOS)
 * @property {boolean} isPrivate set to true if the comment includes the word `private`
 * 
 * @typedef {Object} ApplicationTemplate
 * @property {string} headerName name of the headerfile to be included => `exos_myapplication.h`
 * @property {string} libHeaderName name of a library wrapper headerfile to be included `libmyapplication.h`
 * @property {string} logname name of a `exos_log_handle_t` instance in the application, hardcoded => `logger`
 * @property {ApplicationTemplateHandle} handle handle structure for used for AR libraries (to overcome downloads)
 * @property {ApplicationTemplateDatamodel} datamodel datamodel related types and instance names for the application
 * @property {ApplicationTemplateDataset[]} datasets dataset type and instance names for the application  
 */
class Template
{
    #_datamodel;
    #_templateAR;
    #_templateLinux;
    /**
     * Create a `Datamodel` object from the given parameters and create `ApplicationTemplate` objects for Linux and AR
     * 
     * @param {string} fileName name of the file to parse, e.g. ./SomeFolder/WaterTank.typ
     * @param {string} typName name of the data structure, e.g. WaterTank
     * @param {string[]} SG4Includes (optional) list of include directives within the #ifdef _SG4 part. If left out, theres no #ifdef _SG4 in the generated code
     * 
     */
    constructor(fileName, typeName, SG4Includes) {
        
        /**
         * create the template structure form the Dataset structure
         * 
         * @param {Dataset} types generated `Dataset` structure from the `Datamodel` class
         * @param {boolean} Linux when used in Linux, the `datasets[].isPub` and `datasets[].isSub` are reversed
         * @returns {ApplicationTemplate}
         */
        function configTemplate(types, Linux) {

            var template = {
                headerName: "",
                handle: {
                    dataType: "",
                    name: "",
                },
                libHeaderName: "",
                datamodel: {
                    structName: "",
                    varName: "",
                    dataType: "",
                    comment: "",
                    libStructName: "",
                    handleName: ""
                },
                datasets: [],
                logname: ""
            }
        
            template.logname = "logger";
            template.headerName = `exos_${types.attributes.dataType.toLowerCase()}.h`
            template.libHeaderName = `lib${types.attributes.dataType.toLowerCase()}.h`
            template.handle.dataType = `${types.attributes.dataType}Handle_t`;
            template.handle.name = "handle";

            template.datamodel.dataType = types.attributes.dataType;
            template.datamodel.structName = types.attributes.dataType;
            //check if toLowerCase is equal to datatype name, then extend it with _datamodel
            if (types.attributes.dataType == types.attributes.dataType.toLowerCase()) {
                template.datamodel.varName = types.attributes.dataType.toLowerCase() + "_datamodel";
            }
            else {
                template.datamodel.varName = types.attributes.dataType.toLowerCase();
            }
    
            template.datamodel.libStructName = "lib" + types.attributes.dataType;
            template.datamodel.handleName = "h_" + types.attributes.dataType;
    
            for (let child of types.children) {
                let object = {};
                object["structName"] = child.attributes.name;
                object["varName"] = child.attributes.name.toLowerCase() + (child.attributes.name == child.attributes.name.toLowerCase() ? "_dataset" : "");
                object["dataType"] = child.attributes.dataType;
                object["libDataType"] = template.datamodel.libStructName + child.attributes.name;
                if (typeof child.attributes.arraySize === "number") {
                    object["arraySize"] = child.attributes.arraySize;
                } else {
                    object["arraySize"] = 0;
                }
                object["comment"] = child.attributes.comment;
                if (typeof child.attributes.comment === "string") {
                    if(Linux)
                    {
                        object["isPub"] = child.attributes.comment.includes("SUB");
                        object["isSub"] = child.attributes.comment.includes("PUB");
                    }
                    else
                    {
                        object["isPub"] = child.attributes.comment.includes("PUB");
                        object["isSub"] = child.attributes.comment.includes("SUB");
                    }
                    object["isPrivate"] = child.attributes.comment.includes("private");
                } else {
                    object["comment"] = "";
                    object["isPub"] = false;
                    object["isSub"] = false;
                    object["isPrivate"] = false;
                }
                if (child.attributes.hasOwnProperty("stringLength")) { object["stringLength"] = child.attributes.stringLength; }
                template.datasets.push(object);
            }
        
            return template;
        }

        this.#_datamodel = new Datamodel(fileName, typeName, SG4Includes);
        this.#_templateAR = configTemplate(this.#_datamodel.dataset, false);
        this.#_templateLinux = configTemplate(this.#_datamodel.dataset, true);
    }

    /**
     * @returns {Datamodel} The `Datamodel` class that is created inside the Template, this can be used to access the `Dataset` structure
     */
    get datamodel() {
        return this.#_datamodel;
    }

    /**
     * `ApplicationTemplate` structure for Automation Runtime applications. 
     * This is specific to AR so that `datasets` that are published (via `isPub=true`) in Automation Runtime are subscribed to  (via `isSub=true`) in Linux, and vice versa.
     *  
     * The structure description is based on the following example:
     * 
     *       TYPE
     *         MyApplication : 	STRUCT 
     *              Enable : BOOL; (*PUB*)
     *              Counter : INT; (*SUB*)
     *              Buffer : ARRAY[0..9]OF USINT;
     *              Config : MyConfig; (*PUB SUB*)
     *         END_STRUCT;
     *         MyConfig : 	STRUCT 
     *              Message : STRING[80];
     *              SleepTime : LREAL;
     *         END_STRUCT;
     *      END_TYPE
     * @returns {ApplicationTemplate}
     */
    get templateAR() {
        return this.#_templateAR;
    }

    /**
     * 
     * `ApplicationTemplate` structure Linux applications. 
     * This is specific to Linux so that `datasets` that are published (via `isPub=true`) in Automation Runtime are subscribed to  (via `isSub=true`) in Linux, and vice versa.
     * The structure description is based on the following example:
     * 
     *       TYPE
     *         MyApplication : 	STRUCT 
     *              Enable : BOOL; (*PUB*)
     *              Counter : INT; (*SUB*)
     *              Buffer : ARRAY[0..9]OF USINT;
     *              Config : MyConfig; (*PUB SUB*)
     *         END_STRUCT;
     *         MyConfig : 	STRUCT 
     *              Message : STRING[80];
     *              SleepTime : LREAL;
     *         END_STRUCT;
     *      END_TYPE
     * 
     * @returns {ApplicationTemplate}
     */
    get templateLinux() {
        return this.#_templateLinux;
    }
}

module.exports = {Template};