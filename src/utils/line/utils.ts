type Overlap<A, B> = Extract<keyof A, keyof B>;
type NoOverlap<A, B> = [Overlap<A, B>] extends [never] ? true : false;
export type SafeMerge<A, B, C extends string> = NoOverlap<A, B> extends true
  ? A & B
  : { ERROR: C; Duplicates: Overlap<A, B> };
