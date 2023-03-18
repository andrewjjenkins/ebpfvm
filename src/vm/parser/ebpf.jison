/*
 * Copyright 2023 Andrew Jenkins <andrewjjenkins@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
// Load/store
"ldxw" return "ldxw";
"ldxh" return "ldxh";
"ldxb" return "ldxb";
"ldxdw" return "ldxdw";
"lddw" return "lddw";
"stw" return "stw";
"sth" return "sth"
"stb" return "stb"
"stdw" return "stdw";
"stxw" return "stxw";
"stxh" return "stxh";
"stxb" return "stxb";
"stxdw" return "stxdw";

// Jumps
"jeq" return "jeq";
"jneq" return "jneq";  // synonym for jne
"jne" return "jne";
"jlt" return "jlt";
"jle" return "jle";
"jgt" return "jgt";
"jge" return "jge";
"jset" return "jset";
"jsgt" return "jsgt";
"jsge" return "jsge";
"jslt" return "jslt";
"jsle" return "jsle";
"ja" return "ja";
"call" return "call";
"exit" return "exit";

// ALU
"add" return "add";
"sub" return "sub";
"mul" return "mul";
"div" return "div";
"or" return "or";
"and" return "and";
"lsh" return "lsh";
"rsh" return "rsh";
"neg" return "neg"; // Unary
"mod" return "mod";
"xor" return "xor";
"mov" return "mov";
"arsh" return "arsh";
"add32" return "add32";
"sub32" return "sub32";
"mul32" return "mul32";
"div32" return "div32";
"or32" return "or32";
"and32" return "and32";
"lsh32" return "lsh32";
"rsh32" return "rsh32";
"neg32" return "neg32"; // Unary
"mod32" return "mod32";
"xor32" return "xor32";
"mov32" return "mov32";
"arsh32" return "arsh32";

// Endianness
"le16" return "le16";
"le32" return "le32";
"le64" return "le64";
"be16" return "be16";
"be32" return "be32";
"be64" return "be64";


// operands
[%]?r[0-9]{1,2} return "register";
[+-] return "direction";
"[" return "[";
"]" return "]";
"," return ",";
":" return ":";
[a-zA-Z_][a-zA-Z0-9_]* return "label";
[\#]?[-]?(0x)?[0-9a-fA-F]+ return "constant";

/lex

%%

start: program "EOF";

program
  : /* empty */
  | program line {
    yy.currentLine++;
  }
  ;

line: comment_line | labeled_statement_line | statement_line;

comment_line: comment NL;

labeled_statement_line: label ":" statement_line {
    const l = $1;
    if (l in yy.labels) {
        throw new Error("Label " + l + " redefined");
    }
    yy.labels[l] = yy.instructions.length - 1;
};

statement_line: statement NL {
    yy.current.lineNumber = yy.currentLine;
    yy.instructions.push(yy.current);
    yy.current = {};
};

