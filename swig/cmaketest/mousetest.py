
import sys
import time

sys.path.insert(1, 'build')
import libmouse
import threading


# PythonOnChangeExecuter class is defined and derived from C++ class OnChangeExecuter in libmouse.i
class PythonOnChangeExecuter(libmouse.OnChangeExecuter):

    # Define Python class 'constructor'
    def __init__(self):
        # Call C++ base class constructor
        libmouse.OnChangeExecuter.__init__(self)

    # Override C++ method: virtual void handle() = 0;
    def handle(self):
        print("  python: OnChangeExecuter handle callback thingy")


print("  python: lets go")

mouse = libmouse.libMouse_init()

print("  python: correct left set 2")
mouse.Buttons.value.LeftButton = True
mouse.Movement.value.X = 2

print("  python: correct left:" + str(mouse.Buttons.value.LeftButton))

print("  python: call mouse.Buttons.publish()")
mouse.Buttons.publish()

# Setup the callback, at the moment its called from libMouse_process in libmouse_swig
print("  python: PythonOnChangeExecuter")
handler = PythonOnChangeExecuter()
print("  python: on_change_connect")
libmouse.on_change_connect(mouse, handler)

try:
    while True:
        print("  python: process do")
        mouse.process()
        print("  python: process done")
        mouse.Buttons.value.RightButton = True
        mouse.Buttons.publish()
        time.sleep(3)
except (KeyboardInterrupt, SystemExit):
    print("\n! Received keyboard interrupt, quitting threads.\n")

print("  python: call mouse.movement()")
mouse.Movement.publish()

mouse.dispose()
