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
#include "exos_stringandarray.h"
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

obj_handles stringandarray = {};
obj_handles MyInt1 = {};
obj_handles MyString = {};
obj_handles MyInt2 = {};
obj_handles MyIntStruct = {};
obj_handles MyIntStruct1 = {};
obj_handles MyIntStruct2 = {};
obj_handles MyEnum1 = {};

napi_deferred deferred = NULL;
uv_idle_t cyclic_h;

StringAndArray exos_data = {};
exos_datamodel_handle_t stringandarray_datamodel;
exos_dataset_handle_t MyInt1_dataset;
exos_dataset_handle_t MyString_dataset;
exos_dataset_handle_t MyInt2_dataset;
exos_dataset_handle_t MyIntStruct_dataset;
exos_dataset_handle_t MyIntStruct1_dataset;
exos_dataset_handle_t MyIntStruct2_dataset;
exos_dataset_handle_t MyEnum1_dataset;

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
        if(0 == strcmp(dataset->name,"MyInt1"))
        {
            if (MyInt1.onchange_cb != NULL)
            {
                callback_context_t *ctx = create_callback_context(dataset);
                
                napi_acquire_threadsafe_function(MyInt1.onchange_cb);
                napi_call_threadsafe_function(MyInt1.onchange_cb, ctx, napi_tsfn_blocking);
                napi_release_threadsafe_function(MyInt1.onchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name,"MyString"))
        {
            if (MyString.onchange_cb != NULL)
            {
                callback_context_t *ctx = create_callback_context(dataset);
                
                napi_acquire_threadsafe_function(MyString.onchange_cb);
                napi_call_threadsafe_function(MyString.onchange_cb, ctx, napi_tsfn_blocking);
                napi_release_threadsafe_function(MyString.onchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name,"MyInt2"))
        {
            if (MyInt2.onchange_cb != NULL)
            {
                callback_context_t *ctx = create_callback_context(dataset);
                
                napi_acquire_threadsafe_function(MyInt2.onchange_cb);
                napi_call_threadsafe_function(MyInt2.onchange_cb, ctx, napi_tsfn_blocking);
                napi_release_threadsafe_function(MyInt2.onchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name,"MyIntStruct"))
        {
            if (MyIntStruct.onchange_cb != NULL)
            {
                callback_context_t *ctx = create_callback_context(dataset);
                
                napi_acquire_threadsafe_function(MyIntStruct.onchange_cb);
                napi_call_threadsafe_function(MyIntStruct.onchange_cb, ctx, napi_tsfn_blocking);
                napi_release_threadsafe_function(MyIntStruct.onchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name,"MyIntStruct1"))
        {
            if (MyIntStruct1.onchange_cb != NULL)
            {
                callback_context_t *ctx = create_callback_context(dataset);
                
                napi_acquire_threadsafe_function(MyIntStruct1.onchange_cb);
                napi_call_threadsafe_function(MyIntStruct1.onchange_cb, ctx, napi_tsfn_blocking);
                napi_release_threadsafe_function(MyIntStruct1.onchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name,"MyIntStruct2"))
        {
            if (MyIntStruct2.onchange_cb != NULL)
            {
                callback_context_t *ctx = create_callback_context(dataset);
                
                napi_acquire_threadsafe_function(MyIntStruct2.onchange_cb);
                napi_call_threadsafe_function(MyIntStruct2.onchange_cb, ctx, napi_tsfn_blocking);
                napi_release_threadsafe_function(MyIntStruct2.onchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name,"MyEnum1"))
        {
            if (MyEnum1.onchange_cb != NULL)
            {
                callback_context_t *ctx = create_callback_context(dataset);
                
                napi_acquire_threadsafe_function(MyEnum1.onchange_cb);
                napi_call_threadsafe_function(MyEnum1.onchange_cb, ctx, napi_tsfn_blocking);
                napi_release_threadsafe_function(MyEnum1.onchange_cb, napi_tsfn_release);
            }
        }
        break;

    case EXOS_DATASET_EVENT_PUBLISHED:
        VERBOSE("dataset %s published!", dataset->name);
        // fall through

    case EXOS_DATASET_EVENT_DELIVERED:
        if (event_type == EXOS_DATASET_EVENT_DELIVERED) { VERBOSE("dataset %s delivered!", dataset->name); }

        if(0 == strcmp(dataset->name, "MyInt2"))
        {
            //uint8_t *myint2 = (uint8_t *)dataset->data;
        }
        else if(0 == strcmp(dataset->name, "MyIntStruct"))
        {
            //IntStruct_typ *myintstruct = (IntStruct_typ *)dataset->data;
        }
        else if(0 == strcmp(dataset->name, "MyIntStruct1"))
        {
            //IntStruct1_typ *myintstruct1 = (IntStruct1_typ *)dataset->data;
        }
        else if(0 == strcmp(dataset->name, "MyIntStruct2"))
        {
            //IntStruct2_typ *myintstruct2 = (IntStruct2_typ *)dataset->data;
        }
        else if(0 == strcmp(dataset->name, "MyEnum1"))
        {
            //Enum_enum *myenum1 = (Enum_enum *)dataset->data;
        }
        break;

    case EXOS_DATASET_EVENT_CONNECTION_CHANGED:
        VERBOSE("dataset %s connecton changed to: %s", dataset->name, exos_get_state_string(dataset->connection_state));

        if(0 == strcmp(dataset->name, "MyInt1"))
        {
            if (MyInt1.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(MyInt1.connectiononchange_cb);
                napi_call_threadsafe_function(MyInt1.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(MyInt1.connectiononchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name, "MyString"))
        {
            if (MyString.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(MyString.connectiononchange_cb);
                napi_call_threadsafe_function(MyString.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(MyString.connectiononchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name, "MyInt2"))
        {
            if (MyInt2.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(MyInt2.connectiononchange_cb);
                napi_call_threadsafe_function(MyInt2.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(MyInt2.connectiononchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name, "MyIntStruct"))
        {
            if (MyIntStruct.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(MyIntStruct.connectiononchange_cb);
                napi_call_threadsafe_function(MyIntStruct.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(MyIntStruct.connectiononchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name, "MyIntStruct1"))
        {
            if (MyIntStruct1.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(MyIntStruct1.connectiononchange_cb);
                napi_call_threadsafe_function(MyIntStruct1.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(MyIntStruct1.connectiononchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name, "MyIntStruct2"))
        {
            if (MyIntStruct2.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(MyIntStruct2.connectiononchange_cb);
                napi_call_threadsafe_function(MyIntStruct2.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(MyIntStruct2.connectiononchange_cb, napi_tsfn_release);
            }
        }
        else if(0 == strcmp(dataset->name, "MyEnum1"))
        {
            if (MyEnum1.connectiononchange_cb != NULL)
            {
                napi_acquire_threadsafe_function(MyEnum1.connectiononchange_cb);
                napi_call_threadsafe_function(MyEnum1.connectiononchange_cb, exos_get_state_string(dataset->connection_state), napi_tsfn_blocking);
                napi_release_threadsafe_function(MyEnum1.connectiononchange_cb, napi_tsfn_release);
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
        INFO("application StringAndArray changed state to %s", exos_get_state_string(datamodel->connection_state));

        if (stringandarray.connectiononchange_cb != NULL)
        {
            napi_acquire_threadsafe_function(stringandarray.connectiononchange_cb);
            napi_call_threadsafe_function(stringandarray.connectiononchange_cb, exos_get_state_string(datamodel->connection_state), napi_tsfn_blocking);
            napi_release_threadsafe_function(stringandarray.connectiononchange_cb, napi_tsfn_release);
        }

        switch (datamodel->connection_state)
        {
        case EXOS_STATE_DISCONNECTED:
        case EXOS_STATE_CONNECTED:
            break;
        case EXOS_STATE_OPERATIONAL:
            SUCCESS("StringAndArray operational!");
            break;
        case EXOS_STATE_ABORTED:
            ERROR("StringAndArray application error %d (%s) occured", datamodel->error, exos_get_error_string(datamodel->error));
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
static void stringandarray_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value napi_true, napi_false, undefined;

    napi_get_undefined(env, &undefined);

    napi_get_boolean(env, true, &napi_true);
    napi_get_boolean(env, false, &napi_false);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &stringandarray.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - stringandarray.value");

    if (napi_ok != napi_get_reference_value(env, stringandarray.ref, &stringandarray.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - stringandarray ");

    switch (stringandarray_datamodel.connection_state)
    {
    case EXOS_STATE_DISCONNECTED:
        if (napi_ok != napi_set_named_property(env, stringandarray.object_value, "isConnected", napi_false))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - stringandarray");

        if (napi_ok != napi_set_named_property(env, stringandarray.object_value, "isOperational", napi_false))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - stringandarray");

        break;
    case EXOS_STATE_CONNECTED:
        if (napi_ok != napi_set_named_property(env, stringandarray.object_value, "isConnected", napi_true))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - stringandarray");

        if (napi_ok != napi_set_named_property(env, stringandarray.object_value, "isOperational", napi_false))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - stringandarray");

        break;
    case EXOS_STATE_OPERATIONAL:
        if (napi_ok != napi_set_named_property(env, stringandarray.object_value, "isConnected", napi_true))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - stringandarray");

        if (napi_ok != napi_set_named_property(env, stringandarray.object_value, "isOperational", napi_true))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - stringandarray");

        break;
    case EXOS_STATE_ABORTED:
        if (napi_ok != napi_set_named_property(env, stringandarray.object_value, "isConnected", napi_false))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - stringandarray");

        if (napi_ok != napi_set_named_property(env, stringandarray.object_value, "isOperational", napi_false))
            napi_throw_error(env, "EINVAL", "Can't set connectionState property - stringandarray");

        break;
    }

    if (napi_ok != napi_set_named_property(env, stringandarray.object_value, "connectionState", stringandarray.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - stringandarray");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - stringandarray");
}

static void stringandarray_onprocessed_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Error calling onProcessed - StringAndArray");
}

static void MyInt1_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &MyInt1.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - MyInt1.value");

    if (napi_ok != napi_get_reference_value(env, MyInt1.ref, &MyInt1.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - MyInt1 ");

    if (napi_ok != napi_set_named_property(env, MyInt1.object_value, "connectionState", MyInt1.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - MyInt1");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - MyInt1");
}

static void MyString_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &MyString.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - MyString.value");

    if (napi_ok != napi_get_reference_value(env, MyString.ref, &MyString.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - MyString ");

    if (napi_ok != napi_set_named_property(env, MyString.object_value, "connectionState", MyString.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - MyString");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - MyString");
}

static void MyInt2_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &MyInt2.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - MyInt2.value");

    if (napi_ok != napi_get_reference_value(env, MyInt2.ref, &MyInt2.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - MyInt2 ");

    if (napi_ok != napi_set_named_property(env, MyInt2.object_value, "connectionState", MyInt2.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - MyInt2");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - MyInt2");
}

static void MyIntStruct_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &MyIntStruct.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - MyIntStruct.value");

    if (napi_ok != napi_get_reference_value(env, MyIntStruct.ref, &MyIntStruct.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - MyIntStruct ");

    if (napi_ok != napi_set_named_property(env, MyIntStruct.object_value, "connectionState", MyIntStruct.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - MyIntStruct");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - MyIntStruct");
}

static void MyIntStruct1_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &MyIntStruct1.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - MyIntStruct1.value");

    if (napi_ok != napi_get_reference_value(env, MyIntStruct1.ref, &MyIntStruct1.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - MyIntStruct1 ");

    if (napi_ok != napi_set_named_property(env, MyIntStruct1.object_value, "connectionState", MyIntStruct1.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - MyIntStruct1");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - MyIntStruct1");
}

static void MyIntStruct2_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &MyIntStruct2.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - MyIntStruct2.value");

    if (napi_ok != napi_get_reference_value(env, MyIntStruct2.ref, &MyIntStruct2.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - MyIntStruct2 ");

    if (napi_ok != napi_set_named_property(env, MyIntStruct2.object_value, "connectionState", MyIntStruct2.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - MyIntStruct2");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - MyIntStruct2");
}

static void MyEnum1_connonchange_js_cb(napi_env env, napi_value js_cb, void *context, void *data)
{
    const char *string = data;
    napi_value undefined;

    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_create_string_utf8(env, string, strlen(string), &MyEnum1.value))
        napi_throw_error(env, "EINVAL", "Can't create utf8 string from char* - MyEnum1.value");

    if (napi_ok != napi_get_reference_value(env, MyEnum1.ref, &MyEnum1.object_value))
        napi_throw_error(env, "EINVAL", "Can't get reference - MyEnum1 ");

    if (napi_ok != napi_set_named_property(env, MyEnum1.object_value, "connectionState", MyEnum1.value))
        napi_throw_error(env, "EINVAL", "Can't set connectionState property - MyEnum1");

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onConnectionChange callback - MyEnum1");
}

// js value callbacks
static void MyInt1_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *cb_context)
{
    callback_context_t *ctx = (callback_context_t *)cb_context;
    napi_value undefined, netTime, latency;
    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_get_reference_value(env, MyInt1.ref, &MyInt1.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
    }

    if (napi_ok != napi_create_uint32(env, (uint32_t)(*((uint32_t *)ctx->pData)), &MyInt1.value))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
        int32_t _latency = exos_datamodel_get_nettime(&stringandarray_datamodel) - ctx->nettime;
        napi_create_int32(env, ctx->nettime, &netTime);
        napi_create_int32(env, _latency, &latency);
        napi_set_named_property(env, MyInt1.object_value, "nettime", netTime);
        napi_set_named_property(env, MyInt1.object_value, "latency", latency);
    if (napi_ok != napi_set_named_property(env, MyInt1.object_value, "value", MyInt1.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
    }

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onChange callback");

    
    free(ctx);
}

static void MyString_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *cb_context)
{
    callback_context_t *ctx = (callback_context_t *)cb_context;
    napi_value arrayItem;
    napi_value undefined, netTime, latency;
    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_get_reference_value(env, MyString.ref, &MyString.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
    }

napi_create_array(env, &MyString.value);
for (uint32_t i = 0; i < 3; i++)
{
        if (napi_ok != napi_create_string_utf8(env, ((char *)ctx->pData)[i], strlen(((char *)ctx->pData)[i]), &arrayItem))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable char* to utf8 string");
    }

    napi_set_element(env, MyString.value, i, arrayItem);
}
        int32_t _latency = exos_datamodel_get_nettime(&stringandarray_datamodel) - ctx->nettime;
        napi_create_int32(env, ctx->nettime, &netTime);
        napi_create_int32(env, _latency, &latency);
        napi_set_named_property(env, MyString.object_value, "nettime", netTime);
        napi_set_named_property(env, MyString.object_value, "latency", latency);
    if (napi_ok != napi_set_named_property(env, MyString.object_value, "value", MyString.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
    }

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onChange callback");

    
    free(ctx);
}

static void MyInt2_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *cb_context)
{
    callback_context_t *ctx = (callback_context_t *)cb_context;
    napi_value arrayItem;
    napi_value undefined, netTime, latency;
    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_get_reference_value(env, MyInt2.ref, &MyInt2.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
    }

napi_create_array(env, &MyInt2.value);
for (uint32_t i = 0; i < 5; i++)
{
        if (napi_ok != napi_create_uint32(env, (uint32_t)((uint8_t *)ctx->pData)[i], &arrayItem))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_element(env, MyInt2.value, i, arrayItem);
}
        int32_t _latency = exos_datamodel_get_nettime(&stringandarray_datamodel) - ctx->nettime;
        napi_create_int32(env, ctx->nettime, &netTime);
        napi_create_int32(env, _latency, &latency);
        napi_set_named_property(env, MyInt2.object_value, "nettime", netTime);
        napi_set_named_property(env, MyInt2.object_value, "latency", latency);
    if (napi_ok != napi_set_named_property(env, MyInt2.object_value, "value", MyInt2.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
    }

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onChange callback");

    
    free(ctx);
}

static void MyIntStruct_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *cb_context)
{
    callback_context_t *ctx = (callback_context_t *)cb_context;
    napi_value object0, object1;
    napi_value property;
    napi_value arrayItem;
    napi_value undefined, netTime, latency;
    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_get_reference_value(env, MyIntStruct.ref, &MyIntStruct.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
    }

napi_create_array(env, &MyIntStruct.value);
for (uint32_t i = 0; i < 6; i++)
{
    napi_create_object(env, &object0);
        if (napi_ok != napi_create_uint32(env, (uint32_t)((IntStruct_typ *)ctx->pData)[i].MyInt13, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_named_property(env, object0, "MyInt13", property);
napi_create_array(env, &object1);
for (uint32_t j = 0; j < 3; j++)
{
        if (napi_ok != napi_create_uint32(env, (uint32_t)((IntStruct_typ *)ctx->pData)[i].MyInt14[j], &arrayItem))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_element(env, object1, j, arrayItem);
}
    napi_set_named_property(env, object0, "MyInt14", object1);
        if (napi_ok != napi_create_uint32(env, (uint32_t)((IntStruct_typ *)ctx->pData)[i].MyInt133, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_named_property(env, object0, "MyInt133", property);
napi_create_array(env, &object1);
for (uint32_t j = 0; j < 3; j++)
{
        if (napi_ok != napi_create_uint32(env, (uint32_t)((IntStruct_typ *)ctx->pData)[i].MyInt124[j], &arrayItem))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_element(env, object1, j, arrayItem);
}
    napi_set_named_property(env, object0, "MyInt124", object1);
napi_set_element(env, MyIntStruct.value, i, object0);
}
        int32_t _latency = exos_datamodel_get_nettime(&stringandarray_datamodel) - ctx->nettime;
        napi_create_int32(env, ctx->nettime, &netTime);
        napi_create_int32(env, _latency, &latency);
        napi_set_named_property(env, MyIntStruct.object_value, "nettime", netTime);
        napi_set_named_property(env, MyIntStruct.object_value, "latency", latency);
    if (napi_ok != napi_set_named_property(env, MyIntStruct.object_value, "value", MyIntStruct.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
    }

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onChange callback");

    
    free(ctx);
}

static void MyIntStruct1_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *cb_context)
{
    callback_context_t *ctx = (callback_context_t *)cb_context;
    napi_value object0;
    napi_value property;
    napi_value undefined, netTime, latency;
    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_get_reference_value(env, MyIntStruct1.ref, &MyIntStruct1.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
    }

    napi_create_object(env, &object0);
    if (napi_ok != napi_create_uint32(env, (uint32_t)(*((IntStruct1_typ *)ctx->pData)).MyInt13, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_named_property(env, object0, "MyInt13", property);
MyIntStruct1.value = object0;
        int32_t _latency = exos_datamodel_get_nettime(&stringandarray_datamodel) - ctx->nettime;
        napi_create_int32(env, ctx->nettime, &netTime);
        napi_create_int32(env, _latency, &latency);
        napi_set_named_property(env, MyIntStruct1.object_value, "nettime", netTime);
        napi_set_named_property(env, MyIntStruct1.object_value, "latency", latency);
    if (napi_ok != napi_set_named_property(env, MyIntStruct1.object_value, "value", MyIntStruct1.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
    }

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onChange callback");

    
    free(ctx);
}

static void MyIntStruct2_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *cb_context)
{
    callback_context_t *ctx = (callback_context_t *)cb_context;
    napi_value object0, object1;
    napi_value property;
    napi_value arrayItem;
    napi_value undefined, netTime, latency;
    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_get_reference_value(env, MyIntStruct2.ref, &MyIntStruct2.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
    }

    napi_create_object(env, &object0);
    if (napi_ok != napi_create_uint32(env, (uint32_t)(*((IntStruct2_typ *)ctx->pData)).MyInt23, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_named_property(env, object0, "MyInt23", property);
napi_create_array(env, &object1);
for (uint32_t i = 0; i < 4; i++)
{
        if (napi_ok != napi_create_uint32(env, (uint32_t)(*((IntStruct2_typ *)ctx->pData)).MyInt24[i], &arrayItem))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_element(env, object1, i, arrayItem);
}
    napi_set_named_property(env, object0, "MyInt24", object1);
    if (napi_ok != napi_create_uint32(env, (uint32_t)(*((IntStruct2_typ *)ctx->pData)).MyInt25, &property))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit unsigned integer");
    }
    napi_set_named_property(env, object0, "MyInt25", property);
MyIntStruct2.value = object0;
        int32_t _latency = exos_datamodel_get_nettime(&stringandarray_datamodel) - ctx->nettime;
        napi_create_int32(env, ctx->nettime, &netTime);
        napi_create_int32(env, _latency, &latency);
        napi_set_named_property(env, MyIntStruct2.object_value, "nettime", netTime);
        napi_set_named_property(env, MyIntStruct2.object_value, "latency", latency);
    if (napi_ok != napi_set_named_property(env, MyIntStruct2.object_value, "value", MyIntStruct2.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
    }

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onChange callback");

    
    free(ctx);
}

static void MyEnum1_onchange_js_cb(napi_env env, napi_value js_cb, void *context, void *cb_context)
{
    callback_context_t *ctx = (callback_context_t *)cb_context;
    napi_value undefined, netTime, latency;
    napi_get_undefined(env, &undefined);

    if (napi_ok != napi_get_reference_value(env, MyEnum1.ref, &MyEnum1.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
    }

    if (napi_ok != napi_create_int32(env, (int32_t)(*((Enum_enum *)ctx->pData)), &MyEnum1.value))
    {
        napi_throw_error(env, "EINVAL", "Can convert C-variable to 32bit integer");
    }
        int32_t _latency = exos_datamodel_get_nettime(&stringandarray_datamodel) - ctx->nettime;
        napi_create_int32(env, ctx->nettime, &netTime);
        napi_create_int32(env, _latency, &latency);
        napi_set_named_property(env, MyEnum1.object_value, "nettime", netTime);
        napi_set_named_property(env, MyEnum1.object_value, "latency", latency);
    if (napi_ok != napi_set_named_property(env, MyEnum1.object_value, "value", MyEnum1.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
    }

    if (napi_ok != napi_call_function(env, undefined, js_cb, 0, NULL, NULL))
        throw_fatal_exception_callbacks(env, "EINVAL", "Can't call onChange callback");

    
    free(ctx);
}

// js callback inits
static napi_value stringandarray_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "StringAndArray connection change", stringandarray_connonchange_js_cb, &stringandarray.connectiononchange_cb);
}

static napi_value stringandarray_onprocessed_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "StringAndArray onProcessed", stringandarray_onprocessed_js_cb, &stringandarray.onprocessed_cb);
}

static napi_value MyInt1_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyInt1 connection change", MyInt1_connonchange_js_cb, &MyInt1.connectiononchange_cb);
}

static napi_value MyString_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyString connection change", MyString_connonchange_js_cb, &MyString.connectiononchange_cb);
}

static napi_value MyInt2_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyInt2 connection change", MyInt2_connonchange_js_cb, &MyInt2.connectiononchange_cb);
}

static napi_value MyIntStruct_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyIntStruct connection change", MyIntStruct_connonchange_js_cb, &MyIntStruct.connectiononchange_cb);
}

static napi_value MyIntStruct1_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyIntStruct1 connection change", MyIntStruct1_connonchange_js_cb, &MyIntStruct1.connectiononchange_cb);
}

static napi_value MyIntStruct2_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyIntStruct2 connection change", MyIntStruct2_connonchange_js_cb, &MyIntStruct2.connectiononchange_cb);
}

static napi_value MyEnum1_connonchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyEnum1 connection change", MyEnum1_connonchange_js_cb, &MyEnum1.connectiononchange_cb);
}

static napi_value MyInt1_onchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyInt1 dataset change", MyInt1_onchange_js_cb, &MyInt1.onchange_cb);
}

static napi_value MyString_onchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyString dataset change", MyString_onchange_js_cb, &MyString.onchange_cb);
}

static napi_value MyInt2_onchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyInt2 dataset change", MyInt2_onchange_js_cb, &MyInt2.onchange_cb);
}

static napi_value MyIntStruct_onchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyIntStruct dataset change", MyIntStruct_onchange_js_cb, &MyIntStruct.onchange_cb);
}

static napi_value MyIntStruct1_onchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyIntStruct1 dataset change", MyIntStruct1_onchange_js_cb, &MyIntStruct1.onchange_cb);
}

static napi_value MyIntStruct2_onchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyIntStruct2 dataset change", MyIntStruct2_onchange_js_cb, &MyIntStruct2.onchange_cb);
}

static napi_value MyEnum1_onchange_init(napi_env env, napi_callback_info info)
{
    return init_napi_onchange(env, info, "MyEnum1 dataset change", MyEnum1_onchange_js_cb, &MyEnum1.onchange_cb);
}

// publish methods
static napi_value MyInt2_publish_method(napi_env env, napi_callback_info info)
{
    napi_value arrayItem;
    int32_t _value;

    if (napi_ok != napi_get_reference_value(env, MyInt2.ref, &MyInt2.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
        return NULL;
    }

    if (napi_ok != napi_get_named_property(env, MyInt2.object_value, "value", &MyInt2.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
        return NULL;
    }

for (uint32_t i = 0; i < (sizeof(exos_data.MyInt2)/sizeof(exos_data.MyInt2[0])); i++)
{
    napi_get_element(env, MyInt2.value, i, &arrayItem);
    if (napi_ok != napi_get_value_int32(env, arrayItem, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.MyInt2[i] = (uint8_t)_value;
}

    exos_dataset_publish(&MyInt2_dataset);
    return NULL;
}

static napi_value MyIntStruct_publish_method(napi_env env, napi_callback_info info)
{
    napi_value object0, object1;
    napi_value arrayItem;
    int32_t _value;

    if (napi_ok != napi_get_reference_value(env, MyIntStruct.ref, &MyIntStruct.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
        return NULL;
    }

    if (napi_ok != napi_get_named_property(env, MyIntStruct.object_value, "value", &MyIntStruct.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
        return NULL;
    }

for (uint32_t i = 0; i < (sizeof(exos_data.MyIntStruct)/sizeof(exos_data.MyIntStruct[0])); i++)
{
    napi_get_element(env, MyIntStruct.value, i, &object0);

    napi_get_named_property(env, object0, "MyInt13", &object1);
    if (napi_ok != napi_get_value_int32(env, object1, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.MyIntStruct[i].MyInt13 = (uint32_t)_value;
    napi_get_named_property(env, object0, "MyInt14", &object1);
for (uint32_t j = 0; j < (sizeof(exos_data.MyIntStruct[i].MyInt14)/sizeof(exos_data.MyIntStruct[i].MyInt14[0])); j++)
{
    napi_get_element(env, object1, j, &arrayItem);
    if (napi_ok != napi_get_value_int32(env, arrayItem, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.MyIntStruct[i].MyInt14[j] = (uint8_t)_value;
}

    napi_get_named_property(env, object0, "MyInt133", &object1);
    if (napi_ok != napi_get_value_int32(env, object1, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.MyIntStruct[i].MyInt133 = (uint32_t)_value;
    napi_get_named_property(env, object0, "MyInt124", &object1);
for (uint32_t j = 0; j < (sizeof(exos_data.MyIntStruct[i].MyInt124)/sizeof(exos_data.MyIntStruct[i].MyInt124[0])); j++)
{
    napi_get_element(env, object1, j, &arrayItem);
    if (napi_ok != napi_get_value_int32(env, arrayItem, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.MyIntStruct[i].MyInt124[j] = (uint8_t)_value;
}

}

    exos_dataset_publish(&MyIntStruct_dataset);
    return NULL;
}

static napi_value MyIntStruct1_publish_method(napi_env env, napi_callback_info info)
{
    napi_value object0, object1;
    int32_t _value;

    if (napi_ok != napi_get_reference_value(env, MyIntStruct1.ref, &MyIntStruct1.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
        return NULL;
    }

    if (napi_ok != napi_get_named_property(env, MyIntStruct1.object_value, "value", &MyIntStruct1.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
        return NULL;
    }

    object0 = MyIntStruct1.value;
    napi_get_named_property(env, object0, "MyInt13", &object1);
    if (napi_ok != napi_get_value_int32(env, object1, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.MyIntStruct1.MyInt13 = (uint32_t)_value;
    exos_dataset_publish(&MyIntStruct1_dataset);
    return NULL;
}

static napi_value MyIntStruct2_publish_method(napi_env env, napi_callback_info info)
{
    napi_value object0, object1;
    napi_value arrayItem;
    int32_t _value;

    if (napi_ok != napi_get_reference_value(env, MyIntStruct2.ref, &MyIntStruct2.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
        return NULL;
    }

    if (napi_ok != napi_get_named_property(env, MyIntStruct2.object_value, "value", &MyIntStruct2.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
        return NULL;
    }

    object0 = MyIntStruct2.value;
    napi_get_named_property(env, object0, "MyInt23", &object1);
    if (napi_ok != napi_get_value_int32(env, object1, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.MyIntStruct2.MyInt23 = (uint32_t)_value;
    napi_get_named_property(env, object0, "MyInt24", &object1);
for (uint32_t i = 0; i < (sizeof(exos_data.MyIntStruct2.MyInt24)/sizeof(exos_data.MyIntStruct2.MyInt24[0])); i++)
{
    napi_get_element(env, object1, i, &arrayItem);
    if (napi_ok != napi_get_value_int32(env, arrayItem, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.MyIntStruct2.MyInt24[i] = (uint8_t)_value;
}

    napi_get_named_property(env, object0, "MyInt25", &object1);
    if (napi_ok != napi_get_value_int32(env, object1, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.MyIntStruct2.MyInt25 = (uint32_t)_value;
    exos_dataset_publish(&MyIntStruct2_dataset);
    return NULL;
}

static napi_value MyEnum1_publish_method(napi_env env, napi_callback_info info)
{
    int32_t _value;

    if (napi_ok != napi_get_reference_value(env, MyEnum1.ref, &MyEnum1.object_value))
    {
        napi_throw_error(env, "EINVAL", "Can't get reference");
        return NULL;
    }

    if (napi_ok != napi_get_named_property(env, MyEnum1.object_value, "value", &MyEnum1.value))
    {
        napi_throw_error(env, "EINVAL", "Can't get property");
        return NULL;
    }

    if (napi_ok != napi_get_value_int32(env, MyEnum1.value, &_value))
    {
        napi_throw_error(env, "EINVAL", "Expected number convertable to 32bit integer");
        return NULL;
    }
    exos_data.MyEnum1 = (int32_t)_value;

    exos_dataset_publish(&MyEnum1_dataset);
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
        napi_throw_error(env, "EINVAL", "Too few arguments for stringandarray.log.error()");
        return NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for stringandarray.log.error()");
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
        napi_throw_error(env, "EINVAL", "Too few arguments for stringandarray.log.warning()");
        return  NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for stringandarray.log.warning()");
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
        napi_throw_error(env, "EINVAL", "Too few arguments for stringandarray.log.success()");
        return NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for stringandarray.log.success()");
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
        napi_throw_error(env, "EINVAL", "Too few arguments for stringandarray.log.info()");
        return NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for stringandarray.log.info()");
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
        napi_throw_error(env, "EINVAL", "Too few arguments for stringandarray.log.debug()");
        return NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for stringandarray.log.debug()");
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
        napi_throw_error(env, "EINVAL", "Too few arguments for stringandarray.log.verbose()");
        return NULL;
    }

    if (napi_ok != napi_get_value_string_utf8(env, argv[0], log_entry, sizeof(log_entry), &res))
    {
        napi_throw_error(env, "EINVAL", "Expected string as argument for stringandarray.log.verbose()");
        return NULL;
    }

    exos_log_warning(&logger, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, log_entry);
    return NULL;
}

// cleanup/cyclic
static void cleanup_stringandarray(void *env)
{
    uv_idle_stop(&cyclic_h);

    if (EXOS_ERROR_OK != exos_datamodel_delete(&stringandarray_datamodel))
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
    exos_datamodel_process(&stringandarray_datamodel);
    napi_acquire_threadsafe_function(stringandarray.onprocessed_cb);
    napi_call_threadsafe_function(stringandarray.onprocessed_cb, &dummy, napi_tsfn_blocking);
    napi_release_threadsafe_function(stringandarray.onprocessed_cb, napi_tsfn_release);
    exos_log_process(&logger);
}

//read nettime for DataModel
static napi_value get_net_time(napi_env env, napi_callback_info info)
{
    napi_value netTime;

    if (napi_ok == napi_create_int32(env, exos_datamodel_get_nettime(&stringandarray_datamodel), &netTime))
    {
        return netTime;
    }
    else
    {
        return NULL;
    }
}

// init of module, called at "require"
static napi_value init_stringandarray(napi_env env, napi_value exports)
{
    napi_value stringandarray_conn_change, stringandarray_onprocessed, MyInt1_conn_change, MyString_conn_change, MyInt2_conn_change, MyIntStruct_conn_change, MyIntStruct1_conn_change, MyIntStruct2_conn_change, MyEnum1_conn_change;
    napi_value MyInt1_onchange, MyString_onchange, MyInt2_onchange, MyIntStruct_onchange, MyIntStruct1_onchange, MyIntStruct2_onchange, MyEnum1_onchange;
    napi_value MyInt2_publish, MyIntStruct_publish, MyIntStruct1_publish, MyIntStruct2_publish, MyEnum1_publish;
    napi_value MyInt1_value, MyString_value, MyInt2_value, MyIntStruct_value, MyIntStruct1_value, MyIntStruct2_value, MyEnum1_value;

    napi_value dataModel, getNetTime, undefined, def_bool, def_number, def_string;
    napi_value log, logError, logWarning, logSuccess, logInfo, logDebug, logVerbose;
    napi_value object0, object1;

    napi_get_boolean(env, BUR_NAPI_DEFAULT_BOOL_INIT, &def_bool); 
    napi_create_int32(env, BUR_NAPI_DEFAULT_NUM_INIT, &def_number); 
    napi_create_string_utf8(env, BUR_NAPI_DEFAULT_STRING_INIT, strlen(BUR_NAPI_DEFAULT_STRING_INIT), &def_string);
    napi_get_undefined(env, &undefined); 

    // create base objects
    if (napi_ok != napi_create_object(env, &dataModel)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &log)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &stringandarray.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &MyInt1.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &MyString.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &MyInt2.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &MyIntStruct.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &MyIntStruct1.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &MyIntStruct2.value)) 
        return NULL; 

    if (napi_ok != napi_create_object(env, &MyEnum1.value)) 
        return NULL; 

    // build object structures
MyInt1_value = def_number;
    napi_create_function(env, NULL, 0, MyInt1_onchange_init, NULL, &MyInt1_onchange);
    napi_set_named_property(env, MyInt1.value, "onChange", MyInt1_onchange);
    napi_set_named_property(env, MyInt1.value, "nettime", undefined);
    napi_set_named_property(env, MyInt1.value, "latency", undefined);
    napi_set_named_property(env, MyInt1.value, "value", MyInt1_value);
    napi_create_function(env, NULL, 0, MyInt1_connonchange_init, NULL, &MyInt1_conn_change);
    napi_set_named_property(env, MyInt1.value, "onConnectionChange", MyInt1_conn_change);
    napi_set_named_property(env, MyInt1.value, "connectionState", def_string);

napi_create_array(env, &MyString_value);
for (uint32_t i = 0; i < (sizeof(exos_data.MyString)/sizeof(exos_data.MyString[0])); i++)
{
    napi_set_element(env, MyString_value, i, def_string);
}
    napi_create_function(env, NULL, 0, MyString_onchange_init, NULL, &MyString_onchange);
    napi_set_named_property(env, MyString.value, "onChange", MyString_onchange);
    napi_set_named_property(env, MyString.value, "nettime", undefined);
    napi_set_named_property(env, MyString.value, "latency", undefined);
    napi_set_named_property(env, MyString.value, "value", MyString_value);
    napi_create_function(env, NULL, 0, MyString_connonchange_init, NULL, &MyString_conn_change);
    napi_set_named_property(env, MyString.value, "onConnectionChange", MyString_conn_change);
    napi_set_named_property(env, MyString.value, "connectionState", def_string);

napi_create_array(env, &MyInt2_value);
for (uint32_t i = 0; i < (sizeof(exos_data.MyInt2)/sizeof(exos_data.MyInt2[0])); i++)
{
    napi_set_element(env, MyInt2_value, i, def_number);
}
    napi_create_function(env, NULL, 0, MyInt2_onchange_init, NULL, &MyInt2_onchange);
    napi_set_named_property(env, MyInt2.value, "onChange", MyInt2_onchange);
    napi_set_named_property(env, MyInt2.value, "nettime", undefined);
    napi_set_named_property(env, MyInt2.value, "latency", undefined);
    napi_create_function(env, NULL, 0, MyInt2_publish_method, NULL, &MyInt2_publish);
    napi_set_named_property(env, MyInt2.value, "publish", MyInt2_publish);
    napi_set_named_property(env, MyInt2.value, "value", MyInt2_value);
    napi_create_function(env, NULL, 0, MyInt2_connonchange_init, NULL, &MyInt2_conn_change);
    napi_set_named_property(env, MyInt2.value, "onConnectionChange", MyInt2_conn_change);
    napi_set_named_property(env, MyInt2.value, "connectionState", def_string);

napi_create_array(env, &MyIntStruct_value);
for (uint32_t i = 0; i < (sizeof(exos_data.MyIntStruct)/sizeof(exos_data.MyIntStruct[0])); i++)
{
    napi_create_object(env, &object0);
    napi_set_named_property(env, object0, "MyInt13", def_number);
    napi_create_array(env, &object1);
for (uint32_t j = 0; j < (sizeof(exos_data.MyIntStruct[i].MyInt14)/sizeof(exos_data.MyIntStruct[i].MyInt14[0])); j++)
{
    napi_set_element(env, object1, j, def_number);
}
    napi_set_named_property(env, object0, "MyInt14", object1);
    napi_set_named_property(env, object0, "MyInt133", def_number);
    napi_create_array(env, &object1);
for (uint32_t j = 0; j < (sizeof(exos_data.MyIntStruct[i].MyInt124)/sizeof(exos_data.MyIntStruct[i].MyInt124[0])); j++)
{
    napi_set_element(env, object1, j, def_number);
}
    napi_set_named_property(env, object0, "MyInt124", object1);
napi_set_element(env, MyIntStruct_value, i, object0);
}
    napi_create_function(env, NULL, 0, MyIntStruct_onchange_init, NULL, &MyIntStruct_onchange);
    napi_set_named_property(env, MyIntStruct.value, "onChange", MyIntStruct_onchange);
    napi_set_named_property(env, MyIntStruct.value, "nettime", undefined);
    napi_set_named_property(env, MyIntStruct.value, "latency", undefined);
    napi_create_function(env, NULL, 0, MyIntStruct_publish_method, NULL, &MyIntStruct_publish);
    napi_set_named_property(env, MyIntStruct.value, "publish", MyIntStruct_publish);
    napi_set_named_property(env, MyIntStruct.value, "value", MyIntStruct_value);
    napi_create_function(env, NULL, 0, MyIntStruct_connonchange_init, NULL, &MyIntStruct_conn_change);
    napi_set_named_property(env, MyIntStruct.value, "onConnectionChange", MyIntStruct_conn_change);
    napi_set_named_property(env, MyIntStruct.value, "connectionState", def_string);

    napi_create_object(env, &object0);
    napi_set_named_property(env, object0, "MyInt13", def_number);
    MyIntStruct1_value = object0;
    napi_create_function(env, NULL, 0, MyIntStruct1_onchange_init, NULL, &MyIntStruct1_onchange);
    napi_set_named_property(env, MyIntStruct1.value, "onChange", MyIntStruct1_onchange);
    napi_set_named_property(env, MyIntStruct1.value, "nettime", undefined);
    napi_set_named_property(env, MyIntStruct1.value, "latency", undefined);
    napi_create_function(env, NULL, 0, MyIntStruct1_publish_method, NULL, &MyIntStruct1_publish);
    napi_set_named_property(env, MyIntStruct1.value, "publish", MyIntStruct1_publish);
    napi_set_named_property(env, MyIntStruct1.value, "value", MyIntStruct1_value);
    napi_create_function(env, NULL, 0, MyIntStruct1_connonchange_init, NULL, &MyIntStruct1_conn_change);
    napi_set_named_property(env, MyIntStruct1.value, "onConnectionChange", MyIntStruct1_conn_change);
    napi_set_named_property(env, MyIntStruct1.value, "connectionState", def_string);

    napi_create_object(env, &object0);
    napi_set_named_property(env, object0, "MyInt23", def_number);
    napi_create_array(env, &object1);
for (uint32_t i = 0; i < (sizeof(exos_data.MyIntStruct2.MyInt24)/sizeof(exos_data.MyIntStruct2.MyInt24[0])); i++)
{
    napi_set_element(env, object1, i, def_number);
}
    napi_set_named_property(env, object0, "MyInt24", object1);
    napi_set_named_property(env, object0, "MyInt25", def_number);
    MyIntStruct2_value = object0;
    napi_create_function(env, NULL, 0, MyIntStruct2_onchange_init, NULL, &MyIntStruct2_onchange);
    napi_set_named_property(env, MyIntStruct2.value, "onChange", MyIntStruct2_onchange);
    napi_set_named_property(env, MyIntStruct2.value, "nettime", undefined);
    napi_set_named_property(env, MyIntStruct2.value, "latency", undefined);
    napi_create_function(env, NULL, 0, MyIntStruct2_publish_method, NULL, &MyIntStruct2_publish);
    napi_set_named_property(env, MyIntStruct2.value, "publish", MyIntStruct2_publish);
    napi_set_named_property(env, MyIntStruct2.value, "value", MyIntStruct2_value);
    napi_create_function(env, NULL, 0, MyIntStruct2_connonchange_init, NULL, &MyIntStruct2_conn_change);
    napi_set_named_property(env, MyIntStruct2.value, "onConnectionChange", MyIntStruct2_conn_change);
    napi_set_named_property(env, MyIntStruct2.value, "connectionState", def_string);

MyEnum1_value = def_number;
    napi_create_function(env, NULL, 0, MyEnum1_onchange_init, NULL, &MyEnum1_onchange);
    napi_set_named_property(env, MyEnum1.value, "onChange", MyEnum1_onchange);
    napi_set_named_property(env, MyEnum1.value, "nettime", undefined);
    napi_set_named_property(env, MyEnum1.value, "latency", undefined);
    napi_create_function(env, NULL, 0, MyEnum1_publish_method, NULL, &MyEnum1_publish);
    napi_set_named_property(env, MyEnum1.value, "publish", MyEnum1_publish);
    napi_set_named_property(env, MyEnum1.value, "value", MyEnum1_value);
    napi_create_function(env, NULL, 0, MyEnum1_connonchange_init, NULL, &MyEnum1_conn_change);
    napi_set_named_property(env, MyEnum1.value, "onConnectionChange", MyEnum1_conn_change);
    napi_set_named_property(env, MyEnum1.value, "connectionState", def_string);

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
    napi_set_named_property(env, dataModel, "MyInt1", MyInt1.value); 
    napi_set_named_property(env, dataModel, "MyString", MyString.value); 
    napi_set_named_property(env, dataModel, "MyInt2", MyInt2.value); 
    napi_set_named_property(env, dataModel, "MyIntStruct", MyIntStruct.value); 
    napi_set_named_property(env, dataModel, "MyIntStruct1", MyIntStruct1.value); 
    napi_set_named_property(env, dataModel, "MyIntStruct2", MyIntStruct2.value); 
    napi_set_named_property(env, dataModel, "MyEnum1", MyEnum1.value); 
    napi_set_named_property(env, stringandarray.value, "datamodel", dataModel); 
    napi_create_function(env, NULL, 0, stringandarray_connonchange_init, NULL, &stringandarray_conn_change); 
    napi_set_named_property(env, stringandarray.value, "onConnectionChange", stringandarray_conn_change); 
    napi_set_named_property(env, stringandarray.value, "connectionState", def_string);
    napi_set_named_property(env, stringandarray.value, "isConnected", def_bool);
    napi_set_named_property(env, stringandarray.value, "isOperational", def_bool);
    napi_create_function(env, NULL, 0, stringandarray_onprocessed_init, NULL, &stringandarray_onprocessed); 
    napi_set_named_property(env, stringandarray.value, "onProcessed", stringandarray_onprocessed); 
    napi_create_function(env, NULL, 0, get_net_time, NULL, &getNetTime);
    napi_set_named_property(env, stringandarray.value, "nettime", getNetTime);
    napi_set_named_property(env, stringandarray.value, "log", log);
    // export application object
    napi_set_named_property(env, exports, "StringAndArray", stringandarray.value); 

    // save references to object as globals for this C-file
    if (napi_ok != napi_create_reference(env, stringandarray.value, stringandarray.ref_count, &stringandarray.ref)) 
    {
                    
        napi_throw_error(env, "EINVAL", "Can't create stringandarray reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, MyInt1.value, MyInt1.ref_count, &MyInt1.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create MyInt1 reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, MyString.value, MyString.ref_count, &MyString.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create MyString reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, MyInt2.value, MyInt2.ref_count, &MyInt2.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create MyInt2 reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, MyIntStruct.value, MyIntStruct.ref_count, &MyIntStruct.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create MyIntStruct reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, MyIntStruct1.value, MyIntStruct1.ref_count, &MyIntStruct1.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create MyIntStruct1 reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, MyIntStruct2.value, MyIntStruct2.ref_count, &MyIntStruct2.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create MyIntStruct2 reference"); 
        return NULL; 
    } 
    if (napi_ok != napi_create_reference(env, MyEnum1.value, MyEnum1.ref_count, &MyEnum1.ref)) 
    {
        napi_throw_error(env, "EINVAL", "Can't create MyEnum1 reference"); 
        return NULL; 
    } 

    // register clean up hook
    if (napi_ok != napi_add_env_cleanup_hook(env, cleanup_stringandarray, env)) 
    {
        napi_throw_error(env, "EINVAL", "Can't register cleanup hook"); 
        return NULL; 
    } 

    // exOS
    // exOS inits
    if (EXOS_ERROR_OK != exos_datamodel_init(&stringandarray_datamodel, "StringAndArray_0", "gStringAndArray_0")) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize StringAndArray"); 
    } 
    stringandarray_datamodel.user_context = NULL; 
    stringandarray_datamodel.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&MyInt1_dataset, &stringandarray_datamodel, "MyInt1", &exos_data.MyInt1, sizeof(exos_data.MyInt1))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize MyInt1"); 
    }
    MyInt1_dataset.user_context = NULL; 
    MyInt1_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&MyString_dataset, &stringandarray_datamodel, "MyString", &exos_data.MyString, sizeof(exos_data.MyString))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize MyString"); 
    }
    MyString_dataset.user_context = NULL; 
    MyString_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&MyInt2_dataset, &stringandarray_datamodel, "MyInt2", &exos_data.MyInt2, sizeof(exos_data.MyInt2))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize MyInt2"); 
    }
    MyInt2_dataset.user_context = NULL; 
    MyInt2_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&MyIntStruct_dataset, &stringandarray_datamodel, "MyIntStruct", &exos_data.MyIntStruct, sizeof(exos_data.MyIntStruct))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize MyIntStruct"); 
    }
    MyIntStruct_dataset.user_context = NULL; 
    MyIntStruct_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&MyIntStruct1_dataset, &stringandarray_datamodel, "MyIntStruct1", &exos_data.MyIntStruct1, sizeof(exos_data.MyIntStruct1))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize MyIntStruct1"); 
    }
    MyIntStruct1_dataset.user_context = NULL; 
    MyIntStruct1_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&MyIntStruct2_dataset, &stringandarray_datamodel, "MyIntStruct2", &exos_data.MyIntStruct2, sizeof(exos_data.MyIntStruct2))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize MyIntStruct2"); 
    }
    MyIntStruct2_dataset.user_context = NULL; 
    MyIntStruct2_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_dataset_init(&MyEnum1_dataset, &stringandarray_datamodel, "MyEnum1", &exos_data.MyEnum1, sizeof(exos_data.MyEnum1))) 
    {
        napi_throw_error(env, "EINVAL", "Can't initialize MyEnum1"); 
    }
    MyEnum1_dataset.user_context = NULL; 
    MyEnum1_dataset.user_tag = 0; 

    if (EXOS_ERROR_OK != exos_log_init(&logger, "StringAndArray_0"))
    {
        napi_throw_error(env, "EINVAL", "Can't register logger for StringAndArray"); 
    } 

    INFO("StringAndArray starting!")
    // exOS register datamodel
    if (EXOS_ERROR_OK != exos_datamodel_connect_stringandarray(&stringandarray_datamodel, datamodelEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect StringAndArray"); 
    } 

    // exOS register datasets
    if (EXOS_ERROR_OK != exos_dataset_connect(&MyInt1_dataset, EXOS_DATASET_SUBSCRIBE, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect MyInt1"); 
    }

    if (EXOS_ERROR_OK != exos_dataset_connect(&MyString_dataset, EXOS_DATASET_SUBSCRIBE, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect MyString"); 
    }

    if (EXOS_ERROR_OK != exos_dataset_connect(&MyInt2_dataset, EXOS_DATASET_SUBSCRIBE + EXOS_DATASET_PUBLISH, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect MyInt2"); 
    }

    if (EXOS_ERROR_OK != exos_dataset_connect(&MyIntStruct_dataset, EXOS_DATASET_SUBSCRIBE + EXOS_DATASET_PUBLISH, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect MyIntStruct"); 
    }

    if (EXOS_ERROR_OK != exos_dataset_connect(&MyIntStruct1_dataset, EXOS_DATASET_SUBSCRIBE + EXOS_DATASET_PUBLISH, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect MyIntStruct1"); 
    }

    if (EXOS_ERROR_OK != exos_dataset_connect(&MyIntStruct2_dataset, EXOS_DATASET_SUBSCRIBE + EXOS_DATASET_PUBLISH, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect MyIntStruct2"); 
    }

    if (EXOS_ERROR_OK != exos_dataset_connect(&MyEnum1_dataset, EXOS_DATASET_SUBSCRIBE + EXOS_DATASET_PUBLISH, datasetEvent)) 
    {
        napi_throw_error(env, "EINVAL", "Can't connect MyEnum1"); 
    }

    // start up module

    uv_idle_init(uv_default_loop(), &cyclic_h); 
    uv_idle_start(&cyclic_h, cyclic); 

    SUCCESS("StringAndArray started!")
    return exports; 
} 

// hook for Node-API
NAPI_MODULE(NODE_GYP_MODULE_NAME, init_stringandarray);
