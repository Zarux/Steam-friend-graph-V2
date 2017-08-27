import React, {Component} from 'react';
import socket from '../../socket'
import Header from './Header'
import GraphArea from './GraphArea'

export default class Graph extends Component {
    constructor(props) {
        super(props);
    }

    render(){
        return (
            <div
                style={{
                    height: "100%",
                    width: "100%"
                }}
            >
                <Header/>
                <GraphArea id={this.props.match.params.id}/>
            </div>
        )
    }
}