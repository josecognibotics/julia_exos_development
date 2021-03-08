TYPE
	DeepNest : 	STRUCT 
		calc : BOOL; (*PUB*)
		parameters : ARRAY[0..9]OF Level1; (*PUBSUB*)
		otherStuff : Level1a; (*PUBSUB*)
		someStuff : Level1b; (*PUBSUB*)
		myStuff : ARRAY[0..2]OF Level1c; (*PUBSUB*)
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
	Level1a : 	STRUCT 
		abc : Level2;
		def : Level2;
		g : DINT;
		h : DINT;
	END_STRUCT;
	Level1b : 	STRUCT 
		a : ARRAY[0..4]OF DINT;
		b : ARRAY[0..4]OF DINT;
		c : REAL;
	END_STRUCT;
	Level1c : 	STRUCT 
		k : ARRAY[0..1]OF DINT;
		l : ARRAY[0..1]OF DINT;
		d : REAL;
	END_STRUCT;
END_TYPE
