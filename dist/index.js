"use strict";
/** @jsx h */
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const isUndefined = (value) => typeof value === 'undefined';
exports.isUndefined = isUndefined;
const isNumber = (value) => typeof value === "number";
exports.isNumber = isNumber;
const isInteger = (value) => typeof value === "number" && (Math.floor(value) === value || value > 9007199254740992 || value < -9007199254740992);
exports.isInteger = isInteger;
const isString = (value) => typeof value === 'string';
exports.isString = isString;
const isArray = Array.isArray;
exports.isArray = isArray;
const isObject = (value) => isMergeable(value) && !isArray(value);
exports.isObject = isObject;
const isFunction = (value) => typeof value === 'function';
exports.isFunction = isFunction;
const isPromise = (value) => isFunction(getIn(value, 'then'));
exports.isPromise = isPromise;
const toArray = (value) => isArray(value) ? value : [value];
exports.toArray = toArray;
const deArray = (value, keepArray) => !keepArray && isArray(value) && value.length == 1 ? value[0] : value;
exports.deArray = deArray;
function isMergeable(val) {
    const nonNullObject = val && typeof val === 'object';
    return nonNullObject
        && Object.prototype.toString.call(val) !== '[object RegExp]'
        && Object.prototype.toString.call(val) !== '[object Date]';
}
exports.isMergeable = isMergeable;
const objKeys = Object.keys;
exports.objKeys = objKeys;
const objKeysNSymb = (obj) => objKeys(obj).concat(Object.getOwnPropertySymbols(obj));
exports.objKeysNSymb = objKeysNSymb;
const _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
    ? (obj) => typeof obj
    : (obj) => obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
