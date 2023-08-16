/**
 * @callback StringAndArrayDataModelCallback
 * @returns {function()}
 * 
 * @typedef {Object} StringAndArrayMyIntStructDataSetValue
 * @property {number} MyInt13 
 * @property {number[]} MyInt14 `[0..2]` 
 * @property {number} MyInt133 
 * @property {number[]} MyInt124 `[0..2]` 
 * 
 * @typedef {Object} StringAndArrayMyIntStruct1DataSetValue
 * @property {number} MyInt13 
 * 
 * @typedef {Object} StringAndArrayMyIntStruct2DataSetValue
 * @property {number} MyInt23 
 * @property {number[]} MyInt24 `[0..3]` 
 * @property {number} MyInt25 
 * 
 * @typedef {Object} MyInt1DataSet
 * @property {number} value 
 * @property {StringAndArrayDataModelCallback} onChange event fired when `value` changes
 * @property {number} nettime used in the `onChange` event: nettime @ time of publish
 * @property {number} latency used in the `onChange` event: time in us between publish and arrival
 * @property {StringAndArrayDataModelCallback} onConnectionChange event fired when `connectionState` changes 
 * @property {string} connectionState `Connected`|`Operational`|`Disconnected`|`Aborted` - used in the `onConnectionChange` event
 * 
 * @typedef {Object} MyStringDataSet
 * @property {string[]} value `[0..2]` 
 * @property {StringAndArrayDataModelCallback} onChange event fired when `value` changes
 * @property {number} nettime used in the `onChange` event: nettime @ time of publish
 * @property {number} latency used in the `onChange` event: time in us between publish and arrival
 * @property {StringAndArrayDataModelCallback} onConnectionChange event fired when `connectionState` changes 
 * @property {string} connectionState `Connected`|`Operational`|`Disconnected`|`Aborted` - used in the `onConnectionChange` event
 * 
 * @typedef {Object} MyInt2DataSet
 * @property {number[]} value `[0..4]`  
 * @property {function()} publish publish the value
 * @property {StringAndArrayDataModelCallback} onChange event fired when `value` changes
 * @property {number} nettime used in the `onChange` event: nettime @ time of publish
 * @property {number} latency used in the `onChange` event: time in us between publish and arrival
 * @property {StringAndArrayDataModelCallback} onConnectionChange event fired when `connectionState` changes 
 * @property {string} connectionState `Connected`|`Operational`|`Disconnected`|`Aborted` - used in the `onConnectionChange` event
 * 
 * @typedef {Object} MyIntStructDataSet
 * @property {StringAndArrayMyIntStructDataSetValue[]} value `[0..5]`  
 * @property {function()} publish publish the value
 * @property {StringAndArrayDataModelCallback} onChange event fired when `value` changes
 * @property {number} nettime used in the `onChange` event: nettime @ time of publish
 * @property {number} latency used in the `onChange` event: time in us between publish and arrival
 * @property {StringAndArrayDataModelCallback} onConnectionChange event fired when `connectionState` changes 
 * @property {string} connectionState `Connected`|`Operational`|`Disconnected`|`Aborted` - used in the `onConnectionChange` event
 * 
 * @typedef {Object} MyIntStruct1DataSet
 * @property {StringAndArrayMyIntStruct1DataSetValue} value  
 * @property {function()} publish publish the value
 * @property {StringAndArrayDataModelCallback} onChange event fired when `value` changes
 * @property {number} nettime used in the `onChange` event: nettime @ time of publish
 * @property {number} latency used in the `onChange` event: time in us between publish and arrival
 * @property {StringAndArrayDataModelCallback} onConnectionChange event fired when `connectionState` changes 
 * @property {string} connectionState `Connected`|`Operational`|`Disconnected`|`Aborted` - used in the `onConnectionChange` event
 * 
 * @typedef {Object} MyIntStruct2DataSet
 * @property {StringAndArrayMyIntStruct2DataSetValue} value  
 * @property {function()} publish publish the value
 * @property {StringAndArrayDataModelCallback} onChange event fired when `value` changes
 * @property {number} nettime used in the `onChange` event: nettime @ time of publish
 * @property {number} latency used in the `onChange` event: time in us between publish and arrival
 * @property {StringAndArrayDataModelCallback} onConnectionChange event fired when `connectionState` changes 
 * @property {string} connectionState `Connected`|`Operational`|`Disconnected`|`Aborted` - used in the `onConnectionChange` event
 * 
 * @typedef {Object} StringAndArrayDatamodel
 * @property {MyInt1DataSet} MyInt1
 * @property {MyStringDataSet} MyString
 * @property {MyInt2DataSet} MyInt2
 * @property {MyIntStructDataSet} MyIntStruct
 * @property {MyIntStruct1DataSet} MyIntStruct1
 * @property {MyIntStruct2DataSet} MyIntStruct2
 * 
 * @callback StringAndArrayDatamodelLogMethod
 * @param {string} message
 * 
 * @typedef {Object} StringAndArrayDatamodelLog
 * @property {StringAndArrayDatamodelLogMethod} warning
 * @property {StringAndArrayDatamodelLogMethod} success
 * @property {StringAndArrayDatamodelLogMethod} info
 * @property {StringAndArrayDatamodelLogMethod} debug
 * @property {StringAndArrayDatamodelLogMethod} verbose
 * 
 * @typedef {Object} StringAndArray
 * @property {function():number} nettime get current nettime
 * @property {StringAndArrayDataModelCallback} onConnectionChange event fired when `connectionState` changes 
 * @property {string} connectionState `Connected`|`Operational`|`Disconnected`|`Aborted` - used in the `onConnectionChange` event
 * @property {boolean} isConnected
 * @property {boolean} isOperational
 * @property {StringAndArrayDatamodelLog} log
 * @property {StringAndArrayDatamodel} datamodel
 * 
 */

