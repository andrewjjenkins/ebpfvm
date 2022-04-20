export const DEFAULT_MEMORY_INIT = "hello world";
export const DEFAULT_MEMORY_MIN_SIZE = 128;

export const DEFAULT_PROGRAM = [
    '     ldh [12]',
    '     jeq #ETHERTYPE_IP, L1, L2',
    'L1:  ret #TRUE',
    'L2:  ret #0',
];