statement
  : lddw_statement { yy.current.opname = "lddw"; }
  | ldxw_statement { yy.current.opname = "ldxw"; }
  | ldxh_statement { yy.current.opname = "ldxh"; }
  | ldxb_statement { yy.current.opname = "ldxb"; }
  | ldxdw_statement { yy.current.opname = "ldxdw"; }
  | stw_statement { yy.current.opname = "stw"; }
  | sth_statement { yy.current.opname = "sth"; }
  | stb_statement { yy.current.opname = "stb"; }
  | stdw_statement { yy.current.opname = "stdw"; }
  | stxw_statement { yy.current.opname = "stxw"; }
  | stxh_statement { yy.current.opname = "stxh"; }
  | stxb_statement { yy.current.opname = "stxb"; }
  | stxdw_statement { yy.current.opname = "stxdw"; }
  | jeq_statement { yy.current.opname = "jeq"; }
  | jneq_statement { yy.current.opname = "jne"; }  // synonym for jne
  | jne_statement { yy.current.opname = "jne"; }
  | jlt_statement { yy.current.opname = "jlt"; }
  | jle_statement { yy.current.opname = "jle"; }
  | jgt_statement { yy.current.opname = "jgt"; }
  | jge_statement { yy.current.opname = "jge"; }
  | jset_statement { yy.current.opname = "jset"; }
  | jsgt_statement { yy.current.opname = "jsgt"; }
  | jsge_statement { yy.current.opname = "jsge"; }
  | jslt_statement { yy.current.opname = "jslt"; }
  | jsle_statement { yy.current.opname = "jsle"; }
  | ja_statement { yy.current.opname = "ja"; }
  | call_statement { yy.current.opname = "call"; }
  | exit_statement { yy.current.opname = "exit"; }
  | add_statement { yy.current.opname = "add"; }
  | sub_statement { yy.current.opname = "sub"; }
  | mul_statement { yy.current.opname = "mul"; }
  | div_statement { yy.current.opname = "div"; }
  | or_statement { yy.current.opname = "or"; }
  | and_statement { yy.current.opname = "and"; }
  | lsh_statement { yy.current.opname = "lsh"; }
  | rsh_statement { yy.current.opname = "rsh"; }
  | neg_statement { yy.current.opname = "neg"; }
  | mod_statement { yy.current.opname = "mod"; }
  | xor_statement { yy.current.opname = "xor"; }
  | mov_statement { yy.current.opname = "mov"; }
  | arsh_statement { yy.current.opname = "arsh"; }
  | add32_statement { yy.current.opname = "add32"; }
  | sub32_statement { yy.current.opname = "sub32"; }
  | mul32_statement { yy.current.opname = "mul32"; }
  | div32_statement { yy.current.opname = "div32"; }
  | or32_statement { yy.current.opname = "or32"; }
  | and32_statement { yy.current.opname = "and32"; }
  | lsh32_statement { yy.current.opname = "lsh32"; }
  | rsh32_statement { yy.current.opname = "rsh32"; }
  | neg32_statement { yy.current.opname = "neg32"; }
  | mod32_statement { yy.current.opname = "mod32"; }
  | xor32_statement { yy.current.opname = "xor32"; }
  | mov32_statement { yy.current.opname = "mov32"; }
  | arsh32_statement { yy.current.opname = "arsh32"; }
  | le16_statement { yy.current.opname = "le16"; }
  | le32_statement { yy.current.opname = "le32"; }
  | le64_statement { yy.current.opname = "le64"; }
  | be16_statement { yy.current.opname = "be16"; }
  | be32_statement { yy.current.opname = "be32"; }
  | be64_statement { yy.current.opname = "be64"; }
  ;

lddw_statement: lddw operands_reg_imm;

ldxw_statement: ldxw operands_mem_reg_load | ldxw operands_mem_reg_offset_load;
ldxh_statement: ldxh operands_mem_reg_load | ldxh operands_mem_reg_offset_load;
ldxb_statement: ldxb operands_mem_reg_load | ldxb operands_mem_reg_offset_load;
ldxdw_statement: ldxdw operands_mem_reg_load | ldxdw operands_mem_reg_offset_load;

/* ldabs / ldind not supported yet */

stw_statement: stw operands_mem_imm | stw operands_mem_imm_offset;
sth_statement: sth operands_mem_imm | sth operands_mem_imm_offset;
stb_statement: stb operands_mem_imm | stb operands_mem_imm_offset;
stdw_statement: stdw operands_mem_imm | stdw operands_mem_imm_offset;
stxw_statement: stxw operands_mem_reg_store | stxw operands_mem_reg_offset_store;
stxh_statement: stxh operands_mem_reg_store | stxh operands_mem_reg_offset_store;
stxb_statement: stxb operands_mem_reg_store | stxb operands_mem_reg_offset_store;
stxdw_statement: stxdw operands_mem_reg_store | stxdw operands_mem_reg_offset_store;

