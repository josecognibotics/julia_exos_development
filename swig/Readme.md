
# Install 
```
sudo apt-get install swig
```

# Intial setup
```
cd $workspacefolder/Artefact/exos_api/swig
mkdir python
cd python
```

# Generate wrapper and python
```
swig -python -outcurrentdir -module exos-api ../../exos_api.h
```

### Output files are: 
```
exos-api.py
exos_api_wrap.c
```

### Trying out callback stuff with libmouse.c

https://stackoverflow.com/questions/22923696/how-to-wrap-a-c-function-which-takes-in-a-function-pointer-in-python-using-swi
Solution 5
