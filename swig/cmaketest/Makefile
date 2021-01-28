c:
	mkdir -p build
	gcc main.c libmouse.c -o build/main

runc: c
	./build/main

swig:
	swig -c++ -python -o build/libmousePYTHON_wrap.cxx libmouse.i
	c++ -I. -I/usr/include/python3.5/ -fPIC -shared -o build/_libmouse.so libmouse_swig.c build/libmousePYTHON_wrap.cxx
	
runp: swig
	python mousetest.py