ja_statement: ja operands_offset;
jeq_statement: jeq operands_branch_imm | jeq operands_branch_reg;
jgt_statement: jgt operands_branch_imm | jgt operands_branch_reg;
jge_statement: jge operands_branch_imm | jge operands_branch_reg;
jlt_statement: jlt operands_branch_imm | jlt operands_branch_reg;
jle_statement: jle operands_branch_imm | jle operands_branch_reg;
jset_statement: jset operands_branch_imm | jset operands_branch_reg;
jne_statement: jne operands_branch_imm | jne operands_branch_reg;
jneq_statement: jneq operands_branch_imm | jneq operands_branch_reg; //synonym for jne
jsgt_statement: jsgt operands_branch_imm | jsgt operands_branch_reg;
jsge_statement: jsge operands_branch_imm | jsge operands_branch_reg;
jslt_statement: jslt operands_branch_imm | jslt operands_branch_reg;
jsle_statement: jsle operands_branch_imm | jsle operands_branch_reg;
call_statement: call operands_imm | call operands_label;
exit_statement: exit operands_none;

add_statement: add operands_reg_imm | add operands_reg_reg;
sub_statement: sub operands_reg_imm | sub operands_reg_reg;
mul_statement: mul operands_reg_imm | mul operands_reg_reg;
div_statement: div operands_reg_imm | div operands_reg_reg;
or_statement: or operands_reg_imm | or operands_reg_reg;
and_statement: and operands_reg_imm | and operands_reg_reg;
lsh_statement: lsh operands_reg_imm | lsh operands_reg_reg;
rsh_statement: rsh operands_reg_imm | rsh operands_reg_reg;
neg_statement: neg operands_reg;
mod_statement: mod operands_reg_imm | mod operands_reg_reg;
xor_statement: xor operands_reg_imm | xor operands_reg_reg;
mov_statement: mov operands_reg_imm | mov operands_reg_reg;
arsh_statement: arsh operands_reg_imm | arsh operands_reg_reg;
add32_statement: add32 operands_reg_imm | add32 operands_reg_reg;
sub32_statement: sub32 operands_reg_imm | sub32 operands_reg_reg;
mul32_statement: mul32 operands_reg_imm | mul32 operands_reg_reg;
div32_statement: div32 operands_reg_imm | div32 operands_reg_reg;
or32_statement: or32 operands_reg_imm | or32 operands_reg_reg;
and32_statement: and32 operands_reg_imm | and32 operands_reg_reg;
lsh32_statement: lsh32 operands_reg_imm | lsh32 operands_reg_reg;
rsh32_statement: rsh32 operands_reg_imm | rsh32 operands_reg_reg;
neg32_statement: neg32 operands_reg;
mod32_statement: mod32 operands_reg_imm | mod32 operands_reg_reg;
xor32_statement: xor32 operands_reg_imm | xor32 operands_reg_reg;
mov32_statement: mov32 operands_reg_imm | mov32 operands_reg_reg;
arsh32_statement: arsh32 operands_reg_imm | arsh32 operands_reg_reg;

le16_statement: le16 operands_reg;
le32_statement: le32 operands_reg;
le64_statement: le64 operands_reg;
be16_statement: be16 operands_reg;
be32_statement: be32 operands_reg;
be64_statement: be64 operands_reg;