/**
 * @type {StringAndArray}
 */
let stringandarray = require('./l_StringAndArray.node').StringAndArray;

/* datamodel features:

main methods:
    stringandarray.nettime() : (int32_t) get current nettime

state change events:
    stringandarray.onConnectionChange(() => {
        stringandarray.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted" 
    })

boolean values:
    stringandarray.isConnected
    stringandarray.isOperational

logging methods:
    stringandarray.log.error(string)
    stringandarray.log.warning(string)
    stringandarray.log.success(string)
    stringandarray.log.info(string)
    stringandarray.log.debug(string)
    stringandarray.log.verbose(string)

dataset MyInt1:
    stringandarray.datamodel.MyInt1.value : (uint32_t)  actual dataset value
    stringandarray.datamodel.MyInt1.onChange(() => {
        stringandarray.datamodel.MyInt1.value ...
        stringandarray.datamodel.MyInt1.nettime : (int32_t) nettime @ time of publish
        stringandarray.datamodel.MyInt1.latency : (int32_t) time in us between publish and arrival
    })
    stringandarray.datamodel.MyInt1.onConnectionChange(() => {
        stringandarray.datamodel.MyInt1.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted"
    });

dataset MyString:
    stringandarray.datamodel.MyString.value : (char[3][81)  actual dataset value
    stringandarray.datamodel.MyString.onChange(() => {
        stringandarray.datamodel.MyString.value ...
        stringandarray.datamodel.MyString.nettime : (int32_t) nettime @ time of publish
        stringandarray.datamodel.MyString.latency : (int32_t) time in us between publish and arrival
    })
    stringandarray.datamodel.MyString.onConnectionChange(() => {
        stringandarray.datamodel.MyString.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted"
    });

dataset MyInt2:
    stringandarray.datamodel.MyInt2.value : (uint8_t[5])  actual dataset value
    stringandarray.datamodel.MyInt2.publish()
    stringandarray.datamodel.MyInt2.onChange(() => {
        stringandarray.datamodel.MyInt2.value ...
        stringandarray.datamodel.MyInt2.nettime : (int32_t) nettime @ time of publish
        stringandarray.datamodel.MyInt2.latency : (int32_t) time in us between publish and arrival
    })
    stringandarray.datamodel.MyInt2.onConnectionChange(() => {
        stringandarray.datamodel.MyInt2.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted"
    });

dataset MyIntStruct:
    stringandarray.datamodel.MyIntStruct.value : (IntStruct_typ[6])  actual dataset values
    stringandarray.datamodel.MyIntStruct.publish()
    stringandarray.datamodel.MyIntStruct.onChange(() => {
        stringandarray.datamodel.MyIntStruct.value ...
        stringandarray.datamodel.MyIntStruct.nettime : (int32_t) nettime @ time of publish
        stringandarray.datamodel.MyIntStruct.latency : (int32_t) time in us between publish and arrival
    })
    stringandarray.datamodel.MyIntStruct.onConnectionChange(() => {
        stringandarray.datamodel.MyIntStruct.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted"
    });

dataset MyIntStruct1:
    stringandarray.datamodel.MyIntStruct1.value : (IntStruct1_typ)  actual dataset values
    stringandarray.datamodel.MyIntStruct1.publish()
    stringandarray.datamodel.MyIntStruct1.onChange(() => {
        stringandarray.datamodel.MyIntStruct1.value ...
        stringandarray.datamodel.MyIntStruct1.nettime : (int32_t) nettime @ time of publish
        stringandarray.datamodel.MyIntStruct1.latency : (int32_t) time in us between publish and arrival
    })
    stringandarray.datamodel.MyIntStruct1.onConnectionChange(() => {
        stringandarray.datamodel.MyIntStruct1.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted"
    });

dataset MyIntStruct2:
    stringandarray.datamodel.MyIntStruct2.value : (IntStruct2_typ)  actual dataset values
    stringandarray.datamodel.MyIntStruct2.publish()
    stringandarray.datamodel.MyIntStruct2.onChange(() => {
        stringandarray.datamodel.MyIntStruct2.value ...
        stringandarray.datamodel.MyIntStruct2.nettime : (int32_t) nettime @ time of publish
        stringandarray.datamodel.MyIntStruct2.latency : (int32_t) time in us between publish and arrival
    })
    stringandarray.datamodel.MyIntStruct2.onConnectionChange(() => {
        stringandarray.datamodel.MyIntStruct2.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted"
    });
*/

