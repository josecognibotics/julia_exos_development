#!/bin/sh

rm -f l_*.node
rm -f *.deb

finalize() {
    rm -rf build/*
    rm -r build
    rm -rf node_modules/*
    rm -r node_modules
    rm -f Makefile
    sync
    exit $1
}

npm install
if [ "$?" -ne 0 ] ; then
    finalize 1
fi

cp -f build/Release/l_*.node .

mkdir node_modules #make sure the folder exists even if no submodules are needed

rm -rf build/*
cd build

cmake -Wno-dev ..
if [ "$?" -ne 0 ] ; then
    cd ..
    finalize 2
fi

cpack
if [ "$?" -ne 0 ] ; then
    cd ..
    finalize
fi

cp -f exos-comp-*.deb ..

cd ..

finalize 0

