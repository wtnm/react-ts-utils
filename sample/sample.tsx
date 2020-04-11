import * as React from 'react';
import {withProvider, withConsumer} from '../src/index'
import {PureComponent, useCallback} from "react";

const {render} = require('react-dom');

function Inner({$_count}: any) {
  return `inner count ${$_count}`
}

const ConnectedInner = withConsumer(Inner);

function Inc({$_setState, $_count}: any) {
  let onClick = useCallback(() => $_setState({count: $_count + 1}), [$_count]);
  return <button onClick={onClick}>+</button>
}

const ConnectedInc = withConsumer(Inc);

// function Main({$_setState, $but}: any) {
//   let onClick = useCallback(() =>
//     $_setState({but: !$but}), [$but]);
//
//   return <div>
//     <button onClick={onClick}>switch params</button>
//     <ConnectedInner $_count={"&/state/count" + ($but ? '2' : '')}/>
//     <ConnectedInc $_count="&/state/count" $_setState="&/setState"/>
//   </div>
// }

class Main extends PureComponent<any> {
  state: any = {count: 10, count2: 5, but: true};

  onSwitchClick = () => {
    this.setState({but: !this.state.but})
  };

  render() {
    let {but} = this.state;
    return <div>
      <button onClick={this.onSwitchClick}>switch params</button>
      <ConnectedInner $_count={"&/state/count" + (but ? '2' : '')}/>
      <ConnectedInc $_count="&/state/count" $_setState="&/setState"/>
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
