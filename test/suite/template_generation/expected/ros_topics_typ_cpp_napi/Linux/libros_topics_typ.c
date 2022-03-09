//KNOWN ISSUES
/*
NO checks on values are made. NodeJS har as a javascript language only "numbers" that will be created from SINT, INT etc.
This means that when writing from NodeJS to Automation Runtime, you should take care of that the value actually fits into 
the value assigned.

String arrays will most probably not work, as they are basically char[][]...

Strings are encoded as utf8 strings in NodeJS which means that special chars will reduce length of string. And generate funny 
charachters in Automation Runtime.

PLCs WSTRING is not supported.

Enums defined in typ file will parse to DINT (uint32_t). Enums are not supported in JavaScript.

Generally the generates code is not yet fully and understanably error handled. ex. if (napi_ok != .....

The code generated is NOT yet fully formatted to ones normal liking. There are missing indentations.
*/

#define NAPI_VERSION 6
#include <node_api.h>
#include <stdint.h>
#include <exos_api.h>
#include <exos_log.h>
#include "exos_ros_topics_typ_datamodel.h"
#include <uv.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>

#define SUCCESS(_format_, ...) exos_log_success(&logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);
#define INFO(_format_, ...) exos_log_info(&logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);
#define VERBOSE(_format_, ...) exos_log_debug(&logger, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, _format_, ##__VA_ARGS__);
#define ERROR(_format_, ...) exos_log_error(&logger, _format_, ##__VA_ARGS__);

#define BUR_NAPI_DEFAULT_BOOL_INIT false
#define BUR_NAPI_DEFAULT_NUM_INIT 0
#define BUR_NAPI_DEFAULT_STRING_INIT ""

static exos_log_handle_t logger;

typedef struct
{
    napi_ref ref;
    uint32_t ref_count;
    napi_threadsafe_function onchange_cb;
    napi_threadsafe_function connectiononchange_cb;
    napi_threadsafe_function onprocessed_cb; //used only for datamodel
    napi_value object_value; //volatile placeholder.
    napi_value value;        //volatile placeholder.
} obj_handles;

typedef struct
{
    size_t size;
    int32_t nettime;
    void *pData;
} callback_context_t;

callback_context_t *create_callback_context(exos_dataset_handle_t *dataset)
{
    callback_context_t *context = malloc(sizeof(callback_context_t) + dataset->size);
    context->nettime = dataset->nettime;
    context->size = dataset->size;
    context->pData = (void *)((unsigned long)context + (unsigned long)sizeof(callback_context_t));
    memcpy(context->pData, dataset->data, dataset->size);
    return context;
}

obj_handles ros_topics_typ_datamodel = {};
obj_handles odemetry = {};
obj_handles twist = {};
obj_handles config = {};

napi_deferred deferred = NULL;
uv_idle_t cyclic_h;

ros_topics_typ exos_data = {};
exos_datamodel_handle_t ros_topics_typ_datamodel_datamodel;
exos_dataset_handle_t odemetry_dataset;
exos_dataset_handle_t twist_dataset;
exos_dataset_handle_t config_dataset;

// error handling (Node.js)
static void throw_fatal_exception_callbacks(napi_env env, const char *defaultCode, const char *defaultMessage)
{
    napi_value err;
    bool is_exception = false;

    napi_is_exception_pending(env, &is_exception);

    if (is_exception)
    {
        napi_get_and_clear_last_exception(env, &err);
        napi_fatal_exception(env, err);
    }
    else
    {
        napi_value code, msg;
        napi_create_string_utf8(env, defaultCode, NAPI_AUTO_LENGTH, &code);
        napi_create_string_utf8(env, defaultMessage, NAPI_AUTO_LENGTH, &msg);
        napi_create_error(env, code, msg, &err);
        napi_fatal_exception(env, err);
    }
}

