/*Automatically generated header file from Mouse.typ*/

#ifndef _MOUSE_H_
#define _MOUSE_H_

#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <unistd.h>
#include <stdbool.h>

typedef struct MouseMovement
{
    int16_t Xrel;
    int16_t Yrel;
    int16_t X;
    int16_t Y;

} MouseMovement;

typedef struct MouseButtons
{
    int16_t LeftButton;
    bool RightButton;

} MouseButtons;

typedef struct Mouse
{
    bool ResetXXXY;                //PUB
    struct MouseMovement Movement; //SUB
    struct MouseButtons Buttons;   //IN SUB out

} Mouse;

#endif // _MOUSE_H_
