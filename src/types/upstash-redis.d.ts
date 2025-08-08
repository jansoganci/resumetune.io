declare module '@upstash/redis' {
  export class Redis {
    constructor(opts: { url: string; token: string });
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    set(key: string, value: string, opts?: { nx?: boolean; ex?: number }): Promise<'OK' | null>;
    del(key: string): Promise<number>;
    get(key: string): Promise<string | number | null>;
  }
}