//connection state changes
stringandarray.onConnectionChange(() => {
    switch (stringandarray.connectionState) {
    case "Connected":
        break;
    case "Operational":
        break;
    case "Disconnected":
        break;
    case "Aborted":
        break;
    }
});
stringandarray.datamodel.MyInt1.onConnectionChange(() => {
    // switch (stringandarray.datamodel.MyInt1.connectionState) ...
});
stringandarray.datamodel.MyString.onConnectionChange(() => {
    // switch (stringandarray.datamodel.MyString.connectionState) ...
});
stringandarray.datamodel.MyInt2.onConnectionChange(() => {
    // switch (stringandarray.datamodel.MyInt2.connectionState) ...
});
stringandarray.datamodel.MyIntStruct.onConnectionChange(() => {
    // switch (stringandarray.datamodel.MyIntStruct.connectionState) ...
});
stringandarray.datamodel.MyIntStruct1.onConnectionChange(() => {
    // switch (stringandarray.datamodel.MyIntStruct1.connectionState) ...
});
stringandarray.datamodel.MyIntStruct2.onConnectionChange(() => {
    // switch (stringandarray.datamodel.MyIntStruct2.connectionState) ...
});

//value change events
stringandarray.datamodel.MyInt1.onChange(() => {
    //stringandarray.datamodel.MyInt1.value..
});
stringandarray.datamodel.MyString.onChange(() => {
    //stringandarray.datamodel.MyString.value..
});
stringandarray.datamodel.MyInt2.onChange(() => {
    //stringandarray.datamodel.MyInt2.value..
});
stringandarray.datamodel.MyIntStruct.onChange(() => {
    //stringandarray.datamodel.MyIntStruct.value..
});
stringandarray.datamodel.MyIntStruct1.onChange(() => {
    //stringandarray.datamodel.MyIntStruct1.value..
});
stringandarray.datamodel.MyIntStruct2.onChange(() => {
    //stringandarray.datamodel.MyIntStruct2.value..
});

//Cyclic call triggered from the Component Server
stringandarray.onProcessed(() => {
    //Publish values
    //if (stringandarray.isConnected) {
        //stringandarray.datamodel.MyInt2.value = ..
        //stringandarray.datamodel.MyInt2.publish();
        //stringandarray.datamodel.MyIntStruct.value = ..
        //stringandarray.datamodel.MyIntStruct.publish();
        //stringandarray.datamodel.MyIntStruct1.value = ..
        //stringandarray.datamodel.MyIntStruct1.publish();
        //stringandarray.datamodel.MyIntStruct2.value = ..
        //stringandarray.datamodel.MyIntStruct2.publish();
    //}
});

