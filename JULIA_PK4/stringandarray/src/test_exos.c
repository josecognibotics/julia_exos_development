#include "/home/user/exOS-ComponentExtension/JULIA_PK4/stringandarray/src/test_exos.h"



void test_datamodel_handle(exos_datamodel_handle_t *datamodel_handle)
{
    printf("C datamodel pointer: %p\n", datamodel_handle);
    fflush(stdout);
    printf("----------------------------------------------\n");
    printf("DATAMODEL HANDLE in C\n");
    printf("----------------------------------------------\n");
    printf("Name: %s\n", datamodel_handle->name);
    printf("connection_state: %d\n", datamodel_handle->connection_state); 
    printf("error: %d\n", datamodel_handle->error); 
    printf("user_context: %p\n", datamodel_handle->user_context);
    printf("user_tag: %ld\n", datamodel_handle->user_tag); 
    printf("user_alias: %s\n", datamodel_handle->user_alias);
    printf("datamodel_event_callback: %p\n", datamodel_handle->datamodel_event_callback); 
    printf("sync_info_in_sync: %d\n", datamodel_handle->sync_info.in_sync);
    printf("sync_info_reserved_bool: %d\n", datamodel_handle->sync_info._reserved_bool[0]);
    printf("sync_info_missed_dmr_cycles: %u\n", datamodel_handle->sync_info.missed_dmr_cycles);
    printf("sync_info_missed_ar_cycles: %u\n", datamodel_handle->sync_info.missed_ar_cycles);
    printf("sync_info_process_mode: %d\n", datamodel_handle->sync_info.process_mode);
    printf("sync_info_reserved_uint32: %u\n", datamodel_handle->sync_info._reserved_uint32[0]);
    printf("_reserved_bool: %d\n", datamodel_handle->_reserved_bool[0]); 
    printf("_reserved_uint32: %u\n", datamodel_handle->_reserved_uint32[0]); 
    printf("_reserved_void: %p\n", datamodel_handle->_reserved_void); 
    printf("_private_magic: %u\n", datamodel_handle->_private._magic);
    printf("_private_artefact: %p\n", datamodel_handle->_private._artefact);
    printf("_private_reserved: %p\n", datamodel_handle->_private._reserved);
    printf("----------------------------------------------\n");
    fflush(stdout);
}


void print_exos_dataset_handle(exos_dataset_handle_t *dataset_handle) {
    printf("----------------------------------------------\n");
    printf("DATASET HANDLE in C\n");
    printf("----------------------------------------------\n");
    printf("Name: %s\n", dataset_handle->name);
    printf("Type: %d\n", dataset_handle->type);
    printf("Data Model: %p\n", dataset_handle->datamodel);
    printf("Data: %p\n", dataset_handle->data);
    printf("Size: %zu\n", dataset_handle->size);
    printf("Error Code: %d\n", dataset_handle->error);
    printf("Connection State: %d\n", dataset_handle->connection_state);
    printf("Nettime: %d\n", dataset_handle->nettime);
    printf("User Tag: %d\n", dataset_handle->user_tag);
    printf("User Context: %p\n", dataset_handle->user_context);
    printf("Dataset Event Callback: %p\n", dataset_handle->dataset_event_callback);
    printf("Send Buffer Info: %p\n", &dataset_handle->send_buffer);
    // Print other fields if needed
    printf("----------------------------------------------\n");
}
