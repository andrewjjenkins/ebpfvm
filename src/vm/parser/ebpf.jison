%lex

%options case-insensitive

%{

%}

%%
[\n]+ return "NL";
\s+   /* skip whitespace */
\/\/[^\n]* return "comment"  /* skip comments */

"ldh" return "ldh";
"ld" return "ld";
"[" return "[";
"]" return "]";
[%]?x return "x";
"+" return "+";
"M" return "M";
\#(0x)?[0-9]+ return "immediate";
(0x)?[0-9]+ return "offset";
<<EOF>> return "EOF";

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
  : ldh operands_1 { yy.current.opcode = "ldh"; }
  | ldh operands_2 { yy.current.opcode = "ldh"; }
  | ldb operands_1 { yy.current.opcode = "ldb"; }
  | ldb operands_2 { yy.current.opcode = "ldb"; }
  | ld operands_1 { yy.current.opcode = "ld"; }
  | ld operands_2 { yy.current.opcode = "ld"; }
  | ld operands_3 { yy.current.opcode = "ld"; }
  | ld operands_4 { yy.current.opcode = "ld"; }
  // 12
  | ldi operands_4 { yy.current.opcode = "ldi"; }
  ;

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
    yy.current.offset = parseInt($4);
};

operands_4: immediate {
    yy.current.mode = yy.OperandsModes.Immediate;
    yy.current.offset = parseInt($1);
};
