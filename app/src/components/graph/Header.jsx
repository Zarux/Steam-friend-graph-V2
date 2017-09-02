import React, {Component} from 'react';
import socket from '../../socket'
import AppBar from 'material-ui/AppBar';
import TextField from 'material-ui/TextField';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import store from '../../store'
import { connect } from 'react-redux'
import RaisedButton from 'material-ui/RaisedButton';
import Slider from 'material-ui/Slider';
import Checkbox from 'material-ui/Checkbox';


class Header extends Component {
    constructor(props) {
        super(props);
        const minDegree = this.props.getSetting().minDegree;
        const markRoot = this.props.getSetting().markRoot;
        this.state = {
            steamid: this.props.id,
            oldSteamid: null,
            completed: 0,
            minDegree: minDegree,
            markRoot: markRoot
        }
    }

    render(){
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
                    </ToolbarGroup>
                    <ToolbarGroup
                        style={{
                            width: "5%"
                        }}
                    >

                        <Slider
                            label="Minimum degree"
                            style={{
                                marginTop: "20%",
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
                    <ToolbarGroup lastChild={true} style={{width: "20%"}}>
                        <Checkbox
                            label="Mark searched user"
                            checked={this.state.markRoot}
                            onCheck={(e)=>{
                                const newVal = !this.state.markRoot;
                                this.setState({...this.state, markRoot: newVal});
                                this.props.updateMarkRoot(newVal)
                            }}
                        />
                    </ToolbarGroup>

                </Toolbar>
            </div>
        )
    }
}

const mapStateToProps = state => ({
    getSetting(){
        return state.setting
    },
    getSearchedId(){
        return state.state.steamid
    }
});

const mapDispatchToProps = dispatch => ({
    updateMinDegree(minDegree){
        dispatch({type: 'SET_MIN_DEGREE', minDegree});
    },
    updateMarkRoot(){
        dispatch({type: 'TOGGLE_MARK_ROOT'});
    },
    updateSteamId(steamid, oldSteamid){
        console.log(steamid);
        dispatch({type: 'SET_STEAMID', steamid, oldSteamid});
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);