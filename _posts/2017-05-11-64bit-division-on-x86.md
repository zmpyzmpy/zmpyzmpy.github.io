---
layout: post
title:  "64 bits division implemented on x86"
date: 2017-05-11 19:30:58 +0200 
tags: x86

---

First I want to sort out some interesting projects or pieces of code that I worked on during my Bachelor study @ [Beihang University](http://ev.buaa.edu.cn/). This code was implemented by me during the course "X86 Assembly Language Programming", this is an extra curricular assignment.

The requirement is to implement a 64-bit division program on x86 Assembly. The input is two 64 bits numbers, and output the quotient and the remainder.

Here is the code:
{% highlight assembly %}
STACK		SEGMENT	PARA STACK
		DB	100H DUP(?)
STACK_BTM	EQU	$ - STACK_AREA
STACK		ENDS

DATA		SEGMENT		PARA
dividend_lo	DD		12061165H	;lower 32 bits of the dividend
dividend_hi	DD		12061165H	;higher 32 bits of the dividend

divisor_lo1	DD		0H	
divisor_lo2	DD		0H	

divisor_hi1	DD		12345678H	;divisor
divisor_hi2	DD		0H		;divisor

quotient_lo	DD		0H	;quotient
quotient_hi	DD		0H	;quotient

remainder_lo1	DD		0H	;remainder
remainder_lo2	DD		0H	;remainder
remainder_hi1	DD		0H	
remainder_hi2	DD		0H	



DATA		ENDS

CODE		SEGMENT		PARA
		ASSUME	CS:CODE,DS:DATA,SS:STACK

MAIN		PROC	FAR

		MOV	AX,DATA
		MOV	DS,AX

		XOR	DL,DL
							;check whether the divisor is 0
		MOV	AX,WORD PTR divisor_hi1+2
		CMP	AX,0
		JZ	N_1
		INC	DL

N_1:		MOV	AX,WORD PTR divisor_hi1
		CMP	AX,0
		JZ	N_2
		INC	DL

N_2:		MOV	AX,WORD PTR divisor_hi2+2
		CMP	AX,0
		JZ	N_3
		INC	DL

N_3:		MOV	AX,WORD PTR divisor_hi2
		CMP	AX,0
		JZ	N_4
		INC	DL


N_4:		CMP	DL,0
		JZ	EXIT

		MOV	AX,WORD PTR dividend_hi+2
		MOV	WORD PTR remainder_lo2+2,AX
		MOV	AX,WORD PTR dividend_hi
		MOV	WORD PTR remainder_lo2,AX
		MOV	AX,WORD PTR dividend_lo+2
		MOV	WORD PTR remainder_lo1+2,AX
		MOV	AX,WORD PTR dividend_lo
		MOV	WORD PTR remainder_lo1,AX
		MOV	CX,0H


SSUUBB:		MOV	DX,WORD PTR remainder_lo1+2	
		MOV	AX,WORD PTR remainder_lo1
		PUSH	DX
		PUSH	AX
		SUB	AX,WORD PTR divisor_lo1
		SBB	DX,WORD PTR divisor_lo1+2
		MOV	WORD PTR remainder_lo1,AX
		MOV	WORD PTR remainder_lo1+2,DX

		MOV	DX,WORD PTR remainder_lo2+2	
		MOV	AX,WORD PTR remainder_lo2
		PUSH	DX
		PUSH	AX
		SBB	AX,WORD PTR divisor_lo2
		SBB	DX,WORD PTR divisor_lo2+2
		MOV	WORD PTR remainder_lo2,AX
		MOV	WORD PTR remainder_lo2+2,DX	

		MOV	DX,WORD PTR remainder_hi1+2	
		MOV	AX,WORD PTR remainder_hi1
		PUSH	DX
		PUSH	AX
		SBB	AX,WORD PTR divisor_hi1
		SBB	DX,WORD PTR divisor_hi1+2
		MOV	WORD PTR remainder_hi1,AX
		MOV	WORD PTR remainder_hi1+2,DX

		MOV	DX,WORD PTR remainder_hi2+2	
		MOV	AX,WORD PTR remainder_hi2
		PUSH	DX
		PUSH	AX
		SBB	AX,WORD PTR divisor_hi2
		SBB	DX,WORD PTR divisor_hi2+2
		MOV	WORD PTR remainder_hi2,AX
		MOV	WORD PTR remainder_hi2+2,DX
	
		JC	RESTORE
		CALL	LEFT_SHIFT_1
		JMP	SSUUBB_END
		
SSUUBB_END:	CALL	RIGHT_SHIFT

		INC	CX
		CMP	CX,65
		JZ	EXIT
		JMP	SSUUBB
		



RESTORE:	POP	WORD PTR remainder_hi2
		POP	WORD PTR remainder_hi2+2
		POP	WORD PTR remainder_hi1
		POP	WORD PTR remainder_hi1+2
		POP	WORD PTR remainder_lo2
		POP	WORD PTR remainder_lo2+2
		POP	WORD PTR remainder_lo1
		POP	WORD PTR remainder_lo1+2
		
		CALL	LEFT_SHIFT_0
		JMP	SSUUBB_END


EXIT:		MOV	AX,4C00H
		INT	21H

MAIN		ENDP

LEFT_SHIFT_0	PROC					;left shift the quotient, and set the last bit of it to 1
		MOV	AX,WORD PTR quotient_lo
		SHL	AX,1
		MOV	DL,0H
		MOV	DH,0H
		MOV	WORD PTR quotient_lo,AX
		JC	A_10
		JMP	S_20
A_10:		MOV	DL,1H

S_20:		MOV	AX,WORD PTR quotient_lo+2
		SHL	AX,1
		JC	A_20
P1:		OR	AL,DL
		MOV	DL,0H
		MOV	WORD PTR quotient_lo+2,AX
		
		JMP	S_30
A_20:		MOV	DH,1H
		JMP	P1

S_30:		MOV	AX,WORD PTR quotient_hi
		SHL	AX,1
		JC	A_30
P2:		OR	AL,DH
		MOV	DH,0H
		MOV	WORD PTR quotient_hi,AX
		
		JMP	S_40
A_30:		MOV	DL,1H
		JMP	P2

S_40:		MOV	AX,WORD PTR quotient_hi+2
		SHL	AX,1
		OR	AL,DL
		MOV	WORD PTR quotient_hi+2,AX

		RET
LEFT_SHIFT_0	ENDP

LEFT_SHIFT_1	PROC					;left shift the quotient, and set the last bit of it to 1
		MOV	AX,WORD PTR quotient_lo
		SHL	AX,1
		MOV	DH,0H
		MOV	DL,0H
		JC	A_1
M1:		OR	AL,1H
		MOV	WORD PTR quotient_lo,AX
		JMP	S_2

A_1:		MOV	DL,1H
		JMP	M1

S_2:		MOV	AX,WORD PTR quotient_lo+2
		SHL	AX,1
		JC	A_2
M2:		OR	AL,DL
		MOV	DL,0H
		MOV	WORD PTR quotient_lo+2,AX
		
		JMP	S_3
A_2:		MOV	DH,1H
		JMP	M2

S_3:		MOV	AX,WORD PTR quotient_hi
		SHL	AX,1
		JC	A_3
M3:		OR	AL,DH
		MOV	DH,0H
		MOV	WORD PTR quotient_hi,AX
		
		JMP	S_4
A_3:		MOV	DL,1H
		JMP	M3

S_4:		MOV	AX,WORD PTR quotient_hi+2
		SHL	AX,1
		OR	AL,DL
		MOV	WORD PTR quotient_hi+2,AX

		RET
LEFT_SHIFT_1	ENDP

RIGHT_SHIFT	PROC					;right shift the divisor
		MOV	AX,WORD PTR divisor_hi2+2
		SHR	AX,1
		MOV	DH,0H
		MOV	DL,0H
		MOV	WORD PTR divisor_hi2+2,AX
		JC	A_11
		JMP	S_21
A_11:		MOV	DH,80H
		JMP	S_21

S_21:		MOV	AX,WORD PTR divisor_hi2
		SHR	AX,1
		JC	A_21
Z1:		OR	AH,DH
		MOV	DH,0H
		MOV	WORD PTR divisor_hi2,AX
		
		JMP	S_31
A_21:		MOV	DL,80H
		JMP	Z1

S_31:		MOV	AX,WORD PTR divisor_hi1+2
		SHR	AX,1
		JC	A_31
Z2:		OR	AH,DL
		MOV	DL,0H
		MOV	WORD PTR divisor_hi1+2,AX
		
		JMP	S_41
A_31:		MOV	DH,80H
		JMP	Z2

S_41:		MOV	AX,WORD PTR divisor_hi1
		SHR	AX,1
		JC	A_41
Z3:		OR	AH,DH
		MOV	DH,0H
		MOV	WORD PTR divisor_hi1,AX
		
		JMP	S_51
A_41:		MOV	DL,80H
		JMP	Z3

S_51:		MOV	AX,WORD PTR divisor_lo2+2
		SHR	AX,1
		JC	A_51
Z4:		OR	AH,DL
		MOV	DL,0H
		MOV	WORD PTR divisor_lo2+2,AX
		
		JMP	S_61
A_51:		MOV	DH,80H
		JMP	Z4

S_61:		MOV	AX,WORD PTR divisor_lo2
		SHR	AX,1
		JC	A_61
Z5:		OR	AH,DH
		MOV	DH,0H
		MOV	WORD PTR divisor_lo2,AX
		
		JMP	S_71
A_61:		MOV	DL,80H
		JMP	Z5

S_71:		MOV	AX,WORD PTR divisor_lo1+2
		SHR	AX,1
		JC	A_71
Z6:		OR	AH,DL
		MOV	DL,0H
		MOV	WORD PTR divisor_lo1+2,AX
		
		JMP	S_81
A_71:		MOV	DH,80H
		JMP	Z6

S_81:		MOV	AX,WORD PTR divisor_lo1
		SHR	AX,1
		OR	AH,DH
		MOV	WORD PTR divisor_lo1,AX
		RET
RIGHT_SHIFT	ENDP

CODE		ENDS
		END	MAIN
{% endhighlight %}

We first check if the divisor is 0, if it is 0, we exit the whole program.

If not, we do the division in the following iteration: 

1. First use the dividend minus the divisor, and store the result in the quotient register.
2. Then compare the quotient with 0:
   1. If it is smaller than 0, add the divisor to the quotient register to restore the original value, and store this value in the quotient register, then left shift the quotient register, and set the last bit to 0.
   2. Else left shift the quotient register, and set the last bit to 1.
3. Right shift the divisor register.

We do this iteration for 64 times to get the result.

This is a common algorithm for division in lower level of a computer, and it can be found in many textbooks for computer structure. e.g.

![Division algorithm]({{site.url}}/images/posts/division.png)

Note that this figure was from *"Patterson, David A., and John L. Hennessy. Computer organization and design: the hardware/software interface.* 3rd edition".
