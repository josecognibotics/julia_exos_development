# Use import and sys.path.insert if this .py file is moved.
# The path should point to the directory containing _libStringAndArray.so
# import sys
# sys.path.insert(1, 'StringAndArray/Linux/build')
import libStringAndArray

"""
libStringAndArray datamodel features:

initialize and setup callback handler:
    stringandarray = libStringAndArray.libStringAndArray_init()
    handler = StringAndArrayEventHandler()
    libStringAndArray.add_event_handler(stringandarray, handler)

main methods:
    stringandarray.connect()
    stringandarray.disconnect()
    stringandarray.process()
    stringandarray.set_operational()
    stringandarray.dispose()
    stringandarray.get_nettime() : (int32_t) get current nettime

def user callbacks in class StringAndArrayEventHandler:
    on_connected
    on_disconnected
    on_operational

boolean values:
    stringandarray.is_connected
    stringandarray.is_operational

logging methods:
    stringandarray.log.error(str)
    stringandarray.log.warning(str)
    stringandarray.log.success(str)
    stringandarray.log.info(str)
    stringandarray.log.debug(str)
    stringandarray.log.verbose(str)

dataset MyInt1:
    StringAndArrayEventHandler:on_change_MyInt1 : void(void) user callback function
    stringandarray.MyInt1.nettime : (int32_t) nettime @ time of publish
    stringandarray.MyInt1.value : (uint32_t)  actual dataset value

dataset MyInt3:
    stringandarray.MyInt3.publish()
    StringAndArrayEventHandler:on_change_MyInt3 : void(void) user callback function
    stringandarray.MyInt3.nettime : (int32_t) nettime @ time of publish
    stringandarray.MyInt3.value : (uint8_t[5])  actual dataset value
"""

class StringAndArrayEventHandler(libStringAndArray.StringAndArrayEventHandler):

    def __init__(self):
        libStringAndArray.StringAndArrayEventHandler.__init__(self)

    def on_connected(self):
        self.stringandarray.log.success("python stringandarray connected!")

    # def on_disconnected(self):
    #     self.stringandarray. ..

    # def on_operational(self):
    #     self.stringandarray. ..

    def on_change_MyInt1(self):
        self.stringandarray.log.verbose("python dataset MyInt1 changed!")
        # self.stringandarray.log.debug("on_change: stringandarray.MyInt1: " + str(self.stringandarray.MyInt1.value))
        
        # Your code here...
    
    def on_change_MyInt3(self):
        self.stringandarray.log.verbose("python dataset MyInt3 changed!")
        # self.stringandarray.log.debug("on_change: stringandarray.MyInt3: Array of uint8_t")
        # for index in range(len(self.stringandarray.MyInt3.value)):
        #     self.stringandarray.log.debug(str(index) + ": " + str(self.stringandarray.MyInt3.value[index]))
        ## alternatively:
        ## for item in self.stringandarray.MyInt3.value:
        ##    self.stringandarray.log.debug("  " + str(item))
        
        # Your code here...
    

stringandarray = libStringAndArray.libStringAndArray_init()

handler = StringAndArrayEventHandler()
libStringAndArray.add_event_handler(stringandarray, handler)

try:
    stringandarray.connect()
    while True:
        stringandarray.process()
        # if stringandarray.is_connected:
            # stringandarray.MyInt3.value[..] = .. 
            # stringandarray.MyInt3.publish()
            
except(KeyboardInterrupt, SystemExit):
    stringandarray.log.success("Application terminated, shutting down")

stringandarray.disconnect()
stringandarray.dispose()

