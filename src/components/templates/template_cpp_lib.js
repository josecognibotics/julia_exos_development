const { Template, ApplicationTemplate } = require('./template')
const { Datamodel, GeneratedFileObj } = require('../../datamodel');

class TemplateCppLib extends Template {
    
    /**
     * @type {GeneratedFileObj}
     */
    datasetHeader;

    /**
     * @type {GeneratedFileObj}
     */
    loggerHeader;

    /**
     * @type {GeneratedFileObj}
     */
    loggerSource;

    /**
     * @type {GeneratedFileObj}
     */
    datamodelHeader;

    /**
     * @type {GeneratedFileObj}
     */
    datamodelSource;

    /**
     * souce code comment to be added to the implementing source code - describing the datamodel interface
     * @type {string}
     */
    datamodelLegend;

    /**
     * {@linkcode TemplateCppLib} Generate C++ Datamodel template for Linux and AR
     * 
     * This class creates a following {@link GeneratedFileObj} objects
     * 
     * - {@linkcode datasetHeader} dataset class
     * - {@linkcode loggerHeader} datalogger class
     * - {@linkcode loggerSource} datalogger class implementation
     * - {@linkcode datamodelHeader} datamodel class
     * - {@linkcode datamodelSource} datamodel class implementation
     * 
     * - {@linkcode datamodelLegend} code comment to be added to the implementing source code - describing the library interface
     * 
     * @param {Datamodel} datamodel 
     * @param {boolean} Linux true if generated for Linux, false for AR
     */
    constructor(datamodel, Linux) {
        super(datamodel,Linux);

        this.datasetHeader = {name: `${this.template.datamodel.datasetClassName}.h`, contents:this._generateDatasetHeader(), description:`${this.datamodel.typeName} dataset class`}
        this.loggerHeader = {name: `${this.template.loggerClassName}.h`, contents:this._generateLoggerHeader(), description:`${this.datamodel.typeName} logger class`}
        this.loggerSource = {name: `${this.template.loggerClassName}.cpp`, contents:this._generateLoggerSource(), description:`${this.datamodel.typeName} logger class implementation`}
        this.datamodelHeader = {name: `${this.template.datamodel.className}.h`, contents:this._generateDatamodelHeader(), description:`${this.datamodel.typeName} datamodel class`}
        this.datamodelSource = {name: `${this.template.datamodel.className}.cpp`, contents:this._generateDatamodelSource(), description:`${this.datamodel.typeName} datamodel class implementation`}
        this.datamodelLegend = this._genenerateLegend();
    }

