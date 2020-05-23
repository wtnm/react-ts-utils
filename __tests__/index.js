process.env.TS_NODE_PROJECT = './tsconfig.json';

// Optional: set env variable to enable `tsconfig-paths` integration
// process.env.TS_CONFIG_PATHS = true;

require('ts-mocha'); // register mocha wrapper
const {expect} = require('chai');

const main = require('../src/index.tsx');

describe('object resolver tests', function () {
  const objects = {
    preset: {first: {one: 'one value'}, second: {two: 'two value'}},
    funcs: {
      one: function (...a) {return a},
      two: function (...a) {return a},
      not: function (a) {return !a},
    },
    parts: {
      first: {
        $_ref: '^/preset',
        f1: '^/funcs/one',
        'f1.bind': [2]
      },
      second: {
        $_ref: '^/parts/first',
        'f1.bind': [4],
        f2: '^/funcs/two',
        'f2.bind': [6, 10],
      }
    }
  };
  let exampleObj = {
    func: '^/funcs/two',
    part: {
      $_ref: '^/parts/second',
      'f1.bind': [1],
      first: {
        three: 'three value',
        $_maps: {
          isArray: [{$: '^/funcs/two', args: ['@/fData/type', 'array']}],
          arrayStart: {$: '^/funcs/two', args: [], update: 'build'},
          FFormApi: {$: '^/funcs/one', args: 'props/pFForm/api', update: 'build'},
          $layout: {$: '^/funcs/one', args: 'ff_layout', update: 'data'},
          $branch: {$: '^/funcs/one', args: 'state/branch', update: 'every'},
        }
      },
      _some: '^/funcs/two',
      _more: {
        f3: '^/funcs/three',
        $_maps: {value: '@/value'}
      },
      $fields: [{$_maps: {length: '@/length'}}],
      $_maps: {value: '@/value'}
    }
  };

  it('test objectDerefer', function () {
    let obj = main.objectDerefer(objects, exampleObj);
    expect(obj.func).to.be.equal('^/funcs/two');
    expect(obj.part.f1).to.be.equal('^/funcs/one');
    expect(obj.part['f1.bind']).to.be.eql([1]);
    expect(obj.part.f2).to.be.equal('^/funcs/two');
    expect(obj.part['f2.bind']).to.be.eql([6, 10]);
    expect(obj.part.first.one).to.be.equal('one value');
    expect(obj.part.first.three).to.be.equal('three value');
  });

  // it('test api.objectResolver', function () {
  //
  //   let obj = apiLib.objectResolver(elements, exampleObj);
  //   expect(obj.func).to.be.equal(elements.funcs.two);
  //   expect(obj.part.f1).to.be.equal(elements.funcs.one);
  //   expect(obj.part['f1.bind']).to.be.eql([1]);
  //   expect(obj.part.f2).to.be.equal(elements.funcs.two);
  //   expect(obj.part['f2.bind']).to.be.eql([6, 10]);
  //   expect(obj.part._some).to.be.equal(elements.funcs.two);
  //   expect(obj.part._more.f3).to.be.equal('^/funcs/three');
  //
  //   obj2SymData = apiLib.objectResolver(elements, exampleObj);
  //   expect(obj2SymData.func).to.be.equal(elements.funcs.two);
  //   expect(obj2SymData.part.f1).to.be.equal(elements.funcs.one);
  //   expect(obj2SymData.part['f1.bind']).to.be.eql([1]);
  //   expect(obj2SymData.part.f2).to.be.equal(elements.funcs.two);
  //   expect(obj2SymData.part['f2.bind']).to.be.eql([6, 10]);
  //   expect(obj2SymData.part.first.one).to.be.equal('one value');
  //   expect(obj2SymData.part.first.three).to.be.equal('three value');
  //   expect(obj2SymData.part._some).to.be.equal(elements.funcs.two);
  //   expect(obj2SymData.part._more.f3).to.be.equal('^/funcs/three');
  // });
});

