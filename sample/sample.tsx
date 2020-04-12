import * as React from 'react';
import {withProvider, withConsumer} from '../src/index'
import {PureComponent, useCallback} from "react";

const {render} = require('react-dom');

function Inner({count}: any) {
  return `inner count ${count}`
}

const ConnectedInner = withConsumer(Inner, {$maps: {count: 'state/count'}});

function Inc({setState, count}: any) {
  let onClick = useCallback(() => setState({count: count + 1}), [count]);
  return <button onClick={onClick}>+</button>
}

const ConnectedInc = withConsumer(Inc, {$maps: {count: 'state/count', setState: "setState"}});


class Main extends PureComponent<any> {
  state: any = {count: 10, count2: 5, but: true};

  onSwitchClick = () => {
    this.setState({but: !this.state.but})
  };

  render() {
    let {but} = this.state;
    return <div>
      <button onClick={this.onSwitchClick}>switch params</button>
      <ConnectedInner/>
      <ConnectedInc/>
    </div>
  }
}


const ProviderMain = withProvider(Main, {initialState: {count: 0, count2: 100, but: false}}) as any;


if (typeof window != 'undefined') {
  const container = document.querySelector('#root');

  render(<div style={{margin: '1em'}}>
    <ProviderMain/>
  </div>, container);
}