    /**
     * @returns {string} `[typeName]Dataset.h`: {@linkcode generateDatasetHeader} dataset class
     */
    _generateDatasetHeader() {
        /**
         * @param {ApplicationTemplate} template 
         * @returns {string}
         */
        function generateExosDataSetHeader(template) {

            let out = "";
        
            out += `#ifndef _${template.datamodel.structName.toUpperCase()}DATASET_H_\n`;
            out += `#define _${template.datamodel.structName.toUpperCase()}DATASET_H_\n`;
            out += `\n`;
            out += `#include <string>\n`;
            out += `#include <iostream>\n`;
            out += `#include <string.h>\n`;
            out += `#include <functional>\n`;
            out += `\n`;
            out += `extern "C" {\n`;
            out += `    #include "${template.headerName}"\n`;
            out += `}\n`;
            out += `\n`;
            out += `#include "${template.loggerClassName}.h"\n`;
            out += `#define exos_assert_ok(_plog_,_exp_)                                                                                                    \\\n`;
            out += `    do                                                                                                                                  \\\n`;
            out += `    {                                                                                                                                   \\\n`;
            out += `        EXOS_ERROR_CODE err = _exp_;                                                                                                    \\\n`;
            out += `        if (EXOS_ERROR_OK != err)                                                                                                       \\\n`;
            out += `        {                                                                                                                               \\\n`;
            out += `            _plog_->error << "Error in file " << __FILE__ << ":" << __LINE__ << std::endl;                                               \\\n`;
            out += `            _plog_->error << #_exp_ " returned " << err << " (" << exos_get_error_string(err) << ") instead of expected 0" << std::endl; \\\n`;
            out += `        }                                                                                                                               \\\n`;
            out += `    } while (0)\n`;
            
            out += `\n`;
            out += `template <typename T>\n`;
            out += `class ${template.datamodel.datasetClassName}\n`;
            out += `{\n`;
            out += `private:\n`;
            out += `    exos_dataset_handle_t dataset = {};\n`;
            out += `    ${template.loggerClassName}* log;\n`;
            out += `    std::function<void()> _onChange = [](){};\n`;
            out += `    void datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info) {\n`;
            out += `        switch (event_type)\n`;
            out += `        {\n`;
            out += `            case EXOS_DATASET_EVENT_UPDATED:\n`;
            out += `                log->verbose << "dataset " << dataset->name << " updated! latency (us):" << (exos_datamodel_get_nettime(dataset->datamodel) - dataset->nettime) << std::endl;\n`;
            out += `                nettime = dataset->nettime;\n`;
            out += `                _onChange();\n`;
            out += `                break;\n`;
            out += `            case EXOS_DATASET_EVENT_PUBLISHED:\n`;
            out += `                log->verbose << "dataset " << dataset->name << "  published to local server for distribution! send buffer free:" << dataset->send_buffer.free << std::endl;\n`;
            out += `                break;\n`;
            out += `            case EXOS_DATASET_EVENT_DELIVERED:\n`;
            out += `                log->verbose << "dataset " << dataset->name << " delivered to remote server for distribution! send buffer free:" << dataset->send_buffer.free << std::endl;\n`;
            out += `                break;\n`;
            out += `            case EXOS_DATASET_EVENT_CONNECTION_CHANGED:\n`;
            out += `                log->info << "dataset " << dataset->name << " changed state to " << exos_get_state_string(dataset->connection_state) << std::endl;\n`;
            out += `                \n`;
            out += `                switch (dataset->connection_state)\n`;
            out += `                {\n`;
            out += `                    case EXOS_STATE_DISCONNECTED:\n`;
            out += `                        break;\n`;
            out += `                    case EXOS_STATE_CONNECTED:\n`;
            out += `                        break;\n`;
            out += `                    case EXOS_STATE_OPERATIONAL:\n`;
            out += `                        break;\n`;
            out += `                    case EXOS_STATE_ABORTED:\n`;
            out += `                        log->error << "dataset " << dataset->name << " error " << dataset->error << " (" << exos_get_error_string(dataset->error) << ") occured" << std::endl;\n`;
            out += `                        break;\n`;
            out += `                }\n`;
            out += `                break;\n`;
            out += `        }\n`;
            out += `    }\n`;
            out += `    static void _datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info) {\n`;
            out += `        ${template.datamodel.datasetClassName}* inst = static_cast<${template.datamodel.datasetClassName}*>(dataset->user_context);\n`;
            out += `        inst->datasetEvent(dataset, event_type, info);\n`;
            out += `    }\n`;
            out += `\n`;
            out += `public:\n`;
            out += `    ${template.datamodel.datasetClassName}() {};\n`;
            out += `    \n`;
            out += `    T value;\n`;
            out += `    int nettime;\n`;
            out += `    void init(exos_datamodel_handle_t *datamodel, const char *browse_name, ${template.loggerClassName}* _log) {\n`;
            out += `        log = _log;\n`;
            out += `        exos_assert_ok(log, exos_dataset_init(&dataset, datamodel, browse_name, &value, sizeof(value)));\n`;
            out += `        dataset.user_context = this;\n`;
            out += `    };\n`;
            out += `    void connect(EXOS_DATASET_TYPE type) {\n`;
            out += `        exos_assert_ok(log, exos_dataset_connect(&dataset, type, &${template.datamodel.datasetClassName}::_datasetEvent));\n`;
            out += `    };\n`;
            out += `    void publish() {\n`;
            out += `        exos_dataset_publish(&dataset);\n`;
            out += `    };\n`;
            out += `    void onChange(std::function<void()> f) {_onChange = std::move(f);};\n`;
            out += `    \n`;
            out += `    ~${template.datamodel.datasetClassName}() {\n`;
            out += `        exos_assert_ok(log, exos_dataset_delete(&dataset));\n`;
            out += `    };\n`;
            out += `};\n`;
            out += `\n`;
            out += `#endif\n`;
        
            return out;
        }
        return generateExosDataSetHeader(this.template);
    }

