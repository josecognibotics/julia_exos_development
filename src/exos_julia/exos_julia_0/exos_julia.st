
PROGRAM _INIT

    exos_juliaInit_0();

END_PROGRAM

PROGRAM _CYCLIC
    
    //Auto connect:
    //exos_juliaCyclic_0.Enable := ExComponentInfo_0.Operational; // Component has been deployed and started up successfully
    
    exos_juliaCyclic_0(Handle := exos_juliaInit_0.Handle, pexos_julia := ADR(exos_julia_0));
    
    ExComponentInfo_0(ExTargetLink := ADR(gTarget_0), ExComponentLink := ADR(gexos_julia_0), Enable := TRUE);
    
    ExDatamodelInfo_0(ExTargetLink := ADR(gTarget_0), Enable := TRUE, InstanceName := 'exos_julia_0');
    
END_PROGRAM

PROGRAM _EXIT

    exos_juliaExit_0(Handle := exos_juliaInit_0.Handle);

END_PROGRAM
