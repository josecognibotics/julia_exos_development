
TYPE
	IntStruct_typ : 	STRUCT 
		MyInt13 : UDINT;
		MyInt14 : ARRAY[0..2]OF USINT;
		MyInt133 : UDINT;
		MyInt124 : ARRAY[0..2]OF USINT;
	END_STRUCT;
	IntStruct1_typ : 	STRUCT 
		MyInt13 : UDINT;
	END_STRUCT;
	IntStruct2_typ : 	STRUCT 
		MyInt23 : UDINT;
		MyInt24 : ARRAY[0..3]OF USINT;
		MyInt25 : UDINT;
	END_STRUCT;
	StringAndArray : 	STRUCT 
		MyInt1 : UDINT; (*PUB*)
		MyInt3 : ARRAY[0..4]OF USINT; (*PUB SUB*)
	END_STRUCT;
END_TYPE
