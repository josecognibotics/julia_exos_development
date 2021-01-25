TYPE
	MouseMovement : STRUCT 
		Xrel : INT;
		Yrel : INT;
		X: INT;
		Y: INT;
	END_STRUCT
END_TYPE

TYPE
	MouseButtons : STRUCT 
		LeftButton : INT;
		RightButton : BOOL;
	END_STRUCT
END_TYPE

TYPE
	Mouse : 	STRUCT 
		ResetXY : BOOL; (*PUB*)
		Movement : MouseMovement; (*SUB*)
		Buttons : MouseButtons; (*SUB*)
	END_STRUCT;
END_TYPE
