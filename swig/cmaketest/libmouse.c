#include <string.h>
#define EXOS_ASSERT_LOG &logger
#include "exos_log.h"
#define EXOS_STATIC_INCLUDE
#include "libmouse.h"

#define SUCCESS(_format_, ...) exos_log_success(&logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);
#define INFO(_format_, ...) exos_log_info(&logger, EXOS_LOG_TYPE_USER, _format_, ##__VA_ARGS__);
#define VERBOSE(_format_, ...) exos_log_debug(&logger, EXOS_LOG_TYPE_USER + EXOS_LOG_TYPE_VERBOSE, _format_, ##__VA_ARGS__);
#define ERROR(_format_, ...) exos_log_error(&logger, _format_, ##__VA_ARGS__);

static exos_log_handle_t logger;

typedef struct libMouseHandle
{
    libMouse_t ext_mouse;
    exos_datamodel_handle_t mouse;

    exos_dataset_handle_t resetxy;
    exos_dataset_handle_t movement;
    exos_dataset_handle_t buttons;
} libMouseHandle_t;

static libMouseHandle_t h_Mouse;

static void libMouse_datasetEvent(exos_dataset_handle_t *dataset, EXOS_DATASET_EVENT_TYPE event_type, void *info)
{
    switch (event_type)
    {
    case EXOS_DATASET_EVENT_UPDATED:
        VERBOSE("dataset %s updated! latency (us):%i", dataset->name, (exos_datamodel_get_nettime(dataset->datamodel,NULL) - dataset->nettime));
        //handle each subscription dataset separately
        if (0 == strcmp(dataset->name,"ResetXY"))
        {
            //trigger the callback if assigned
            if (NULL != h_Mouse.ext_mouse.ResetXY.on_change)
            {
                h_Mouse.ext_mouse.ResetXY.on_change();
            }
        }
        break;

    default:
        break;

    }
}

static void libMouse_datamodelEvent(exos_datamodel_handle_t *datamodel, const EXOS_DATAMODEL_EVENT_TYPE event_type, void *info)
{
    switch (event_type)
    {
    case EXOS_DATAMODEL_EVENT_CONNECTION_CHANGED:
        INFO("application changed state to %s", exos_get_state_string(datamodel->connection_state));

        h_Mouse.ext_mouse.is_connected = false;
        h_Mouse.ext_mouse.is_operational = false;
        switch (datamodel->connection_state)
        {
        case EXOS_STATE_DISCONNECTED:
            if (NULL != h_Mouse.ext_mouse.on_disconnected)
            {
                h_Mouse.ext_mouse.on_disconnected();
            }
            break;
        case EXOS_STATE_CONNECTED:
            h_Mouse.ext_mouse.is_connected = true;
            if (NULL != h_Mouse.ext_mouse.on_connected)
            {
                h_Mouse.ext_mouse.on_connected();
            }
            break;
        case EXOS_STATE_OPERATIONAL:
            h_Mouse.ext_mouse.is_connected = true;
            h_Mouse.ext_mouse.is_operational = true;
            if (NULL != h_Mouse.ext_mouse.on_operational)
            {
                h_Mouse.ext_mouse.on_operational();
            }
            SUCCESS("Mouse operational!");
            break;
        case EXOS_STATE_ABORTED:
            if (NULL != h_Mouse.ext_mouse.on_disconnected)
            {
                h_Mouse.ext_mouse.on_disconnected();
            }
            ERROR("application error %d (%s) occured", datamodel->error, exos_get_error_string(datamodel->error));
            break;
        }
        break;
    }
}

static void libMouse_publish_movement(void)
{
    exos_dataset_publish(&h_Mouse.movement);
}
static void libMouse_publish_buttons(void)
{
    exos_dataset_publish(&h_Mouse.buttons);
}

static void libMouse_connect(void)
{
    //connect the datamodel
    EXOS_ASSERT_OK(exos_datamodel_connect_mouse(&(h_Mouse.mouse), libMouse_datamodelEvent));
    
    //connect datasets
    EXOS_ASSERT_OK(exos_dataset_connect(&(h_Mouse.resetxy), EXOS_DATASET_SUBSCRIBE, libMouse_datasetEvent));
    EXOS_ASSERT_OK(exos_dataset_connect(&(h_Mouse.movement), EXOS_DATASET_PUBLISH, libMouse_datasetEvent));
    EXOS_ASSERT_OK(exos_dataset_connect(&(h_Mouse.buttons), EXOS_DATASET_PUBLISH, libMouse_datasetEvent));
}
static void libMouse_disconnect(void)
{
    EXOS_ASSERT_OK(exos_datamodel_disconnect(&(h_Mouse.mouse)));
}

static void libMouse_set_operational(void)
{
    EXOS_ASSERT_OK(exos_datamodel_set_operational(&(h_Mouse.mouse)));
}

static void libMouse_process(void)
{
    EXOS_ASSERT_OK(exos_datamodel_process(&(h_Mouse.mouse)));
    exos_log_process(&logger);

}

static void libMouse_dispose(void)
{
    EXOS_ASSERT_OK(exos_datamodel_delete(&(h_Mouse.mouse)));
    exos_log_delete(&logger);
}

libMouse_t *libMouse_init(void)
{
    memset(&h_Mouse,0,sizeof(h_Mouse));

    h_Mouse.ext_mouse.Movement.publish = libMouse_publish_movement;
    h_Mouse.ext_mouse.Buttons.publish = libMouse_publish_buttons;
    
    h_Mouse.ext_mouse.connect = libMouse_connect;
    h_Mouse.ext_mouse.disconnect = libMouse_disconnect;
    h_Mouse.ext_mouse.process = libMouse_process;
    h_Mouse.ext_mouse.set_operational = libMouse_set_operational;
    h_Mouse.ext_mouse.dispose = libMouse_dispose;
    
    exos_log_init(&logger, "Mouse_Linux");

    SUCCESS("starting Mouse_Linux application..");

    EXOS_ASSERT_OK(exos_datamodel_init(&h_Mouse.mouse, "Mouse", "Mouse_Linux"));

    //set the user_context to access custom data in the callbacks
    h_Mouse.mouse.user_context = NULL; //not used
    h_Mouse.mouse.user_tag = 0; //not used

    EXOS_ASSERT_OK(exos_dataset_init(&h_Mouse.resetxy, &h_Mouse.mouse, "ResetXY", &h_Mouse.ext_mouse.ResetXY.value, sizeof(h_Mouse.ext_mouse.ResetXY.value)));
    h_Mouse.resetxy.user_context = NULL; //not used
    h_Mouse.resetxy.user_tag = 0; //not used

    EXOS_ASSERT_OK(exos_dataset_init(&h_Mouse.movement, &h_Mouse.mouse, "Movement", &h_Mouse.ext_mouse.Movement.value, sizeof(h_Mouse.ext_mouse.Movement.value)));
    h_Mouse.movement.user_context = NULL; //not used
    h_Mouse.movement.user_tag = 0; //not used

    EXOS_ASSERT_OK(exos_dataset_init(&h_Mouse.buttons, &h_Mouse.mouse, "Buttons", &h_Mouse.ext_mouse.Buttons.value, sizeof(h_Mouse.ext_mouse.Buttons.value)));
    h_Mouse.buttons.user_context = NULL; //not used
    h_Mouse.buttons.user_tag = 0; //not used

    return &(h_Mouse.ext_mouse);
}

