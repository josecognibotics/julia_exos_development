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
    out += `  </Files>\n`;
    out += `  <Dependencies>\n`;
    out += `    <Dependency ObjectName="ExApi" />\n`;
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
    out += `	VAR_INPUT\n`;
    out += `		Enable : BOOL;\n`;
    out += `		Start : BOOL;\n`;
    out += `		Handle : UDINT;\n`;
    out += `		p${template.datamodel.structName} : REFERENCE TO ${template.datamodel.structName};\n`;
    out += `	END_VAR\n`;
    out += `	VAR_OUTPUT\n`;
    out += `		Connected : BOOL;\n`;
    out += `		Operational : BOOL;\n`;
    out += `		Error : BOOL;\n`;
    out += `	END_VAR\n`;
    out += `	VAR\n`;
    out += `		_Start : BOOL;\n`;
    out += `		_Enable : BOOL;\n`;
    out += `	END_VAR\n`;
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
    out += `    #define EXOS_ASSERT_LOG logger\n`;
    out += `    #include "exos_log.h"\n`;
    out += `    #include "exos_${typName.toLowerCase()}.h"\n`;
    out += `}\n`;
    out += `\n`;
    out += `#define SUCCESS(_format_, ...) exos_log_success(logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);\n`;
    out += `#define INFO(_format_, ...) exos_log_info(logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);\n`;
    out += `#define VERBOSE(_format_, ...) exos_log_debug(logger, (EXOS_LOG_TYPE)(EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE), _format_, ##__VA_ARGS__);\n`;
    out += `#define ERROR(_format_, ...) exos_log_error(logger, _format_, ##__VA_ARGS__);\n`;
    out += `\n`;
    out += `template <typename T>\n`;
    out += `class ${typName}DataSet\n`;
    out += `{\n`;
    out += `private:\n`;
    out += `    exos_dataset_handle_t dataset = {};\n`;
    out += `    exos_log_handle_t* logger;\n`;
    out += `    std::function<void()> _onChange = [](){};\n`;
    out += `    void datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info) {\n`;
    out += `        switch (event_type)\n`;
    out += `        {\n`;
    out += `            case EXOS_DATASET_EVENT_UPDATED:\n`;
    out += `                VERBOSE("dataset %s updated! latency (us):%i", dataset->name, (exos_datamodel_get_nettime(dataset->datamodel,NULL) - dataset->nettime));\n`;
    out += `                nettime = dataset->nettime;\n`;
    out += `                _onChange();\n`;
    out += `                break;\n`;
    out += `            case EXOS_DATASET_EVENT_PUBLISHED:\n`;
    out += `                VERBOSE("dataset %s published to local server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);\n`;
    out += `                break;\n`;
    out += `            case EXOS_DATASET_EVENT_DELIVERED:\n`;
    out += `                VERBOSE("dataset %s delivered to remote server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);\n`;
    out += `                break;\n`;
    out += `            case EXOS_DATASET_EVENT_CONNECTION_CHANGED:\n`;
    out += `                INFO("dataset %s changed state to %s", dataset->name, exos_get_state_string(dataset->connection_state));\n`;
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
    out += `                        ERROR("dataset %s error %d (%s) occured", dataset->name, dataset->error, exos_get_error_string(dataset->error));\n`;
    out += `                        break;\n`;
    out += `                }\n`;
    out += `                break;\n`;
    out += `        }\n`;
    out += `    }\n`;
    out += `    static void _datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info) {\n`;
    out += `		${typName}DataSet* inst = static_cast<${typName}DataSet*>(dataset->user_context);\n`;
    out += `		inst->datasetEvent(dataset, event_type, info);\n`;
    out += `	}\n`;
    out += `\n`;
    out += `public:\n`;
    out += `    ${typName}DataSet() {};\n`;
    out += `\n`;
    out += `    T value;\n`;
    out += `    int nettime;\n`;
    out += `    void init(exos_datamodel_handle_t *datamodel, const char *browse_name, exos_log_handle_t* _logger) {\n`;
    out += `        EXOS_ASSERT_OK(exos_dataset_init(&dataset, datamodel, browse_name, &value, sizeof(value)));\n`;
    out += `        dataset.user_context = this;\n`;
    out += `        logger = _logger;\n`;
    out += `    };\n`;
    out += `    void connect(EXOS_DATASET_TYPE type) {\n`;
    out += `        EXOS_ASSERT_OK(exos_dataset_connect(&dataset, type, &${typName}DataSet::_datasetEvent));\n`;
    out += `    };\n`;
    out += `    void publish() {\n`;
    out += `        exos_dataset_publish(&dataset);\n`;
    out += `    };\n`;
    out += `    void onChange(std::function<void()> f) {_onChange = std::move(f);};\n`;
    out += `\n`;
    out += `    ~${typName}DataSet() {\n`;
    out += `		EXOS_ASSERT_OK(exos_dataset_delete(&dataset));\n`;
    out += `	};\n`;
    out += `};\n`;
    out += `\n`;
    out += `#endif\n`;

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
    out += `extern "C" {\n`;
    out += `#include "exos_log.h"\n`;
    out += `}\n`;
    out += `\n`;
    out += `class ${typName}DataModel\n`;
    out += `{\n`;
    out += `private:\n`;
    out += `    exos_datamodel_handle_t datamodel = {};\n`;
    out += `	exos_log_handle_t log = {};\n`;
    out += `    exos_log_handle_t* logger;\n`;
    out += `	std::function<void()> _onConnectionChange = [](){};\n`;
    out += `\n`;
    out += `	void datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info);\n`;
    out += `	static void _datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info) {\n`;
    out += `		${typName}DataModel* inst = static_cast<${typName}DataModel*>(datamodel->user_context);\n`;
    out += `		inst->datamodelEvent(datamodel, event_type, info);\n`;
    out += `	}\n`;
    out += `\n`;
    out += `public:\n`;
    out += `	${typName}DataModel();\n`;
    out += `	void process();\n`;
    out += `	void connect();\n`;
    out += `	void disconnect();\n`;
    out += `	void setOperational();\n`;
    out += `	int getNettime();\n`;
    out += `	void onConnectionChange(std::function<void()> f) {_onConnectionChange = std::move(f);};\n`;
    out += `\n`;
    out += `	bool isOperational = false;\n`;
    out += `	bool isConnected = false;\n`;
    out += `	EXOS_CONNECTION_STATE connectionState = EXOS_STATE_DISCONNECTED;\n`;
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
    out += `${typName}DataModel::${typName}DataModel() {\n`;
    out += `    logger = &log;\n`;
    out += `	exos_log_init(logger, "${moduleName}");\n`;
    out += `	SUCCESS("starting ${moduleName} application..");\n`;
    out += `\n`;
    out += `	EXOS_ASSERT_OK(exos_datamodel_init(&datamodel, "${template.datamodel.structName}", "${moduleName}"));\n`;
    out += `	datamodel.user_context = this;\n`;
    out += `\n`;
    for (let dataset of template.datasets) {
        if (dataset.isPub || dataset.isSub) {
            out += `    ${dataset.structName}.init(&datamodel, "${dataset.structName}", logger);\n`;
        }
    }
    out += `}\n`;
    out += `\n`;
    out += `void ${typName}DataModel::connect() {\n`;
    out += `	EXOS_ASSERT_OK(exos_datamodel_connect_${typName.toLowerCase()}(&datamodel, &${typName}DataModel::_datamodelEvent));\n`;
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
    out += `	EXOS_ASSERT_OK(exos_datamodel_disconnect(&datamodel));\n`;
    out += `}\n`;
    out += `\n`;
    out += `void ${typName}DataModel::setOperational() {\n`;
    out += `	EXOS_ASSERT_OK(exos_datamodel_set_operational(&datamodel));\n`;
    out += `}\n`;
    out += `\n`;
    out += `void ${typName}DataModel::process() {\n`;
    out += `	EXOS_ASSERT_OK(exos_datamodel_process(&datamodel));\n`;
    out += `	exos_log_process(logger);\n`;
    out += `}\n`;
    out += `\n`;
    out += `int ${typName}DataModel::getNettime() {\n`;
    out += `	return exos_datamodel_get_nettime(&datamodel,NULL);\n`;
    out += `}\n`;
    out += `\n`;
    out += `void ${typName}DataModel::datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info) {\n`;
    out += `	switch (event_type)\n`;
    out += `	{\n`;
    out += `		case EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED:\n`;
    out += `			INFO("application changed state to %s", exos_get_state_string(datamodel->connection_state));\n`;
    out += `			connectionState = datamodel->connection_state;\n`;
    out += `			_onConnectionChange();\n`;
    out += `			switch (datamodel->connection_state)\n`;
    out += `			{\n`;
    out += `				case EXOS_STATE_DISCONNECTED:\n`;
    out += `					isOperational = false;\n`;
    out += `					isConnected = false;\n`;
    out += `					break;\n`;
    out += `				case EXOS_STATE_CONNECTED:\n`;
    out += `					isConnected = true;\n`;
    out += `					break;\n`;
    out += `				case EXOS_STATE_OPERATIONAL:\n`;
    out += `					SUCCESS("${typName}DataModel operational!");\n`;
    out += `					isOperational = true;\n`;
    out += `					break;\n`;
    out += `				case EXOS_STATE_ABORTED:\n`;
    out += `					ERROR("application error %d (%s) occured", datamodel->error, exos_get_error_string(datamodel->error));\n`;
    out += `					isOperational = false;\n`;
    out += `					isConnected = false;\n`;
    out += `					break;\n`;
    out += `			}\n`;
    out += `			break;\n`;
    out += `	}\n`;
    out += `}\n`;
    out += `\n`;
    out += `${typName}DataModel::~${typName}DataModel()\n`;
    out += `{\n`;
    out += `	EXOS_ASSERT_OK(exos_datamodel_delete(&datamodel));\n`;
    out += `	exos_log_delete(logger);\n`;
    out += `}\n`;

    return out;
}

