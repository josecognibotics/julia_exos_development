{
  "targets": [
    {
      "target_name": "l_WaterTank",
      "sources": [
        "libwatertank.c"
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