    /**
     * @returns {string} `[typeName]Logger.h`: datalogger class
     */
    _generateLoggerHeader() {
        /**
         * @param {ApplicationTemplate} template 
         * @returns {string}
         */
        function generateExosLoggerHeader(template) {
            
            let out = "";
            
            out += `#ifndef _${template.datamodel.structName.toUpperCase()}_LOGGER_H_\n`;
            out += `#define _${template.datamodel.structName.toUpperCase()}_LOGGER_H_\n`;
            out += `\n`;
            out += `#include <iostream>\n`;
            out += `#include <sstream>\n`;
            out += `#include <string>\n`;
            out += `\n`;
            out += `extern "C" {\n`;
            out += `    #include "exos_log.h"\n`;
            out += `}\n`;
            out += `\n`;
            out += `class ExosLogger\n`;
            out += `{\n`;
            out += `private:\n`;
            out += `    exos_log_handle_t* logger;\n`;
            out += `    EXOS_LOG_LEVEL logLevel;\n`;
            out += `    EXOS_LOG_TYPE logType;\n`;
            out += `    std::stringstream sstream;\n`;
            out += `public:\n`;
            out += `    typedef std::ostream&  (*ManipFn)(std::ostream&);\n`;
            out += `    typedef std::ios_base& (*FlagsFn)(std::ios_base&);\n`;
            out += `\n`;
            out += `    ExosLogger(exos_log_handle_t* logger, EXOS_LOG_LEVEL logLevel, EXOS_LOG_TYPE logType);\n`;
            out += `    \n`;
            out += `    template<class T>  // int, double, strings, etc\n`;
            out += `        ExosLogger& operator<<(const T& output)\n`;
            out += `    {\n`;
            out += `        sstream << output;\n`;
            out += `        return *this;\n`;
            out += `    }\n`;
            out += `\n`;
            out += `    ExosLogger& operator<<(ManipFn manip) /// endl, flush, setw, setfill, etc.\n`;
            out += `    { \n`;
            out += `        manip(sstream);\n`;
            out += `\n`;
            out += `        if (manip == static_cast<ManipFn>(std::flush)\n`;
            out += `            || manip == static_cast<ManipFn>(std::endl ) )\n`;
            out += `            this->flush();\n`;
            out += `\n`;
            out += `        return *this;\n`;
            out += `    }\n`;
            out += `\n`;
            out += `    ExosLogger& operator<<(FlagsFn manip) /// setiosflags, resetiosflags\n`;
            out += `    {\n`;
            out += `        manip(sstream);\n`;
            out += `        return *this;\n`;
            out += `    }\n`;
            out += `    \n`;
            out += `    void flush();\n`;
            out += `\n`;
            out += `    ExosLogger();\n`;
            out += `};\n`;
            out += `\n`;
            out += `class ${template.loggerClassName}\n`;
            out += `{\n`;
            out += `public:\n`;
            out += `    ${template.loggerClassName}(std::string name)\n`;
            out += `        : info(&logger, EXOS_LOG_LEVEL_INFO, EXOS_LOG_TYPE_USER)\n`;
            out += `        , warning(&logger, EXOS_LOG_LEVEL_WARNING, EXOS_LOG_TYPE_USER)\n`;
            out += `        , error(&logger, EXOS_LOG_LEVEL_ERROR, EXOS_LOG_TYPE_USER)\n`;
            out += `        , debug(&logger, EXOS_LOG_LEVEL_DEBUG, EXOS_LOG_TYPE_USER)\n`;
            out += `        , verbose(&logger, EXOS_LOG_LEVEL_WARNING, EXOS_LOG_TYPE(EXOS_LOG_TYPE_USER+EXOS_LOG_TYPE_VERBOSE))\n`;
            out += `        , success(&logger, EXOS_LOG_LEVEL_SUCCESS, EXOS_LOG_TYPE_USER)\n`;
            out += `    {\n`;
            out += `        exos_log_init(&logger, name.c_str());\n`;
            out += `    };\n`;
            out += `    void process() {\n`;
            out += `        exos_log_process(&logger);\n`;
            out += `    }\n`;
            out += `    ~${template.loggerClassName}() {\n`;
            out += `        exos_log_delete(&logger);\n`;
            out += `    };\n`;
            out += `    ExosLogger info;\n`;
            out += `    ExosLogger warning;\n`;
            out += `    ExosLogger error;\n`;
            out += `    ExosLogger debug;\n`;
            out += `    ExosLogger verbose;\n`;
            out += `    ExosLogger success;\n`;
            out += `private:\n`;
            out += `    exos_log_handle_t logger = {};\n`;
            out += `};\n`;
            out += `\n`;
            out += `#endif\n`;
            
            return out;
        }
        return generateExosLoggerHeader(this.template);
    }

