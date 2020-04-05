/** @jsx h */

import {createElement as h, isValidElement} from 'react';

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
  state: any,
  changes?: any,
}

export interface MergeStateOptionsArgument {
  noSymbol?: boolean;
  del?: boolean;  // remove props with SymDelete
  diff?: boolean;
  arrays?: Function; // 'mergeWithoutLength'
  replace?: replaceType; // force replace for mergeable object instead of merge, should be and object with true value for the keys that must be replaced, can be recursive for deep elements
  SymbolDelete?: any;
  path?: string | string[];
}

export type replaceType = { [key: string]: boolean | replaceType } | boolean | ((path: any[]) => boolean);


const isUndefined = (value: any): value is undefined => typeof value === 'undefined';
const isNumber = (value: any): value is number => typeof value === "number";
const isInteger = (value: any) => typeof value === "number" && (Math.floor(value) === value || value > 9007199254740992 || value < -9007199254740992);
const isString = (value: any): value is string => typeof value === 'string';
const isArray = Array.isArray;
const isObject = (value: any): value is anyObject => isMergeable(value) && !isArray(value);
const isFunction = (value: any): value is Function => typeof value === 'function';
const isPromise = (value: any): value is Promise<any> => isFunction(getIn(value, 'then'));

const toArray = (value: any) => isArray(value) ? value : [value];
const deArray = (value: any, keepArray?: boolean) => !keepArray && isArray(value) && value.length == 1 ? value[0] : value;

function isMergeable(val: any) {
  const nonNullObject = val && typeof val === 'object';
  return nonNullObject
    && Object.prototype.toString.call(val) !== '[object RegExp]'
    && Object.prototype.toString.call(val) !== '[object Date]'
}

const objKeys = Object.keys;
const objKeysNSymb = (obj: any): any[] => (objKeys(obj) as any[]).concat(Object.getOwnPropertySymbols(obj));


const _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
  ? (obj: any) => typeof obj
  : (obj: any) => obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
function is(x: any, y: any) {
  // SameValue algorithm
  if (x === y) { // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    return x !== 0 || 1 / x === 1 / y;
  } else {
    // Step 6.a: NaN == NaN
    return x !== x && y !== y;
  }
}

