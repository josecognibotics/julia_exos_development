
import sys
import time

sys.path.insert(1, 'build')
import libmouse
import threading


# PythonBinaryOp class is defined and derived from C++ class BinaryOp
class PythonOnChangeExecuter(libmouse.OnChangeExecuter):

    # Define Python class 'constructor'
    def __init__(self):
        # Call C++ base class constructor
        libmouse.OnChangeExecuter.__init__(self)

    # Override C++ method: virtual int handle(int a, int b) = 0;
    def handle(self):
        # Return the product
        print("  python: OnChangeExecuter handle callback thingy")
        #return a * b




def py_callback():
    print('Hello world! Im a py_callback')

def main(callback):
    print('Calling callback if != None')
    if callback != None:
        callback()

print("  python: lets go")

mouse = libmouse.libMouse_init()

print("  python: correct left set 2")
mouse.Buttons.value.LeftButton = True
mouse.Movement.value.X = 2

print("  python: correct left:" + str(mouse.Buttons.value.LeftButton))

print("  python: call mouse.Buttons.publish()")
mouse.Buttons.publish()

#print("  python: on_change_connect")
#libmouse.on_change_connect(mouse, py_callback)

print("  python: PythonOnChangeExecuter")
handler = PythonOnChangeExecuter()
print("  python: on_change_executer_wrapper")
libmouse.on_change_executer_wrapper(mouse,handler)

try:
    while True:
        mouse.process()
        print("  python: process done, val something")
        mouse.Buttons.value.RightButton = True
        print("  python: call mouse.Buttons.publish(), which calls on_change")
        mouse.Buttons.publish()
        #main(py_callback)
        time.sleep(3)
except (KeyboardInterrupt, SystemExit):
    print("\n! Received keyboard interrupt, quitting threads.\n")

print("  python: call mouse.movement()")
mouse.Movement.publish()

mouse.dispose()
