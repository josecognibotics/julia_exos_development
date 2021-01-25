c:
	mkdir -p build
	gcc main.c libmouse.c -o build/main

runc:
	./build/main

swig:
	swig -python -o build/libmouse_wrap.c libmouse.i
	gcc -I. -I/usr/include/python2.7/ -fPIC -shared -o build/_libmouse.so libmouse.c build/libmouse_wrap.c
	
runp:
	python2.7 mousetest.py
