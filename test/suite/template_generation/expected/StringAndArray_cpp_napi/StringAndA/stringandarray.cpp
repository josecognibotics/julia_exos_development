#include <string.h>
#include <stdbool.h>
#include "StringAndArrayDatamodel.hpp"

/* datamodel features:

main methods:
    stringandarray->connect()
    stringandarray->disconnect()
    stringandarray->process()
    stringandarray->setOperational()
    stringandarray->dispose()
    stringandarray->getNettime() : (int32_t) get current nettime

void(void) user lambda callback:
    stringandarray->onConnectionChange([&] () {
        // stringandarray->connectionState ...
    })

boolean values:
    stringandarray->isConnected
    stringandarray->isOperational

logging methods:
    stringandarray->log.error << "some value:" << 1 << std::endl;
    stringandarray->log.warning << "some value:" << 1 << std::endl;
    stringandarray->log.success << "some value:" << 1 << std::endl;
    stringandarray->log.info << "some value:" << 1 << std::endl;
    stringandarray->log.debug << "some value:" << 1 << std::endl;
    stringandarray->log.verbose << "some value:" << 1 << std::endl;

dataset MyInt1:
    stringandarray->MyInt1.publish()
    stringandarray->MyInt1.value : (uint32_t)  actual dataset value

dataset MyString:
    stringandarray->MyString.publish()
    stringandarray->MyString.value : (char[3][81])  actual dataset value

dataset MyInt2:
    stringandarray->MyInt2.publish()
    stringandarray->MyInt2.onChange([&] () {
        stringandarray->MyInt2.value ...
    })
    stringandarray->MyInt2.nettime : (int32_t) nettime @ time of publish
    stringandarray->MyInt2.value : (uint8_t[5])  actual dataset value

dataset MyIntStruct:
    stringandarray->MyIntStruct.publish()
    stringandarray->MyIntStruct.onChange([&] () {
        stringandarray->MyIntStruct.value ...
    })
    stringandarray->MyIntStruct.nettime : (int32_t) nettime @ time of publish
    stringandarray->MyIntStruct.value : (IntStruct_typ[6])  actual dataset values

dataset MyIntStruct1:
    stringandarray->MyIntStruct1.publish()
    stringandarray->MyIntStruct1.onChange([&] () {
        stringandarray->MyIntStruct1.value ...
    })
    stringandarray->MyIntStruct1.nettime : (int32_t) nettime @ time of publish
    stringandarray->MyIntStruct1.value : (IntStruct1_typ)  actual dataset values

dataset MyIntStruct2:
    stringandarray->MyIntStruct2.publish()
    stringandarray->MyIntStruct2.onChange([&] () {
        stringandarray->MyIntStruct2.value ...
    })
    stringandarray->MyIntStruct2.nettime : (int32_t) nettime @ time of publish
    stringandarray->MyIntStruct2.value : (IntStruct2_typ)  actual dataset values

dataset MyEnum1:
    stringandarray->MyEnum1.publish()
    stringandarray->MyEnum1.onChange([&] () {
        stringandarray->MyEnum1.value ...
    })
    stringandarray->MyEnum1.nettime : (int32_t) nettime @ time of publish
    stringandarray->MyEnum1.value : (Enum_enum)  actual dataset value
*/


_BUR_PUBLIC void StringAndArrayInit(struct StringAndArrayInit *inst)
{
    StringAndArrayDatamodel* stringandarray = new StringAndArrayDatamodel();
    if (NULL == stringandarray)
    {
        inst->Handle = 0;
        return;
    }
    inst->Handle = (UDINT)stringandarray;
}