function genenerateLegend(fileName, typName, PubSubSwap) {
    let dmDelim = PubSubSwap ? "." : "->";
    let out = "";

    let template = configTemplate(fileName, typName);
    out += `/* datamodel features:\n`;

    out += `\nmain methods:\n`
    out += `    datamodel${dmDelim}connect()\n`;
    out += `    datamodel${dmDelim}disconnect()\n`;
    out += `    datamodel${dmDelim}process()\n`;
    out += `    datamodel${dmDelim}setOperational()\n`;
    out += `    datamodel${dmDelim}dispose()\n`;
    out += `    datamodel${dmDelim}getNettime() : (int32_t) get current nettime\n`;
    out += `\nvoid(void) user lambda callback:\n`
    out += `    datamodel${dmDelim}onConnectionChange([&] () {\n`;
    out += `        // dataModel.connectionState ...\n`;
    out += `    })\n`;
    out += `\nboolean values:\n`
    out += `    datamodel${dmDelim}isConnected\n`;
    out += `    datamodel${dmDelim}isOperational\n`;
//    out += `\nlogging methods:\n`
//    out += `    datamodel${dmDelim}log.error(char *)\n`;
//    out += `    datamodel${dmDelim}log.warning(char *)\n`;
//    out += `    datamodel${dmDelim}log.success(char *)\n`;
//    out += `    datamodel${dmDelim}log.info(char *)\n`;
//    out += `    datamodel${dmDelim}log.debug(char *)\n`;
//    out += `    datamodel${dmDelim}log.verbose(char *)\n`;  
    for (let dataset of template.datasets) {
        if (dataset.isSub || dataset.isPub) {
            out += `\ndataset ${dataset.structName}:\n`;
            
            if ((!PubSubSwap && dataset.isPub) || (PubSubSwap && dataset.isSub)) {
                out += `    datamodel${dmDelim}${dataset.structName}.publish()\n`;
            }
            if ((!PubSubSwap && dataset.isSub) || (PubSubSwap && dataset.isPub)) {
                out += `    datamodel${dmDelim}${dataset.structName}.onChange([&] () {\n`;
                out += `        datamodel${dmDelim}${dataset.structName}.value ...\n`;
                out += `    })\n`;
                out += `    datamodel${dmDelim}${dataset.structName}.nettime : (int32_t) nettime @ time of publish\n`;
            }
            out += `    datamodel${dmDelim}${dataset.structName}.value : (${header.convertPlcType(dataset.dataType)}`;
            if (dataset.arraySize > 0) { // array comes before string length in c (unlike AS typ editor where it would be: STRING[80][0..1])
                out += `[${parseInt(dataset.arraySize)}]`;
            }
            if (dataset.dataType.includes("STRING")) {
                out += `[${parseInt(dataset.stringLength)}) `;
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
    out += `	${typName}DataModel* handle = new ${typName}DataModel();\n`;
    out += `	if (NULL == handle)\n`;
    out += `	{\n`;
    out += `		inst->Handle = 0;\n`;
    out += `		return;\n`;
    out += `	}\n`;
    out += `	inst->Handle = (UDINT)handle;\n`;
    out += `}\n`;
    out += `\n`;
    out += `_BUR_PUBLIC void ${template.datamodel.structName}Cyclic(struct ${template.datamodel.structName}Cyclic *inst)\n`;
    out += `{\n`;
    out += `	// return error if reference to structure is not set on function block\n`;
    out += `	if(NULL == (void*)inst->Handle || NULL == inst->p${template.datamodel.structName})\n`;
    out += `	{\n`;
    out += `		inst->Operational = false;\n`;
    out += `		inst->Connected = false;\n`;
    out += `		inst->Error = true;\n`;
    out += `		return;\n`;
    out += `	}\n`;
    out += `	${typName}DataModel* dataModel = static_cast<${typName}DataModel*>((void*)inst->Handle);\n`;
    out += `	if (inst->Enable && !inst->_Enable)\n`;
    out += `	{\n`;
    for (let dataset of template.datasets) {
        if (dataset.isSub) {
            out += `		dataModel->${dataset.structName}.onChange([&] () {\n`;
            
            if(header.isScalarType(dataset.dataType) && (dataset.arraySize == 0)) {
                out += `            inst->p${template.datamodel.structName}->${dataset.structName} = dataModel->${dataset.structName}.value;\n`;
            }
            else {
                out += `            memcpy(&inst->p${template.datamodel.structName}->${dataset.structName}, &dataModel->${dataset.structName}.value, sizeof(inst->p${template.datamodel.structName}->${dataset.structName}));\n`;
            }
    
            out += `        });\n`;
        }
    }
    out += `		dataModel->connect();\n`;
    out += `	}\n`;
    out += `	if (!inst->Enable && inst->_Enable)\n`;
    out += `	{\n`;
    out += `		dataModel->disconnect();\n`;
    out += `	}\n`;
    out += `	inst->_Enable = inst->Enable;\n`;
    out += `\n`;
    out += `	if(inst->Start && !inst->_Start && dataModel->isConnected)\n`;
    out += `	{\n`;
    out += `		dataModel->setOperational();\n`;
    out += `		inst->_Start = inst->Start;\n`;
    out += `	}\n`;
    out += `	if(!inst->Start)\n`;
    out += `	{\n`;
    out += `		inst->_Start = false;\n`;
    out += `	}\n`;
    out += `\n`;
    out += `	//trigger callbacks\n`;
    out += `	dataModel->process();\n`;
    out += `\n`;
    out += `	if (dataModel->isConnected)\n`;
    out += `	{\n`;
    for (let dataset of template.datasets) {
        if (!dataset.isPrivate) {
            if (dataset.isPub) {
                if(header.isScalarType(dataset.dataType) && (dataset.arraySize == 0)) {
                    out += `        //publish the ${dataset.structName} dataset as soon as there are changes\n`;
                    out += `        if (inst->p${template.datamodel.structName}->${dataset.structName} != dataModel->${dataset.structName}.value)\n`;
                    out += `        {\n`;
                    out += `            dataModel->${dataset.structName}.value = inst->p${template.datamodel.structName}->${dataset.structName};\n`;
                    out += `            dataModel->${dataset.structName}.publish();\n`;
                    out += `        }\n`;
                } 
                else {
                    out += `        //publish the ${dataset.structName} dataset as soon as there are changes\n`;
                    out += `        if (0 != memcmp(&inst->p${template.datamodel.structName}->${dataset.structName}, &dataModel->${dataset.structName}.value, sizeof(dataModel->${dataset.structName}.value)))\n`;
                    out += `        {\n`;
                    out += `            memcpy(&dataModel->${dataset.structName}.value, &inst->p${template.datamodel.structName}->${dataset.structName}, sizeof(dataModel->${dataset.structName}.value));\n`;
                    out += `            dataModel->${dataset.structName}.publish();\n`;
                    out += `        }\n`;
                }
            }
        }
    }
    out += `		// Your code here...\n`;
    out += `	}\n`;
    out += `\n`;
    out += `	inst->Connected = dataModel->isConnected;\n`;
    out += `	inst->Operational = dataModel->isOperational;\n`;
    out += `}\n`;
    out += `\n`;
    out += `_BUR_PUBLIC void ${template.datamodel.structName}Exit(struct ${template.datamodel.structName}Exit *inst)\n`;
    out += `{\n`;
    out += `	${typName}DataModel* dataModel = static_cast<${typName}DataModel*>((void*)inst->Handle);\n`;
    out += `	delete dataModel;\n`;
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
    out += `	exit(signum);\n`;
    out += `}\n`;
    out += `\n`;
    out += `int main(int argc, char ** argv)\n`;
    out += `{\n`;
    out += `	signal(SIGINT, catchTermination);\n`;
    out += `\n`;
    out += `	${typName}DataModel dataModel;\n`;
    out += `	dataModel.connect();\n`;
    out += `\n`;
    out += `	dataModel.onConnectionChange([&] () {\n`;
    out += `		if(dataModel.connectionState == EXOS_STATE_CONNECTED) {\n`;
    out += `			// Datamodel connected\n`;
    out += `		}\n`;
    out += `		else if(dataModel.connectionState == EXOS_STATE_DISCONNECTED) {	\n`;
    out += `			// Datamodel disconnected\n`;
    out += `		}\n`;
    out += `	});\n`;
    out += `\n`;
    for (let dataset of template.datasets) {
        if (dataset.isPub) {
            out += `	dataModel.${dataset.structName}.onChange([&] () {\n`;
            out += `        // dataModel.${dataset.structName}.value ...\n`;
            out += `    });\n`;
            out += `\n`;
        }
    }
    out += `	// publishing of values\n`;
    out += `\n`;
    for (let dataset of template.datasets) {
        if (dataset.isSub) {
            out += `	// dataModel.${dataset.structName}.value = ...\n`;
            out += `	// dataModel.${dataset.structName}.publish();\n`;
            out += `\n`;
        }
    }
    out += `\n`;
    out += `	while(true) {\n`;
    out += `		dataModel.process();\n`;
    out += `	}\n`;
    out += `\n`;
    out += `	return 0;\n`;
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
    generateMainAR,
    generateIECProgram,
    generateIECProgramVar,
    generateIECProgramST,
    generateMainLinux
}