function isEqual(objA: any, objB: any, options: IsEqualOptions = {}) {
  if (is(objA, objB)) return true;

  if ((isUndefined(objA) ? 'undefined' : _typeof(objA)) !== 'object' || objA === null || (isUndefined(objB) ? 'undefined' : _typeof(objB)) !== 'object' || objB === null)
    return false;
  const fn = options.symbol ? objKeysNSymb : objKeys;
  const keysA = fn(objA);
  const keysB = fn(objB);

  if (keysA.length !== keysB.length) return false;

  const {skipKeys = [], deepKeys = []} = options;
  for (let i = 0; i < keysA.length; i++) {
    if (~skipKeys.indexOf(keysA[i])) continue;     // if key is an skip key, skip comparison

    if (options.deep || ~deepKeys.indexOf(keysA[i])) {
      const result = isEqual(objA[keysA[i]], objB[keysA[i]], options);
      if (!result) return false;
    } else if (!objB.hasOwnProperty(keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }
  return true;
}


function asNumber(value: any) {
  if (value === "") return null;
  if (/\.$/.test(value)) return value; // "3." can't really be considered a number even if it parses in js. The user is most likely entering a float.
  if (/\.0$/.test(value)) return value; // we need to return this as a string here, to allow for input like 3.07
  const n = Number(value);
  const valid = typeof n === "number" && !Number.isNaN(n);
  if (/\.\d*0$/.test(value)) return value; // It's a number, that's cool - but we need it as a string so it doesn't screw with the user when entering dollar amounts or other values (such as those with specific precision or number of significant digits)
  return valid ? n : value;
}


function memoize(fn: any) {
  fn.cache = new Map();
  return function (...args: any[]) {
    let newArgs = [args.length].concat(args);
    let cache = fn.cache;
    let last = newArgs.pop();
    for (let i = 0; i < newArgs.length; i++) {
      cache.has(newArgs[i]) || cache.set(newArgs[i], new Map());
      cache = cache.get(newArgs[i]);
    }
    if (!cache.has(last)) cache.set(last, fn.apply(this, args));
    return cache.get(last);
  };
}


function push2array(array: any[], ...vals: any[]): any {
  for (let i = 0; i < vals.length; i++) {
    if (isArray(vals[i])) array.push(...vals[i]);
    else array.push(vals[i])
  }
  return array
}


function moveArrayElems(arr: any, from: number, to: number): Array<any> {
  let length = arr.length;
  if (length) {
    from = (from % length + length) % length;
    to = (to % length + length) % length;
  }
  let elem = arr[from];
  for (let i = from; i < to; i++) arr[i] = arr [i + 1];
  for (let i = from; i > to; i--) arr[i] = arr [i - 1];
  arr[to] = elem;
  return arr
}

//////////////////////////////
//  object get/set functions
/////////////////////////////


function hasIn(state: any, ...paths: any[]) {
  if (paths.length > 0) {
    for (let i = 0; i < paths.length; i++) {
      let path = isArray(paths[i]) ? paths[i] : [paths[i]];
      for (let j = 0; j < path.length; j++) {
        if (isUndefined(path[j])) continue;
        try {
          if (!state.hasOwnProperty(path[j])) return false;
        } catch (e) {return false;}
        state = state[path[j]]
      }
    }
  }
  return true
}

function setIn(state: any, value: any, ...paths: any[]) {
  let result = state;
  let key;
  if (paths.length > 0) {
    for (let i = 0; i < paths.length; i++) {
      let path = isArray(paths[i]) ? paths[i] : [paths[i]];
      for (let j = 0; j < path.length; j++) {
        if (isUndefined(path[j])) continue;
        if (!isUndefined(key)) {
          if (!isMergeable(result[key])) result[key] = {};
          result = result[key];
        }
        key = path[j];

        // prev = result;
        // result = result[key];
      }
    }
  }
  if (!isUndefined(key)) result[key] = value;
  else return value;
  return state;
}

function delIn(state: any, path: any[]) {
  // if (path[0] == '#') path = path.slice(1);
  if (!path.length) return state;
  const keys = typeof path[0] == 'string' ? path[0].split(',') : [path[0]];
  const newPath = path.slice(1);
  if (newPath.length) {
    keys.forEach((key: any) => {
      let newObj;
      if (isMergeable(state[key])) newObj = delIn(state[key], newPath);
      if (newObj && (newObj !== state[key])) state = merge(state, {[key]: newObj}, {replace: {[key]: true}})
    })
  } else {
    for (let i = 0; i < keys.length; i++) {
      if (state.hasOwnProperty(keys[i])) {
        state = Object.assign({}, state);
        break
      }
    }
    for (let i = 0; i < keys.length; i++) delete state[keys[i]]
  }
  return state
}


function getIn(state: any, ...paths: any[]): any {
  let res = state;
  for (let i = 0; i < paths.length; i++) {
    let track = paths[i];
    if (typeof track === 'function') track = track(res);
    if (!isArray(track)) track = [track];
    for (let j = 0; j < track.length; j++) {
      //if (isUndefined(res) ) return res;
      if (!isMergeable(res)) return undefined;
      if (isUndefined(track[j])) continue;
      res = res[track[j]];
    }
  }
  return res;
};


function getSetIn(state: any, value: any, ...paths: any[]) {
  if (!hasIn(state, ...paths)) setIn(state, value, ...paths);
  return getIn(state, ...paths)
}


//////////////////////////////
//  object merge functions
/////////////////////////////

function mergeState(state: any, source: any, options: MergeStateOptionsArgument = {}): MergeStateResult {
  const fn = options.noSymbol ? objKeys : objKeysNSymb;
  // let arrayMergeFn: any = false;
  let {SymbolDelete, del, diff, replace, arrays, path} = options;
  if (path) {
    if (isString(path)) path = path.split('/');
    source = setIn({}, source, path);
    if (replace && !isFunction(replace))
      replace = setIn({}, replace, path);
  }
  let forceReplace: any = replace;
  if (typeof forceReplace !== 'function') {
    if (!isMergeable(replace)) forceReplace = () => false;
    else forceReplace = (path: any) => getIn(replace, path)
  }
  if (replace === true || forceReplace([], state, source) === true) return {state: source, changes: state !== source ? source : undefined};
  if (!isFunction(arrays)) arrays = undefined;

  function recusion(state: any, source: any, track: any[] = []): MergeStateResult {
    const changes: any = {};
    const isSourceArray = isArray(source);
    if (!isMergeable(state)) {
      state = isSourceArray ? [] : {};  // return only elements
      if (isArray(state)) changes.length = 0;
    }
    const isStateArray = isArray(state);
    if (!isMergeable(source)) return {state};  // merge only mergeable elements, may be throw here

    if (isStateArray && isSourceArray) {
      if (arrays) source = arrays(state, source, track);
      if (state.length != source.length) changes.length = source.length;
    }

    let stateKeys = fn(state);
    if (stateKeys.length == 0 && !del) {
      if (!isStateArray && !isSourceArray)
        return fn(source).length ? {state: source, changes: source} : {state};
      if (isStateArray && isSourceArray) {
        if (state.length == source.length && source.length == 0) return {state};
        return (fn(source).length || source.length !== state.length) ? {state: source, changes: source} : {state};
      }
    }

    let srcKeys = fn(source);

    const changedObjects: any = {};
    const result = (isStateArray ? [] : {});


    if (diff) {
      stateKeys.forEach(key => {
        if (!~srcKeys.indexOf(key))
          changes[key] = SymbolDelete;
      });
    }


    srcKeys.forEach(key => {
      if (del && source[key] === SymbolDelete) {
        if (state.hasOwnProperty(key)) changes[key] = SymbolDelete;
      } else {
        let keyTrack = track.concat(key);
        if (!isMergeable(source[key]) || !isMergeable(state[key]) || forceReplace(keyTrack, state[key], source[key]) === true) {
          if (!state.hasOwnProperty(key) || !is(state[key], source[key])) changes[key] = source[key];
        } else {
          if (state[key] !== source[key]) {
            let obj = recusion(state[key], source[key], keyTrack);
            if (obj.changes)
              changedObjects[key] = obj;
          }
        }
      }
    });

    let changedObjKeys = fn(changedObjects);
    let changesKeys = fn(changes);
    if (changesKeys.length == 0 && changedObjKeys.length == 0) return {state};
    else {
      Object.assign(result, state);
      changesKeys.forEach(key => {
        if (del && changes[key] === SymbolDelete || diff && !source.hasOwnProperty(key)) delete result[key];
        else result[key] = changes[key];
      });
      changedObjKeys.forEach(key => {
        result[key] = changedObjects[key].state;
        changes[key] = changedObjects[key].changes
      });
      return {state: result, changes}
    }
  }

  return recusion(state, source)
}

const merge: any = (a: any, b: any, opts: MergeStateOptionsArgument = {}) => mergeState(a, b, opts).state;


merge.all = function (state: any, obj2merge: any[], options: MergeStateOptionsArgument = {}) {
  if (obj2merge.length == 0) return state;  // no changes should be done
  else return obj2merge.reduce((prev, next) => merge(prev, next, options), state);  // merge
};

function objSplit(obj: anyObject, fn: Function, byKey: boolean = false) {
  let res: any[] = [];
  objKeys(obj).forEach((key) => setIn(res, obj[key], fn(byKey ? key : obj[key]), key));
  return res;
}

function extendSingleProps(key: string, base: any, extend: any = {}, opts: any = {}) {
  let {_$cx, $baseClass, $rootKey, $args = []} = opts;
  if (isValidElement(extend)) return extend;
  if (isFunction(extend)) return extend(base, key, ...toArray($args));
  let {tagName = '_$tag', defaultTag: Tag = 'div',} = opts;
  let rest = base ? {key, 'data-key': key, ...base, ...extend} : {key, 'data-key': key, ...extend};
  if (rest[tagName]) {
    Tag = rest[tagName];
    delete rest[tagName];
  }
  if (rest.className)
    rest.className = _$cx(rest.className);
  if ($baseClass)
    rest.className = _$cx(rest.className || '', `${$baseClass}${key !== $rootKey ? '__' + key : ''}`);
  return h(Tag, rest);
}

function propsExtender(base: anyObject = {}, extend: anyObject = {}, opts: any = {}) {
  let {onlyKeys, skipKeys, ...rest} = opts;
  let keys: string[], baseKeys: string[], res: anyObject = {}, extendRes = {};
  if (onlyKeys) baseKeys = keys = onlyKeys;
  else {
    keys = objKeys(extend || {});
    baseKeys = objKeys(base || {});
  }
  keys.forEach((k: string) => {
    if (!skipKeys || !~skipKeys.indexOf(k))
      extendRes[k] = extendSingleProps(k, base[k], extend[k], rest);
    let idx = baseKeys.indexOf(k);
    if (~idx) baseKeys.splice(idx, 1);
  });
  baseKeys.forEach((k: string) => {
    if (!skipKeys || !~skipKeys.indexOf(k))
      res[k] = extendSingleProps(k, base[k], extend[k], rest);
  });
  Object.assign(res, extendRes);
  return res;
}

export {isEqual, isMergeable, isUndefined, isNumber, isInteger, isString, isObject, isArray, isFunction, isPromise}
export {merge, mergeState, objSplit, objKeys, objKeysNSymb, delIn, setIn, hasIn, getIn, getSetIn};
export {push2array, moveArrayElems, toArray, deArray}
export {memoize, asNumber, extendSingleProps, propsExtender}

