let WaterTank = require('./watertank.js');

//connection callbacks
WaterTank.connectionOnChange(() => {
    //WaterTank.connectionState.....;
});
WaterTank.dataModel.EnableHeater.connectionOnChange(() => {
    //WaterTank.dataModel.EnableHeater.connectionState ...
});
WaterTank.dataModel.HeaterConfig.connectionOnChange(() => {
    //WaterTank.dataModel.HeaterConfig.connectionState ...
});
WaterTank.dataModel.Status.connectionOnChange(() => {
    //WaterTank.dataModel.Status.connectionState ...
});
WaterTank.dataModel.Extra.connectionOnChange(() => {
    //WaterTank.dataModel.Extra.connectionState ...
});

//value callbacks from Automation Runtime
WaterTank.dataModel.EnableHeater.onChange(() => {
    //WaterTank.dataModel.EnableHeater.value..
});
WaterTank.dataModel.HeaterConfig.onChange(() => {
    //WaterTank.dataModel.HeaterConfig.value..
});
WaterTank.dataModel.Extra.onChange(() => {
    //WaterTank.dataModel.Extra.value..
});

//read current nettime
setInterval(() => {
    //console.log("current netTime is: " + WaterTank.netTime().toString());
}, 2000);

/*
All values in WaterTank.dataModel that has a .onChange() callback will
have the corresponding "netTime" and "latency" datas. These are initialized to "undefined" until
the first data have arrived via the call to .onchange().

- "latency" describes the time it took ´for the data to be transmitted from Automation Runtime 
  (real time OS) to this application.
- "netTime" describes the local timestamp (CLOCK_MONOTONIC) when the last data arrived to this 
  application.

To check the current time, call the WaterTank.netTime() method that 
returns current netTime.

Note that ALL netTime and latency values are created from int32_t datatype and the wrapping of
these values are not considered/handled in the imported module.
*/

//Cyclic call from Automation Runtime
WaterTank.onProcessed(() => {
    //Code placed here will be called in sync with Automation Runtime.
});

//publishing of values to Automation Runtime
if (1 === 0) {
    //WaterTank.dataModel.Status.value = ..
    WaterTank.dataModel.Status.publish();
}

