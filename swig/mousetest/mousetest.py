
import sys
import time

sys.path.insert(1, 'build')
import libmouse


print("  python: lets go")

mouse = libmouse.libMouse_t()

# doesnt work with mouse = libmouse.libMouse_t 
# TypeError: in method 'libMouse_init', argument 1 of type 'libMouse_t *'
libmouse.libMouse_init(mouse)


#print("  python: wrong left set")
#mouse.libButtons.LeftButton = 1
# very good, it fails.

print("  python: correct left set 2")
mouse.libButtons.Buttons.LeftButton = 2

##print("  python: wrong left:")
#print mouse.libButtons.LeftButton
print("  python: correct left:")
print mouse.libButtons.Buttons.LeftButton

#not callable
#print("  python: call libButtons.publish()")
#mouse.libButtons.publish()
#TypeError: 'SwigPyObject' object is not callable

# this ok
print("  python: call libmouse.libMouse_publish()")
libmouse.libMouse_publish()

print("  python: set mouse.publish = libmouse.libMouse_publish")
mouse.publish = libmouse.libMouse_publish
mouse.publish()
#above only works if mouse = libmouse.libMouse_t but that makes the init fails as mouse is not a libMouse_t *

while 1:
    libmouse.libMouse_process(mouse)
    print("  python: process done, val something")


    mouse.libButtons.Buttons.LeftButton = 1
    mouse.libButtons.publish()
    time.sleep(3)