_BUR_PUBLIC void StringAndArrayCyclic(struct StringAndArrayCyclic *inst)
{
    // return error if reference to structure is not set on function block
    if(NULL == (void*)inst->Handle || NULL == inst->pStringAndArray)
    {
        inst->Operational = false;
        inst->Connected = false;
        inst->Error = true;
        return;
    }
    StringAndArrayDatamodel* stringandarray = static_cast<StringAndArrayDatamodel*>((void*)inst->Handle);
    if (inst->Enable && !inst->_Enable)
    {
        stringandarray->MyInt2.onChange([&] () {
            memcpy(&inst->pStringAndArray->MyInt2, &stringandarray->MyInt2.value, sizeof(inst->pStringAndArray->MyInt2));
        });
        stringandarray->MyIntStruct.onChange([&] () {
            memcpy(&inst->pStringAndArray->MyIntStruct, &stringandarray->MyIntStruct.value, sizeof(inst->pStringAndArray->MyIntStruct));
        });
        stringandarray->MyIntStruct1.onChange([&] () {
            memcpy(&inst->pStringAndArray->MyIntStruct1, &stringandarray->MyIntStruct1.value, sizeof(inst->pStringAndArray->MyIntStruct1));
        });
        stringandarray->MyIntStruct2.onChange([&] () {
            memcpy(&inst->pStringAndArray->MyIntStruct2, &stringandarray->MyIntStruct2.value, sizeof(inst->pStringAndArray->MyIntStruct2));
        });
        stringandarray->MyEnum1.onChange([&] () {
            inst->pStringAndArray->MyEnum1 = stringandarray->MyEnum1.value;
        });
        stringandarray->connect();
    }
    if (!inst->Enable && inst->_Enable)
    {
        stringandarray->disconnect();
    }
    inst->_Enable = inst->Enable;

    if(inst->Start && !inst->_Start && stringandarray->isConnected)
    {
        stringandarray->setOperational();
        inst->_Start = inst->Start;
    }
    if(!inst->Start)
    {
        inst->_Start = false;
    }

    //trigger callbacks
    stringandarray->process();

    if (stringandarray->isConnected)
    {
        //publish the MyInt1 dataset as soon as there are changes
        if (inst->pStringAndArray->MyInt1 != stringandarray->MyInt1.value)
        {
            stringandarray->MyInt1.value = inst->pStringAndArray->MyInt1;
            stringandarray->MyInt1.publish();
        }
        //publish the MyString dataset as soon as there are changes
        if (0 != memcmp(&inst->pStringAndArray->MyString, &stringandarray->MyString.value, sizeof(stringandarray->MyString.value)))
        {
            memcpy(&stringandarray->MyString.value, &inst->pStringAndArray->MyString, sizeof(stringandarray->MyString.value));
            stringandarray->MyString.publish();
        }
        //publish the MyInt2 dataset as soon as there are changes
        if (0 != memcmp(&inst->pStringAndArray->MyInt2, &stringandarray->MyInt2.value, sizeof(stringandarray->MyInt2.value)))
        {
            memcpy(&stringandarray->MyInt2.value, &inst->pStringAndArray->MyInt2, sizeof(stringandarray->MyInt2.value));
            stringandarray->MyInt2.publish();
        }
        //publish the MyIntStruct dataset as soon as there are changes
        if (0 != memcmp(&inst->pStringAndArray->MyIntStruct, &stringandarray->MyIntStruct.value, sizeof(stringandarray->MyIntStruct.value)))
        {
            memcpy(&stringandarray->MyIntStruct.value, &inst->pStringAndArray->MyIntStruct, sizeof(stringandarray->MyIntStruct.value));
            stringandarray->MyIntStruct.publish();
        }
        //publish the MyIntStruct1 dataset as soon as there are changes
        if (0 != memcmp(&inst->pStringAndArray->MyIntStruct1, &stringandarray->MyIntStruct1.value, sizeof(stringandarray->MyIntStruct1.value)))
        {
            memcpy(&stringandarray->MyIntStruct1.value, &inst->pStringAndArray->MyIntStruct1, sizeof(stringandarray->MyIntStruct1.value));
            stringandarray->MyIntStruct1.publish();
        }
        //publish the MyIntStruct2 dataset as soon as there are changes
        if (0 != memcmp(&inst->pStringAndArray->MyIntStruct2, &stringandarray->MyIntStruct2.value, sizeof(stringandarray->MyIntStruct2.value)))
        {
            memcpy(&stringandarray->MyIntStruct2.value, &inst->pStringAndArray->MyIntStruct2, sizeof(stringandarray->MyIntStruct2.value));
            stringandarray->MyIntStruct2.publish();
        }
        //publish the MyEnum1 dataset as soon as there are changes
        if (inst->pStringAndArray->MyEnum1 != stringandarray->MyEnum1.value)
        {
            stringandarray->MyEnum1.value = inst->pStringAndArray->MyEnum1;
            stringandarray->MyEnum1.publish();
        }
        // Your code here...
    }

    inst->Connected = stringandarray->isConnected;
    inst->Operational = stringandarray->isOperational;
}

_BUR_PUBLIC void StringAndArrayExit(struct StringAndArrayExit *inst)
{
    StringAndArrayDatamodel* stringandarray = static_cast<StringAndArrayDatamodel*>((void*)inst->Handle);
    delete stringandarray;
}

