{
  "targets": [
    {
      "target_name": "l_StringAndArray",
      "sources": [
        "libstringandarray.c",
        "exos_stringandarray.c"
      ],
      "include_dirs": [
        '/usr/include'
      ],  
      'link_settings': {
        'libraries': [
          '-lexos-api',
          '-lzmq'
        ]
      }
    }
  ]
}