    /**
     * @returns {string} `[typeName]Logger.cpp`: datalogger class implementation
     */
    _generateLoggerSource() {
        function generateExosLoggerCpp(loggerHeaderName) {
        
            let out = "";
            
            out += `#include "${loggerHeaderName}"\n`;
            out += `\n`;
            out += `ExosLogger::ExosLogger(exos_log_handle_t* logger, EXOS_LOG_LEVEL logLevel, EXOS_LOG_TYPE logType)\n`;
            out += `    : logger(logger)\n`;
            out += `    , logLevel(logLevel)\n`;
            out += `    , logType(logType)\n`;
            out += `{ \n`;
            out += `}\n`;
            out += `\n`;
            out += `void ExosLogger::flush() \n`;
            out += `{\n`;
            out += `    switch(logLevel)\n`;
            out += `    {\n`;
            out += `        case EXOS_LOG_LEVEL_INFO:\n`;
            out += `            exos_log_info(logger, logType, const_cast<char*>(sstream.str().c_str()));\n`;
            out += `            break;\n`;
            out += `        case EXOS_LOG_LEVEL_DEBUG:\n`;
            out += `            exos_log_debug(logger, logType, const_cast<char*>(sstream.str().c_str()));\n`;
            out += `            break;\n`;
            out += `        case EXOS_LOG_LEVEL_ERROR:\n`;
            out += `            exos_log_error(logger, const_cast<char*>(sstream.str().c_str()));\n`;
            out += `            break;\n`;
            out += `        case EXOS_LOG_LEVEL_SUCCESS:\n`;
            out += `            exos_log_success(logger, logType, const_cast<char*>(sstream.str().c_str()));\n`;
            out += `            break;\n`;
            out += `        case EXOS_LOG_LEVEL_WARNING:\n`;
            out += `            exos_log_warning(logger, logType, const_cast<char*>(sstream.str().c_str()));\n`;
            out += `            break;\n`;
            out += `    }\n`;
            out += `    sstream.str(std::string());\n`;
            out += `    sstream.clear();\n`;
            out += `}\n`;
        
            return out;
        }
        return generateExosLoggerCpp(this.loggerHeader.name);
    }

