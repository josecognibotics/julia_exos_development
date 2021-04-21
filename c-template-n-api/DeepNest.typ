TYPE
	DeepNest : 	STRUCT 
		calc : BOOL; (*PUB*)
		parameters : ARRAY[0..9]OF Level1; (*PUBSUB*)
	END_STRUCT;
	Level2 : 	STRUCT 
		x : INT;
		y : INT;
	END_STRUCT;
	Level1 : 	STRUCT 
		mamma : Level2;
		pappa : Level2;
		kalle : DINT;
		ella : DINT;
	END_STRUCT;
END_TYPE
