
PROGRAM _INIT

    WaterTankInit_0();

END_PROGRAM

PROGRAM _CYCLIC

    WaterTankCyclic_0(Handle := WaterTankInit_0.Handle, pWaterTank := ADR(WaterTank_0));

END_PROGRAM

PROGRAM _EXIT

    WaterTankExit_0(Handle := WaterTankInit_0.Handle);

END_PROGRAM