    /**
     * @returns {string} `[typeName]Datamodel.h` datamodel class
     */
    _generateDatamodelHeader() {
        /**
         * @param {ApplicationTemplate} template 
         * @returns {string}
         */
        function generateExosDataModelHeader(template) {
        
            let out = "";
        
            out += `#ifndef _${template.datamodel.structName.toUpperCase()}DATAMODEL_H_\n`;
            out += `#define _${template.datamodel.structName.toUpperCase()}DATAMODEL_H_\n`;
            out += `\n`;
            out += `#include <string>\n`;
            out += `#include <iostream>\n`;
            out += `#include <string.h>\n`;
            out += `#include <functional>\n`;
            out += `#include "${template.datamodel.datasetClassName}.h"\n`;
            out += `\n`;
            out += `class ${template.datamodel.className}\n`;
            out += `{\n`;
            out += `private:\n`;
            out += `    exos_datamodel_handle_t datamodel = {};\n`;
            out += `    std::function<void()> _onConnectionChange = [](){};\n`;
            out += `\n`;
            out += `    void datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info);\n`;
            out += `    static void _datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info) {\n`;
            out += `        ${template.datamodel.className}* inst = static_cast<${template.datamodel.className}*>(datamodel->user_context);\n`;
            out += `        inst->datamodelEvent(datamodel, event_type, info);\n`;
            out += `    }\n`;
            out += `\n`;
            out += `public:\n`;
            out += `    ${template.datamodel.className}();\n`;
            out += `    void process();\n`;
            out += `    void connect();\n`;
            out += `    void disconnect();\n`;
            out += `    void setOperational();\n`;
            out += `    int getNettime();\n`;
            out += `    void onConnectionChange(std::function<void()> f) {_onConnectionChange = std::move(f);};\n`;
            out += `\n`;
            out += `    bool isOperational = false;\n`;
            out += `    bool isConnected = false;\n`;
            out += `    EXOS_CONNECTION_STATE connectionState = EXOS_STATE_DISCONNECTED;\n`;
            out += `\n`;
            out += `    ${template.loggerClassName} log;\n`;
            out += `\n`;
            for (let dataset of template.datasets) {
                if (dataset.isPub || dataset.isSub) {
                    let dataType = dataset.dataType;
                    if(dataType.includes("STRING")) {
                        dataType = "char";
                    }
                    if(header.isScalarType(dataType)){
                        dataType = header.convertPlcType(dataType);
                    }
                    out += `    ${template.datamodel.datasetClassName}<${dataType}${dataset.arraySize > 0 ? '['+dataset.arraySize+']' : ''}${dataset.stringLength && dataset.stringLength > 0 ? '['+dataset.stringLength+']' : ''}> ${dataset.structName};\n`;
                }
            }
            out += `\n`;
            out += `    ~${template.datamodel.className}();\n`;
            out += `};\n`;
            out += `\n`;
            out += `#endif\n`;
        
            return out;
        }
        return generateExosDataModelHeader(this.datamodel.template);
    }

