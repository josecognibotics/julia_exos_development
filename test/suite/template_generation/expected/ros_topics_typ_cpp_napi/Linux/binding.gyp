{
  "targets": [
    {
      "target_name": "l_ros_topics_typ",
      "sources": [
        "libros_topics_typ.c",
        "exos_ros_topics_typ.c"
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