// exOS callbacks
static void datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info)
{
    switch (event_type)
    {
    case EXOS_DATASET_EVENT_UPDATED:
        VERBOSE("dataset %s updated! latency (us):%i", dataset->name, (exos_datamodel_get_nettime(dataset->datamodel) - dataset->nettime));
        if(0 == strcmp(dataset->name,"odemetry"))
        {
            if (odemetry.onchange_cb != NULL)
            {
                callback_context_t *ctx = create_callback_context(dataset);
                
                napi_acquire_threadsafe_function(odemetry.onchange_cb);
                napi_call_threadsafe_function(odemetry.onchange_cb, ctx, napi_tsfn_blocking);
                napi_release_threadsafe_function(odemetry.onchange_cb, napi_tsfn_release);
            }
        }
        break;

    case EXOS_DATASET_EVENT_PUBLISHED:
        VERBOSE("dataset %s published!", dataset->name);
        // fall through

    case EXOS_DATASET_EVENT_DELIVERED:
        if (event_type == EXOS_DATASET_EVENT_DELIVERED) { VERBOSE("dataset %s delivered!", dataset->name); }

        if(0 == strcmp(dataset->name, "twist"))
        {
            //ros_topic_twist_typ *twist_dataset = (ros_topic_twist_typ *)dataset->data;
        }
        else if(0 == strcmp(dataset->name, "config"))
        {
            //ros_config_typ *config_dataset = (ros_config_typ *)dataset->data;
        }
        break;

    case EXOS_DATASET_EVENT_CONNECTION_CHANGED:
        VERBOSE("dataset %s connecton changed to: %s", dataset->name, exos_get_state_string(dataset->connection_state));

        if(0 == strcmp(dataset->name, "odemetry"))
        {
            if (odemetry.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(odemetry.connectiononchange_cb);
                napi_call_threadsafe_function(odemetry.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(odemetry.connectiononchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name, "twist"))
        {
            if (twist.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(twist.connectiononchange_cb);
                napi_call_threadsafe_function(twist.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(twist.connectiononchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name, "config"))
        {
            if (config.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(config.connectiononchange_cb);
                napi_call_threadsafe_function(config.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(config.connectiononchange_cb, napi_tsfn_release);
            }
        }

        switch (dataset->connection_state)
        {
        case EXOS_STATE_DISCONNECTED:
        case EXOS_STATE_CONNECTED:
        case EXOS_STATE_OPERATIONAL:
        case EXOS_STATE_ABORTED:
            break;
        }
        break;
    default:
        break;

    }
}

static void datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info)
{
    switch (event_type)
    {
    case EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED:
        INFO("application ros_topics_typ changed state to %s", exos_get_state_string(datamodel->connection_state));

        if (ros_topics_typ_datamodel.connectiononchange_cb != NULL)
        {
            napi_acquire_threadsafe_function(ros_topics_typ_datamodel.connectiononchange_cb);
            napi_call_threadsafe_function(ros_topics_typ_datamodel.connectiononchange_cb, exos_get_state_string(datamodel->connection_state), napi_tsfn_blocking);
            napi_release_threadsafe_function(ros_topics_typ_datamodel.connectiononchange_cb, napi_tsfn_release);
        }

        switch (datamodel->connection_state)
        {
        case EXOS_STATE_DISCONNECTED:
        case EXOS_STATE_CONNECTED:
            break;
        case EXOS_STATE_OPERATIONAL:
            SUCCESS("ros_topics_typ operational!");
            break;
        case EXOS_STATE_ABORTED:
            ERROR("ros_topics_typ application error %d (%s) occured", datamodel->error, exos_get_error_string(datamodel->error));
            break;
        }
        break;
    case EXOS_DATAMODEL_EVENT_SYNC_STATE_CHANGED:
        break;

    default:
        break;

    }
}

// napi callback setup main function
static napi_value init_napi_onchange(napi_env env, napi_callback_info info, const char *identifier, napi_threadsafe_function_call_js call_js_cb, napi_threadsafe_function *result)
{
    size_t argc = 1;
    napi_value argv[1];

    if (napi_ok != napi_get_cb_info(env, info, &argc, argv, NULL, NULL))
    {
        char msg[100] = {};
        strcpy(msg, "init_napi_onchange() napi_get_cb_info failed - ");
        strcat(msg, identifier);
        napi_throw_error(env, "EINVAL", msg);
        return NULL;
    }

    if (argc < 1)
    {
        napi_throw_error(env, "EINVAL", "Too few arguments");
        return NULL;
    }

    napi_value work_name;
    if (napi_ok != napi_create_string_utf8(env, identifier, NAPI_AUTO_LENGTH, &work_name))
    {
        char msg[100] = {};
        strcpy(msg, "init_napi_onchange() napi_create_string_utf8 failed - ");
        strcat(msg, identifier);
        napi_throw_error(env, "EINVAL", msg);
        return NULL;
    }

    napi_valuetype cb_typ;
    if (napi_ok != napi_typeof(env, argv[0], &cb_typ))
    {
        char msg[100] = {};
        strcpy(msg, "init_napi_onchange() napi_typeof failed - ");
        strcat(msg, identifier);
        napi_throw_error(env, "EINVAL", msg);
        return NULL;
    }

    if (cb_typ == napi_function)
    {
        if (napi_ok != napi_create_threadsafe_function(env, argv[0], NULL, work_name, 0, 1, NULL, NULL, NULL, call_js_cb, result))
        {
            const napi_extended_error_info *info;
            napi_get_last_error_info(env, &info);
            napi_throw_error(env, NULL, info->error_message);
            return NULL;
        }
    }
    return NULL;
}

// js object callbacks
static void ros_topics_typ_datamodel_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value napi_true, napi_false, undefined;

    napi_get_undefined(env, &undefined);

    napi_get_boolean(env, true, &napi_true);
    napi_get_boolean(env, false, &napi_false);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &ros_topics_typ_datamodel.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - ros_topics_typ_datamodel.value");

    if (napi_ok != napi_get_reference_value(env, ros_topics_typ_datamodel.ref, &ros_topics_typ_datamodel.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - ros_topics_typ_datamodel ");

    switch (ros_topics_typ_datamodel_datamodel.connection_state)
    {
    case EXOS_STATE_DISCONNECTED:
        if (napi_ok != napi_set_named_property(env, ros_topics_typ_datamodel.object_value, "isConnected", napi_false))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ros_topics_typ_datamodel");

        if (napi_ok != napi_set_named_property(env, ros_topics_typ_datamodel.object_value, "isOperational", napi_false))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ros_topics_typ_datamodel");

        break;
    case EXOS_STATE_CONNECTED:
        if (napi_ok != napi_set_named_property(env, ros_topics_typ_datamodel.object_value, "isConnected", napi_true))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ros_topics_typ_datamodel");

        if (napi_ok != napi_set_named_property(env, ros_topics_typ_datamodel.object_value, "isOperational", napi_false))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ros_topics_typ_datamodel");

        break;
    case EXOS_STATE_OPERATIONAL:
        if (napi_ok != napi_set_named_property(env, ros_topics_typ_datamodel.object_value, "isConnected", napi_true))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ros_topics_typ_datamodel");

        if (napi_ok != napi_set_named_property(env, ros_topics_typ_datamodel.object_value, "isOperational", napi_true))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ros_topics_typ_datamodel");

        break;
    case EXOS_STATE_ABORTED:
        if (napi_ok != napi_set_named_property(env, ros_topics_typ_datamodel.object_value, "isConnected", napi_false))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ros_topics_typ_datamodel");

        if (napi_ok != napi_set_named_property(env, ros_topics_typ_datamodel.object_value, "isOperational", napi_false))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - ros_topics_typ_datamodel");

        break;
    }

    if (napi_ok != napi_set_named_property(env, ros_topics_typ_datamodel.object_value, "connectionState", ros_topics_typ_datamodel.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - ros_topics_typ_datamodel");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - ros_topics_typ_datamodel");
}

static void ros_topics_typ_datamodel_onprocessed_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Error calling onProcessed - ros_topics_typ");
}

static void odemetry_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &odemetry.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - odemetry.value");

    if (napi_ok != napi_get_reference_value(env, odemetry.ref, &odemetry.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - odemetry ");

    if (napi_ok != napi_set_named_property(env, odemetry.object_value, "connectionState", odemetry.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - odemetry");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - odemetry");
}

static void twist_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &twist.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - twist.value");

    if (napi_ok != napi_get_reference_value(env, twist.ref, &twist.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - twist ");

    if (napi_ok != napi_set_named_property(env, twist.object_value, "connectionState", twist.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - twist");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - twist");
}

static void config_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &config.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - config.value");

    if (napi_ok != napi_get_reference_value(env, config.ref, &config.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - config ");

    if (napi_ok != napi_set_named_property(env, config.object_value, "connectionState", config.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - config");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - config");
}

// js value callbacks
static void odemetry_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *cb_context)
{
    callback_context_t *ctx = (callback_context_t *)cb_context;
    napi_value object0, object1, object2, object3;
    napi_value property;
    napi_value arrayItem;
    napi_value undefined, netTime, latency;
    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_get_reference_value(env, odemetry.ref, &odemetry.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
    }

    napi_create_object(env, &object0);
    napi_create_object(env, &object1);
    napi_create_object(env, &object2);
    napi_create_object(env, &object3);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).pose.pose.position.y, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "y", property);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).pose.pose.position.z, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "z", property);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).pose.pose.position.x, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "x", property);
napi_set_named_property(env, object2, "position", object3);
    napi_create_object(env, &object3);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).pose.pose.orientation.y, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "y", property);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).pose.pose.orientation.z, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "z", property);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).pose.pose.orientation.w, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "w", property);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).pose.pose.orientation.x, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "x", property);
