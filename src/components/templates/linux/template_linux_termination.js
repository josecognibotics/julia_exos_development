/*
 * Copyright (C) 2021 B&R Danmark
 * All rights reserved
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const {GeneratedFileObj} = require('../../../datamodel')

class TemplateLinuxTermination {
    
    /**
     * termination handling header
     * @type {GeneratedFileObj}
     */
    terminationHeader;

    /**
     * termination handling source code
     * @type {GeneratedFileObj}
     */
    terminationSource;
    
    /**
     * {@linkcode TemplateLinuxTermination} Generate code for handling Ctrl-C in Linux appliactions
     * 
     * Generates following {@link GeneratedFileObj} objects
     * - {@linkcode terminationHeader}
     * - {@linkcode terminationSource}
     */
    constructor() {
        this.terminationHeader = {name:"termination.h", contents:this._generateTerminationHeader(), description:"Handling for Ctrl-C header"};
        this.terminationSource = {name:"termination.c", contents:this._generateTerminationSource(), description:"Handling for Ctrl-C source"};
    }

    _generateTerminationHeader() {
        function generateTerminationHeader() {
            let out = "";
        
            out += `#ifndef _TERMINATION_H_\n`;
            out += `#define _TERMINATION_H_\n`;
            out += `\n`;
            out += `#ifdef __cplusplus\n`;
            out += `extern "C" {\n`;
            out += `#endif\n`;
            out += `\n`;
            out += `#include <stdbool.h>\n`;
            out += `\n`;
            out += `void catch_termination();\n`;
            out += `bool is_terminated();\n`;
            out += `\n`;
            out += `#ifdef __cplusplus\n`;
            out += `}\n`;
            out += `#endif\n`;
            out += `\n`;
            out += `#endif//_TERMINATION_H_\n`;
        
            return out;
        }
        return generateTerminationHeader();
    }

    _generateTerminationSource() {
        function generateTerminationSource() {
            let out = "";
        
            out += `#include "termination.h"\n`;
            out += `#include <stdio.h>\n`;
            out += `#include <execinfo.h>\n`;
            out += `#include <signal.h>\n`;
            out += `#include <stdlib.h>\n`;
            out += `#include <unistd.h>\n`;
            out += `\n`;
            out += `static bool terminate_process = false;\n`;
            out += `\n`;
            out += `bool is_terminated()\n`;
            out += `{\n`;
            out += `    return terminate_process;\n`;
            out += `}\n`;
            out += `\n`;
            out += `static void handle_segfault(int sig) {\n`;
            out += `	void *array[10];\n`;
            out += `	size_t size;\n`;
            out += `	\n`;
            out += `	// get void*'s for all entries on the stack\n`;
            out += `	size = backtrace(array, 10);\n`;
            out += `\n`;
            out += `	// print out all the frames to stderr\n`;
            out += `	fprintf(stderr, "Error: segfault\\n");\n`;
            out += `	backtrace_symbols_fd(array, size, STDERR_FILENO);\n`;
            out += `	exit(1);\n`;
            out += `}\n`;
            out += `\n`;
            out += `static void handle_term_signal(int signum)\n`;
            out += `{\n`;
            out += `    switch (signum)\n`;
            out += `    {\n`;
            out += `    case SIGINT:\n`;
            out += `    case SIGTERM:\n`;
            out += `    case SIGQUIT:\n`;
            out += `        terminate_process = true;\n`;
            out += `        break;\n`;
            out += `\n`;
            out += `    default:\n`;
            out += `        break;\n`;
            out += `    }\n`;
            out += `}\n`;
            out += `\n`;
            out += `void catch_termination()\n`;
            out += `{\n`;
            out += `    struct sigaction new_action;\n`;
            out += `\n`;
            out += `    // Register termination handler for signals with termination semantics\n`;
            out += `    new_action.sa_handler = handle_term_signal;\n`;
            out += `    sigemptyset(&new_action.sa_mask);\n`;
            out += `    new_action.sa_flags = 0;\n`;
            out += `\n`;
            out += `    // Sent via CTRL-C.\n`;
            out += `    sigaction(SIGINT, &new_action, NULL);\n`;
            out += `\n`;
            out += `    // Generic signal used to cause program termination.\n`;
            out += `    sigaction(SIGTERM, &new_action, NULL);\n`;
            out += `\n`;
            out += `    // Terminate because of abnormal condition.\n`;
            out += `    sigaction(SIGQUIT, &new_action, NULL);\n`;
            out += `\n`;
            out += `    // Print backtrace to stderr and exit() on segfault\n`;
            out += `	signal(SIGSEGV, handle_segfault); \n`;
            out += `}\n`;
        
            return out;
        }
        return generateTerminationSource();
    }
}

module.exports = {TemplateLinuxTermination};