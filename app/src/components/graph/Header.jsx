import React, {Component} from 'react';
import socket from '../../socket'
import AppBar from 'material-ui/AppBar';
import TextField from 'material-ui/TextField';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import store from '../../store'


export default class Header extends Component {
    constructor(props) {
        super(props);
        const minDegree = store.getState().setting.minDegree;
        const hideEdges = store.getState().setting.hideEdges;
        this.state = {
            steamid: "",
            completed: 0,
            minDegree: minDegree
        }
    }



    render(){

        return (
            <div

            >
                <Toolbar

                >
                    <ToolbarGroup>
                    <TextField
                        id="text"
                        label="Steam id"
                        value={this.state.steamid}
                        onChange={event => this.setState({ ...this.state, steamid: event.target.value })}
                    />
                        <input
                            type="number"
                            value={this.state.minDegree}
                            onChange={event => this.setState({ ...this.state, minDegree: event.target.value })}
                        />
                        <input
                            type="button"
                            value="asd"
                            onClick={e => {store.dispatch({'type': 'SET_MIN_DEGREE', minDegree: this.state.minDegree})}}
                        />

                    </ToolbarGroup>
                </Toolbar>
            </div>
        )
    }
}