napi_set_named_property(env, object2, "orientation", object3);
napi_set_named_property(env, object1, "pose", object2);
napi_create_array(env, &object2);
for (uint32_t i = 0; i < 64; i++)
{
        if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).pose.covariance[i], &arrayItem))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_element(env, object2, i, arrayItem);
}
    napi_set_named_property(env, object1, "covariance", object2);
napi_set_named_property(env, object0, "pose", object1);
    napi_create_object(env, &object1);
    napi_create_object(env, &object2);
    napi_create_object(env, &object3);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).twist.twist.angular.y, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "y", property);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).twist.twist.angular.z, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "z", property);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).twist.twist.angular.x, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "x", property);
napi_set_named_property(env, object2, "angular", object3);
    napi_create_object(env, &object3);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).twist.twist.linear.y, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "y", property);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).twist.twist.linear.z, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "z", property);
    if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).twist.twist.linear.x, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object3, "x", property);
napi_set_named_property(env, object2, "linear", object3);
napi_set_named_property(env, object1, "twist", object2);
napi_create_array(env, &object2);
for (uint32_t j = 0; j < 64; j++)
{
        if (napi_ok != napi_create_double(env, (double)(*((ros_topic_odemety_typ *)ctx->pData)).twist.covariance[j], &arrayItem))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_element(env, object2, j, arrayItem);
}
    napi_set_named_property(env, object1, "covariance", object2);
