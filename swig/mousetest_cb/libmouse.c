#include "libmouse.h"

void libMouse_init(libMouse_t *mouse) {}
void libMouse_process(libMouse_t *mouse)
{
    printf("libmouse.c: libMouse_process\n");

    if (NULL != mouse->libResetXY.on_change)
    {
        printf("libmouse.c: libMouse_process: NULL != mouse->ResetXY.on_change\n");
        mouse->libResetXY.on_change(mouse);
    }
}
void libMouse_exit(libMouse_t *mouse) {}

void on_change_connect(libMouse_t *mouse, libMouse_onchange_cb callback)
//void on_change_connect(libMouse_t *mouse, void (*libMouse_onchange_cb)(libMouse_t *libMouse))

{
    printf("libmouse.c: on_change_connect: call it once to test\n");
    printf("libmouse.c: on_change_connect: mouse left %u\n", mouse->libButtons.Buttons.LeftButton);
    printf("libmouse.c: on_change_connect: mouse addr %u, callback addrs %u\n", mouse, callback);
    callback(mouse);
    mouse->libResetXY.on_change = callback;
    printf("libmouse.c: on_change_connect: done\n");
}

// cant use int16_t
// #swig/python detected a memory leak of type 'int16_t *', no destructor found.
// #python: left get: <Swig Object of type 'int16_t *' at 0x7f5b8b411a20>
int get_left_button(libMouse_t *mouse)
{
    printf("libmouse.c: get_left_button: mouse left %i\n", mouse->libButtons.Buttons.LeftButton);
    return mouse->libButtons.Buttons.LeftButton;
}
void set_left_button(libMouse_t *mouse, int val)

{
    printf("libmouse.c: set_left_button: mouse left %i, val %i\n", mouse->libButtons.Buttons.LeftButton, val);
    mouse->libButtons.Buttons.LeftButton = val;
}