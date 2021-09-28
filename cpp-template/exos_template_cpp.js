const header = require('../exos_header');
const fs = require('fs');

function generateCLibrary(fileName, typName, libName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio Version=4.6.3.55 SP?>\n`;
    out += `<Library SubType="ANSIC" xmlns="http://br-automation.co.at/AS/Library">\n`;
    out += `  <Files>\n`;
    out += `    <File Description="Implementation">main.cpp</File>\n`;
    out += `    <File Description="Data Model Definition">${fileName}</File>\n`;
    out += `    <File Description="Exported functions and function blocks">${libName}.fun</File>\n`;
    out += `    <File Description="Generated exos headerfile">exos_${typName.toLowerCase()}.h</File>\n`;
    out += `    <File Description="Enable dynamic heap">dynamic_heap.cpp</File>\n`;
    out += `    <File>${typName}DataModel.cpp</File>\n`;
    out += `    <File>${typName}DataModel.h</File>\n`;
    out += `    <File>${typName}DataSet.h</File>\n`;
    out += `    <File>${typName}Logger.cpp</File>\n`;
    out += `    <File>${typName}Logger.h</File>\n`;
   out += `  </Files>\n`;
    out += `  <Dependencies>\n`;
    out += `    <Dependency ObjectName="ExData" />\n`;
    out += `  </Dependencies>\n`;
    out += `</Library>\n`;

    return out;
}

function generateFun(fileName, typName) {

    let template = configTemplate(fileName, typName);
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

function generateExosDataSetHeader(typName) {

    let out = "";

    out += `#ifndef _${typName.toUpperCase()}DATASET_H_\n`;
    out += `#define _${typName.toUpperCase()}DATASET_H_\n`;
    out += `\n`;
    out += `#include <string>\n`;
    out += `#include <iostream>\n`;
    out += `#include <string.h>\n`;
    out += `#include <functional>\n`;
    out += `\n`;
    out += `extern "C" {\n`;
    out += `    #include "exos_${typName.toLowerCase()}.h"\n`;
    out += `}\n`;
    out += `\n`;
    out += `#include "${typName}Logger.h"\n`;
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
    out += `class ${typName}DataSet\n`;
    out += `{\n`;
    out += `private:\n`;
    out += `    exos_dataset_handle_t dataset = {};\n`;
    out += `    ${typName}Logger* log;\n`;
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
    out += `\n`;
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
    out += `        ${typName}DataSet* inst = static_cast<${typName}DataSet*>(dataset->user_context);\n`;
    out += `        inst->datasetEvent(dataset, event_type, info);\n`;
    out += `    }\n`;
    out += `\n`;
    out += `public:\n`;
    out += `    ${typName}DataSet() {};\n`;
    out += `\n`;
    out += `    T value;\n`;
    out += `    int nettime;\n`;
    out += `    void init(exos_datamodel_handle_t *datamodel, const char *browse_name, ${typName}Logger* _log) {\n`;
    out += `        log = _log;\n`;
    out += `        exos_assert_ok(log, exos_dataset_init(&dataset, datamodel, browse_name, &value, sizeof(value)));\n`;
    out += `        dataset.user_context = this;\n`;
    out += `    };\n`;
    out += `    void connect(EXOS_DATASET_TYPE type) {\n`;
    out += `        exos_assert_ok(log, exos_dataset_connect(&dataset, type, &${typName}DataSet::_datasetEvent));\n`;
    out += `    };\n`;
    out += `    void publish() {\n`;
    out += `        exos_dataset_publish(&dataset);\n`;
    out += `    };\n`;
    out += `    void onChange(std::function<void()> f) {_onChange = std::move(f);};\n`;
    out += `\n`;
    out += `    ~${typName}DataSet() {\n`;
    out += `        exos_assert_ok(log, exos_dataset_delete(&dataset));\n`;
    out += `    };\n`;
    out += `};\n`;
    out += `\n`;
    out += `#endif\n`;

    return out;
}


