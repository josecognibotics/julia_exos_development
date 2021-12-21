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

dataset MyString:
    StringAndArrayEventHandler:on_change_MyString : void(void) user callback function
    stringandarray.MyString.nettime : (int32_t) nettime @ time of publish
    stringandarray.MyString.value : (char[3][81])  actual dataset value

dataset MyInt2:
    stringandarray.MyInt2.publish()
    StringAndArrayEventHandler:on_change_MyInt2 : void(void) user callback function
    stringandarray.MyInt2.nettime : (int32_t) nettime @ time of publish
    stringandarray.MyInt2.value : (uint8_t[5])  actual dataset value

dataset MyIntStruct:
    stringandarray.MyIntStruct.publish()
    StringAndArrayEventHandler:on_change_MyIntStruct : void(void) user callback function
    stringandarray.MyIntStruct.nettime : (int32_t) nettime @ time of publish
    stringandarray.MyIntStruct.value : (IntStruct_typ[6])  actual dataset values

dataset MyIntStruct1:
    stringandarray.MyIntStruct1.publish()
    StringAndArrayEventHandler:on_change_MyIntStruct1 : void(void) user callback function
    stringandarray.MyIntStruct1.nettime : (int32_t) nettime @ time of publish
    stringandarray.MyIntStruct1.value : (IntStruct1_typ)  actual dataset values

dataset MyIntStruct2:
    stringandarray.MyIntStruct2.publish()
    StringAndArrayEventHandler:on_change_MyIntStruct2 : void(void) user callback function
    stringandarray.MyIntStruct2.nettime : (int32_t) nettime @ time of publish
    stringandarray.MyIntStruct2.value : (IntStruct2_typ)  actual dataset values

dataset MyEnum1:
    stringandarray.MyEnum1.publish()
    StringAndArrayEventHandler:on_change_MyEnum1 : void(void) user callback function
    stringandarray.MyEnum1.nettime : (int32_t) nettime @ time of publish
    stringandarray.MyEnum1.value : (Enum_enum)  actual dataset value
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
    
    def on_change_MyString(self):
        self.stringandarray.log.verbose("python dataset MyString changed!")
        # self.stringandarray.log.debug("on_change: stringandarray.MyString: Array of char[]")
        # for index in range(len(self.stringandarray.MyString.value)):
        #     self.stringandarray.log.debug(str(index) + ": " + str(self.stringandarray.MyString.value[index]))
        ## alternatively:
        ## for item in self.stringandarray.MyString.value:
        ##    self.stringandarray.log.debug("  " + str(item))
        
        # Your code here...
    
    def on_change_MyInt2(self):
        self.stringandarray.log.verbose("python dataset MyInt2 changed!")
        # self.stringandarray.log.debug("on_change: stringandarray.MyInt2: Array of uint8_t")
        # for index in range(len(self.stringandarray.MyInt2.value)):
        #     self.stringandarray.log.debug(str(index) + ": " + str(self.stringandarray.MyInt2.value[index]))
        ## alternatively:
        ## for item in self.stringandarray.MyInt2.value:
        ##    self.stringandarray.log.debug("  " + str(item))
        
        # Your code here...
    
    def on_change_MyIntStruct(self):
        self.stringandarray.log.verbose("python dataset MyIntStruct changed!")
        # self.stringandarray.log.debug("on_change: stringandarray.MyIntStruct: Array of IntStruct_typ")
        # for index in range(len(self.stringandarray.MyIntStruct.value)):
        #     self.stringandarray.log.debug(str(index) + ": " + str(self.stringandarray.MyIntStruct.value[index]))
        ## alternatively:
        ## for item in self.stringandarray.MyIntStruct.value:
        ##    self.stringandarray.log.debug("  " + str(item))
        
        # Your code here...
    
    def on_change_MyIntStruct1(self):
        self.stringandarray.log.verbose("python dataset MyIntStruct1 changed!")
        # self.stringandarray.log.debug("on_change: stringandarray.MyIntStruct1: " + str(self.stringandarray.MyIntStruct1.value))
        
        # Your code here...
    
    def on_change_MyIntStruct2(self):
        self.stringandarray.log.verbose("python dataset MyIntStruct2 changed!")
        # self.stringandarray.log.debug("on_change: stringandarray.MyIntStruct2: " + str(self.stringandarray.MyIntStruct2.value))
        
        # Your code here...
    
    def on_change_MyEnum1(self):
        self.stringandarray.log.verbose("python dataset MyEnum1 changed!")
        # self.stringandarray.log.debug("on_change: stringandarray.MyEnum1: " + str(self.stringandarray.MyEnum1.value))
        
        # Your code here...
    

stringandarray = libStringAndArray.libStringAndArray_init()

handler = StringAndArrayEventHandler()
libStringAndArray.add_event_handler(stringandarray, handler)

try:
    stringandarray.connect()
    while True:
        stringandarray.process()
        # if stringandarray.is_connected:
            # stringandarray.MyInt2.value[..] = .. 
            # stringandarray.MyInt2.publish()
            
            # stringandarray.MyIntStruct.value[..]. .. = .. 
            # stringandarray.MyIntStruct.publish()
            
            # stringandarray.MyIntStruct1.value. .. = .. 
            # stringandarray.MyIntStruct1.publish()
            
            # stringandarray.MyIntStruct2.value. .. = .. 
            # stringandarray.MyIntStruct2.publish()
            
            # stringandarray.MyEnum1.value = .. 
            # stringandarray.MyEnum1.publish()
            
except(KeyboardInterrupt, SystemExit):
    stringandarray.log.success("Application terminated, shutting down")

stringandarray.disconnect()
stringandarray.dispose()

