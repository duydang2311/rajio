export type SnakeToCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
    : S;

export type CamelCase<T> =
    T extends Array<infer U>
        ? Array<CamelCase<U>>
        : T extends object
          ? {
                [K in keyof T as SnakeToCamel<K & string>]: CamelCase<T[K]>;
            }
          : T;
