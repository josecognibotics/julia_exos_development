
TYPE
	BigDataCommand : 	STRUCT 
		CheckValues : BOOL;
		SetValues : BOOL;
		SendBuffer : USINT;
		SendStruct : USINT;
		SendValues : USINT;
		SendValueBuffer : USINT;
		ReconnectBuffer : BOOL;
		ReconnectStruct : BOOL;
		ReconnectValues : BOOL;
		ReconnectValueBuffer : BOOL;
	END_STRUCT;
	BigDataAck : 	STRUCT 
		Id : UDINT;
		Latency : DINT;
	END_STRUCT;
	BigDataBuffer : 	STRUCT 
		Id : UDINT;
		Buffer : ARRAY[0..99999]OF USINT;
		Ack : BigDataAck;
	END_STRUCT;
	BigDataValue : 	STRUCT 
		Id : UDINT;
		Value : LREAL;
		Ack : BigDataAck;
	END_STRUCT;
	BigDataValueBuffer : 	STRUCT 
		Id : UDINT;
		Values : ARRAY[0..999]OF LREAL;
		Ack : BigDataAck;
	END_STRUCT;
	BigDataSubStructMember : 	STRUCT 
		Value1 : LREAL;
		Value2 : LREAL;
		Value3 : LREAL;
		Value4 : LREAL;
		Value5 : LREAL;
	END_STRUCT;
	BigDataSubStruct : 	STRUCT 
		Member1 : BigDataSubStructMember;
		Member2 : BigDataSubStructMember;
		Member3 : BigDataSubStructMember;
		Member4 : BigDataSubStructMember;
		Member5 : BigDataSubStructMember;
	END_STRUCT;
	BigDataStruct : 	STRUCT 
		Id : UDINT;
		SubStruct1 : BigDataSubStruct;
		SubStruct2 : BigDataSubStruct;
		SubStruct3 : BigDataSubStruct;
		SubStruct4 : BigDataSubStruct;
		SubStruct5 : BigDataSubStruct;
		Ack : BigDataAck;
	END_STRUCT;
	BigData : 	STRUCT 
		Command : BigDataCommand; (*SUB*)
		Buffer : BigDataBuffer; (*PUB SUB*)
		ValueBuffer : BigDataValueBuffer; (*PUB SUB*)
		Values : ARRAY[0..999]OF BigDataValue; (*PUB SUB*)
		DataStruct : BigDataStruct; (*PUB SUB*)
	END_STRUCT;
	BigDataFbOutput : 	STRUCT 
		Ack : BigDataAck;
		SendErrors : UDINT;
		SendQueue : UDINT;
		AckErrors : UDINT;
		AckMax : BigDataAck;
		Receive : BigDataAck;
	END_STRUCT;
	BigDataFbInput : 	STRUCT 
		Send : USINT;
		SendCyclic : USINT;
		Recieve : USINT;
		Reconnect : BOOL;
		SendRemoteCyclic : USINT;
	END_STRUCT;
END_TYPE
