
import sys
import time

sys.path.insert(1, 'build')
import libmouse


print("  python: lets go")

#mouse = libmouse.libMouse_t()
mouse = libmouse.init_test()

# doesnt work with mouse = libmouse.libMouse_t 
# TypeError: in method 'libMouse_init', argument 1 of type 'libMouse_t *'

# print("  python: mouse.publish adr:" + str(int(mouse.publish)))
# TypeError: int() argument must be a string or a number, not 'NoneType'
libmouse.libMouse_init(mouse)
#print("  python: mouse.publish adr:" + str(int(mouse.publish)))

#print("  python: wrong left set")
#mouse.libButtons.LeftButton = 1
# very good, it fails.

print("  python: correct left set 2")
mouse.libButtons.Buttons.LeftButton = 2

##print("  python: wrong left:")
#print mouse.libButtons.LeftButton
print("  python: correct left:" + str(mouse.libButtons.Buttons.LeftButton))

#not callable
#print("  python: call libButtons.publish()")
#mouse.libButtons.publish()
#TypeError: 'SwigPyObject' object is not callable

# this ok
#print("  python: call libmouse.libMouse_publish()")
#libmouse.libMouse_publish()

print("  python: call mouse.publish()")
mouse.publish()

print("  python: call mouse.libButtons.publish()")
mouse.libButtons.publish()


# this should fail as init_test doesnt set it up
print("  python: call mouse.libMovement.publish()")
mouse.libMovement.publish()
# yup: Segmentation fault (core dumped)


while 1:
    libmouse.libMouse_process(mouse)
    print("  python: process done, val something")


    mouse.libButtons.Buttons.LeftButton = 1
    mouse.libButtons.publish()
    time.sleep(3)
