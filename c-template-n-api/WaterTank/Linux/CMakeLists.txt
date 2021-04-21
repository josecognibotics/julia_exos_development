
project(watertank)
cmake_minimum_required(VERSION 3.0)

set(WATERTANK_MODULE_FILES
    l_WaterTank.node
    watertank.js
    package.json
    package-lock.json)

install(FILES ${WATERTANK_MODULE_FILES} DESTINATION /home/user/watertank)
install(DIRECTORY node_modules DESTINATION /home/user/watertank/)

set(CPACK_GENERATOR "DEB")
set(CPACK_PACKAGE_NAME exos-comp-watertank)
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "watertank summary")
set(CPACK_PACKAGE_DESCRIPTION "Some description")
set(CPACK_PACKAGE_VENDOR "Your Organization")

set(CPACK_PACKAGE_VERSION_MAJOR 1)
set(CPACK_PACKAGE_VERSION_MINOR 0)
set(CPACK_PACKAGE_VERSION_PATCH 0)
set(CPACK_PACKAGE_FILE_NAME exos-comp-watertank-${CPACK_PACKAGE_VERSION_MAJOR}.${CPACK_PACKAGE_VERSION_MINOR}.${CPACK_PACKAGE_VERSION_PATCH})
set(CPACK_DEBIAN_PACKAGE_MAINTAINER "your name")

set(CPACK_DEBIAN_PACKAGE_SHLIBDEPS ON)

include(CPack)
