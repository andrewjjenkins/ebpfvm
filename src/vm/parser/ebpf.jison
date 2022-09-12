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

//extensions
"len" return "len";

// operands
4\s*\*\s*\(\s*\[ return "fourxopen";
\]\s*\&\s*0xf\s*\) return "fourxclose";
[%]?x return "x";
"+" return "+";
"M" return "M";
"[" return "[";
"]" return "]";
\#(0x)?[0-9]+ return "immediate";
(0x)?[0-9]+ return "offset";

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

operands_12: extension {
    yy.current.mode = yy.OperandsModes.Extension;
    yy.current.extension = $1;
};

extension: len;