function generateExosLoggerHeader(fileName, typName) {
    let template = configTemplate(fileName, typName);

    let out = "";
    
    out += `#ifndef _${typName.toUpperCase()}_LOGGER_H_\n`;
    out += `#define _${typName.toUpperCase()}_LOGGER_H_\n`;
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
    out += `class ${typName}Logger\n`;
    out += `{\n`;
    out += `public:\n`;
    out += `    ${typName}Logger(std::string name)\n`;
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
    out += `    ~${typName}Logger() {\n`;
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

function generateExosLoggerCpp(fileName, typName) {
    let template = configTemplate(fileName, typName);

    let out = "";
    
    out += `#include "${typName}Logger.h"\n`;
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


function generateExosDataModelHeader(fileName, typName) {
    let template = configTemplate(fileName, typName);

    let out = "";

    out += `#ifndef _${typName.toUpperCase()}DATAMODEL_H_\n`;
    out += `#define _${typName.toUpperCase()}DATAMODEL_H_\n`;
    out += `\n`;
    out += `#include <string>\n`;
    out += `#include <iostream>\n`;
    out += `#include <string.h>\n`;
    out += `#include <functional>\n`;
    out += `#include "${typName}DataSet.h"\n`;
    out += `\n`;
    out += `class ${typName}DataModel\n`;
    out += `{\n`;
    out += `private:\n`;
    out += `    exos_datamodel_handle_t datamodel = {};\n`;
    out += `    std::function<void()> _onConnectionChange = [](){};\n`;
    out += `\n`;
    out += `    void datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info);\n`;
    out += `    static void _datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info) {\n`;
    out += `        ${typName}DataModel* inst = static_cast<${typName}DataModel*>(datamodel->user_context);\n`;
    out += `        inst->datamodelEvent(datamodel, event_type, info);\n`;
    out += `    }\n`;
    out += `\n`;
    out += `public:\n`;
    out += `    ${typName}DataModel();\n`;
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
    out += `    ${typName}Logger log;\n`;
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
            out += `    ${typName}DataSet<${dataType}${dataset.arraySize > 0 ? '['+dataset.arraySize+']' : ''}${dataset.stringLength && dataset.stringLength > 0 ? '['+dataset.stringLength+']' : ''}> ${dataset.structName};\n`;
        }
    }
    out += `\n`;
    out += `    ~${typName}DataModel();\n`;
    out += `};\n`;
    out += `\n`;
    out += `#endif\n`;

    return out;
}

function generateExosDataModelCpp(fileName, typName, moduleName, PubSubSwap) {
    let template = configTemplate(fileName, typName);

    let out = "";

    out += `#define EXOS_STATIC_INCLUDE\n`;
    out += `#include "${typName}DataModel.h"\n`;
    out += `\n`;
    out += `${typName}DataModel::${typName}DataModel()\n`;
    out += `    : log("${moduleName}")\n`;
    out += `{\n`;
    out += `    log.success << "starting ${moduleName} application.." << std::endl;\n`;
    out += `\n`;
    out += `    exos_assert_ok((&log), exos_datamodel_init(&datamodel, "${template.datamodel.structName}", "${moduleName}"));\n`;
    out += `    datamodel.user_context = this;\n`;
    out += `\n`;
    for (let dataset of template.datasets) {
        if (dataset.isPub || dataset.isSub) {
            out += `    ${dataset.structName}.init(&datamodel, "${dataset.structName}", &log);\n`;
        }
    }
    out += `}\n`;
    out += `\n`;
    out += `void ${typName}DataModel::connect() {\n`;
    out += `    exos_assert_ok((&log), exos_datamodel_connect_${typName.toLowerCase()}(&datamodel, &${typName}DataModel::_datamodelEvent));\n`;
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
    out += `void ${typName}DataModel::disconnect() {\n`;
    out += `    exos_assert_ok((&log), exos_datamodel_disconnect(&datamodel));\n`;
    out += `}\n`;
    out += `\n`;
    out += `void ${typName}DataModel::setOperational() {\n`;
    out += `    exos_assert_ok((&log), exos_datamodel_set_operational(&datamodel));\n`;
    out += `}\n`;
    out += `\n`;
    out += `void ${typName}DataModel::process() {\n`;
    out += `    exos_assert_ok((&log), exos_datamodel_process(&datamodel));\n`;
    out += `    log.process();\n`;
    out += `}\n`;
    out += `\n`;
    out += `int ${typName}DataModel::getNettime() {\n`;
    out += `    return exos_datamodel_get_nettime(&datamodel);\n`;
    out += `}\n`;
    out += `\n`;
    out += `void ${typName}DataModel::datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info) {\n`;
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
    out += `${typName}DataModel::~${typName}DataModel()\n`;
    out += `{\n`;
    out += `    exos_assert_ok((&log), exos_datamodel_delete(&datamodel));\n`;
    out += `}\n`;

    return out;
}

