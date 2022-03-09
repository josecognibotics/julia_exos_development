#include <unistd.h>
#include <string.h>
#include "termination.h"

#define EXOS_ASSERT_LOG &logger
#include "exos_log.h"
#include "exos_ros_topics_typ.h"

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
        if(0 == strcmp(dataset->name,"odemetry"))
        {
            ros_topic_odemety_typ *odemetry_dataset = (ros_topic_odemety_typ *)dataset->data;
        }
        break;

    case EXOS_DATASET_EVENT_PUBLISHED:
        VERBOSE("dataset %s published to local server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);
        //handle each published dataset separately
        if(0 == strcmp(dataset->name, "twist"))
        {
            ros_topic_twist_typ *twist_dataset = (ros_topic_twist_typ *)dataset->data;
        }
        else if(0 == strcmp(dataset->name, "config"))
        {
            ros_config_typ *config_dataset = (ros_config_typ *)dataset->data;
        }
        break;

    case EXOS_DATASET_EVENT_DELIVERED:
        VERBOSE("dataset %s delivered to remote server for distribution! send buffer free:%i", dataset->name, dataset->send_buffer.free);
        //handle each published dataset separately
        if(0 == strcmp(dataset->name, "twist"))
        {
            ros_topic_twist_typ *twist_dataset = (ros_topic_twist_typ *)dataset->data;
        }
        else if(0 == strcmp(dataset->name, "config"))
        {
            ros_config_typ *config_dataset = (ros_config_typ *)dataset->data;
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
            SUCCESS("ros_topics_typ operational!");
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
    ros_topics_typ data;

    exos_datamodel_handle_t ros_topics_typ_datamodel;

    exos_dataset_handle_t odemetry_dataset;
    exos_dataset_handle_t twist_dataset;
    exos_dataset_handle_t config_dataset;
    
    exos_log_init(&logger, "gros_topics_typ_0");

    SUCCESS("starting ros_topics_typ application..");

    EXOS_ASSERT_OK(exos_datamodel_init(&ros_topics_typ_datamodel, "ros_topics_typ_0", "gros_topics_typ_0"));

    //set the user_context to access custom data in the callbacks
    ros_topics_typ_datamodel.user_context = NULL; //user defined
    ros_topics_typ_datamodel.user_tag = 0; //user defined

    EXOS_ASSERT_OK(exos_dataset_init(&odemetry_dataset, &ros_topics_typ_datamodel, "odemetry", &data.odemetry, sizeof(data.odemetry)));
    odemetry_dataset.user_context = NULL; //user defined
    odemetry_dataset.user_tag = 0; //user defined

    EXOS_ASSERT_OK(exos_dataset_init(&twist_dataset, &ros_topics_typ_datamodel, "twist", &data.twist, sizeof(data.twist)));
    twist_dataset.user_context = NULL; //user defined
    twist_dataset.user_tag = 0; //user defined

    EXOS_ASSERT_OK(exos_dataset_init(&config_dataset, &ros_topics_typ_datamodel, "config", &data.config, sizeof(data.config)));
    config_dataset.user_context = NULL; //user defined
    config_dataset.user_tag = 0; //user defined

    //connect the datamodel
    EXOS_ASSERT_OK(exos_datamodel_connect_ros_topics_typ(&ros_topics_typ_datamodel, datamodelEvent));
    
    //connect datasets
    EXOS_ASSERT_OK(exos_dataset_connect(&odemetry_dataset, EXOS_DATASET_SUBSCRIBE, datasetEvent));
    EXOS_ASSERT_OK(exos_dataset_connect(&twist_dataset, EXOS_DATASET_PUBLISH, datasetEvent));
    EXOS_ASSERT_OK(exos_dataset_connect(&config_dataset, EXOS_DATASET_PUBLISH, datasetEvent));
    
    catch_termination();
    while (true)
    {
        EXOS_ASSERT_OK(exos_datamodel_process(&ros_topics_typ_datamodel));
        exos_log_process(&logger);

        //put your cyclic code here!

        if (is_terminated())
        {
            SUCCESS("ros_topics_typ application terminated, closing..");
            break;
        }
    }


    EXOS_ASSERT_OK(exos_datamodel_delete(&ros_topics_typ_datamodel));

    //finish with deleting the log
    exos_log_delete(&logger);
    return 0;
}
