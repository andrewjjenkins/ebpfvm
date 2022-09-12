%lex

%options case-insensitive

%{

%}

%%
[\n]+ return "NL";
\s+   /* skip whitespace */
\/\/[^\n]* return "comment"  /* skip comments */
<<EOF>> return "EOF";

// opcodes
"ld" return "ld";
"ldi" return "ldi";
"ldh" return "ldh";
"ldb" return "ldb";
"ldx" return "ldx";
"ldxi" return "ldxi";
"ldxb" return "ldxb";
"jmp" return "jmp";
"ja" return "ja";
"jeq" return "jeq";
"jneq" return "jneq";
"jne" return "jne";
"jlt" return "jlt";
"jle" return "jle";
"jgt" return "jgt";
"jge" return "jge";
"jset" return "jset";
"ret" return "ret";

//extensions
"len" return "len";

// operands
4\s*\*\s*\(\s*\[ return "fourxopen";
\]\s*\&\s*0xf\s*\) return "fourxclose";
[%]?x return "x";
[%]?a return "a";
"+" return "+";
"M" return "M";
"[" return "[";
"]" return "]";
"," return ",";
\#(0x)?[0-9]+ return "immediate";
(0x)?[0-9]+ return "offset";
[A-Za-z_]\w* return "label";

/lex

%%

start: program "EOF";

program
  : /* empty */
  | program line {
    yy.currentLine++;
  }
  ;

line: comment NL | statement_line;

comment_line: comment NL;

statement_line: statement NL {
    yy.instructions.push(yy.current);
    yy.current = {};
};

statement
  : ld_statement { yy.current.opcode = "ld"; }
  | ldi_statement { yy.current.opcode = "ldi"; }
  | ldh_statement { yy.current.opcode = "ldh"; }
  | ldb_statement { yy.current.opcode = "ldb"; }
  | ldx_statement { yy.current.opcode = "ldx"; }
  | ldxi_statement { yy.current.opcode = "ldxi"; }
  | ldxb_statement { yy.current.opcode = "ldxb"; }
  | jmp_statement { yy.current.opcode = "jmp"; }
  | ja_statement { yy.current.opcode = "ja"; }
  | jeq_statement { yy.current.opcode = "jeq"; }
  | jneq_statement { yy.current.opcode = "jneq"; }
  | jne_statement { yy.current.opcode = "jne"; }
  | jlt_statement { yy.current.opcode = "jlt"; }
  | jle_statement { yy.current.opcode = "jle"; }
  | jgt_statement { yy.current.opcode = "jgt"; }
  | jge_statement { yy.current.opcode = "jge"; }
  | jset_statement { yy.current.opcode = "jset"; }
  | ret_statement { yy.current.opcode = "ret"; }
  ;

ld_statement: ld operands_1 | ld operands_2 | ld operands_3
  | ld operands_4 | ld operands_12;
ldi_statement: ldi operands_4;
ldh_statement: ldh operands_1 | ldh operands_2;
ldb_statement: ldb operands_1 | ldb operands_2;
ldx_statement: ldx operands_3 | ldx operands_4 | ldx operands_5
  | ldx operands_12;
ldxi_statement: ldxi operands_4;
ldxb_statement: ldxb operands_5;

jmp_statement: jmp operands_6;
ja_statement: ja operands_6;
jeq_statement: jeq operands_7 | jeq operands_8 | jeq operands_9
  | jeq operands_10;
jneq_statement: jneq operands_9 | jneq operands_10;
jne_statement: jne operands_9 | jne operands_10;
jlt_statement: jlt operands_9 | jlt operands_10;
jle_statement: jle operands_9 | jle operands_10;
jgt_statement: jgt operands_7 | jgt operands_8 | jgt operands_9
  | jgt operands_10;
jge_statement: jge operands_7 | jge operands_8 | jge operands_9
  | jge operands_10;
jset_statement: jset operands_7 | jset operands_8 | jset operands_9
  | jset operands_10;

ret_statement: ret operands_4 | ret operands_11;

// Numbering from
// https://www.kernel.org/doc/Documentation/networking/filter.txt
operands_0: x {
    yy.current.mode = yy.OperandsModes.Register;
};

operands_1: "[" offset "]" {
    yy.current.mode = yy.OperandsModes.Packet;
    yy.current.offset = parseInt($2);
};

operands_2: "[" x "+" offset "]" {
    yy.current.mode = yy.OperandsModes.PacketOffset;
    yy.current.register = ($2).replace(/^%/,'');
    yy.current.offset = parseInt($4);
};

operands_3: "M" "[" offset "]" {
    yy.current.mode = yy.OperandsModes.Memory;
    yy.current.offset = parseInt($3);
};

operands_4: immediate {
    yy.current.mode = yy.OperandsModes.Immediate;
    yy.current.offset = parseInt(($1).replace(/^\#/,''));
};

operands_5: fourxopen offset fourxclose {
    yy.current.mode = yy.OperandsModes.FourXPacketNibble;
    yy.current.offset = parseInt($2);
};

operands_6: label {
    yy.current.mode = yy.OperandsModes.Label;
    yy.current.label = $1;
};

operands_7: immediate "," label "," label {
    yy.current.mode = yy.OperandsModes.JumpTFImmediate;
    yy.current.offset = parseInt(($1).replace(/^\#/,''));
    yy.current.true = $3;
    yy.current.false = $5;
};

operands_8: x "," label "," label {
    yy.current.mode = yy.OperandsModes.JumpTFRegister;
    yy.current.register = ($1).replace(/^%/,'');
    yy.current.true = $3;
    yy.current.false = $5;
};

operands_9: immediate "," label {
    yy.current.mode = yy.OperandsModes.JumpImmediate;
    yy.current.offset = parseInt(($1).replace(/^\#/,''));
    yy.current.true = $3;
};

operands_10: x "," label {
    yy.current.mode = yy.OperandsModes.JumpRegister;
    yy.current.register = ($1).replace(/^%/,'');
    yy.current.true = $3;
};

operands_11: a {
    yy.current.mode = yy.OperandsModes.Accumulator;
};

operands_12: extension {
    yy.current.mode = yy.OperandsModes.Extension;
    yy.current.extension = $1;
};

extension: len;