describe('object manipulations tests', function () {

  it('test delIn', function () {
    let state = {vr: {t1: 1, t2: 2, t3: {r1: 5, r2: undefined}}, vr_1: 1};
    let result = main.delIn(state, ['vr', 't3', 'r4']);
    expect(result).to.be.equal(state);
    result = main.delIn(state, ['vr', 't3', 'r2']);
    expect(result !== state).to.be.equal(true);
    expect(main.isEqual(result, {"vr": {"t1": 1, "t2": 2, "t3": {"r1": 5}}, "vr_1": 1}, {deep: true})).to.be.equal(true);
    result = main.delIn(state, ['vr', 't3', 'r1,r2,r6']);
    expect(result !== state).to.be.equal(true);
    expect(main.isEqual(result, {"vr": {"t1": 1, "t2": 2, "t3": {}}, "vr_1": 1}, {deep: true})).to.be.equal(true);
    result = main.delIn(state, ['vr', 't2,t3']);
    expect(result !== state).to.be.equal(true);
    expect(main.isEqual(result, {"vr": {"t1": 1}, "vr_1": 1}, {deep: true})).to.be.equal(true);
  });

  it('test hasIn', function () {
    let state = {vr: {t1: undefined, t2: 2, t3: {r1: 5, r2: undefined}}, vr_1: 1};
    let result = main.hasIn(state, ['vr', 't3', 'r2']);
    expect(result).to.be.equal(true);
    result = main.hasIn(state, ['vr', 't3', 'r3']);
    expect(result).to.be.equal(false);
    result = main.hasIn(state, ['vr', 't3']);
    expect(result).to.be.equal(true);
    result = main.hasIn(state, ['t1', 't3']);
    expect(result).to.be.equal(false);
  });

  it('test setIn', function () {
    let state = {vr: 1};
    let result = main.setIn(state, 1, ['vr', 't3', 'r2']);
    expect(main.hasIn(result, ['vr', 't3', 'r2'])).to.be.equal(true);
    expect(state === result).to.be.equal(true);
    expect(main.getIn(state, ['vr', 't3', 'r2'])).to.be.equal(1);
    result = main.setIn(state, 2, 'vr', 't2');
    expect(main.getIn(state, ['vr', 't3', 'r2'])).to.be.equal(1);
    expect(main.getIn(state, ['vr', 't2'])).to.be.equal(2);
    expect(state === result).to.be.equal(true);
    result = main.setIn(state, 1, []);
    expect(result).to.be.equal(1);
  });

  it('test objSplit', function () {
    let state = {vr: 0, $vr: 1, vt: 2, $vt: 3};
    let result = main.objSplit(state, (v) => v);
    expect(result).to.be.eql([{vr: 0}, {$vr: 1}, {vt: 2}, {$vt: 3}]);
    result = main.objSplit(state, (v) => v[0] === '$' ? 0 : 1, true);
    expect(result).to.be.eql([{$vr: 1, $vt: 3}, {vr: 0, vt: 2}])
  });

  it('test propsExtender', function () {
    let baseProps = {
      'checkbox': {_$tag: 'label'},
      'input': {_$tag: 'input', type: 'checkbox'},
      'label': {_$tag: 'span', children: ['label']}
    };
    let $extend = {
      icon: {$_tag: 'div', children: 'img'},
      text: {$_tag: 'div'}
    };
    let result = main.propsExtender(baseProps, $extend, {});
    expect(main.objKeys(result).length).to.be.equal(5);
    expect(main.objKeys(result)).to.be.eql(['checkbox', 'input', 'label', 'icon', 'text']);
    result = main.propsExtender(baseProps, $extend, {skipKeys: ['checkbox']});
    expect(main.objKeys(result).length).to.be.equal(4);
    expect(main.objKeys(result)).to.be.eql(['input', 'label', 'icon', 'text']);
    result = main.propsExtender(baseProps, $extend, {onlyKeys: ['checkbox']});
    expect(main.objKeys(result).length).to.be.equal(1);
    expect(main.objKeys(result)).to.be.eql(['checkbox']);

    $extend = {
      icon: {$_tag: 'div', children: 'img'},
      label: {_$tag: 'h4'}
    };
    result = main.propsExtender(baseProps, $extend, {});
    expect(main.objKeys(result).length).to.be.equal(4);
  });

  it('test mergeState', function () {

    let obj = {sm: 3, val: {a: 1, b: {c: 1}}};

    let result = main.mergeState({val: [1, 2, 3, 4]}, {val: {1: 5}}, {replace: (p, a) => Array.isArray(a)});
    expect(result.state.val).to.be.eql({1: 5});

    result = main.merge({a: [[1]]}, {a: [[2, 3]]});
    expect(result).to.be.eql({a: [[2, 3]]});

    result = main.mergeState({val: [1, 2, 3, 4]}, {val: {1: 5}}, {});
    expect(result.state.val).to.be.eql([1, 5, 3, 4]);

    result = main.mergeState({val: [1, 2, 3, 4]}, {val: {length: 1}});
    expect(result.state.val).to.be.eql([1]);

    let replaceObj = {a: {b: {c: 1}}, d: 5};
    let obj2replace = {d: 2};
    result = main.mergeState(replaceObj, {a: {b: obj2replace}}, {replace: {a: {b: true}}});
    expect(result.state.a.b).to.be.equal(obj2replace);
    expect(result.state.d).to.be.equal(5);
    expect(result.state.a.b.c).to.be.equal(undefined);

    result = main.mergeState(replaceObj, obj2replace, {replace: true});
    expect(result.state).to.be.equal(obj2replace);

    result = main.mergeState(replaceObj, {a: {}});
    expect(result.state).to.be.equal(replaceObj);

    result = main.mergeState(obj, {val: undefined}, {del: true});
    expect(result.changes).to.be.ok;
    expect(result.state).not.to.be.equal(obj);
    expect(result.state.hasOwnProperty('val')).to.be.false;
    expect(result.changes.val).to.be.equal(undefined);

    result = main.merge(obj, {val: undefined});
    expect(result.val).to.be.equal(undefined);

    result = main.mergeState({val: [1, 2, 3, 4]}, {val: [3, 4, 5]});
    expect(result.state.val).to.be.eql([3, 4, 5]);

    result = main.merge.all(obj, [{val: undefined}, {val: {b: {c: 1}}}], {del: true});
    expect(obj.val.b.c).to.be.equal(result.val.b.c);
    expect(result.val.hasOwnProperty('a')).to.be.false;

    result = main.mergeState(obj, result, {diff: true, del: true});
    expect(obj.val.b).to.be.equal(result.state.val.b);
    expect(result.state.val.hasOwnProperty('a')).to.be.false;
    expect(result.changes.val.a).to.be.equal(undefined);

    result = main.mergeState({a: 1}, {b: 2}, {diff: true});
    expect(result.state).to.be.eql({b: 2});
    expect(result.changes).to.be.eql({a: undefined, b: 2});

    result = main.mergeState([1, 2, 3, 4], [3, 4, 5], {});
    expect(result.state).to.be.eql([3, 4, 5]);

    result = main.mergeState([1, 2, 3, 4], {0: 3, 1: 4, 2: 5});
    expect(result.state).to.be.eql([3, 4, 5, 4]);

    result = main.mergeState({val: [1, 2, 3, 4]}, {val: []});
    expect(result.state.val).to.be.eql([]);

    let arr = [1, 2, 3, 4];
    result = main.mergeState({val: arr}, {val: [3, 4, 5]}, {arrays: (a, b) => a.concat(b)});
    expect(result.state.val).to.be.eql([1, 2, 3, 4, 3, 4, 5]);
    expect(result.state.val).not.to.be.equal(arr);

    let newArr = {val: []};
    newArr.val.length = 3;
    newArr.val[1] = 8;
    result = main.mergeState({val: arr}, newArr, {});
    expect(result.state.val).to.be.eql([1, 8, 3]);
    expect(result.state.val).not.to.be.equal(arr);

    obj = {
      "array_1": [],
      "array_2": [[{"v1": 1, "v2": 2}, {"t1": 4, "t2": 5}]]
    };
    result = main.mergeState(undefined, obj, {del: true,});
    expect(result.state).to.be.eql(obj);

    let arr2 = [];
    result = main.mergeState(obj, {array_1: arr2}, {replace: (p, a) => Array.isArray(a)});
    expect(result.state).not.to.be.equal(obj);
    expect(result.state.array_1).to.be.equal(arr2);

    result = main.mergeState(obj, {array_1: []}, {});
    expect(result.state).to.be.equal(obj);

    result = main.mergeState(obj, {array_1: []}, {arrays: (a, b) => a.concat(b)});
    expect(result.state).to.be.equal(obj);


    obj = {a: 1, b: {c: 3}};
    obj2 = {d: 4, e: 5};
    result = main.merge(obj, obj2, {path: 'b/c'});
    expect(result.b.c).to.be.equal(obj2)
  });


});