function genenerateLegend(fileName, typName, PubSubSwap) {
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

function generateMainAR(fileName, typName) {
    let template = configTemplate(fileName, typName);

    let out = "";

    out += `#include <string.h>\n`;
    out += `#include <stdbool.h>\n`;
    out += `#include "${typName}DataModel.h"\n`;
    out += `\n`;
    out += genenerateLegend(fileName, typName, false);
    out += `\n`;
    out += `_BUR_PUBLIC void ${template.datamodel.structName}Init(struct ${template.datamodel.structName}Init *inst)\n`;
    out += `{\n`;
    out += `    ${typName}DataModel* ${template.datamodel.varName} = new ${typName}DataModel();\n`;
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
    out += `    ${typName}DataModel* ${template.datamodel.varName} = static_cast<${typName}DataModel*>((void*)inst->Handle);\n`;
    out += `    if (inst->Enable && !inst->_Enable)\n`;
    out += `    {\n`;
    for (let dataset of template.datasets) {
        if (dataset.isSub) {
            out += `        ${template.datamodel.varName}->${dataset.structName}.onChange([&] () {\n`;
            
            if(header.isScalarType(dataset.dataType) && (dataset.arraySize == 0)) {
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
                if(header.isScalarType(dataset.dataType) && (dataset.arraySize == 0)) {
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
    out += `    ${typName}DataModel* ${template.datamodel.varName} = static_cast<${typName}DataModel*>((void*)inst->Handle);\n`;
    out += `    delete ${template.datamodel.varName};\n`;
    out += `}\n`;
    out += `\n`;
    
    return out;
}

function generateIECProgram(typName) {
    let out = "";

    out += `<?xml version="1.0" encoding="utf-8"?>\n`;
    out += `<?AutomationStudio Version=4.9.1.69?>\n`;
    out += `<Program SubType="IEC" xmlns="http://br-automation.co.at/AS/Program">\n`;
    out += `  <Files>\n`;
    out += `    <File Description="Init, cyclic, exit code">${typName}.st</File>\n`;
    out += `    <File Description="Local variables" Private="true">${typName}.var</File>\n`;
    out += `  </Files>\n`;
    out += `</Program>\n`;

    return out;
}

function generateIECProgramVar(typName) {
    let out = "";

    out += `VAR\n`;
    out += `    ${typName}Init_0 : ${typName}Init;\n`;
    out += `    ${typName}Cyclic_0 : ${typName}Cyclic;\n`;
    out += `    ${typName}Exit_0 : ${typName}Exit;\n`;
    out += `    ${typName}_0 : ${typName};\n`;
    out += `END_VAR\n`;

    return out;
}

function generateIECProgramST(typName) {
    let out = "";

    out += `\n`;
    out += `PROGRAM _INIT\n`;
    out += `\n`;
    out += `    ${typName}Init_0();\n`;
    out += `\n`;
    out += `END_PROGRAM\n`;
    out += `\n`;
    out += `PROGRAM _CYCLIC\n`;
    out += `\n`;
    out += `    ${typName}Cyclic_0(Handle := ${typName}Init_0.Handle, p${typName} := ADR(${typName}_0));\n`;
    out += `\n`;
    out += `END_PROGRAM\n`;
    out += `\n`;
    out += `PROGRAM _EXIT\n`;
    out += `\n`;
    out += `    ${typName}Exit_0(Handle := ${typName}Init_0.Handle);\n`;
    out += `\n`;
    out += `END_PROGRAM\n`;

    return out;
}


function generateMainLinux(fileName, typName) {
    let template = configTemplate(fileName, typName);
    let out = "";

    out += `#include <string>\n`;
    out += `#include <csignal>\n`;
    out += `#include "${typName}DataModel.h"\n`;
    out += `\n`;
    out += genenerateLegend(fileName, typName, true);
    out += `\n`;
    out += `void catchTermination(int signum) {\n`;
    out += `    exit(signum);\n`;
    out += `}\n`;
    out += `\n`;
    out += `int main(int argc, char ** argv)\n`;
    out += `{\n`;
    out += `    signal(SIGINT, catchTermination);\n`;
    out += `    \n`;
    out += `    ${typName}DataModel ${template.datamodel.varName};\n`;
    out += `    ${template.datamodel.varName}.connect();\n`;
    out += `    \n`;
    out += `    ${template.datamodel.varName}.onConnectionChange([&] () {\n`;
    out += `        if(${template.datamodel.varName}.connectionState == EXOS_STATE_CONNECTED) {\n`;
    out += `            // Datamodel connected\n`;
    out += `        }\n`;
    out += `        else if(${template.datamodel.varName}.connectionState == EXOS_STATE_DISCONNECTED) {    \n`;
    out += `            // Datamodel disconnected\n`;
    out += `        }\n`;
    out += `    });\n`;
    out += `\n`;
    for (let dataset of template.datasets) {
        if (dataset.isPub) {
            out += `    ${template.datamodel.varName}.${dataset.structName}.onChange([&] () {\n`;
            out += `        // ${template.datamodel.varName}.${dataset.structName}.value ...\n`;
            out += `    });\n`;
            out += `\n`;
        }
    }
    out += `\n`;
    out += `    while(true) {\n`;
    out += `        // trigger callbacks\n`;
    out += `        ${template.datamodel.varName}.process();\n`;
    out += `        \n`;
    out += `        // publish datasets\n`;
    out += `        \n`;
    for (let dataset of template.datasets) {
        if (dataset.isSub) {
            out += `        // ${template.datamodel.varName}.${dataset.structName}.value = ...\n`;
            out += `        // ${template.datamodel.varName}.${dataset.structName}.publish();\n`;
            out += `        \n`;
        }
    }
    out += `    }\n`;
    out += `\n`;
    out += `    return 0;\n`;
    out += `}\n`;

    return out;
}

function configTemplate(fileName, typName) {

    let template = {
        headerName: "",
        handle: {
            dataType: "",
            name: "",
        },
        datamodel: {
            structName: "",
            varName: "",
            dataType: "",
            comment: ""
        },
        datasets: [],
        logname: ""
    };

    if (fs.existsSync(fileName)) {

        let types = header.parseTypFile(fileName, typName);

        template.logname = "logger";
        template.headerName = `exos_${types.attributes.dataType.toLowerCase()}.h`
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

        //check if toLowerCase is same as struct name, then extend it with _dataset
        for (let child of types.children) {
            let object = {};
            object["structName"] = child.attributes.name;
            object["varName"] = child.attributes.name.toLowerCase() + (child.attributes.name == child.attributes.name.toLowerCase() ? "_dataset" : "");
            object["dataType"] = child.attributes.dataType;
            object["arraySize"] = child.attributes.arraySize;
            object["comment"] = child.attributes.comment;
            object["isPub"] = child.attributes.comment.includes("PUB");
            object["isSub"] = child.attributes.comment.includes("SUB");
            object["isPrivate"] = child.attributes.comment.includes("private");
            if (child.attributes.hasOwnProperty("stringLength")) { object["stringLength"] = child.attributes.stringLength; }
            template.datasets.push(object);
        }

        // initialize non-string comments to "" and missing arraysizes to 0
        for (let dataset of template.datasets) {
            if (typeof dataset.comment !== 'string') {
                dataset.comment = "";
            }
            if (typeof dataset.arraySize !== 'number') {
                dataset.arraySize = 0;
            }
        }
    }
    else {
        throw(`file '${fileName}' not found.`);
    }
    return template;
}

module.exports = {
    generateCLibrary,
    generateFun,
    generateExosDataModelCpp,
    generateExosDataModelHeader,
    generateExosDataSetHeader,
    generateExosLoggerHeader,
    generateExosLoggerCpp,
    generateMainAR,
    generateIECProgram,
    generateIECProgramVar,
    generateIECProgramST,
    generateMainLinux
}