operands_imm: constant {
  yy.current.mode = yy.InstructionOpMode.EBPF_MODE_IMM;
  yy.current.imm = BigInt(($1).replace(/^\#/,''));
};

operands_label: label {
  yy.current.mode = yy.InstructionOpMode.EBPF_MODE_IMM;
  yy.current.label = $1;
};

operands_mem_reg_load: register "," "[" register "]" {
  yy.current.mode = yy.InstructionOpMode.EBPF_MODE_MEM;
  yy.current.dest = ($1).replace(/^%/, '');
  yy.current.source = ($4).replace(/^%/, '');
  yy.current.offset = 0;
  yy.current.imm = BigInt(0);
};

operands_mem_reg_offset_load: register "," "[" register direction constant "]" {
  yy.current.mode = yy.InstructionOpMode.EBPF_MODE_MEM;
  yy.current.dest = ($1).replace(/^%/, '');
  yy.current.source = ($4).replace(/^%/, '');
  yy.current.offset = parseInt($6);
  if ($5 === "-") {
    yy.current.offset = -yy.current.offset;
  }
  yy.current.imm = BigInt(0);
};

operands_mem_reg_store: "[" register "]" "," register {
  yy.current.mode = yy.InstructionOpMode.EBPF_MODE_MEM;
  yy.current.dest = ($2).replace(/^%/, '');
  yy.current.source = ($5).replace(/^%/, '');
  yy.current.offset = 0;
  yy.current.imm = BigInt(0);
};

operands_mem_reg_offset_store: "[" register direction constant "]" "," register {
  yy.current.mode = yy.InstructionOpMode.EBPF_MODE_MEM;
  yy.current.dest = ($2).replace(/^%/, '');
  yy.current.source = ($7).replace(/^%/, '');
  yy.current.offset = parseInt($4);
  if ($3 === "-") {
    yy.current.offset = -yy.current.offset;
  }
  yy.current.imm = BigInt(0);
};

operands_mem_imm: "[" register "]" "," constant {
  yy.current.mode = yy.InstructionOpMode.EBPF_MODE_MEM;
  yy.current.dest = ($2).replace(/^%/, '');
  yy.current.source = 0;
  yy.current.offset = 0;
  yy.current.imm = BigInt(($5).replace(/^\#/,''));
};

operands_mem_imm_offset: "[" register direction constant "]" "," constant {
  yy.current.mode = yy.InstructionOpMode.EBPF_MODE_MEM;
  yy.current.dest = ($2).replace(/^%/, '');
  yy.current.source = 0;
  yy.current.offset = parseInt($4);
  if ($3 === "-") {
    yy.current.offset = -yy.current.offset;
  }
  yy.current.imm = BigInt(($7).replace(/^\#/,''));
};

operands_reg: register {
  yy.current.mode = yy.InstructionOpMode.EBPF_MODE_IMM;
  yy.current.dest = ($1).replace(/^%/, '');
  yy.current.source = "";
  yy.current.offset = 0;
  yy.current.imm = BigInt(0);
};

operands_reg_imm: register "," constant {
  yy.current.mode = yy.InstructionOpMode.EBPF_MODE_IMM;
  yy.current.dest = ($1).replace(/^%/, '');
  yy.current.source = "";
  yy.current.offset = 0;
  yy.current.imm = BigInt(($3).replace(/^\#/,''));
};

operands_reg_reg: register "," register {
  yy.current.dest = ($1).replace(/^%/, '');
  yy.current.source = ($3).replace(/^%/, '');
  yy.current.offset = 0;
  yy.current.imm = BigInt(0);
};

operands_offset: direction constant {
  yy.current.dest = "";
  yy.current.source = "";
  yy.current.offset = parseInt($2);
  if ($1 === "-") {
    yy.current.offset = -yy.current.offset;
  }
  yy.current.imm = BigInt(0);
};

operands_branch_imm: register "," constant "," direction constant {
  yy.current.dest = ($1).replace(/^%/, '');
  yy.current.source = "";
  yy.current.offset = parseInt($6);
  if ($5 === "-") {
    yy.current.offset = -yy.current.offset;
  }
  yy.current.imm = BigInt(($3).replace(/^\#/,''));
};

operands_branch_reg: register "," register "," direction constant {
  yy.current.dest = ($1).replace(/^%/, '');
  yy.current.source = ($3).replace(/^%/, '');;
  yy.current.offset = parseInt($6);
  if ($5 === "-") {
    yy.current.offset = -yy.current.offset;
  }
  yy.current.imm = BigInt(0);
};

operands_none: {
  yy.current.mode = yy.InstructionOpMode.EBPF_MODE_IMM;
  yy.current.source = "";
  yy.current.dest = "";
  yy.current.offset = 0;
  yy.current.imm = BigInt(0);
};