function is(x, y) {
    // SameValue algorithm
    if (x === y) { // Steps 1-5, 7-10
        // Steps 6.b-6.e: +0 != -0
        return x !== 0 || 1 / x === 1 / y;
    }
    else {
        // Step 6.a: NaN == NaN
        return x !== x && y !== y;
    }
}
function isEqual(objA, objB, options = {}) {
    if (is(objA, objB))
        return true;
    if ((isUndefined(objA) ? 'undefined' : _typeof(objA)) !== 'object' || objA === null || (isUndefined(objB) ? 'undefined' : _typeof(objB)) !== 'object' || objB === null)
        return false;
    const fn = options.symbol ? objKeysNSymb : objKeys;
    const keysA = fn(objA);
    const keysB = fn(objB);
    if (keysA.length !== keysB.length)
        return false;
    const { skipKeys = [], deepKeys = [] } = options;
    for (let i = 0; i < keysA.length; i++) {
        if (~skipKeys.indexOf(keysA[i]))
            continue; // if key is an skip key, skip comparison
        if (options.deep || ~deepKeys.indexOf(keysA[i])) {
            const result = isEqual(objA[keysA[i]], objB[keysA[i]], options);
            if (!result)
                return false;
        }
        else if (!objB.hasOwnProperty(keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
            return false;
        }
    }
    return true;
}
exports.isEqual = isEqual;
function asNumber(value) {
    if (value === "")
        return null;
    if (/\.$/.test(value))
        return value; // "3." can't really be considered a number even if it parses in js. The user is most likely entering a float.
    if (/\.0$/.test(value))
        return value; // we need to return this as a string here, to allow for input like 3.07
    const n = Number(value);
    const valid = typeof n === "number" && !Number.isNaN(n);
    if (/\.\d*0$/.test(value))
        return value; // It's a number, that's cool - but we need it as a string so it doesn't screw with the user when entering dollar amounts or other values (such as those with specific precision or number of significant digits)
    return valid ? n : value;
}
exports.asNumber = asNumber;
function memoize(fn) {
    fn.cache = new Map();
    return function (...args) {
        let newArgs = [args.length].concat(args);
        let cache = fn.cache;
        let last = newArgs.pop();
        for (let i = 0; i < newArgs.length; i++) {
            cache.has(newArgs[i]) || cache.set(newArgs[i], new Map());
            cache = cache.get(newArgs[i]);
        }
        if (!cache.has(last))
            cache.set(last, fn.apply(this, args));
        return cache.get(last);
    };
}
exports.memoize = memoize;
function push2array(array, ...vals) {
    for (let i = 0; i < vals.length; i++) {
        if (isArray(vals[i]))
            array.push(...vals[i]);
        else
            array.push(vals[i]);
    }
    return array;
}
exports.push2array = push2array;
function moveArrayElems(arr, from, to) {
    let length = arr.length;
    if (length) {
        from = (from % length + length) % length;
        to = (to % length + length) % length;
    }
    let elem = arr[from];
    for (let i = from; i < to; i++)
        arr[i] = arr[i + 1];
    for (let i = from; i > to; i--)
        arr[i] = arr[i - 1];
    arr[to] = elem;
    return arr;
}
exports.moveArrayElems = moveArrayElems;
//////////////////////////////
//  object get/set functions
/////////////////////////////
function hasIn(state, ...paths) {
    if (paths.length > 0) {
        for (let i = 0; i < paths.length; i++) {
            let path = isArray(paths[i]) ? paths[i] : [paths[i]];
            for (let j = 0; j < path.length; j++) {
                if (isUndefined(path[j]))
                    continue;
                try {
                    if (!state.hasOwnProperty(path[j]))
                        return false;
                }
                catch (e) {
                    return false;
                }
                state = state[path[j]];
            }
        }
    }
    return true;
}
exports.hasIn = hasIn;
function setIn(state, value, ...paths) {
    let result = state;
    let key;
    if (paths.length > 0) {
        for (let i = 0; i < paths.length; i++) {
            let path = isArray(paths[i]) ? paths[i] : [paths[i]];
            for (let j = 0; j < path.length; j++) {
                if (isUndefined(path[j]))
                    continue;
                if (!isUndefined(key)) {
                    if (!isMergeable(result[key]))
                        result[key] = {};
                    result = result[key];
                }
                key = path[j];
                // prev = result;
                // result = result[key];
            }
        }
    }
    if (!isUndefined(key))
        result[key] = value;
    else
        return value;
    return state;
}
exports.setIn = setIn;
function delIn(state, path) {
    // if (path[0] == '#') path = path.slice(1);
    if (!path.length)
        return state;
    const keys = typeof path[0] == 'string' ? path[0].split(',') : [path[0]];
    const newPath = path.slice(1);
    if (newPath.length) {
        keys.forEach((key) => {
            let newObj;
            if (isMergeable(state[key]))
                newObj = delIn(state[key], newPath);
            if (newObj && (newObj !== state[key]))
                state = merge(state, { [key]: newObj }, { replace: { [key]: true } });
        });
    }
    else {
        for (let i = 0; i < keys.length; i++) {
            if (state.hasOwnProperty(keys[i])) {
                state = Object.assign({}, state);
                break;
            }
        }
        for (let i = 0; i < keys.length; i++)
            delete state[keys[i]];
    }
    return state;
}
exports.delIn = delIn;
function getIn(state, ...paths) {
    let res = state;
    for (let i = 0; i < paths.length; i++) {
        let track = paths[i];
        if (typeof track === 'function')
            track = track(res);
        if (!isArray(track))
            track = [track];
        for (let j = 0; j < track.length; j++) {
            if (!isMergeable(res))
                return undefined;
            if (isUndefined(track[j]))
                continue;
            res = res[track[j]];
        }
    }
    return res;
}
exports.getIn = getIn;
;
function getSetIn(state, value, ...paths) {
    if (!hasIn(state, ...paths))
        setIn(state, value, ...paths);
    return getIn(state, ...paths);
}
exports.getSetIn = getSetIn;
//////////////////////////////
//  object merge functions
//////////////////////////////
function mergeState(state, source, options = {}) {
    const fn = options.noSymbol ? objKeys : objKeysNSymb;
    // let arrayMergeFn: any = false;
    let { SymbolDelete, del, diff, replace, arrays, path } = options;
    if (path) {
        if (isString(path))
            path = path.split('/');
        source = setIn({}, source, path);
        if (replace && !isFunction(replace))
            replace = setIn({}, replace, path);
    }
    let forceReplace = replace;
    if (typeof forceReplace !== 'function') {
        if (!isMergeable(replace))
            forceReplace = () => false;
        else
            forceReplace = (path) => getIn(replace, path);
    }
    if (replace === true || forceReplace([], state, source) === true)
        return { state: source, changes: state !== source ? source : undefined };
    if (!isFunction(arrays))
        arrays = undefined;
    function recusion(state, source, track = []) {
        const changes = {};
        const isSourceArray = isArray(source);
        if (!isMergeable(state)) {
            state = isSourceArray ? [] : {}; // return only elements
            if (isArray(state))
                changes.length = 0;
        }
        const isStateArray = isArray(state);
        if (!isMergeable(source))
            return { state }; // merge only mergeable elements, may be throw here
        if (isStateArray && isSourceArray) {
            if (arrays)
                source = arrays(state, source, track);
            if (state.length != source.length)
                changes.length = source.length;
        }
        let stateKeys = fn(state);
        if (stateKeys.length == 0 && !del) {
            if (!isStateArray && !isSourceArray)
                return fn(source).length ? { state: source, changes: source } : { state };
            if (isStateArray && isSourceArray) {
                if (state.length == source.length && source.length == 0)
                    return { state };
                return (fn(source).length || source.length !== state.length) ? { state: source, changes: source } : { state };
            }
        }
        let srcKeys = fn(source);
        const changedObjects = {};
        const result = (isStateArray ? [] : {});
        if (diff) {
            stateKeys.forEach(key => {
                if (!~srcKeys.indexOf(key))
                    changes[key] = SymbolDelete;
            });
        }
        srcKeys.forEach(key => {
            if (del && source[key] === SymbolDelete) {
                if (state.hasOwnProperty(key))
                    changes[key] = SymbolDelete;
            }
            else {
                let keyTrack = track.concat(key);
                if (!isMergeable(source[key]) || !isMergeable(state[key]) || forceReplace(keyTrack, state[key], source[key]) === true) {
                    if (!state.hasOwnProperty(key) || !is(state[key], source[key]))
                        changes[key] = source[key];
                }
                else {
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
        if (changesKeys.length == 0 && changedObjKeys.length == 0)
            return { state };
        else {
            Object.assign(result, state);
            changesKeys.forEach(key => {
                if (del && changes[key] === SymbolDelete || diff && !source.hasOwnProperty(key))
                    delete result[key];
                else
                    result[key] = changes[key];
            });
            changedObjKeys.forEach(key => {
                result[key] = changedObjects[key].state;
                changes[key] = changedObjects[key].changes;
            });
            return { state: result, changes };
        }
    }
    return recusion(state, source);
}
exports.mergeState = mergeState;
const merge = (a, b, opts = {}) => mergeState(a, b, opts).state;
exports.merge = merge;
merge.all = function (state, obj2merge, options = {}) {
    if (obj2merge.length == 0)
        return state; // no changes should be done
    else
        return obj2merge.reduce((prev, next) => merge(prev, next, options), state); // merge
};
//////////////////////////////
//  object functions
//////////////////////////////
const objMap = (object, fn, track = []) => objKeys(object).reduce((result, key) => ((result[key] = fn(object[key], track.concat(key))) || true) && result, isArray(object) ? [] : {});
exports.objMap = objMap;
function objSplit(obj, fn, byKey = false) {
    let res = [];
    objKeys(obj).forEach((key) => setIn(res, obj[key], fn(byKey ? key : obj[key]), key));
    return res;
}
exports.objSplit = objSplit;
function splitBy$(obj) {
    objSplit(obj, (k) => k[0] === '$' ? 0 : 1, true);
}
exports.splitBy$ = splitBy$;
//////////////////////////////
//  props extender
//////////////////////////////
function extendSingleProps(key, base, extend = {}, opts = {}) {
    let { _$cx, $baseClass, $rootKey, $args = [], $asArray } = opts;
    if (react_1.isValidElement(extend))
        return extend;
    if (isFunction(extend))
        return extend(base, key, ...toArray($args));
    let { tagName = '_$tag', wrapName = '_$wrap', defaultTag: Tag = 'div', } = opts;
    let rest = base ? Object.assign(Object.assign({ key, 'data-key': key }, base), extend) : Object.assign({ key, 'data-key': key }, extend);
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
    return $asArray ? [Tag, rest] : react_1.createElement(Tag, rest);
}
exports.extendSingleProps = extendSingleProps;
function propsExtender(base = {}, extend = {}, opts = {}) {
    let { onlyKeys, skipKeys } = opts, rest = __rest(opts, ["onlyKeys", "skipKeys"]);
    let keys, baseKeys, res = {}, extendRes = {};
    if (onlyKeys)
        baseKeys = keys = onlyKeys;
    else {
        keys = objKeys(extend || {});
        baseKeys = objKeys(base || {});
    }
    keys.forEach((k) => {
        if (!skipKeys || !~skipKeys.indexOf(k))
            extendRes[k] = extendSingleProps(k, base[k], extend[k], rest);
        let idx = baseKeys.indexOf(k);
        if (~idx)
            baseKeys.splice(idx, 1);
    });
    baseKeys.forEach((k) => {
        if (!skipKeys || !~skipKeys.indexOf(k))
            res[k] = extendSingleProps(k, base[k], extend[k], rest);
    });
    Object.assign(res, extendRes);
    return res;
}
exports.propsExtender = propsExtender;
//////////////////////////////
//  parse functions
//////////////////////////////
function parseSearch(search) {
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
exports.parseSearch = parseSearch;
function jsonParse(val) {
    try {
        return JSON.parse(val);
    }
    catch (e) {
        return val;
    }
}
exports.jsonParse = jsonParse;
//////////////////////////////
//  Provider functions
//////////////////////////////
const getContext = memoize((name) => react_1.createContext(name));
exports.getContext = getContext;
function withProvider(Component, opts = {}) {
    const { name, initialState } = opts;
    const Provider = getContext(name).Provider;
    let { prototype } = Component;
    if (!prototype || !prototype.isReactComponent)
        throw new Error('Only class-components can be used withProvider.');
    class Result extends Component {
        constructor(props, ...rest) {
            super(props, ...rest);
            this.subscribers = {};
            this.providerValue = { value: this };
            this._$subscribe = (param, fn) => {
                let { subscribers } = this;
                if (!subscribers[param])
                    subscribers[param] = new Set();
                subscribers[param].add(fn);
                return this._$unsubscribe.bind(this, param, fn);
            };
            this._$unsubscribe = (param, fn) => {
                let list = getIn(this.subscribers, param);
                if (list)
                    list.delete(fn);
            };
            this.setState = (partialState) => {
                let updState = {};
                objKeys(partialState).forEach(key => {
                    if (partialState[key] !== this.state[key])
                        updState[key] = partialState[key];
                });
                if (objKeys(updState).length)
                    super.setState(updState);
            };
            this.componentDidUpdate = (propsPrev, statePrev, ...rest) => {
                let { props, state } = this;
                let self = { props, propsPrev, state, statePrev };
                let fns = [];
                objKeys(this.subscribers).forEach(key => {
                    let path = key.split('/');
                    let nm = path[0];
                    if (nm === 'state' || nm === 'props') {
                        path = path.slice(1);
                        if (getIn(self[nm], path) !== getIn(self[nm + 'Prev'], path))
                            fns.push(...this.subscribers[key]);
                    }
                });
                fns = new Set(fns);
                for (let fn of fns)
                    fn();
                if (super.componentDidUpdate)
                    return super.componentDidUpdate(propsPrev, statePrev, ...rest);
            };
            this.render = () => {
                return react_1.createElement(Provider, this.providerValue, super.render());
            };
            if (initialState || !this.state)
                this.state = initialState || {};
        }
    }
    return Result;
}
exports.withProvider = withProvider;
function withConsumer(Component, opts = {}) {
    const { name } = opts;
    const $maps = {};
    objKeys(opts.$maps || {}).forEach(key => $maps[key] = opts.$maps[key].split('/').filter(Boolean));
    const context = getContext(name);
    class Result extends react_1.PureComponent {
        constructor() {
            super(...arguments);
            this.refresh = () => {
                this.forceUpdate();
            };
            this.componentDidMount = () => {
                this.subscribe($maps);
            };
            this.componentWillUnmount = () => {
                this.unsubscribe($maps);
            };
            this.subscribe = (props) => {
                if (!this.context)
                    throw new Error('Provider not found');
                objKeys($maps).forEach(key => {
                    this.context._$subscribe($maps[key].join('/'), this.refresh);
                });
            };
            this.unsubscribe = (props) => {
                if (!this.context)
                    throw new Error('Provider not found');
                objKeys($maps).forEach(key => {
                    this.context._$unsubscribe($maps[key].join('/'), this.refresh);
                });
            };
            this.render = () => {
                let provider = this.context;
                let props = __rest(this.props, []);
                objKeys($maps).forEach(key => {
                    props[key] = $maps[key] ? getIn(provider, $maps[key]) : provider;
                });
                return react_1.createElement(Component, props);
            };
        }
    }
    Result.contextType = context;
    return Result;
}
exports.withConsumer = withConsumer;
//////////////////////////////
//  Stuff
//////////////////////////////
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function string2path(path, { str2sym, replace } = {}) {
    // path = path.replace(symConv(SymData), '/' + symConv(SymData) + '/');
    if (replace)
        path = replace(path);
    path = path.replace(/\/+/g, '/');
    const result = [];
    path.split('/').forEach(key => key && (key = (str2sym ? str2sym(key.trim()) : key.trim())) && result.push(key));
    return result;
}
//////////////////////////////
//  Object resolver functions
//////////////////////////////
const isElemRef = (val) => isString(val) && val.trim().substr(0, 2) == '^/';
exports.isElemRef = isElemRef;
function testRef(refRes, $_ref, track) {
    if (isUndefined(refRes))
        throw new Error('Reference "' + $_ref + '" leads to undefined object\'s property in path: ' + track.join('/'));
    return true;
}
function getInWithCheck(refRes, path) {
    let elems = refRes['^'];
    let whileBreak = false;
    while (!whileBreak) {
        whileBreak = true;
        for (let j = 0; j < path.length; j++) {
            refRes = getIn(refRes, path[j]);
            if (isElemRef(refRes)) {
                path = string2path(refRes).concat(path.slice(j + 1));
                refRes = { '^': elems };
                whileBreak = false;
                break;
            }
            if (isFunction(refRes) && j + 1 !== path.length) { // check if there is a function
                refRes = refRes(elems, path.slice(j + 1));
                break;
            }
            if (isUndefined(refRes))
                break;
        }
    }
    return refRes;
}
function objectDerefer(_elements, obj2deref, track = []) {
    if (!isMergeable(obj2deref))
        return obj2deref;
    let { $_ref = '' } = obj2deref, restObj = __rest(obj2deref, ["$_ref"]);
    $_ref = $_ref.split(':');
    const objs2merge = [];
    for (let i = 0; i < $_ref.length; i++) {
        if (!$_ref[i])
            continue;
        let path = string2path($_ref[i]);
        if (path[0] !== '^')
            throw new Error('Can reffer only to "^"');
        let refRes = getInWithCheck({ '^': _elements }, path);
        testRef(refRes, $_ref[i], track.concat('@' + i));
        if (isMergeable(refRes))
            refRes = objectDerefer(_elements, refRes, track.concat('@' + i));
        objs2merge.push(refRes);
    }
    let result = isArray(obj2deref) ? [] : {};
    for (let i = 0; i < objs2merge.length; i++) {
        if (objs2merge[i]._$setSelfIn && result) {
            let _a = objs2merge[i], { _$setSelfIn } = _a, restRes = __rest(_a, ["_$setSelfIn"]);
            result = merge(restRes, result, { path: _$setSelfIn });
        }
        else
            result = merge(result, objs2merge[i]);
    }
    return merge(result, objMap(restObj, objectDerefer.bind(null, _elements), track));
    //objKeys(restObj).forEach(key => result[key] = isMergeable(restObj[key]) ? objectDerefer(_objects, restObj[key]) : restObj[key]);
}
exports.objectDerefer = objectDerefer;
function skipKey(key, obj) {
    return key.substr(0, 2) == '_$' || obj['_$skipKeys'] && ~obj['_$skipKeys'].indexOf(key);
}
exports.skipKey = skipKey;
const convRef = (_elements, refs, track = [], prefix = '') => {
    const _objs = { '^': _elements };
    return deArray(refs.split('|').map((ref, i) => {
        ref = ref.trim();
        if (isElemRef(ref))
            prefix = ref.substr(0, ref.lastIndexOf('/') + 1);
        else
            ref = prefix + ref;
        ref = ref.split(':');
        let result;
        for (let i = 0; i < ref.length; i++) {
            let r = ref[i];
            if (!r)
                continue;
            if (!isElemRef(r))
                r = prefix + r;
            let refRes = getInWithCheck(_objs, string2path(r));
            testRef(refRes, r, track.concat('@' + i));
            if (refRes._$setSelfIn && result) {
                let { _$setSelfIn } = refRes, restRes = __rest(refRes, ["_$setSelfIn"]);
                result = merge(restRes, result, { path: _$setSelfIn });
            }
            else
                result = result ? merge(result, refRes) : refRes;
        }
        return result;
    }));
};
exports.convRef = convRef;
function objectResolver(_elements, obj2resolve, track = []) {
    if (isElemRef(obj2resolve))
        return convRef(_elements, obj2resolve, track);
    if (!isMergeable(obj2resolve))
        return obj2resolve;
    // const _objs = {'^': _elements};
    const result = objectDerefer(_elements, obj2resolve);
    const retResult = isArray(result) ? [] : {};
    objKeys(result).forEach((key) => {
        let value = result[key];
        if (isElemRef(value)) {
            value = convRef(_elements, value, track);
            if (key !== '$' && !skipKey(key, result) && (isFunction(value) || isArray(value) && value.every(isFunction)))
                value = { $: value };
        }
        if (!skipKey(key, result))
            retResult[key] = objectResolver(_elements, value, track.concat(key));
        else
            retResult[key] = value;
    });
    return retResult;
}
exports.objectResolver = objectResolver;
//# sourceMappingURL=index.js.map