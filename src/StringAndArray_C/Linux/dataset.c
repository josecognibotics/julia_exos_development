#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define EXOS_DATASET_BROWSE_NAME_INIT "", &(data), sizeof(data), 0
#define EXOS_DATASET_BROWSE_NAME(_arg_) #_arg_, &(data._arg_), sizeof(data._arg_), offsetof(StringAndArray, _arg_)

#define EXOS_ARRAY_DEPTH 10

typedef struct StringAndArray
{
    uint32_t MyInt1; // PUB
    uint8_t MyInt3[5]; // PUB SUB
} StringAndArray;

typedef struct exos_dataset_info
{
    const char *name;
    void *adr;
    size_t size;
    long offset;
    uint32_t arrayItems[EXOS_ARRAY_DEPTH];
} exos_dataset_info_t;

StringAndArray data;

exos_dataset_info_t datasets[] = {
    {EXOS_DATASET_BROWSE_NAME_INIT},
    {EXOS_DATASET_BROWSE_NAME(MyInt1)},
    {EXOS_DATASET_BROWSE_NAME(MyInt3)},
    {EXOS_DATASET_BROWSE_NAME(MyInt3[0])}
};

void printDatasetInfo(exos_dataset_info_t dataset) {
    printf("Name: %s\n", dataset.name);
    printf("Address: %p\n", dataset.adr);
    printf("Size: %zu\n", dataset.size);
    printf("Offset: %ld\n", dataset.offset);
    printf("Array Items: ");
    
    for (int i = 0; i < EXOS_ARRAY_DEPTH; i++) {
        printf("%u ", dataset.arrayItems[i]);
    }
    
    printf("\n\n");
}

int main() {
    for (int i = 0; i < sizeof(datasets) / sizeof(datasets[0]); i++) {
        printDatasetInfo(datasets[i]);
    }
    
    return 0;
}
