#include <StringAndA.h>

#define EXOS_ASSERT_LOG &handle->logger
#define EXOS_ASSERT_CALLBACK inst->_state = 255;
#include "exos_log.h"
#include "exos_stringandarray.h"
#include <string.h>

#define SUCCESS(_format_, ...) exos_log_success(&handle->logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);
#define INFO(_format_, ...) exos_log_info(&handle->logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);
#define VERBOSE(_format_, ...) exos_log_debug(&handle->logger, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, _format_, ##__VA_ARGS__);
#define ERROR(_format_, ...) exos_log_error(&handle->logger, _format_, ##__VA_ARGS__);

typedef struct
{
    void *self;
    exos_log_handle_t logger;
    StringAndArray data;

    exos_datamodel_handle_t stringandarray;

    exos_dataset_handle_t myint1;
    exos_dataset_handle_t myint3;
} StringAndArrayHandle_t;

static void datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info)
{
    struct StringAndArrayCyclic *inst = (struct StringAndArrayCyclic *)dataset->datamodel->user_context;
    StringAndArrayHandle_t *handle = (StringAndArrayHandle_t *)inst->Handle;

    switch (event_type)
    {
    case EXOS_DATASET_EVENT_UPDATED:
        VERBOSE("dataset %s updated! latency (us):%i", dataset->name, (exos_datamodel_get_nettime(dataset->datamodel) - dataset->nettime));
        //handle each subscription dataset separately
        if(0 == strcmp(dataset->name, "MyInt3"))
        {
            memcpy(&inst->pStringAndArray->MyInt3, dataset->data, dataset->size);
        }
        break;

    case EXOS_DATASET_EVENT_PUBLISHED:
        VERBOSE("dataset %s published to local server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);
        //handle each published dataset separately
        if(0 == strcmp(dataset->name, "MyInt1"))
        {
            // UDINT *myint1 = (UDINT *)dataset->data;
        }
        else if(0 == strcmp(dataset->name, "MyInt3"))
        {
            // USINT *myint3 = (USINT *)dataset->data;
        }
        break;

    case EXOS_DATASET_EVENT_DELIVERED:
        VERBOSE("dataset %s delivered to remote server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);
        //handle each published dataset separately
        if(0 == strcmp(dataset->name, "MyInt1"))
        {
            // UDINT *myint1 = (UDINT *)dataset->data;
        }
        else if(0 == strcmp(dataset->name, "MyInt3"))
        {
            // USINT *myint3 = (USINT *)dataset->data;
        }
        break;

    case EXOS_DATASET_EVENT_CONNECTION_CHANGED:
        INFO("dataset %s changed state to %s", dataset->name, exos_get_state_string(dataset->connection_state));

        switch (dataset->connection_state)
        {
        case EXOS_STATE_DISCONNECTED:
            break;
        case EXOS_STATE_CONNECTED:
            //call the dataset changed event to update the dataset when connected
            //datasetEvent(dataset,EXOS_DATASET_UPDATED,info);
            break;
        case EXOS_STATE_OPERATIONAL:
            break;
        case EXOS_STATE_ABORTED:
            ERROR("dataset %s error %d (%s) occured", dataset->name, dataset->error, exos_get_error_string(dataset->error));
            break;
        }
        break;
    }

}

static void datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info)
{
    struct StringAndArrayCyclic *inst = (struct StringAndArrayCyclic *)datamodel->user_context;
    StringAndArrayHandle_t *handle = (StringAndArrayHandle_t *)inst->Handle;

    switch (event_type)
    {
    case EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED:
        INFO("application changed state to %s", exos_get_state_string(datamodel->connection_state));

        inst->Disconnected = 0;
        inst->Connected = 0;
        inst->Operational = 0;
        inst->Aborted = 0;

        switch (datamodel->connection_state)
        {
        case EXOS_STATE_DISCONNECTED:
            inst->Disconnected = 1;
            inst->_state = 255;
            break;
        case EXOS_STATE_CONNECTED:
            inst->Connected = 1;
            break;
        case EXOS_STATE_OPERATIONAL:
            SUCCESS("StringAndArray operational!");
            inst->Operational = 1;
            break;
        case EXOS_STATE_ABORTED:
            ERROR("application error %d (%s) occured", datamodel->error, exos_get_error_string(datamodel->error));
            inst->_state = 255;
            inst->Aborted = 1;
            break;
        }
        break;
    case EXOS_DATAMODEL_EVENT_SYNC_STATE_CHANGED:
        break;

    default:
        break;

    }

}

_BUR_PUBLIC void StringAndArrayInit(struct StringAndArrayInit *inst)
{
    StringAndArrayHandle_t *handle;
    TMP_alloc(sizeof(StringAndArrayHandle_t), (void **)&handle);
    if (NULL == handle)
    {
        inst->Handle = 0;
        return;
    }

    memset(&handle->data, 0, sizeof(handle->data));
    handle->self = handle;

    exos_log_init(&handle->logger, "gStringAndArray_0");

    
    
    exos_datamodel_handle_t *stringandarray = &handle->stringandarray;
    exos_dataset_handle_t *myint1 = &handle->myint1;
    exos_dataset_handle_t *myint3 = &handle->myint3;
    EXOS_ASSERT_OK(exos_datamodel_init(stringandarray, "StringAndArray_0", "gStringAndArray_0"));

    EXOS_ASSERT_OK(exos_dataset_init(myint1, stringandarray, "MyInt1", &handle->data.MyInt1, sizeof(handle->data.MyInt1)));
    EXOS_ASSERT_OK(exos_dataset_init(myint3, stringandarray, "MyInt3", &handle->data.MyInt3, sizeof(handle->data.MyInt3)));
    
    inst->Handle = (UDINT)handle;
}

_BUR_PUBLIC void StringAndArrayCyclic(struct StringAndArrayCyclic *inst)
{
    StringAndArrayHandle_t *handle = (StringAndArrayHandle_t *)inst->Handle;

    inst->Error = false;
    if (NULL == handle || NULL == inst->pStringAndArray)
    {
        inst->Error = true;
        return;
    }
    if ((void *)handle != handle->self)
    {
        inst->Error = true;
        return;
    }

    StringAndArray *data = &handle->data;
    exos_datamodel_handle_t *stringandarray = &handle->stringandarray;
    //the user context of the datamodel points to the StringAndArrayCyclic instance
    stringandarray->user_context = inst; //set it cyclically in case the program using the FUB is retransferred
    stringandarray->user_tag = 0; //user defined
    //handle online download of the library
    if(NULL != stringandarray->datamodel_event_callback && stringandarray->datamodel_event_callback != datamodelEvent)
    {
        stringandarray->datamodel_event_callback = datamodelEvent;
        exos_log_delete(&handle->logger);
        exos_log_init(&handle->logger, "gStringAndArray_0");
    }

    exos_dataset_handle_t *myint1 = &handle->myint1;
    myint1->user_context = NULL; //user defined
    myint1->user_tag = 0; //user defined
    //handle online download of the library
    if(NULL != myint1->dataset_event_callback && myint1->dataset_event_callback != datasetEvent)
    {
        myint1->dataset_event_callback = datasetEvent;
    }

    exos_dataset_handle_t *myint3 = &handle->myint3;
    myint3->user_context = NULL; //user defined
    myint3->user_tag = 0; //user defined
    //handle online download of the library
    if(NULL != myint3->dataset_event_callback && myint3->dataset_event_callback != datasetEvent)
    {
        myint3->dataset_event_callback = datasetEvent;
    }

    //unregister on disable
    if (inst->_state && !inst->Enable)
    {
        inst->_state = 255;
    }

    switch (inst->_state)
    {
    case 0:
        inst->Disconnected = 1;
        inst->Connected = 0;
        inst->Operational = 0;
        inst->Aborted = 0;

        if (inst->Enable)
        {
            inst->_state = 10;
        }
        break;

    case 10:
        inst->_state = 100;

        SUCCESS("starting StringAndArray application..");

        //connect the datamodel, then the datasets
        EXOS_ASSERT_OK(exos_datamodel_connect_stringandarray(stringandarray, datamodelEvent));
        EXOS_ASSERT_OK(exos_dataset_connect(myint1, EXOS_DATASET_PUBLISH, datasetEvent));
        EXOS_ASSERT_OK(exos_dataset_connect(myint3, EXOS_DATASET_PUBLISH + EXOS_DATASET_SUBSCRIBE, datasetEvent));

        inst->Active = true;
        break;

    case 100:
    case 101:
        if (inst->Start)
        {
            if (inst->_state == 100)
            {
                EXOS_ASSERT_OK(exos_datamodel_set_operational(stringandarray));
                inst->_state = 101;
            }
        }
        else
        {
            inst->_state = 100;
        }

        EXOS_ASSERT_OK(exos_datamodel_process(stringandarray));
        //put your cyclic code here!

        //publish the myint1 dataset as soon as there are changes
        if (inst->pStringAndArray->MyInt1 != data->MyInt1)
        {
            data->MyInt1 = inst->pStringAndArray->MyInt1;
            exos_dataset_publish(myint1);
        }
        //publish the myint3 dataset as soon as there are changes
        if (0 != memcmp(&inst->pStringAndArray->MyInt3, &data->MyInt3, sizeof(data->MyInt3)))
        {
            memcpy(&data->MyInt3, &inst->pStringAndArray->MyInt3, sizeof(data->MyInt3));
            exos_dataset_publish(myint3);
        }

        break;

    case 255:
        //disconnect the datamodel
        EXOS_ASSERT_OK(exos_datamodel_disconnect(stringandarray));

        inst->Active = false;
        inst->_state = 254;
        //no break

    case 254:
        if (!inst->Enable)
            inst->_state = 0;
        break;
    }

    exos_log_process(&handle->logger);

}

_BUR_PUBLIC void StringAndArrayExit(struct StringAndArrayExit *inst)
{
    StringAndArrayHandle_t *handle = (StringAndArrayHandle_t *)inst->Handle;

    if (NULL == handle)
    {
        ERROR("StringAndArrayExit: NULL handle, cannot delete resources");
        return;
    }
    if ((void *)handle != handle->self)
    {
        ERROR("StringAndArrayExit: invalid handle, cannot delete resources");
        return;
    }

    exos_datamodel_handle_t *stringandarray = &handle->stringandarray;

    EXOS_ASSERT_OK(exos_datamodel_delete(stringandarray));

    //finish with deleting the log
    exos_log_delete(&handle->logger);
    //free the allocated handle
    TMP_free(sizeof(StringAndArrayHandle_t), (void *)handle);
}

