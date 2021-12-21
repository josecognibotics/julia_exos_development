FUNCTION_BLOCK StringAndArrayInit
    VAR_OUTPUT
        Handle : UDINT;
    END_VAR
END_FUNCTION_BLOCK

FUNCTION_BLOCK StringAndArrayCyclic
    VAR_INPUT
        Enable : BOOL;
        Start : BOOL;
        Handle : UDINT;
        pStringAndArray : REFERENCE TO StringAndArray;
    END_VAR
    VAR_OUTPUT
        Connected : BOOL;
        Operational : BOOL;
        Error : BOOL;
    END_VAR
    VAR
        _Start : BOOL;
        _Enable : BOOL;
    END_VAR
END_FUNCTION_BLOCK

FUNCTION_BLOCK StringAndArrayExit
    VAR_INPUT
        Handle : UDINT;
    END_VAR
END_FUNCTION_BLOCK

