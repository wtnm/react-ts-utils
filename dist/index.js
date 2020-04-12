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
/////////////////////////////
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
function objSplit(obj, fn, byKey = false) {
    let res = [];
    objKeys(obj).forEach((key) => setIn(res, obj[key], fn(byKey ? key : obj[key]), key));
    return res;
}
exports.objSplit = objSplit;
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
            this.subscribe = (param, fn) => {
                let { subscribers } = this;
                if (!subscribers[param])
                    subscribers[param] = new Set();
                subscribers[param].add(fn);
                return this.unsubscribe.bind(this, param, fn);
            };
            this.unsubscribe = (param, fn) => {
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
                objKeys($maps).forEach(key => {
                    this.context.subscribe($maps[key].join('/'), this.refresh);
                });
            };
            this.unsubscribe = (props) => {
                objKeys($maps).forEach(key => {
                    this.context.unsubscribe($maps[key].join('/'), this.refresh);
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
//# sourceMappingURL=index.js.map