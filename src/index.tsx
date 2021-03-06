/** @jsx h */

import {createElement as h, isValidElement, createContext, PureComponent, forwardRef} from 'react';

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
//////////////////////////////

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

//////////////////////////////
//  object functions
//////////////////////////////

const objMap = (object: any, fn: (item: any, track: string[]) => any, track: string[] = []) =>
  objKeys(object).reduce((result, key) => ((result[key] = fn(object[key], track.concat(key))) || true) && result, isArray(object) ? [] : {});


function objSplit(obj: anyObject, fn: Function, byKey: boolean = false) {
  let res: any[] = [];
  objKeys(obj).forEach((key) => setIn(res, obj[key], fn(byKey ? key : obj[key]), key));
  return res;
}

function splitBy$(obj: anyObject) {
  return objSplit(obj, (k: string) => k[0] === '$' ? 0 : 1, true)
}


//////////////////////////////
//  props extender
//////////////////////////////

function extendSingleProps(key: string, base: any, extend: any = {}, opts: any = {}) {
  let {_$cx, $baseClass, $rootKey, $args = [], $asArray} = opts;
  if (isValidElement(extend)) return extend;
  if (isFunction(extend)) return extend(base, key, ...toArray($args));
  let {tagName = '_$useTag', wrapName = '_$wrap', defaultTag: Tag = 'div',} = opts;
  let rest = base ? {key, 'data-key': key, ...base, ...extend} : {key, 'data-key': key, ...extend};
  if (rest[tagName]) {
    Tag = rest[tagName];
    delete rest[tagName];
  }
  if (rest[wrapName]) {
    let wrappers = toArray(rest[wrapName]);
    Tag = wrappers.reduce((acc, wrap) => wrap ? wrap(acc, extend) : acc, Tag);
    delete rest[wrapName];
  }
  if (rest.className)
    rest.className = _$cx(rest.className);
  if ($baseClass)
    rest.className = _$cx(rest.className || '', `${$baseClass}${key !== $rootKey ? '__' + key : ''}`);
  return $asArray ? [Tag, rest] : h(Tag, rest);
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


//////////////////////////////
//  checkbox components
//////////////////////////////

const Checkbox = forwardRef(({
                               $extend = {}, $baseClass, children = [], label,
                               type = "checkbox", _$cx, className = "", ['data-key']: dataKey, ...rest
                             }: any, ref) => {
  const baseProps = {
    'input': {_$useTag: 'input', ref, type, ...rest},
    'label': {_$useTag: 'span', children: [label]}
  };
  let childrenRes = propsExtender(baseProps, $extend, {skipKeys: ['checkbox'], _$cx, $baseClass});
  let {input: inputTag, label: labelTag, ...restChildren} = childrenRes;
  let classMods: string[] = [];
  objKeys(rest).forEach(key => {
    if (key[0] !== '$' && (rest[key] === true || rest[key] === 'true'))
      classMods.push('_' + key);
  });
  className = _$cx(className, classMods);
  const rootProps = {
    'checkbox': {
      _$useTag: 'label',
      className,
      children: [inputTag, labelTag, ...(objKeys(restChildren).map(k => restChildren[k])), ...toArray(children)]
    }
  };
  return propsExtender(rootProps, $extend, {onlyKeys: ['checkbox'], _$cx, $baseClass, $rootKey: 'checkbox'}).checkbox;
});


class Checkboxes extends PureComponent<any, any> {
  render() {
    let {
      $enum = [], $enumExten = {}, $setRef, $prefixRefName = '', $baseClass, $extend = {},
      _$useTag = 'div', type = "radio", className = "", value = [], name, _$cx, staticProps, ...rest
    } = this.props;
    value = toArray(value);
    if (name) name = type === 'radio' ? name : name + '[]';
    let opts = {$args: [this], _$cx};
    let enumRes = {};
    $enum.map((val: any) => {
      let baseProps = {...staticProps};
      baseProps.checked = !!~value.indexOf(val);
      baseProps.type = type;
      baseProps.name = name;
      baseProps.value = val;
      baseProps.label = val;
      baseProps._$useTag = baseProps._$useTag || Checkbox;
      baseProps._$cx = baseProps._$cx || _$cx;
      if ($setRef) baseProps.ref = $setRef($prefixRefName + name);
      if ($baseClass) baseProps.$baseClass = $baseClass + '-item';
      if ($enumExten[val]) Object.assign(baseProps, isString($enumExten[val]) ? {label: $enumExten[val]} : $enumExten[val]);
      enumRes[val] = baseProps;
    });
    enumRes = propsExtender(enumRes, $extend, opts);
    let children = $enum.map((val: any) => {
      let res = enumRes[val];
      delete enumRes[val];
      return res;
    });
    let restRes = objKeys(enumRes).map(val => enumRes[val]).filter(Boolean);
    push2array(children, restRes);

    if ($baseClass) className = ((className || '') + ' ' + $baseClass).trim();
    (rest as any).className = _$cx ? _$cx(className) : className;

    return h(_$useTag, rest, children);
  }
}


//////////////////////////////
//  parse functions
//////////////////////////////

function parseSearch(search: string): any {
  let searchValue = {};

  if (search) {
    if (~search.indexOf('?'))
      search = search.substr(search.indexOf('?') + 1);
    decodeURI(search).split('&').map(v => {
      let [key, value] = v.split('=');
      searchValue[key] = value;
    });
  }

  return searchValue;
}

function jsonParse(val: any) {
  try {
    return JSON.parse(val)
  } catch (e) {
    return val;
  }
}


//////////////////////////////
//  Provider functions
//////////////////////////////

const getContext = memoize((name: string) => createContext(name));

function withProvider(Component: any, opts: any = {}): any {
  const {name, initialState} = opts;
  const Provider = getContext(name).Provider;
  let {prototype} = Component;
  if (!prototype || !prototype.isReactComponent)
    throw new Error('Only class-components can be used withProvider.');

  class Result extends Component<any> {
    subscribers = {};
    providerValue = {value: this};

    constructor(props: any, ...rest: any[]) {
      super(props, ...rest);
      if (initialState || !this.state)
        this.state = initialState || {};
    }

    protected _$subscribe = (param: string, fn: any) => {
      let {subscribers} = this;
      if (!subscribers[param]) subscribers[param] = new Set();
      subscribers[param].add(fn);
      return this._$unsubscribe.bind(this, param, fn)
    };

    protected _$unsubscribe = (param: string, fn: any) => {
      let list = getIn(this.subscribers, param);
      if (list) list.delete(fn);
    };

    setState = (partialState: any) => {
      let updState = {};
      objKeys(partialState).forEach(key => {
        if (partialState[key] !== this.state[key])
          updState[key] = partialState[key];
      });
      if (objKeys(updState).length)
        super.setState(updState);
    };

    componentDidUpdate = (propsPrev: any, statePrev: any, ...rest: any[]) => {
      let {props, state} = this;
      let self = {props, propsPrev, state, statePrev};
      let fns: any = [];

      objKeys(this.subscribers).forEach(key => {
        let path = key.split('/');
        let nm = path[0];
        if (nm === 'state' || nm === 'props') {
          path = path.slice(1);
          if (getIn(self[nm], path) !== getIn(self[nm + 'Prev'], path))
            fns.push(...this.subscribers[key])
        }
      });

      fns = new Set(fns);
      for (let fn of fns) fn();
      if (super.componentDidUpdate)
        return super.componentDidUpdate(propsPrev, statePrev, ...rest);
    };

    render = () => {
      return h(Provider, this.providerValue, super.render())
    }
  }

  return Result;
}

function withConsumer(Component: any, opts: any = {}) {
  const {name} = opts;
  const $maps = {};
  objKeys(opts.$maps || {}).forEach(key => $maps[key] = opts.$maps[key].split('/').filter(Boolean));
  const context = getContext(name);

  class Result extends PureComponent {
    static contextType = context;

    refresh = () => {
      this.forceUpdate();
    };

    componentDidMount = () => {
      this.subscribe($maps);
    };

    componentWillUnmount = () => {
      this.unsubscribe($maps);
    };

    subscribe = (props: any) => {
      if (!this.context) throw new Error('Provider not found');
      objKeys($maps).forEach(key => {
        this.context._$subscribe($maps[key].join('/'), this.refresh);
      })
    };

    unsubscribe = (props: any) => {
      if (!this.context) throw new Error('Provider not found');
      objKeys($maps).forEach(key => {
        this.context._$unsubscribe($maps[key].join('/'), this.refresh);
      })
    };

    render = () => {
      let provider = this.context;
      let {...props} = this.props;
      objKeys($maps).forEach(key => {
        props[key] = $maps[key] ? getIn(provider, $maps[key]) : provider
      });
      return h(Component, props);
    }
  }

  return Result as any;
}


//////////////////////////////
//  Stuff
//////////////////////////////

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function string2path(path: string, {str2sym, replace}: any = {}) {
  // path = path.replace(symConv(SymData), '/' + symConv(SymData) + '/');
  if (replace) path = replace(path);
  path = path.replace(/\/+/g, '/');
  const result: any[] = [];
  path.split('/').forEach(key => key && (key = (str2sym ? str2sym(key.trim()) : key.trim())) && result.push(key));
  return result
}


//////////////////////////////
//  Object resolver functions
//////////////////////////////

const isElemRef = (val: any) => isString(val) && (val.substr(0, 2) == '^/' || val.substr(0, 2) == '^.');

function testRef(refRes: any, $_ref: string, track: string[]) {
  if (isUndefined(refRes))
    throw new Error('Reference "' + $_ref + '" leads to undefined object\'s property in path: ' + track.join('/'));
  return true;
}

function getInWithCheck(refRes: any, path: any[]) {
  let elems = refRes['^'];
  let whileBreak = false;
  while (!whileBreak) {
    whileBreak = true;
    for (let j = 0; j < path.length; j++) {
      refRes = getIn(refRes, path[j]);
      if (isElemRef(refRes)) {
        path = string2path(refRes).concat(path.slice(j + 1));
        refRes = {'^': elems};
        whileBreak = false;
        break;
      }
      if (isFunction(refRes) && j + 1 !== path.length) { // check if there is a function
        refRes = refRes(elems, path.slice(j + 1));
        break;
      }
      if (isUndefined(refRes)) break;
    }
  }
  return refRes
}

function skipKey(key: string, obj?: any, opts: any = {}) {
  let {start = '_$', field = '_$skipKeys'} = opts;
  if (!isString(key)) return false;
  return key === field || key.substr(0, start.length) == start || obj && isArray(obj[field]) && ~obj[field].indexOf(key)
}

function processRef($_refs: any, _elements: any, opts: any, track: any, baseObj: any) {
  $_refs = $_refs.split(':');
  let {isRef} = opts;
  const objs2merge: any[] = [];
  for (let i = 0; i < $_refs.length; i++) {
    if (!$_refs[i]) continue;
    if (!isRef($_refs[i]))
      throw new Error(`Non-ref value "${$_refs[i]}" in path "${track.concat('/')}"`);
    let $_ref = $_refs[i];
    let refRes;
    if ($_ref[1] === '.') $_ref = resolveRelativeObject(baseObj, $_ref, track, opts);
    if (isRef($_ref)) {
      let path = string2path($_ref);
      refRes = getInWithCheck({'^': _elements}, path);
    } else refRes = $_ref;
    testRef(refRes, $_refs[i], track.concat('@' + i));
    if (isMergeable(refRes)) refRes = objectDerefer(_elements, refRes, opts, track, baseObj);
    objs2merge.push(refRes);
  }
  if (objs2merge.length <= 1) return objs2merge[0];
  let result = objs2merge[0];
  for (let i = 1; i < objs2merge.length; i++) {
    if (objs2merge[i]._$setSelfIn && result) {
      let {_$setSelfIn, ...restRes} = objs2merge[i];
      result = merge(restRes, result, {path: _$setSelfIn});
    } else
      result = merge(result, objs2merge[i]);
  }
  return result
}

function resolvePath(path: any[], base?: any[]) {
  const result: any[] = (base && (path[0] === '.' || path[0] == '..')) ? base.slice() : [];
  for (let i = 0; i < path.length; i++) {
    let val = path[i];
    if (val === '..') result.pop();
    else if (val !== '' && val !== '.') result.push(val);
  }
  return result;
}

function resolveRelativeObject(obj: any, ref: any, track: any[], opts: any) {
  while (opts.isRef(ref) && ref[1] === '.') {
    let path = resolvePath(string2path(ref.substr(1)), track);
    ref = getIn(obj, path);
  }
  return ref
}

function objectDerefer(_elements: any, obj2deref: any, opts: any = {}, track: string[] = [], baseObj: any = obj2deref): any {
  let {isRef = isElemRef, refHandler, skipKey: skipFn = skipKey} = opts;
  opts = {isRef, refHandler, skipKey: skipFn};
  if (isRef(obj2deref)) {
    let result = refHandler ? refHandler(_elements, obj2deref, opts, track, getIn(baseObj, track.slice(0, -1))) : obj2deref;
    if (isRef(result))
      result = processRef(result, _elements, opts, track, baseObj);
    return result;
  }
  if (!isMergeable(obj2deref)) return obj2deref;

  if (isArray(obj2deref)) return obj2deref.map((obj: any, i: any) => objectDerefer(_elements, obj, opts, track.concat(i), baseObj));
  let {$_ref = '', ...restObj} = obj2deref;
  let result = processRef($_ref, _elements, opts, track, baseObj);

  return merge(result, objMap(restObj, (obj, tr) => {
    let key = tr[tr.length - 1];
    if (!isRef(obj) && skipFn(key, obj2deref)) return obj;
    return objectDerefer(_elements, obj, opts, tr, baseObj)
  }, track));
  //objKeys(restObj).forEach(key => result[key] = isMergeable(restObj[key]) ? objectDerefer(_objects, restObj[key]) : restObj[key]);
}


export {isEqual, isMergeable, isUndefined, isNumber, isInteger, isString, isObject, isArray, isFunction, isPromise}
export {merge, mergeState, objSplit, splitBy$, objMap, objKeys, objKeysNSymb, delIn, setIn, hasIn, getIn, getSetIn};
export {push2array, moveArrayElems, toArray, deArray, string2path, resolvePath}
export {getContext, memoize, asNumber, extendSingleProps, propsExtender, Checkbox, Checkboxes}
export {withConsumer, withProvider, parseSearch, jsonParse, sleep}
export {isElemRef, objectDerefer, skipKey}
