/** @jsx h */
export interface anyObject {
    [key: string]: any;
    [key: number]: any;
}
interface IsEqualOptions {
    deep?: boolean;
    symbol?: boolean;
    skipKeys?: string[];
    deepKeys?: string[];
    onlyKeysB?: boolean;
}
interface MergeStateResult {
    state: any;
    changes?: any;
}
export interface MergeStateOptionsArgument {
    noSymbol?: boolean;
    del?: boolean;
    diff?: boolean;
    arrays?: Function;
    replace?: replaceType;
    SymbolDelete?: any;
    path?: string | string[];
}
export declare type replaceType = {
    [key: string]: boolean | replaceType;
} | boolean | ((path: any[]) => boolean);
declare const isUndefined: (value: any) => value is undefined;
declare const isNumber: (value: any) => value is number;
declare const isInteger: (value: any) => boolean;
declare const isString: (value: any) => value is string;
declare const isArray: (arg: any) => arg is any[];
declare const isObject: (value: any) => value is anyObject;
declare const isFunction: (value: any) => value is Function;
declare const isPromise: (value: any) => value is Promise<any>;
declare const toArray: (value: any) => any[];
declare const deArray: (value: any, keepArray?: boolean | undefined) => any;
declare function isMergeable(val: any): boolean;
declare const objKeys: {
    (o: object): string[];
    (o: {}): string[];
};
declare const objKeysNSymb: (obj: any) => any[];
declare function isEqual(objA: any, objB: any, options?: IsEqualOptions): boolean;
declare function asNumber(value: any): any;
declare function memoize(fn: any): (...args: any[]) => any;
declare function push2array(array: any[], ...vals: any[]): any;
declare function moveArrayElems(arr: any, from: number, to: number): Array<any>;
declare function hasIn(state: any, ...paths: any[]): boolean;
declare function setIn(state: any, value: any, ...paths: any[]): any;
declare function delIn(state: any, path: any[]): any;
declare function getIn(state: any, ...paths: any[]): any;
declare function getSetIn(state: any, value: any, ...paths: any[]): any;
declare function mergeState(state: any, source: any, options?: MergeStateOptionsArgument): MergeStateResult;
declare const merge: any;
declare function objSplit(obj: anyObject, fn: Function, byKey?: boolean): any[];
declare function extendSingleProps(key: string, base: any, extend?: any, opts?: any): any;
declare function propsExtender(base?: anyObject, extend?: anyObject, opts?: any): anyObject;
export { isEqual, isMergeable, isUndefined, isNumber, isInteger, isString, isObject, isArray, isFunction, isPromise };
export { merge, mergeState, objSplit, objKeys, objKeysNSymb, delIn, setIn, hasIn, getIn, getSetIn };
export { push2array, moveArrayElems, toArray, deArray };
export { memoize, asNumber, extendSingleProps, propsExtender };
