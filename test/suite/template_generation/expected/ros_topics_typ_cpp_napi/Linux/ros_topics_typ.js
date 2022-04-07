/**
 * @callback ros_topics_typDataModelCallback
 * @returns {function()}
 * 
 * @typedef {Object} ros_topics_typodemetryposeposepositionDataSetValue
 * @property {number} y 
 * @property {number} z 
 * @property {number} x 
 * 
 * @typedef {Object} ros_topics_typodemetryposeposeorientationDataSetValue
 * @property {number} y 
 * @property {number} z 
 * @property {number} w 
 * @property {number} x 
 * 
 * @typedef {Object} ros_topics_typodemetryposeposeDataSetValue
 * @property {ros_topics_typodemetryposeposepositionDataSetValue} position 
 * @property {ros_topics_typodemetryposeposeorientationDataSetValue} orientation 
 * 
 * @typedef {Object} ros_topics_typodemetryposeDataSetValue
 * @property {ros_topics_typodemetryposeposeDataSetValue} pose 
 * @property {number[]} covariance `[0..63]` Row-major representation of the 6x6 covariance matrix | The orientation parameters use a fixed-axis representation. In order, the parameters are: |  (x, y, z, rotation about X axis, rotation about Y axis, rotation about Z axis)
 * 
 * @typedef {Object} ros_topics_typodemetrytwisttwistangularDataSetValue
 * @property {number} y 
 * @property {number} z 
 * @property {number} x 
 * 
 * @typedef {Object} ros_topics_typodemetrytwisttwistlinearDataSetValue
 * @property {number} y 
 * @property {number} z 
 * @property {number} x 
 * 
 * @typedef {Object} ros_topics_typodemetrytwisttwistDataSetValue
 * @property {ros_topics_typodemetrytwisttwistangularDataSetValue} angular 
 * @property {ros_topics_typodemetrytwisttwistlinearDataSetValue} linear 
 * 
 * @typedef {Object} ros_topics_typodemetrytwistDataSetValue
 * @property {ros_topics_typodemetrytwisttwistDataSetValue} twist 
 * @property {number[]} covariance `[0..63]` Row-major representation of the 6x6 covariance matrix | The orientation parameters use a fixed-axis representation. In order, the parameters are: |  (x, y, z, rotation about X axis, rotation about Y axis, rotation about Z axis)
 * 
 * @typedef {Object} ros_topics_typodemetryheaderstampDataSetValue
 * @property {number} nsec 
 * @property {number} sec 
 * 
 * @typedef {Object} ros_topics_typodemetryheaderDataSetValue
 * @property {ros_topics_typodemetryheaderstampDataSetValue} stamp 
 * @property {number} seq 
 * @property {string} frame_id 
 * 
 * @typedef {Object} ros_topics_typodemetryDataSetValue
 * @property {ros_topics_typodemetryposeDataSetValue} pose 
 * @property {ros_topics_typodemetrytwistDataSetValue} twist 
 * @property {ros_topics_typodemetryheaderDataSetValue} header 
 * 
 * @typedef {Object} ros_topics_typtwistangularDataSetValue
 * @property {number} y 
 * @property {number} z 
 * @property {number} x 
 * 
 * @typedef {Object} ros_topics_typtwistlinearDataSetValue
 * @property {number} y 
 * @property {number} z 
 * @property {number} x 
 * 
 * @typedef {Object} ros_topics_typtwistDataSetValue
 * @property {ros_topics_typtwistangularDataSetValue} angular 
 * @property {ros_topics_typtwistlinearDataSetValue} linear 
 * 
 * @typedef {Object} ros_topics_typconfigDataSetValue
 * @property {number} maxSpeed 
 * @property {number} minSpeed 
 * @property {number} baseWidth 
 * 
 * @typedef {Object} odemetryDataSet
 * @property {ros_topics_typodemetryDataSetValue} value 
 * @property {ros_topics_typDataModelCallback} onChange event fired when `value` changes
 * @property {number} nettime used in the `onChange` event: nettime @ time of publish
 * @property {number} latency used in the `onChange` event: time in us between publish and arrival
 * @property {ros_topics_typDataModelCallback} onConnectionChange event fired when `connectionState` changes 
 * @property {string} connectionState `Connected`|`Operational`|`Disconnected`|`Aborted` - used in the `onConnectionChange` event
 * 
 * @typedef {Object} twistDataSet
 * @property {ros_topics_typtwistDataSetValue} value 
 * @property {function()} publish publish the value
 * @property {ros_topics_typDataModelCallback} onConnectionChange event fired when `connectionState` changes 
 * @property {string} connectionState `Connected`|`Operational`|`Disconnected`|`Aborted` - used in the `onConnectionChange` event
 * 
 * @typedef {Object} configDataSet
 * @property {ros_topics_typconfigDataSetValue} value 
 * @property {function()} publish publish the value
 * @property {ros_topics_typDataModelCallback} onConnectionChange event fired when `connectionState` changes 
 * @property {string} connectionState `Connected`|`Operational`|`Disconnected`|`Aborted` - used in the `onConnectionChange` event
 * 
 * @typedef {Object} ros_topics_typDatamodel
 * @property {odemetryDataSet} odemetry
 * @property {twistDataSet} twist
 * @property {configDataSet} config
 * 
 * @callback ros_topics_typDatamodelLogMethod
 * @param {string} message
 * 
 * @typedef {Object} ros_topics_typDatamodelLog
 * @property {ros_topics_typDatamodelLogMethod} warning
 * @property {ros_topics_typDatamodelLogMethod} success
 * @property {ros_topics_typDatamodelLogMethod} info
 * @property {ros_topics_typDatamodelLogMethod} debug
 * @property {ros_topics_typDatamodelLogMethod} verbose
 * 
 * @typedef {Object} ros_topics_typ
 * @property {function():number} nettime get current nettime
 * @property {ros_topics_typDataModelCallback} onConnectionChange event fired when `connectionState` changes 
 * @property {string} connectionState `Connected`|`Operational`|`Disconnected`|`Aborted` - used in the `onConnectionChange` event
 * @property {boolean} isConnected
 * @property {boolean} isOperational
 * @property {ros_topics_typDatamodelLog} log
 * @property {ros_topics_typDatamodel} datamodel
 * 
 */

