#include <unistd.h>
#include <string.h>
#include "termination.h"

#define EXOS_ASSERT_LOG &logger
#include "exos_log.h"
#include "exos_stringandarray.h"

#define SUCCESS(_format_, ...) exos_log_success(&logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);
#define INFO(_format_, ...) exos_log_info(&logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);
#define VERBOSE(_format_, ...) exos_log_debug(&logger, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, _format_, ##__VA_ARGS__);
#define ERROR(_format_, ...) exos_log_error(&logger, _format_, ##__VA_ARGS__);

exos_log_handle_t logger;

static void datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info)
{
    switch (event_type)
    {
    case EXOS_DATASET_EVENT_UPDATED:
        VERBOSE("dataset %s updated! latency (us):%i", dataset->name, (exos_datamodel_get_nettime(dataset->datamodel) - dataset->nettime));
        //handle each subscription dataset separately
        if(0 == strcmp(dataset->name,"MyInt1"))
        {
            uint32_t *myint1 = (uint32_t *)dataset->data;
        }
        else if(0 == strcmp(dataset->name,"MyInt3"))
        {
            uint8_t *myint3 = (uint8_t *)dataset->data;
        }
        break;

    case EXOS_DATASET_EVENT_PUBLISHED:
        VERBOSE("dataset %s published to local server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);
        //handle each published dataset separately
        if(0 == strcmp(dataset->name, "MyInt3"))
        {
            uint8_t *myint3 = (uint8_t *)dataset->data;
        }
        break;

    case EXOS_DATASET_EVENT_DELIVERED:
        VERBOSE("dataset %s delivered to remote server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);
        //handle each published dataset separately
        if(0 == strcmp(dataset->name, "MyInt3"))
        {
            uint8_t *myint3 = (uint8_t *)dataset->data;
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
    switch (event_type)
    {
    case EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED:
        INFO("application changed state to %s", exos_get_state_string(datamodel->connection_state));

        switch (datamodel->connection_state)
        {
        case EXOS_STATE_DISCONNECTED:
            break;
        case EXOS_STATE_CONNECTED:
            break;
        case EXOS_STATE_OPERATIONAL:
            SUCCESS("StringAndArray operational!");
            break;
        case EXOS_STATE_ABORTED:
            ERROR("application error %d (%s) occured", datamodel->error, exos_get_error_string(datamodel->error));
            break;
        }
        break;
    case EXOS_DATAMODEL_EVENT_SYNC_STATE_CHANGED:
        break;

    default:
        break;

    }

}

int main()
{
    StringAndArray data;

    exos_datamodel_handle_t stringandarray;

    exos_dataset_handle_t myint1;
    exos_dataset_handle_t myint3;
    
    exos_log_init(&logger, "gStringAndArray_0");

    SUCCESS("starting StringAndArray application..");

    EXOS_ASSERT_OK(exos_datamodel_init(&stringandarray, "StringAndArray_0", "gStringAndArray_0"));

    //set the user_context to access custom data in the callbacks
    stringandarray.user_context = NULL; //user defined
    stringandarray.user_tag = 0; //user defined

    EXOS_ASSERT_OK(exos_dataset_init(&myint1, &stringandarray, "MyInt1", &data.MyInt1, sizeof(data.MyInt1)));
    myint1.user_context = NULL; //user defined
    myint1.user_tag = 0; //user defined

    EXOS_ASSERT_OK(exos_dataset_init(&myint3, &stringandarray, "MyInt3", &data.MyInt3, sizeof(data.MyInt3)));
    myint3.user_context = NULL; //user defined
    myint3.user_tag = 0; //user defined

    //connect the datamodel
    EXOS_ASSERT_OK(exos_datamodel_connect_stringandarray(&stringandarray, datamodelEvent));
    
    //connect datasets
    EXOS_ASSERT_OK(exos_dataset_connect(&myint1, EXOS_DATASET_SUBSCRIBE, datasetEvent));
    EXOS_ASSERT_OK(exos_dataset_connect(&myint3, EXOS_DATASET_PUBLISH + EXOS_DATASET_SUBSCRIBE, datasetEvent));
    
    catch_termination();
    while (true)
    {
        EXOS_ASSERT_OK(exos_datamodel_process(&stringandarray));
        exos_log_process(&logger);

        //put your cyclic code here!

        if (is_terminated())
        {
            SUCCESS("StringAndArray application terminated, closing..");
            break;
        }
    }


    EXOS_ASSERT_OK(exos_datamodel_delete(&stringandarray));

    //finish with deleting the log
    exos_log_delete(&logger);
    return 0;
}
