cmake_minimum_required(VERSION 3.0)

project(exos_julia)

set(CMAKE_BUILD_TYPE Debug)
JULIA 1

set(CPACK_GENERATOR "DEB")
set(CPACK_PACKAGE_NAME exos-comp-exos_julia)
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "exos_julia summary")
set(CPACK_PACKAGE_DESCRIPTION "Some description")
set(CPACK_PACKAGE_VENDOR "Your Company")

set(CPACK_PACKAGE_VERSION_MAJOR 1)
set(CPACK_PACKAGE_VERSION_MINOR 0)
set(CPACK_PACKAGE_VERSION_PATCH 0)
set(CPACK_PACKAGE_FILE_NAME exos-comp-exos_julia_1.0.0_amd64)
set(CPACK_DEBIAN_PACKAGE_MAINTAINER "Your Name")

set(CPACK_DEBIAN_PACKAGE_SHLIBDEPS ON)

include(CPack)

