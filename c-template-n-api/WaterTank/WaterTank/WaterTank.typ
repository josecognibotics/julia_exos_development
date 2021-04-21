
TYPE
	WaterTank : 	STRUCT 
		FillValve : UDINT := 0;
		EnableHeater : ARRAY[0..2]OF BOOL; (*PUB*)
		HeaterConfig : ARRAY[0..2]OF WaterTankHeaterConfig; (*PUB*)
		Status : WaterTankStatus; (*SUB*)
		Extra : ExtraParams; (*PUB*)
	END_STRUCT;
	WaterTankHeaterConfig : 	STRUCT 
		MaxTemperature : REAL;
		MaxPower : REAL;
	END_STRUCT;
	WaterTankStatus : 	STRUCT 
		LevelHigh : BOOL;
		LevelLow : BOOL;
		WaterLevel : UDINT;
		FillValveDelay : DINT;
		Heater : WaterTankHeaterStatus;
	END_STRUCT;
	WaterTankHeaterStatus : 	STRUCT 
		WaterTemperature : REAL;
		HeatingActive : BOOL;
	END_STRUCT;
	ExtraParams : 	STRUCT 
		Speed : UDINT;
	END_STRUCT;
END_TYPE
