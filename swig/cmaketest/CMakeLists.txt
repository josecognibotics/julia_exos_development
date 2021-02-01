cmake_minimum_required(VERSION 3.0)

project(libmouse)

FIND_PACKAGE(PythonLibs 3) # if it fails:  sudo apt-get install python3-dev

FIND_PACKAGE(SWIG REQUIRED)
INCLUDE(${SWIG_USE_FILE})

# /usr/lib/gcc/x86_64-linux-gnu/8/include/  /usr/include/
INCLUDE_DIRECTORIES(${PYTHON_INCLUDE_PATH})

INCLUDE_DIRECTORIES(${CMAKE_CURRENT_SOURCE_DIR})

SET(CMAKE_SWIG_FLAGS "")
SET_SOURCE_FILES_PROPERTIES(libmouse.i PROPERTIES CPLUSPLUS ON)
# SET_SOURCE_FILES_PROPERTIES(libmouse.i PROPERTIES SWIG_FLAGS "-includeall")
SWIG_ADD_MODULE(libmouse python libmouse.i libmouse_swig.c)
SWIG_LINK_LIBRARIES(libmouse ${PYTHON_LIBRARIES})

# set_property(SOURCE libmouse.i PROPERTY CPLUSPLUS ON)
# set_property(SOURCE libmouse.i PROPERTY SWIG_MODULE_NAME pymouse)
# swig_add_library(pymouse
#   TYPE SHARED
#   LANGUAGE python
#   SOURCES libmouse.i libmouse_swig.c)

# target_include_directories(pymouse PUBLIC .. ${Python_INCLUDE_DIRS} )

# set_property(TARGET pymouse PROPERTY SWIG_USE_TARGET_INCLUDE_DIRECTORIES ON)

# target_link_libraries(pymouse PRIVATE Foo) #zmq exos-api

# install(TARGETS mouse RUNTIME DESTINATION /home/user)
# install(TARGETS libmouse ARCHIVE DESTINATION /home/user)

# set(CPACK_GENERATOR "DEB")
# set(CPACK_PACKAGE_NAME exos-comp-mouse)
# set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "mouse summary")
# set(CPACK_PACKAGE_DESCRIPTION "Some description")
# set(CPACK_PACKAGE_VENDOR "Your Organization")

# set(CPACK_PACKAGE_VERSION_MAJOR 1)
# set(CPACK_PACKAGE_VERSION_MINOR 0)
# set(CPACK_PACKAGE_VERSION_PATCH 0)
# set(CPACK_PACKAGE_FILE_NAME exos-comp-mouse-${CPACK_PACKAGE_VERSION_MAJOR}.${CPACK_PACKAGE_VERSION_MINOR}.${CPACK_PACKAGE_VERSION_PATCH})
# set(CPACK_DEBIAN_PACKAGE_MAINTAINER "your name")

# set(CPACK_DEBIAN_PACKAGE_SHLIBDEPS ON)

# include(CPack)

