FUNCTION_BLOCK ros_topics_typInit
    VAR_OUTPUT
        Handle : UDINT;
    END_VAR
END_FUNCTION_BLOCK

FUNCTION_BLOCK ros_topics_typCyclic
    VAR_INPUT
        Enable : BOOL;
        Start : BOOL;
        Handle : UDINT;
        pros_topics_typ : REFERENCE TO ros_topics_typ;
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

FUNCTION_BLOCK ros_topics_typExit
    VAR_INPUT
        Handle : UDINT;
    END_VAR
END_FUNCTION_BLOCK

