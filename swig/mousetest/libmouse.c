#include "libmouse.h"

void libMouse_publish(void){
    printf("libmouse.c: libMouse_publish\n");
}

void libMouse_init(libMouse_t *mouse)
{
    printf("libmouse.c: libMouse_init\n");

    mouse->libButtons.publish = libMouse_publish;
    mouse->publish = libMouse_publish;
    printf("libmouse.c: libMouse_init: mouse->publish addr %u\n", &mouse->publish);
}

void libMouse_process(libMouse_t *mouse)
{
    printf("libmouse.c: libMouse_process\n");

}
void libMouse_exit(libMouse_t *mouse)
{
    printf("libmouse.c: libMouse_init\n");
}

