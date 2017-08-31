import React, {Component} from 'react';
import socket from '../../socket'
import AppBar from 'material-ui/AppBar';
import TextField from 'material-ui/TextField';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import store from '../../store'
import { connect } from 'react-redux'
import RaisedButton from 'material-ui/RaisedButton';
import Slider from 'material-ui/Slider';


class Header extends Component {
    constructor(props) {
        super(props);
        const minDegree = this.props.getMinDegree();
        const hideEdges = store.getState().setting.hideEdges;
        this.state = {
            steamid: this.props.id,
            oldSteamid: null,
            completed: 0,
            minDegree: minDegree
        }
    }

    render(){
        const minDegree = this.props.getMinDegree();
        return (
            <div>
                <Toolbar>
                    <ToolbarGroup>
                    <TextField
                        id="text"
                        label="Steam id"
                        value={this.state.steamid}
                        onChange={event => this.setState({ ...this.state, steamid: event.target.value })}
                    />
                    <RaisedButton
                        label="Search"
                        primary={true}
                        onClick={event => {
                            this.props.updateSteamId(this.state.steamid, this.state.oldSteamid);
                            this.setState({...this.state, oldSteamid: this.state.steamid})
                        }}
                    />
                    <ToolbarGroup
                        style={{
                            width: "100px"
                        }}
                    >
                        <Slider
                            style={{
                                width: "100%"
                            }}
                            min={1}
                            max={5}
                            step={1}
                            value={this.state.minDegree}
                            onChange={(event, minDegree) => {
                                this.setState({ ...this.state, minDegree});
                                this.props.updateMinDegree(minDegree);
                            }}
                        />
                    </ToolbarGroup>
                    </ToolbarGroup>
                </Toolbar>
            </div>
        )
    }
}

const mapStateToProps = state => ({
    getMinDegree(){
        return state.setting.minDegree
    },
    getSearchedId(){
        return state.state.steamid
    }
});

const mapDispatchToProps = dispatch => ({
    updateMinDegree(minDegree){
        dispatch({type: 'SET_MIN_DEGREE', minDegree});
    },
    updateSteamId(steamid, oldSteamid){
        console.log(steamid);
        dispatch({type: 'SET_STEAMID', steamid, oldSteamid});
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);