/**
 * @type {ros_topics_typ}
 */
let ros_topics_typ_datamodel = require('./l_ros_topics_typ.node').ros_topics_typ;

/* datamodel features:

main methods:
    ros_topics_typ_datamodel.nettime() : (int32_t) get current nettime

state change events:
    ros_topics_typ_datamodel.onConnectionChange(() => {
        ros_topics_typ_datamodel.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted" 
    })

boolean values:
    ros_topics_typ_datamodel.isConnected
    ros_topics_typ_datamodel.isOperational

logging methods:
    ros_topics_typ_datamodel.log.error(string)
    ros_topics_typ_datamodel.log.warning(string)
    ros_topics_typ_datamodel.log.success(string)
    ros_topics_typ_datamodel.log.info(string)
    ros_topics_typ_datamodel.log.debug(string)
    ros_topics_typ_datamodel.log.verbose(string)

dataset odemetry:
    ros_topics_typ_datamodel.datamodel.odemetry.value : (ros_topic_odemety_typ)  actual dataset values
    ros_topics_typ_datamodel.datamodel.odemetry.onChange(() => {
        ros_topics_typ_datamodel.datamodel.odemetry.value ...
        ros_topics_typ_datamodel.datamodel.odemetry.nettime : (int32_t) nettime @ time of publish
        ros_topics_typ_datamodel.datamodel.odemetry.latency : (int32_t) time in us between publish and arrival
    })
    ros_topics_typ_datamodel.datamodel.odemetry.onConnectionChange(() => {
        ros_topics_typ_datamodel.datamodel.odemetry.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted"
    });

dataset twist:
    ros_topics_typ_datamodel.datamodel.twist.value : (ros_topic_twist_typ)  actual dataset values
    ros_topics_typ_datamodel.datamodel.twist.publish()
    ros_topics_typ_datamodel.datamodel.twist.onConnectionChange(() => {
        ros_topics_typ_datamodel.datamodel.twist.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted"
    });

dataset config:
    ros_topics_typ_datamodel.datamodel.config.value : (ros_config_typ)  actual dataset values
    ros_topics_typ_datamodel.datamodel.config.publish()
    ros_topics_typ_datamodel.datamodel.config.onConnectionChange(() => {
        ros_topics_typ_datamodel.datamodel.config.connectionState : (string) "Connected", "Operational", "Disconnected" or "Aborted"
    });
*/

//connection state changes
ros_topics_typ_datamodel.onConnectionChange(() => {
    switch (ros_topics_typ_datamodel.connectionState) {
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
ros_topics_typ_datamodel.datamodel.odemetry.onConnectionChange(() => {
    // switch (ros_topics_typ_datamodel.datamodel.odemetry.connectionState) ...
});
ros_topics_typ_datamodel.datamodel.twist.onConnectionChange(() => {
    // switch (ros_topics_typ_datamodel.datamodel.twist.connectionState) ...
});
ros_topics_typ_datamodel.datamodel.config.onConnectionChange(() => {
    // switch (ros_topics_typ_datamodel.datamodel.config.connectionState) ...
});

//value change events
ros_topics_typ_datamodel.datamodel.odemetry.onChange(() => {
    //ros_topics_typ_datamodel.datamodel.odemetry.value..
});

//Cyclic call triggered from the Component Server
ros_topics_typ_datamodel.onProcessed(() => {
    //Publish values
    //if (ros_topics_typ_datamodel.isConnected) {
        //ros_topics_typ_datamodel.datamodel.twist.value = ..
        //ros_topics_typ_datamodel.datamodel.twist.publish();
        //ros_topics_typ_datamodel.datamodel.config.value = ..
        //ros_topics_typ_datamodel.datamodel.config.publish();
    //}
});

