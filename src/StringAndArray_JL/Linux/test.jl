const config_stringandarray = """
{
    "name": "struct",
    "attributes": {
        "name": "<NAME>",
        "dataType": "StringAndArray",
        "info": "<infoId0>"
    },
    "children": [
        {
            "name": "variable",
            "attributes": {
                "name": "MyInt1",
                "dataType": "UDINT",
                "comment": "PUB",
                "info": "<infoId1>"
            }
        },
        {
            "name": "variable",
            "attributes": {
                "name": "MyString",
                "dataType": "STRING",
                "stringLength": 81,
                "comment": "PUB",
                "arraySize": 3,
                "info": "<infoId2>",
                "info2": "<infoId3>"
            }
        },
        {
            "name": "variable",
            "attributes": {
                "name": "MyInt2",
                "dataType": "USINT",
                "comment": "PUB SUB",
                "arraySize": 5,
                "info": "<infoId4>",
                "info2": "<infoId5>"
            }
        },
        {
            "name": "struct",
            "attributes": {
                "name": "MyIntStruct",
                "dataType": "IntStruct_typ",
                "comment": "PUB SUB",
                "arraySize": 6,
                "info": "<infoId6>",
                "info2": "<infoId7>"
            },
            "children": [
                {
                    "name": "variable",
                    "attributes": {
                        "name": "MyInt13",
                        "dataType": "UDINT",
                        "info": "<infoId8>"
                    }
                },
                {
                    "name": "variable",
                    "attributes": {
                        "name": "MyInt14",
                        "dataType": "USINT",
                        "arraySize": 3,
                        "info": "<infoId9>",
                        "info2": "<infoId10>"
                    }
                },
                {
                    "name": "variable",
                    "attributes": {
                        "name": "MyInt133",
                        "dataType": "UDINT",
                        "info": "<infoId11>"
                    }
                },
                {
                    "name": "variable",
                    "attributes": {
                        "name": "MyInt124",
                        "dataType": "USINT",
                        "arraySize": 3,
                        "info": "<infoId12>",
                        "info2": "<infoId13>"
                    }
                }
            ]
        },
        {
            "name": "struct",
            "attributes": {
                "name": "MyIntStruct1",
                "dataType": "IntStruct1_typ",
                "comment": "PUB SUB",
                "info": "<infoId14>"
            },
            "children": [
                {
                    "name": "variable",
                    "attributes": {
                        "name": "MyInt13",
                        "dataType": "UDINT",
                        "info": "<infoId15>"
                    }
                }
            ]
        },
        {
            "name": "struct",
            "attributes": {
                "name": "MyIntStruct2",
                "dataType": "IntStruct2_typ",
                "comment": "PUB SUB",
                "info": "<infoId16>"
            },
            "children": [
                {
                    "name": "variable",
                    "attributes": {
                        "name": "MyInt23",
                        "dataType": "UDINT",
                        "info": "<infoId17>"
                    }
                },
                {
                    "name": "variable",
                    "attributes": {
                        "name": "MyInt24",
                        "dataType": "USINT",
                        "arraySize": 4,
                        "info": "<infoId18>",
                        "info2": "<infoId19>"
                    }
                },
                {
                    "name": "variable",
                    "attributes": {
                        "name": "MyInt25",
                        "dataType": "UDINT",
                        "info": "<infoId20>"
                    }
                }
            ]
        }
    ]
}
"""