
import sys
import time

sys.path.insert(1, 'build')
import libmouse
import threading



print("  python: lets go")

mouse = libmouse.libMouse_init()

print("  python: correct left set 2")
mouse.Buttons.value.LeftButton = True
mouse.Movement.value.X = 2

print("  python: correct left:" + str(mouse.Buttons.value.LeftButton))

print("  python: call mouse.publish()")
mouse.Buttons.publish()

try:
    while True:
        mouse.process()
        print("  python: process done, val something")
        mouse.Buttons.value.RightButton = True
        mouse.Buttons.publish()
        time.sleep(3)
except (KeyboardInterrupt, SystemExit):
    print '\n! Received keyboard interrupt, quitting threads.\n'

print("  python: call mouse.movement()")
mouse.Movement.publish()

mouse.dispose()
