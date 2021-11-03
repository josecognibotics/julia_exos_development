
TYPE
	WaterTank : 	STRUCT 
		FillValve : WaterTankFillValve_enum; (*SUB*)
		EnableHeater : ARRAY[0..2]OF BOOL; (*PUB*)
		HeaterConfig : ARRAY[0..2]OF WaterTankHeaterConfig; (*PUB SUB*)
		Status : WaterTankStatus; (*PUB*)
	END_STRUCT;
	WaterTankHeaterConfig : 	STRUCT 
		MaxTemperature : REAL;
		MaxPower : DINT;
	END_STRUCT;
	WaterTankStatus : 	STRUCT 
		LevelHigh : BOOL;
		LevelLow : BOOL;
		WaterLevel : UDINT;
		Heater : WaterTankHeaterStatus;
	END_STRUCT;
	WaterTankHeaterStatus : 	STRUCT 
		WaterTemperature : REAL;
		HeatingActive : BOOL;
	END_STRUCT;
	WaterTankFillValve_enum : 
		(
		VALVE_CLOSED := 0,
		VALVE_OPEN := 1
		);
END_TYPE
