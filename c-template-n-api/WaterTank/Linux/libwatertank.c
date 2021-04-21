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
#include "exos_watertank.h"
#include <uv.h>
#include <unistd.h>
#include <string.h>

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

obj_handles watertank = {};
obj_handles EnableHeater = {};
obj_handles HeaterConfig = {};
obj_handles Status = {};
obj_handles Extra = {};

napi_deferred deferred = NULL;
uv_idle_t cyclic_h;

WaterTank exos_data = {};
exos_datamodel_handle_t watertank_datamodel;
exos_dataset_handle_t EnableHeater_dataset;
exos_dataset_handle_t HeaterConfig_dataset;
exos_dataset_handle_t Status_dataset;
exos_dataset_handle_t Extra_dataset;

// exOS callbacks
static void datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info)
{
    switch (event_type)
    {
    case EXOS_DATASET_EVENT_UPDATED:
        VERBOSE("dataset %s updated! latency (us):%i", dataset->name, (exos_datamodel_get_nettime(dataset->datamodel,NULL) - dataset->nettime));
        if(0 == strcmp(dataset->name,"EnableHeater"))
        {
            if (EnableHeater.onchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(EnableHeater.onchange_cb);
                napi_call_threadsafe_function(EnableHeater.onchange_cb, &dataset->nettime, napi_tsfn_blocking);
                napi_release_threadsafe_function(EnableHeater.onchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name,"HeaterConfig"))
        {
            if (HeaterConfig.onchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(HeaterConfig.onchange_cb);
                napi_call_threadsafe_function(HeaterConfig.onchange_cb, &dataset->nettime, napi_tsfn_blocking);
                napi_release_threadsafe_function(HeaterConfig.onchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name,"Extra"))
        {
            if (Extra.onchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(Extra.onchange_cb);
                napi_call_threadsafe_function(Extra.onchange_cb, &dataset->nettime, napi_tsfn_blocking);
                napi_release_threadsafe_function(Extra.onchange_cb, napi_tsfn_release);
            }
        }
        break;

    case EXOS_DATASET_EVENT_PUBLISHED:
        VERBOSE("dataset %s published!", dataset->name);

    case EXOS_DATASET_EVENT_DELIVERED:
        if (event_type == EXOS_DATASET_EVENT_DELIVERED) { VERBOSE("dataset %s delivered!", dataset->name); }

        if(0 == strcmp(dataset->name, "Status"))
        {
            //WaterTankStatus *status = (WaterTankStatus *)dataset->data;
        }
        break;

    case EXOS_DATASET_EVENT_CONNECTION_CHANGED:
        VERBOSE("dataset %s connecton changed to: %s", dataset->name, exos_get_state_string(dataset->connection_state));

        if(0 == strcmp(dataset->name, "EnableHeater"))
        {
            if (EnableHeater.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(EnableHeater.connectiononchange_cb);
                napi_call_threadsafe_function(EnableHeater.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(EnableHeater.connectiononchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name, "HeaterConfig"))
        {
            if (HeaterConfig.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(HeaterConfig.connectiononchange_cb);
                napi_call_threadsafe_function(HeaterConfig.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(HeaterConfig.connectiononchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name, "Status"))
        {
            if (Status.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(Status.connectiononchange_cb);
                napi_call_threadsafe_function(Status.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(Status.connectiononchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name, "Extra"))
        {
            if (Extra.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(Extra.connectiononchange_cb);
                napi_call_threadsafe_function(Extra.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(Extra.connectiononchange_cb, napi_tsfn_release);
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
    }
}

static void datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info)
{
    switch (event_type)
    {
    case EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED:
        INFO("application WaterTank changed state to %s", exos_get_state_string(datamodel->connection_state));

        if (watertank.connectiononchange_cb != NULL)
        {
            napi_acquire_threadsafe_function(watertank.connectiononchange_cb);
            napi_call_threadsafe_function(watertank.connectiononchange_cb, exos_get_state_string(datamodel->connection_state), napi_tsfn_blocking);
            napi_release_threadsafe_function(watertank.connectiononchange_cb, napi_tsfn_release);
        }

        switch (datamodel->connection_state)
        {
        case EXOS_STATE_DISCONNECTED:
        case EXOS_STATE_CONNECTED:
            break;
        case EXOS_STATE_OPERATIONAL:
            SUCCESS("WaterTank operational!");
            break;
        case EXOS_STATE_ABORTED:
            ERROR("WaterTank application error %d (%s) occured", datamodel->error, exos_get_error_string(datamodel->error));
            break;
        }
        break;
    }
}

// napi callback setup main function
napi_value init_napi_onchange(napi_env env, napi_callback_info info, const char *identifier, napi_threadsafe_function_call_js call_js_cb, napi_threadsafe_function *result)
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
static void watertank_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &watertank.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - watertank.value");

    if (napi_ok != napi_get_reference_value(env, watertank.ref, &watertank.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - watertank ");

    if (napi_ok != napi_set_named_property(env, watertank.object_value, "connectionState", watertank.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - watertank");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        napi_throw_error(env, "EINVAL", "Can't call connectionOnChange callback - watertank");
}

static void watertank_onprocessed_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        napi_throw_error(env, "EINVAL", "Can't call onProcessed - watertank");
}

static void EnableHeater_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &EnableHeater.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - EnableHeater.value");

    if (napi_ok != napi_get_reference_value(env, EnableHeater.ref, &EnableHeater.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - EnableHeater ");

    if (napi_ok != napi_set_named_property(env, EnableHeater.object_value, "connectionState", EnableHeater.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - EnableHeater");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        napi_throw_error(env, "EINVAL", "Can't call connectionOnChange callback - EnableHeater");
}

static void HeaterConfig_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &HeaterConfig.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - HeaterConfig.value");

    if (napi_ok != napi_get_reference_value(env, HeaterConfig.ref, &HeaterConfig.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - HeaterConfig ");

    if (napi_ok != napi_set_named_property(env, HeaterConfig.object_value, "connectionState", HeaterConfig.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - HeaterConfig");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        napi_throw_error(env, "EINVAL", "Can't call connectionOnChange callback - HeaterConfig");
}

static void Status_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &Status.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - Status.value");

    if (napi_ok != napi_get_reference_value(env, Status.ref, &Status.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - Status ");

    if (napi_ok != napi_set_named_property(env, Status.object_value, "connectionState", Status.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - Status");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        napi_throw_error(env, "EINVAL", "Can't call connectionOnChange callback - Status");
}

static void Extra_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &Extra.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - Extra.value");

    if (napi_ok != napi_get_reference_value(env, Extra.ref, &Extra.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - Extra ");

    if (napi_ok != napi_set_named_property(env, Extra.object_value, "connectionState", Extra.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - Extra");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        napi_throw_error(env, "EINVAL", "Can't call connectionOnChange callback - Extra");
}

// js value callbacks
static void EnableHeater_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *netTime_exos)
{
    napi_value arrayItem;
    napi_value undefined, netTime, latency;
    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_get_reference_value(env, EnableHeater.ref, &EnableHeater.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
    }

napi_create_array(env, &EnableHeater.value);for (uint32_t i = 0; i < (sizeof(exos_data.EnableHeater)/sizeof(exos_data.EnableHeater[0])); i++)
{
        if (napi_ok != napi_get_boolean(env, exos_data.EnableHeater[i], &arrayItem))
    {
        napi_throw_error(env, "EINVAL", "Can't convert C-var to bool");
    }

    napi_set_element(env, EnableHeater.value, i, arrayItem);
}
        int32_t _latency = exos_datamodel_get_nettime(&watertank_datamodel, NULL) - *(int32_t *)netTime_exos;
        napi_create_int32(env, *(int32_t *)netTime_exos, &netTime);
        napi_create_int32(env, _latency, &latency);
        napi_set_named_property(env, EnableHeater.object_value, "netTime", netTime);
        napi_set_named_property(env, EnableHeater.object_value, "latency", latency);
    if (napi_ok != napi_set_named_property(env, EnableHeater.object_value, "value", EnableHeater.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
    }

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        napi_throw_error(env, "EINVAL", "Can't call onChange callback");

    exos_dataset_publish(&EnableHeater_dataset);
}

static void HeaterConfig_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *netTime_exos)
{
    napi_value object0;
    napi_value property;
    napi_value undefined, netTime, latency;
    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_get_reference_value(env, HeaterConfig.ref, &HeaterConfig.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
    }

napi_create_array(env, &HeaterConfig.value);
for (uint32_t i = 0; i < (sizeof(exos_data.HeaterConfig)/sizeof(exos_data.HeaterConfig[0])); i++)
{
    napi_create_object(env, &object0);
        if (napi_ok != napi_create_double(env, (double)exos_data.HeaterConfig[i].MaxTemperature, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object0, "MaxTemperature", property);
        if (napi_ok != napi_create_double(env, (double)exos_data.HeaterConfig[i].MaxPower, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to double");
    }
    napi_set_named_property(env, object0, "MaxPower", property);
napi_set_element(env, HeaterConfig.value, i, object0);
}
        int32_t _latency = exos_datamodel_get_nettime(&watertank_datamodel, NULL) - *(int32_t *)netTime_exos;
        napi_create_int32(env, *(int32_t *)netTime_exos, &netTime);
        napi_create_int32(env, _latency, &latency);
        napi_set_named_property(env, HeaterConfig.object_value, "netTime", netTime);
        napi_set_named_property(env, HeaterConfig.object_value, "latency", latency);
    if (napi_ok != napi_set_named_property(env, HeaterConfig.object_value, "value", HeaterConfig.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
    }

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        napi_throw_error(env, "EINVAL", "Can't call onChange callback");

    exos_dataset_publish(&HeaterConfig_dataset);
}

static void Extra_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *netTime_exos)
{
    napi_value object0;
    napi_value property;
    napi_value undefined, netTime, latency;
    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_get_reference_value(env, Extra.ref, &Extra.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
    }

    napi_create_object(env, &object0);
    if (napi_ok != napi_create_uint32(env, (uint32_t)exos_data.Extra.Speed, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_named_property(env, object0, "Speed", property);
Extra.value = object0;
        int32_t _latency = exos_datamodel_get_nettime(&watertank_datamodel, NULL) - *(int32_t *)netTime_exos;
        napi_create_int32(env, *(int32_t *)netTime_exos, &netTime);
        napi_create_int32(env, _latency, &latency);
        napi_set_named_property(env, Extra.object_value, "netTime", netTime);
        napi_set_named_property(env, Extra.object_value, "latency", latency);
    if (napi_ok != napi_set_named_property(env, Extra.object_value, "value", Extra.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
    }

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        napi_throw_error(env, "EINVAL", "Can't call onChange callback");

    exos_dataset_publish(&Extra_dataset);
}

// js callback inits
napi_value watertank_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "WaterTank connection change", watertank_connonchange_js_cb, &watertank.connectiononchange_cb);
}

napi_value watertank_onprocessed_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "WaterTank onProcessed", watertank_onprocessed_js_cb, &watertank.onprocessed_cb);
}

napi_value EnableHeater_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "EnableHeater connection change", EnableHeater_connonchange_js_cb, &EnableHeater.connectiononchange_cb);
}

napi_value HeaterConfig_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "HeaterConfig connection change", HeaterConfig_connonchange_js_cb, &HeaterConfig.connectiononchange_cb);
}

napi_value Status_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "Status connection change", Status_connonchange_js_cb, &Status.connectiononchange_cb);
}

napi_value Extra_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "Extra connection change", Extra_connonchange_js_cb, &Extra.connectiononchange_cb);
}

napi_value EnableHeater_onchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "EnableHeater dataset change", EnableHeater_onchange_js_cb, &EnableHeater.onchange_cb);
}

napi_value HeaterConfig_onchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "HeaterConfig dataset change", HeaterConfig_onchange_js_cb, &HeaterConfig.onchange_cb);
}

napi_value Extra_onchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "Extra dataset change", Extra_onchange_js_cb, &Extra.onchange_cb);
}

// publish methods
napi_value Status_publish_method(napi_env env, napi_callback_info info)
{
    napi_value object0, object1, object2;
    int32_t _value;
    double __value;

    if (napi_ok != napi_get_reference_value(env, Status.ref, &Status.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
        return NULL;
    }

    if (napi_ok != napi_get_named_property(env, Status.object_value, "value", &Status.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
        return NULL;
    }

    object0 = Status.value;
    napi_get_named_property(env, object0, "LevelHigh", &object1);
    if (napi_ok != napi_get_value_bool(env, object1, &exos_data.Status.LevelHigh))
    {
        napi_throw_error(env, "EINVAL", "Expected bool");
        return NULL;
    }
    napi_get_named_property(env, object0, "LevelLow", &object1);
    if (napi_ok != napi_get_value_bool(env, object1, &exos_data.Status.LevelLow))
    {
        napi_throw_error(env, "EINVAL", "Expected bool");
        return NULL;
    }
    napi_get_named_property(env, object0, "WaterLevel", &object1);
    if (napi_ok != napi_get_value_int32(env, object1, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.Status.WaterLevel = (uint32_t)_value;
    napi_get_named_property(env, object0, "FillValveDelay", &object1);
    if (napi_ok != napi_get_value_int32(env, object1, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.Status.FillValveDelay = (int32_t)_value;
    napi_get_named_property(env, object0, "Heater", &object1);
    napi_get_named_property(env, object1, "WaterTemperature", &object2);
    if (napi_ok != napi_get_value_double(env, object2, &__value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to double float");
        return NULL;
    }
    exos_data.Status.Heater.WaterTemperature = (float)__value;
    napi_get_named_property(env, object1, "HeatingActive", &object2);
    if (napi_ok != napi_get_value_bool(env, object2, &exos_data.Status.Heater.HeatingActive))
    {
        napi_throw_error(env, "EINVAL", "Expected bool");
        return NULL;
    }
    exos_dataset_publish(&Status_dataset);
    return NULL;
}

// cleanup/cyclic
static void cleanup_watertank(void *env)
{
    uv_idle_stop(&cyclic_h);

    if (EXOS_ERROR_OK != exos_datamodel_delete(&watertank_datamodel))
    {
        napi_throw_error(env, "EINVAL", "Can't delete datamodel");
    }

    if (EXOS_ERROR_OK != exos_log_delete(&logger))
    {
        napi_throw_error(env, "EINVAL", "Can't delete logger");
    }
}

void cyclic(uv_idle_t * handle) 
{
    int dummy = 0;
    exos_datamodel_process(&watertank_datamodel);
    napi_acquire_threadsafe_function(watertank.onprocessed_cb);
    napi_call_threadsafe_function(watertank.onprocessed_cb, &dummy, napi_tsfn_blocking);
    napi_release_threadsafe_function(watertank.onprocessed_cb, napi_tsfn_release);
    exos_log_process(&logger);
}

//read nettime for DataModel
napi_value get_net_time(napi_env env, napi_callback_info info)
{
    napi_value netTime;

    if (napi_ok == napi_create_int32(env, exos_datamodel_get_nettime(&watertank_datamodel, NULL), &netTime))
    {
        return netTime;
    }
    else
    {
        return NULL;
    }
}

// init of module, called at "require"
napi_value init_watertank(napi_env env, napi_value exports)
{
    napi_value watertank_conn_change, watertank_onprocessed, EnableHeater_conn_change, HeaterConfig_conn_change, Status_conn_change, Extra_conn_change;
    napi_value EnableHeater_onchange, HeaterConfig_onchange, Extra_onchange;
    napi_value Status_publish;
    napi_value EnableHeater_value, HeaterConfig_value, Status_value, Extra_value;

    napi_value dataModel, getNetTime, undefined, def_bool, def_number, def_string;
    napi_value object0, object1;

    napi_get_boolean(env, BUR_NAPI_DEFAULT_BOOL_INIT, &def_bool); 
    napi_create_int32(env, BUR_NAPI_DEFAULT_NUM_INIT, &def_number); 
    napi_create_string_utf8(env, BUR_NAPI_DEFAULT_STRING_INIT, strlen(BUR_NAPI_DEFAULT_STRING_INIT), &def_string);
    napi_get_undefined(env, &undefined); 

    // create base objects
    if (napi_ok != napi_create_object(env, &dataModel)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &watertank.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &EnableHeater.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &HeaterConfig.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &Status.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &Extra.value)) 
        return NULL; 

    // build object structures
napi_create_array(env, &EnableHeater_value);
for (uint32_t i = 0; i < (sizeof(exos_data.EnableHeater)/sizeof(exos_data.EnableHeater[0])); i++)
{
    napi_set_element(env, EnableHeater_value, i, def_bool);
}
    napi_create_function(env, NULL, 0, EnableHeater_onchange_init, NULL, &EnableHeater_onchange);
    napi_set_named_property(env, EnableHeater.value, "onChange", EnableHeater_onchange);
    napi_set_named_property(env, EnableHeater.value, "netTime", undefined);
    napi_set_named_property(env, EnableHeater.value, "latency", undefined);
    napi_set_named_property(env, EnableHeater.value, "value", EnableHeater_value);
    napi_create_function(env, NULL, 0, EnableHeater_connonchange_init, NULL, &EnableHeater_conn_change);
    napi_set_named_property(env, EnableHeater.value, "connectionOnChange", EnableHeater_conn_change);
    napi_set_named_property(env, EnableHeater.value, "connectionState", def_string);

napi_create_array(env, &HeaterConfig_value);
for (uint32_t i = 0; i < (sizeof(exos_data.HeaterConfig)/sizeof(exos_data.HeaterConfig[0])); i++)
{
    napi_create_object(env, &object0);
    napi_set_named_property(env, object0, "MaxTemperature", def_number);
    napi_set_named_property(env, object0, "MaxPower", def_number);
napi_set_element(env, HeaterConfig_value, i, object0);
}
    napi_create_function(env, NULL, 0, HeaterConfig_onchange_init, NULL, &HeaterConfig_onchange);
    napi_set_named_property(env, HeaterConfig.value, "onChange", HeaterConfig_onchange);
    napi_set_named_property(env, HeaterConfig.value, "netTime", undefined);
    napi_set_named_property(env, HeaterConfig.value, "latency", undefined);
    napi_set_named_property(env, HeaterConfig.value, "value", HeaterConfig_value);
    napi_create_function(env, NULL, 0, HeaterConfig_connonchange_init, NULL, &HeaterConfig_conn_change);
    napi_set_named_property(env, HeaterConfig.value, "connectionOnChange", HeaterConfig_conn_change);
    napi_set_named_property(env, HeaterConfig.value, "connectionState", def_string);

    napi_create_object(env, &object0);
    napi_set_named_property(env, object0, "LevelHigh", def_bool);
    napi_set_named_property(env, object0, "LevelLow", def_bool);
    napi_set_named_property(env, object0, "WaterLevel", def_number);
    napi_set_named_property(env, object0, "FillValveDelay", def_number);
        napi_create_object(env, &object1);
    napi_set_named_property(env, object1, "WaterTemperature", def_number);
    napi_set_named_property(env, object1, "HeatingActive", def_bool);
    napi_set_named_property(env, object0, "Heater", object1);
    Status_value = object0;
    napi_create_function(env, NULL, 0, Status_publish_method, NULL, &Status_publish);
    napi_set_named_property(env, Status.value, "publish", Status_publish);
    napi_set_named_property(env, Status.value, "value", Status_value);
    napi_create_function(env, NULL, 0, Status_connonchange_init, NULL, &Status_conn_change);
    napi_set_named_property(env, Status.value, "connectionOnChange", Status_conn_change);
    napi_set_named_property(env, Status.value, "connectionState", def_string);

    napi_create_object(env, &object0);
    napi_set_named_property(env, object0, "Speed", def_number);
    Extra_value = object0;
    napi_create_function(env, NULL, 0, Extra_onchange_init, NULL, &Extra_onchange);
    napi_set_named_property(env, Extra.value, "onChange", Extra_onchange);
    napi_set_named_property(env, Extra.value, "netTime", undefined);
    napi_set_named_property(env, Extra.value, "latency", undefined);
    napi_set_named_property(env, Extra.value, "value", Extra_value);
    napi_create_function(env, NULL, 0, Extra_connonchange_init, NULL, &Extra_conn_change);
    napi_set_named_property(env, Extra.value, "connectionOnChange", Extra_conn_change);
    napi_set_named_property(env, Extra.value, "connectionState", def_string);

    // bind dataset objects to datamodel object
    napi_set_named_property(env, dataModel, "EnableHeater", EnableHeater.value); 
    napi_set_named_property(env, dataModel, "HeaterConfig", HeaterConfig.value); 
    napi_set_named_property(env, dataModel, "Status", Status.value); 
    napi_set_named_property(env, dataModel, "Extra", Extra.value); 
    napi_set_named_property(env, watertank.value, "dataModel", dataModel); 
    napi_create_function(env, NULL, 0, watertank_connonchange_init, NULL, &watertank_conn_change); 
    napi_set_named_property(env, watertank.value, "connectionOnChange", watertank_conn_change); 
    napi_set_named_property(env, watertank.value, "connectionState", def_string);
    napi_create_function(env, NULL, 0, watertank_onprocessed_init, NULL, &watertank_onprocessed); 
    napi_set_named_property(env, watertank.value, "onProcessed", watertank_onprocessed); 
    napi_create_function(env, NULL, 0, get_net_time, NULL, &getNetTime);
    napi_set_named_property(env, watertank.value, "netTime", getNetTime);
    // export application object
    napi_set_named_property(env, exports, "WaterTank", watertank.value); 

    // save references to object as globals for this C-file
    if (napi_ok != napi_create_reference(env, watertank.value, watertank.ref_count, &watertank.ref)) 
    {
        
        napi_throw_error(env, "EINVAL", "Can't create watertank reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, EnableHeater.value, EnableHeater.ref_count, &EnableHeater.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create EnableHeater reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, HeaterConfig.value, HeaterConfig.ref_count, &HeaterConfig.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create HeaterConfig reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, Status.value, Status.ref_count, &Status.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create Status reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, Extra.value, Extra.ref_count, &Extra.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create Extra reference"); 
        return NULL; 
    } 

    // register clean up hook
    if (napi_ok != napi_add_env_cleanup_hook(env, cleanup_watertank, env)) 
    {
        napi_throw_error(env, "EINVAL", "Can't register cleanup hook"); 
        return NULL; 
    } 

    // exOS
    // exOS inits
    if (EXOS_ERROR_OK != exos_datamodel_init(&watertank_datamodel, "WaterTank", "WaterTank_NodeJS")) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize WaterTank"); 
    } 
    watertank_datamodel.user_context = NULL; 
    watertank_datamodel.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&EnableHeater_dataset, &watertank_datamodel, "EnableHeater", &exos_data.EnableHeater, sizeof(exos_data.EnableHeater))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize EnableHeater"); 
    }
    EnableHeater_dataset.user_context = NULL; 
    EnableHeater_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&HeaterConfig_dataset, &watertank_datamodel, "HeaterConfig", &exos_data.HeaterConfig, sizeof(exos_data.HeaterConfig))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize HeaterConfig"); 
    }
    HeaterConfig_dataset.user_context = NULL; 
    HeaterConfig_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&Status_dataset, &watertank_datamodel, "Status", &exos_data.Status, sizeof(exos_data.Status))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize Status"); 
    }
    Status_dataset.user_context = NULL; 
    Status_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&Extra_dataset, &watertank_datamodel, "Extra", &exos_data.Extra, sizeof(exos_data.Extra))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize Extra"); 
    }
    Extra_dataset.user_context = NULL; 
    Extra_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_log_init(&logger, "WaterTank_Linux"))
    {
        napi_throw_error(env, "EINVAL", "Can't register logger for WaterTank"); 
    } 

    INFO("WaterTank starting!")
    // exOS register datamodel
    if (EXOS_ERROR_OK != exos_datamodel_connect_watertank(&watertank_datamodel, datamodelEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect WaterTank"); 
    } 

    // exOS register datasets
    if (EXOS_ERROR_OK != exos_dataset_connect(&EnableHeater_dataset, EXOS_DATASET_SUBSCRIBE, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect EnableHeater"); 
    }

    if (EXOS_ERROR_OK != exos_dataset_connect(&HeaterConfig_dataset, EXOS_DATASET_SUBSCRIBE, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect HeaterConfig"); 
    }

    if (EXOS_ERROR_OK != exos_dataset_connect(&Status_dataset, EXOS_DATASET_PUBLISH, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect Status"); 
    }

    if (EXOS_ERROR_OK != exos_dataset_connect(&Extra_dataset, EXOS_DATASET_SUBSCRIBE, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect Extra"); 
    }

    // start up module

    uv_idle_init(uv_default_loop(), &cyclic_h); 
    uv_idle_start(&cyclic_h, cyclic); 

    SUCCESS("WaterTank started!")
    return exports; 
} 

// hook for Node-API
NAPI_MODULE(NODE_GYP_MODULE_NAME, init_watertank);