    /**
     * @returns {string}
     */
    _generateDatamodelSource() {
        /**
         * 
         * @param {ApplicationTemplate} template 
         * @param {string} aliasName 
         * @param {boolean} PubSubSwap 
         * @returns 
         */
        function generateExosDataModelCpp(template, PubSubSwap) {
        
            let out = "";
        
            out += `#define EXOS_STATIC_INCLUDE\n`;
            out += `#include "${template.datamodel.className}.h"\n`;
            out += `\n`;
            out += `${template.datamodel.className}::${template.datamodel.className}()\n`;
            out += `    : log("${template.aliasName}")\n`;
            out += `{\n`;
            out += `    log.success << "starting ${template.aliasName} application.." << std::endl;\n`;
            out += `\n`;
            out += `    exos_assert_ok((&log), exos_datamodel_init(&datamodel, "${template.datamodelInstanceName}", "${template.aliasName}"));\n`;
            out += `    datamodel.user_context = this;\n`;
            out += `\n`;
            for (let dataset of template.datasets) {
                if (dataset.isPub || dataset.isSub) {
                    out += `    ${dataset.structName}.init(&datamodel, "${dataset.structName}", &log);\n`;
                }
            }
            out += `}\n`;
            out += `\n`;
            out += `void ${template.datamodel.className}::connect() {\n`;
            out += `    exos_assert_ok((&log), exos_datamodel_connect_${typName.toLowerCase()}(&datamodel, &${template.datamodel.className}::_datamodelEvent));\n`;
            out += `\n`;
            for (let dataset of template.datasets) {
                if (dataset.isPub && dataset.isSub) {
                    out += `    ${dataset.structName}.connect((EXOS_DATASET_TYPE)(EXOS_DATASET_PUBLISH+EXOS_DATASET_SUBSCRIBE));\n`;
                }
                else if (!PubSubSwap && dataset.isPub || PubSubSwap && dataset.isSub) {
                    out += `    ${dataset.structName}.connect((EXOS_DATASET_TYPE)EXOS_DATASET_PUBLISH);\n`;
                } 
                else if(!PubSubSwap && dataset.isSub || PubSubSwap && dataset.isPub) {
                    out += `    ${dataset.structName}.connect((EXOS_DATASET_TYPE)EXOS_DATASET_SUBSCRIBE);\n`;
                }
            }
            out += `}\n`;
            out += `\n`;
            out += `void ${template.datamodel.className}::disconnect() {\n`;
            out += `    exos_assert_ok((&log), exos_datamodel_disconnect(&datamodel));\n`;
            out += `}\n`;
            out += `\n`;
            out += `void ${template.datamodel.className}::setOperational() {\n`;
            out += `    exos_assert_ok((&log), exos_datamodel_set_operational(&datamodel));\n`;
            out += `}\n`;
            out += `\n`;
            out += `void ${template.datamodel.className}::process() {\n`;
            out += `    exos_assert_ok((&log), exos_datamodel_process(&datamodel));\n`;
            out += `    log.process();\n`;
            out += `}\n`;
            out += `\n`;
            out += `int ${template.datamodel.className}::getNettime() {\n`;
            out += `    return exos_datamodel_get_nettime(&datamodel);\n`;
            out += `}\n`;
            out += `\n`;
            out += `void ${template.datamodel.className}::datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info) {\n`;
            out += `    switch (event_type)\n`;
            out += `    {\n`;
            out += `    case EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED:\n`;
            out += `        log.info << "application changed state to " << exos_get_state_string(datamodel->connection_state) << std::endl;\n`;
            out += `        connectionState = datamodel->connection_state;\n`;
            out += `        _onConnectionChange();\n`;
            out += `        switch (datamodel->connection_state)\n`;
            out += `        {\n`;
            out += `        case EXOS_STATE_DISCONNECTED:\n`;
            out += `            isOperational = false;\n`;
            out += `            isConnected = false;\n`;
            out += `            break;\n`;
            out += `        case EXOS_STATE_CONNECTED:\n`;
            out += `            isConnected = true;\n`;
            out += `            break;\n`;
            out += `        case EXOS_STATE_OPERATIONAL:\n`;
            out += `            log.success << "${moduleName} operational!" << std::endl;\n`;
            out += `            isOperational = true;\n`;
            out += `            break;\n`;
            out += `        case EXOS_STATE_ABORTED:\n`;
            out += `            log.error << "application error " << datamodel->error << " (" << exos_get_error_string(datamodel->error) << ") occured" << std::endl;\n`;
            out += `            isOperational = false;\n`;
            out += `            isConnected = false;\n`;
            out += `            break;\n`;
            out += `        }\n`;
            out += `        break;\n`;
            out += `    case EXOS_DATAMODEL_EVENT_SYNC_STATE_CHANGED:\n`;
            out += `        break;\n\n`;
            out += `    default:\n`;
            out += `        break;\n\n`;
            out += `    }\n`;
            out += `}\n`;
            out += `\n`;
            out += `${template.datamodel.className}::~${template.datamodel.className}()\n`;
            out += `{\n`;
            out += `    exos_assert_ok((&log), exos_datamodel_delete(&datamodel));\n`;
            out += `}\n`;
        
            return out;
        }
        return generateExosDataModelCpp(this.template, this.isLinux);
    }

