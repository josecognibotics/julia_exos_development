#include <string.h>
#include <stdio.h>
#define EXOS_STATIC_INCLUDE
#include "libmouse.h"

typedef struct libMouseHandle
{
    libMouse_t ext_mouse;
} libMouseHandle_t;

static libMouseHandle_t h_Mouse;

static void libMouse_publish_movement(void)
{
    printf("exos_dataset_publish(&h_Mouse.movement)\n");
}
static void libMouse_publish_buttons(void)
{
    printf("exos_dataset_publish(&h_Mouse.buttons)\n");
}

static void libMouse_connect(void)
{
    //connect the datamodel
    printf("exos_datamodel_connect_mouse(&h_Mouse.mouse)\n");
    
    //connect datasets
    printf("exos_dataset_connect(&(h_Mouse.resetxy), EXOS_DATASET_SUBSCRIBE, libMouse_datasetEvent)\n");
    printf("exos_dataset_connect(&(h_Mouse.movement), EXOS_DATASET_PUBLISH, libMouse_datasetEvent)\n");
    printf("exos_dataset_connect(&(h_Mouse.buttons), EXOS_DATASET_PUBLISH, libMouse_datasetEvent)\n");
}
static void libMouse_disconnect(void)
{
    printf("exos_datamodel_disconnect(&(h_Mouse.mouse))\n");
}

static void libMouse_set_operational(void)
{
    printf("exos_datamodel_set_operational(&(h_Mouse.mouse))\n");
}

static void libMouse_process(void)
{
    printf("exos_datamodel_process(&(h_Mouse.mouse))\n");

    if (NULL != h_Mouse.ext_mouse.ResetXY.on_change)
    {
        printf("h_Mouse.ext_mouse.ResetXY.on_change()\n");
        h_Mouse.ext_mouse.ResetXY.on_change();
    }
}

static void libMouse_dispose(void)
{
    printf("exos_datamodel_delete(&(h_Mouse.mouse))\n");
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
    
    printf("starting Mouse_Linux application..\n");

    printf("exos_datamodel_init(&h_Mouse.mouse, Mouse, Mouse_Linux)\n");

    printf("exos_dataset_init(&h_Mouse.resetxy, &h_Mouse.mouse, ResetXY, &h_Mouse.ext_mouse.ResetXY.value, sizeof(h_Mouse.ext_mouse.ResetXY.value))\n");
    printf("exos_dataset_init(&h_Mouse.movement, &h_Mouse.mouse, Movement, &h_Mouse.ext_mouse.Movement.value, sizeof(h_Mouse.ext_mouse.Movement.value))\n");
    printf("exos_dataset_init(&h_Mouse.buttons, &h_Mouse.mouse, Buttons, &h_Mouse.ext_mouse.Buttons.value, sizeof(h_Mouse.ext_mouse.Buttons.value))\n");
    return &(h_Mouse.ext_mouse);
}