napi_set_named_property(env, object0, "twist", object1);
    napi_create_object(env, &object1);
    napi_create_object(env, &object2);
    if (napi_ok != napi_create_uint32(env, (uint32_t)(*((ros_topic_odemety_typ *)ctx->pData)).header.stamp.nsec, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_named_property(env, object2, "nsec", property);
    if (napi_ok != napi_create_uint32(env, (uint32_t)(*((ros_topic_odemety_typ *)ctx->pData)).header.stamp.sec, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_named_property(env, object2, "sec", property);
napi_set_named_property(env, object1, "stamp", object2);
    if (napi_ok != napi_create_uint32(env, (uint32_t)(*((ros_topic_odemety_typ *)ctx->pData)).header.seq, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_named_property(env, object1, "seq", property);
    if (napi_ok != napi_create_string_utf8(env, (*((ros_topic_odemety_typ *)ctx->pData)).header.frame_id, strlen((*((ros_topic_odemety_typ *)ctx->pData)).header.frame_id), &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable char* to utf8 string");
    }

    napi_set_named_property(env, object1, "frame_id", property);
napi_set_named_property(env, object0, "header", object1);
odemetry.value = object0;
        int32_t _latency = exos_datamodel_get_nettime(&ros_topics_typ_datamodel_datamodel) - ctx->nettime;
        napi_create_int32(env, ctx->nettime, &netTime);
        napi_create_int32(env, _latency, &latency);
        napi_set_named_property(env, odemetry.object_value, "nettime", netTime);
        napi_set_named_property(env, odemetry.object_value, "latency", latency);
    if (napi_ok != napi_set_named_property(env, odemetry.object_value, "value", odemetry.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
    }

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onChange callback");

    
    free(ctx);
}

// js callback inits
static napi_value ros_topics_typ_datamodel_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "ros_topics_typ connection change", ros_topics_typ_datamodel_connonchange_js_cb, &ros_topics_typ_datamodel.connectiononchange_cb);
}

static napi_value ros_topics_typ_datamodel_onprocessed_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "ros_topics_typ onProcessed", ros_topics_typ_datamodel_onprocessed_js_cb, &ros_topics_typ_datamodel.onprocessed_cb);
}

static napi_value odemetry_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "odemetry connection change", odemetry_connonchange_js_cb, &odemetry.connectiononchange_cb);
}

static napi_value twist_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "twist connection change", twist_connonchange_js_cb, &twist.connectiononchange_cb);
}

static napi_value config_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "config connection change", config_connonchange_js_cb, &config.connectiononchange_cb);
}

static napi_value odemetry_onchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "odemetry dataset change", odemetry_onchange_js_cb, &odemetry.onchange_cb);
}