    /**
     * 
     * @returns {string}
     */
    _genenerateLegend() {
        /**
         * 
         * @param {ApplicationTemplate} template
         * 
         * @param {boolean} PubSubSwap 
         * @returns {string}
         */
        function genenerateLegend(template, PubSubSwap) {
            let dmDelim = PubSubSwap ? "." : "->";
            let out = "";
        
            let template = configTemplate(fileName, typName);
            out += `/* datamodel features:\n`;
        
            out += `\nmain methods:\n`
            out += `    ${template.datamodel.varName}${dmDelim}connect()\n`;
            out += `    ${template.datamodel.varName}${dmDelim}disconnect()\n`;
            out += `    ${template.datamodel.varName}${dmDelim}process()\n`;
            out += `    ${template.datamodel.varName}${dmDelim}setOperational()\n`;
            out += `    ${template.datamodel.varName}${dmDelim}dispose()\n`;
            out += `    ${template.datamodel.varName}${dmDelim}getNettime() : (int32_t) get current nettime\n`;
            out += `\nvoid(void) user lambda callback:\n`
            out += `    ${template.datamodel.varName}${dmDelim}onConnectionChange([&] () {\n`;
            out += `        // ${template.datamodel.varName}${dmDelim}connectionState ...\n`;
            out += `    })\n`;
            out += `\nboolean values:\n`
            out += `    ${template.datamodel.varName}${dmDelim}isConnected\n`;
            out += `    ${template.datamodel.varName}${dmDelim}isOperational\n`;
            out += `\nlogging methods:\n`
            out += `    ${template.datamodel.varName}${dmDelim}log.error << "some value:" << 1 << std::endl;\n`;
            out += `    ${template.datamodel.varName}${dmDelim}log.warning << "some value:" << 1 << std::endl;\n`;
            out += `    ${template.datamodel.varName}${dmDelim}log.success << "some value:" << 1 << std::endl;\n`;
            out += `    ${template.datamodel.varName}${dmDelim}log.info << "some value:" << 1 << std::endl;\n`;
            out += `    ${template.datamodel.varName}${dmDelim}log.debug << "some value:" << 1 << std::endl;\n`;
            out += `    ${template.datamodel.varName}${dmDelim}log.verbose << "some value:" << 1 << std::endl;\n`;  
            for (let dataset of template.datasets) {
                if (dataset.isSub || dataset.isPub) {
                    out += `\ndataset ${dataset.structName}:\n`;
                    
                    if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
                        out += `    ${template.datamodel.varName}${dmDelim}${dataset.structName}.publish()\n`;
                    }
                    if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
                        out += `    ${template.datamodel.varName}${dmDelim}${dataset.structName}.onChange([&] () {\n`;
                        out += `        ${template.datamodel.varName}${dmDelim}${dataset.structName}.value ...\n`;
                        out += `    })\n`;
                        out += `    ${template.datamodel.varName}${dmDelim}${dataset.structName}.nettime : (int32_t) nettime @ time of publish\n`;
                    }
                    out += `    ${template.datamodel.varName}${dmDelim}${dataset.structName}.value : (${header.convertPlcType(dataset.dataType)}`;
                    if (dataset.arraySize > 0) { // array comes before string length in c (unlike AS typ editor where it would be: STRING[80][0..1])
                        out += `[${parseInt(dataset.arraySize)}]`;
                    }
                    if (dataset.dataType.includes("STRING")) {
                        out += `[${parseInt(dataset.stringLength)}]) `;
                    } else {
                        out += `) `;
                    }
                    out += ` actual dataset value`;
                    if(header.isScalarType(dataset.dataType, true)) {
                        out += `\n`;
                    }
                    else {
                        out += `s\n`;
                    }
                }
            }
            out += `*/\n\n`;
        
            return out;
        }
        return genenerateLegend(this.datamodel.template, this.datamodel.isLinux);
    }
}

module.exports = {TemplateCppLib};