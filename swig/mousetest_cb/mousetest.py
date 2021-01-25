
import sys
import time

sys.path.insert(1, 'build')
import libmouse


def Changed(sdfsdf):
    print("  python: hello")

print("  python: lets go")

mouse = libmouse.libMouse_t()
# mouse.libButtons.Buttons.Left #  not available. And it shouldnt be as its in exos_mouse.h 

print("  python: left get: " + str(libmouse.get_left_button(mouse)))
print("  python: left set: 5")
libmouse.set_left_button(mouse, 5)
print("  python: left get: " + str(libmouse.get_left_button(mouse)))
#callback = Changed(mouse)
libmouse.on_change_connect(mouse, Changed(mouse))
# Segmentation fault (core dumped)
# callback adress is printed in c and is 0

while 1:
    libmouse.libMouse_process(mouse)
    print("  python: process done, val something")

    #mouse.Buttons.value.LeftButton = 1
    time.sleep(3)
