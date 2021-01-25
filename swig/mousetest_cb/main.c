#include "libmouse.h"

libMouse_t mouse;

void ResetXYChanged(libMouse_t *libMouse)
{
    mouse.libResetXY.reset;
    printf("reset changed, val=%i\n", libMouse->libButtons.Buttons.LeftButton);

    libMouse->libButtons.Buttons.LeftButton = 0;
}
/*
void mouse_publish(void)
{
    printf("reset publisg, call change\n");
    mouse.libResetXY.on_change(&mouse);
}
*/

int main()
{

    libMouse_init(&mouse);

    //mouse.Movement.publish = mouse_publish;
    mouse.libButtons.Buttons.LeftButton = 1;
    on_change_connect(&mouse, ResetXYChanged);

    printf("main");

    while (1)
    {
        libMouse_process(&mouse);

        printf("process done, val=%i\n", mouse.libButtons.Buttons.LeftButton);

        mouse.libButtons.Buttons.LeftButton = 1;
        //mouse.Movement.publish();
        sleep(3);
    }

    libMouse_exit(&mouse);
}