// publish methods
static napi_value twist_publish_method(napi_env env, napi_callback_info info)
{
    napi_value object0, object1, object2;
    double __value;

    if (napi_ok != napi_get_reference_value(env, twist.ref, &twist.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
        return NULL;
    }

    if (napi_ok != napi_get_named_property(env, twist.object_value, "value", &twist.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
        return NULL;
    }

    object0 = twist.value;
    napi_get_named_property(env, object0, "angular", &object1);
    napi_get_named_property(env, object1, "y", &object2);
    if (napi_ok != napi_get_value_double(env, object2, &__value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");
        return NULL;
    }
    exos_data.twist.angular.y = (double)__value;
    napi_get_named_property(env, object1, "z", &object2);
    if (napi_ok != napi_get_value_double(env, object2, &__value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");
        return NULL;
    }
    exos_data.twist.angular.z = (double)__value;
    napi_get_named_property(env, object1, "x", &object2);
    if (napi_ok != napi_get_value_double(env, object2, &__value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");
        return NULL;
    }
    exos_data.twist.angular.x = (double)__value;
    napi_get_named_property(env, object0, "linear", &object1);
    napi_get_named_property(env, object1, "y", &object2);
    if (napi_ok != napi_get_value_double(env, object2, &__value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");
        return NULL;
    }
    exos_data.twist.linear.y = (double)__value;
    napi_get_named_property(env, object1, "z", &object2);
    if (napi_ok != napi_get_value_double(env, object2, &__value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");
        return NULL;
    }
    exos_data.twist.linear.z = (double)__value;
    napi_get_named_property(env, object1, "x", &object2);
    if (napi_ok != napi_get_value_double(env, object2, &__value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");
        return NULL;
    }
    exos_data.twist.linear.x = (double)__value;
    exos_dataset_publish(&twist_dataset);
    return NULL;
}

static napi_value config_publish_method(napi_env env, napi_callback_info info)
{
    napi_value object0, object1;
    double __value;

    if (napi_ok != napi_get_reference_value(env, config.ref, &config.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
        return NULL;
    }

    if (napi_ok != napi_get_named_property(env, config.object_value, "value", &config.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
        return NULL;
    }

    object0 = config.value;
    napi_get_named_property(env, object0, "maxSpeed", &object1);
    if (napi_ok != napi_get_value_double(env, object1, &__value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");
        return NULL;
    }
    exos_data.config.maxSpeed = (double)__value;
    napi_get_named_property(env, object0, "minSpeed", &object1);
    if (napi_ok != napi_get_value_double(env, object1, &__value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");
        return NULL;
    }
    exos_data.config.minSpeed = (double)__value;
    napi_get_named_property(env, object0, "baseWidth", &object1);
    if (napi_ok != napi_get_value_double(env, object1, &__value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");
        return NULL;
    }
    exos_data.config.baseWidth = (double)__value;
    exos_dataset_publish(&config_dataset);
    return NULL;
}

//logging functions
static napi_value log_error(napi_env env, napi_callback_info info)
{
    napi_value argv[1];
    size_t argc = 1;
    char log_entry[81] = {};
    size_t res;

    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);

    if (argc < 1)
    {
        napi_throw_error(env, "EINVAL", "Too few arguments for ros_topics_typ_datamodel.log.error()");
        return NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for ros_topics_typ_datamodel.log.error()");
        return NULL;
    }

    exos_log_error(&logger, log_entry);
    return NULL;
}

static napi_value log_warning(napi_env env, napi_callback_info info)
{
    napi_value argv[1];
    size_t argc = 1;
    char log_entry[81] = {};
    size_t res;

    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);

    if (argc < 1)
    {
        napi_throw_error(env, "EINVAL", "Too few arguments for ros_topics_typ_datamodel.log.warning()");
        return  NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for ros_topics_typ_datamodel.log.warning()");
        return NULL;
    }

    exos_log_warning(&logger, EXOS_LOG_TYPE_USER, log_entry);
    return NULL;
}

static napi_value log_success(napi_env env, napi_callback_info info)
{
    napi_value argv[1];
    size_t argc = 1;
    char log_entry[81] = {};
    size_t res;

    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);

    if (argc < 1)
    {
        napi_throw_error(env, "EINVAL", "Too few arguments for ros_topics_typ_datamodel.log.success()");
        return NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for ros_topics_typ_datamodel.log.success()");
        return NULL;
    }

    exos_log_success(&logger, EXOS_LOG_TYPE_USER, log_entry);
    return NULL;
}

static napi_value log_info(napi_env env, napi_callback_info info)
{
    napi_value argv[1];
    size_t argc = 1;
    char log_entry[81] = {};
    size_t res;

    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);

    if (argc < 1)
    {
        napi_throw_error(env, "EINVAL", "Too few arguments for ros_topics_typ_datamodel.log.info()");
        return NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for ros_topics_typ_datamodel.log.info()");
        return NULL;
    }

    exos_log_info(&logger, EXOS_LOG_TYPE_USER, log_entry);
    return NULL;
}

static napi_value log_debug(napi_env env, napi_callback_info info)
{
    napi_value argv[1];
    size_t argc = 1;
    char log_entry[81] = {};
    size_t res;

    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);

    if (argc < 1)
    {
        napi_throw_error(env, "EINVAL", "Too few arguments for ros_topics_typ_datamodel.log.debug()");
        return NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for ros_topics_typ_datamodel.log.debug()");
        return NULL;
    }

    exos_log_debug(&logger, EXOS_LOG_TYPE_USER, log_entry);
    return NULL;
}

static napi_value log_verbose(napi_env env, napi_callback_info info)
{
    napi_value argv[1];
    size_t argc = 1;
    char log_entry[81] = {};
    size_t res;

    napi_get_cb_info(env, info, &argc, argv, NULL, NULL);

    if (argc < 1)
    {
        napi_throw_error(env, "EINVAL", "Too few arguments for ros_topics_typ_datamodel.log.verbose()");
        return NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for ros_topics_typ_datamodel.log.verbose()");
        return NULL;
    }

    exos_log_warning(&logger, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, log_entry);
    return NULL;
}

// cleanup/cyclic
static void cleanup_ros_topics_typ_datamodel(void *env)
{
    uv_idle_stop(&cyclic_h);

    if (EXOS_ERROR_OK != exos_datamodel_delete(&ros_topics_typ_datamodel_datamodel))
    {
        napi_throw_error(env, "EINVAL", "Can't delete datamodel");
    }

    if (EXOS_ERROR_OK != exos_log_delete(&logger))
    {
        napi_throw_error(env, "EINVAL", "Can't delete logger");
    }
}

static void cyclic(uv_idle_t * handle) 
{
    int dummy = 0;
    exos_datamodel_process(&ros_topics_typ_datamodel_datamodel);
    napi_acquire_threadsafe_function(ros_topics_typ_datamodel.onprocessed_cb);
    napi_call_threadsafe_function(ros_topics_typ_datamodel.onprocessed_cb, &dummy, napi_tsfn_blocking);
    napi_release_threadsafe_function(ros_topics_typ_datamodel.onprocessed_cb, napi_tsfn_release);
    exos_log_process(&logger);
}

//read nettime for DataModel
static napi_value get_net_time(napi_env env, napi_callback_info info)
{
    napi_value netTime;

    if (napi_ok == napi_create_int32(env, exos_datamodel_get_nettime(&ros_topics_typ_datamodel_datamodel), &netTime))
    {
        return netTime;
    }
    else
    {
        return NULL;
    }
}

// init of module, called at "require"
static napi_value init_ros_topics_typ_datamodel(napi_env env, napi_value exports)
{
    napi_value ros_topics_typ_datamodel_conn_change, ros_topics_typ_datamodel_onprocessed, odemetry_conn_change, twist_conn_change, config_conn_change;
    napi_value odemetry_onchange;
    napi_value twist_publish, config_publish;
    napi_value odemetry_value, twist_value, config_value;

    napi_value dataModel, getNetTime, undefined, def_bool, def_number, def_string;
    napi_value log, logError, logWarning, logSuccess, logInfo, logDebug, logVerbose;
    napi_value object0, object1, object2, object3;

    napi_get_boolean(env, BUR_NAPI_DEFAULT_BOOL_INIT, &def_bool); 
    napi_create_int32(env, BUR_NAPI_DEFAULT_NUM_INIT, &def_number); 
    napi_create_string_utf8(env, BUR_NAPI_DEFAULT_STRING_INIT, strlen(BUR_NAPI_DEFAULT_STRING_INIT), &def_string);
    napi_get_undefined(env, &undefined); 

    // create base objects
    if (napi_ok != napi_create_object(env, &dataModel)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &log)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &ros_topics_typ_datamodel.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &odemetry.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &twist.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &config.value)) 
        return NULL; 

    // build object structures
    napi_create_object(env, &object0);
        napi_create_object(env, &object1);
        napi_create_object(env, &object2);
        napi_create_object(env, &object3);
    napi_set_named_property(env, object3, "y", def_number);
    napi_set_named_property(env, object3, "z", def_number);
    napi_set_named_property(env, object3, "x", def_number);
    napi_set_named_property(env, object2, "position", object3);
        napi_create_object(env, &object3);
    napi_set_named_property(env, object3, "y", def_number);
    napi_set_named_property(env, object3, "z", def_number);
    napi_set_named_property(env, object3, "w", def_number);
    napi_set_named_property(env, object3, "x", def_number);
    napi_set_named_property(env, object2, "orientation", object3);
    napi_set_named_property(env, object1, "pose", object2);
    napi_create_array(env, &object2);
for (uint32_t i = 0; i < (sizeof(exos_data.odemetry.pose.covariance)/sizeof(exos_data.odemetry.pose.covariance[0])); i++)
{
    napi_set_element(env, object2, i, def_number);
}
    napi_set_named_property(env, object1, "covariance", object2);
    napi_set_named_property(env, object0, "pose", object1);
        napi_create_object(env, &object1);
        napi_create_object(env, &object2);
        napi_create_object(env, &object3);
    napi_set_named_property(env, object3, "y", def_number);
    napi_set_named_property(env, object3, "z", def_number);
    napi_set_named_property(env, object3, "x", def_number);
    napi_set_named_property(env, object2, "angular", object3);
        napi_create_object(env, &object3);
    napi_set_named_property(env, object3, "y", def_number);
    napi_set_named_property(env, object3, "z", def_number);
    napi_set_named_property(env, object3, "x", def_number);
    napi_set_named_property(env, object2, "linear", object3);
    napi_set_named_property(env, object1, "twist", object2);
    napi_create_array(env, &object2);
for (uint32_t j = 0; j < (sizeof(exos_data.odemetry.twist.covariance)/sizeof(exos_data.odemetry.twist.covariance[0])); j++)
{
    napi_set_element(env, object2, j, def_number);
}
    napi_set_named_property(env, object1, "covariance", object2);
    napi_set_named_property(env, object0, "twist", object1);
        napi_create_object(env, &object1);
        napi_create_object(env, &object2);
    napi_set_named_property(env, object2, "nsec", def_number);
    napi_set_named_property(env, object2, "sec", def_number);
    napi_set_named_property(env, object1, "stamp", object2);
    napi_set_named_property(env, object1, "seq", def_number);
    napi_set_named_property(env, object1, "frame_id", def_string);
    napi_set_named_property(env, object0, "header", object1);
    odemetry_value = object0;
    napi_create_function(env, NULL, 0, odemetry_onchange_init, NULL, &odemetry_onchange);
    napi_set_named_property(env, odemetry.value, "onChange", odemetry_onchange);
    napi_set_named_property(env, odemetry.value, "nettime", undefined);
    napi_set_named_property(env, odemetry.value, "latency", undefined);
    napi_set_named_property(env, odemetry.value, "value", odemetry_value);
    napi_create_function(env, NULL, 0, odemetry_connonchange_init, NULL, &odemetry_conn_change);
    napi_set_named_property(env, odemetry.value, "onConnectionChange", odemetry_conn_change);
    napi_set_named_property(env, odemetry.value, "connectionState", def_string);

    napi_create_object(env, &object0);
        napi_create_object(env, &object1);
    napi_set_named_property(env, object1, "y", def_number);
    napi_set_named_property(env, object1, "z", def_number);
    napi_set_named_property(env, object1, "x", def_number);
    napi_set_named_property(env, object0, "angular", object1);
        napi_create_object(env, &object1);
    napi_set_named_property(env, object1, "y", def_number);
    napi_set_named_property(env, object1, "z", def_number);
    napi_set_named_property(env, object1, "x", def_number);
    napi_set_named_property(env, object0, "linear", object1);
    twist_value = object0;
    napi_create_function(env, NULL, 0, twist_publish_method, NULL, &twist_publish);
    napi_set_named_property(env, twist.value, "publish", twist_publish);
    napi_set_named_property(env, twist.value, "value", twist_value);
    napi_create_function(env, NULL, 0, twist_connonchange_init, NULL, &twist_conn_change);
    napi_set_named_property(env, twist.value, "onConnectionChange", twist_conn_change);
    napi_set_named_property(env, twist.value, "connectionState", def_string);

    napi_create_object(env, &object0);
    napi_set_named_property(env, object0, "maxSpeed", def_number);
    napi_set_named_property(env, object0, "minSpeed", def_number);
    napi_set_named_property(env, object0, "baseWidth", def_number);
    config_value = object0;
    napi_create_function(env, NULL, 0, config_publish_method, NULL, &config_publish);
    napi_set_named_property(env, config.value, "publish", config_publish);
    napi_set_named_property(env, config.value, "value", config_value);
    napi_create_function(env, NULL, 0, config_connonchange_init, NULL, &config_conn_change);
    napi_set_named_property(env, config.value, "onConnectionChange", config_conn_change);
    napi_set_named_property(env, config.value, "connectionState", def_string);

    //connect logging functions
    napi_create_function(env, NULL, 0, log_error, NULL, &logError);
    napi_set_named_property(env, log, "error", logError);
    napi_create_function(env, NULL, 0, log_warning, NULL, &logWarning);
    napi_set_named_property(env, log, "warning", logWarning);
    napi_create_function(env, NULL, 0, log_success, NULL, &logSuccess);
    napi_set_named_property(env, log, "success", logSuccess);
    napi_create_function(env, NULL, 0, log_info, NULL, &logInfo);
    napi_set_named_property(env, log, "info", logInfo);
    napi_create_function(env, NULL, 0, log_debug, NULL, &logDebug);
    napi_set_named_property(env, log, "debug", logDebug);
    napi_create_function(env, NULL, 0, log_verbose, NULL, &logVerbose);
    napi_set_named_property(env, log, "verbose", logVerbose);

    // bind dataset objects to datamodel object
    napi_set_named_property(env, dataModel, "odemetry", odemetry.value); 
    napi_set_named_property(env, dataModel, "twist", twist.value); 
    napi_set_named_property(env, dataModel, "config", config.value); 
    napi_set_named_property(env, ros_topics_typ_datamodel.value, "datamodel", dataModel); 
    napi_create_function(env, NULL, 0, ros_topics_typ_datamodel_connonchange_init, NULL, &ros_topics_typ_datamodel_conn_change); 
    napi_set_named_property(env, ros_topics_typ_datamodel.value, "onConnectionChange", ros_topics_typ_datamodel_conn_change); 
    napi_set_named_property(env, ros_topics_typ_datamodel.value, "connectionState", def_string);
    napi_set_named_property(env, ros_topics_typ_datamodel.value, "isConnected", def_bool);
    napi_set_named_property(env, ros_topics_typ_datamodel.value, "isOperational", def_bool);
    napi_create_function(env, NULL, 0, ros_topics_typ_datamodel_onprocessed_init, NULL, &ros_topics_typ_datamodel_onprocessed); 
    napi_set_named_property(env, ros_topics_typ_datamodel.value, "onProcessed", ros_topics_typ_datamodel_onprocessed); 
    napi_create_function(env, NULL, 0, get_net_time, NULL, &getNetTime);
    napi_set_named_property(env, ros_topics_typ_datamodel.value, "nettime", getNetTime);
    napi_set_named_property(env, ros_topics_typ_datamodel.value, "log", log);
    // export application object
    napi_set_named_property(env, exports, "ros_topics_typ", ros_topics_typ_datamodel.value); 

    // save references to object as globals for this C-file
    if (napi_ok != napi_create_reference(env, ros_topics_typ_datamodel.value, ros_topics_typ_datamodel.ref_count, &ros_topics_typ_datamodel.ref)) 
    {
                    
        napi_throw_error(env, "EINVAL", "Can't create ros_topics_typ_datamodel reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, odemetry.value, odemetry.ref_count, &odemetry.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create odemetry reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, twist.value, twist.ref_count, &twist.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create twist reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, config.value, config.ref_count, &config.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create config reference"); 
        return NULL; 
    } 

    // register clean up hook
    if (napi_ok != napi_add_env_cleanup_hook(env, cleanup_ros_topics_typ_datamodel, env)) 
    {
        napi_throw_error(env, "EINVAL", "Can't register cleanup hook"); 
        return NULL; 
    } 

    // exOS
    // exOS inits
    if (EXOS_ERROR_OK != exos_datamodel_init(&ros_topics_typ_datamodel_datamodel, "ros_topics_typ_0", "gros_topics_typ_0")) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize ros_topics_typ"); 
    } 
    ros_topics_typ_datamodel_datamodel.user_context = NULL; 
    ros_topics_typ_datamodel_datamodel.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&odemetry_dataset, &ros_topics_typ_datamodel_datamodel, "odemetry", &exos_data.odemetry, sizeof(exos_data.odemetry))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize odemetry"); 
    }
    odemetry_dataset.user_context = NULL; 
    odemetry_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&twist_dataset, &ros_topics_typ_datamodel_datamodel, "twist", &exos_data.twist, sizeof(exos_data.twist))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize twist"); 
    }
    twist_dataset.user_context = NULL; 
    twist_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&config_dataset, &ros_topics_typ_datamodel_datamodel, "config", &exos_data.config, sizeof(exos_data.config))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize config"); 
    }
    config_dataset.user_context = NULL; 
    config_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_log_init(&logger, "ros_topics_typ_0"))
    {
        napi_throw_error(env, "EINVAL", "Can't register logger for ros_topics_typ"); 
    } 

    INFO("ros_topics_typ starting!")
    // exOS register datamodel
    if (EXOS_ERROR_OK != exos_datamodel_connect_ros_topics_typ_datamodel(&ros_topics_typ_datamodel_datamodel, datamodelEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect ros_topics_typ"); 
    } 

    // exOS register datasets
    if (EXOS_ERROR_OK != exos_dataset_connect(&odemetry_dataset, EXOS_DATASET_SUBSCRIBE, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect odemetry"); 
    }

    if (EXOS_ERROR_OK != exos_dataset_connect(&twist_dataset, EXOS_DATASET_PUBLISH, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect twist"); 
    }

    if (EXOS_ERROR_OK != exos_dataset_connect(&config_dataset, EXOS_DATASET_PUBLISH, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect config"); 
    }

    // start up module

    uv_idle_init(uv_default_loop(), &cyclic_h); 
    uv_idle_start(&cyclic_h, cyclic); 

    SUCCESS("ros_topics_typ started!")
    return exports; 
} 

// hook for Node-API
NAPI_MODULE(NODE_GYP_MODULE_NAME, init_ros_topics_typ_datamodel);
