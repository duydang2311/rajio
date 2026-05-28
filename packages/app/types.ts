export type SnakeToCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
    : S;

export type CamelCaseKeys<T> = {
    [K in keyof T as K extends string ? SnakeToCamel<K> : K]: T[K];
};

export type EncodedKeys<T, K extends keyof T> = {
    [P in keyof T]: P extends K ? string : T[P];
};
