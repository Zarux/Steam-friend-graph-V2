import React, {Component} from 'react';
import socket from '../../socket'
import {Sigma, ForceAtlas2, RelativeSize, SigmaEnableWebGL, RandomizeNodePositions, Filter} from 'react-sigma';
import LinearProgress from 'material-ui/LinearProgress';
import { connect } from 'react-redux'
import store from '../../store'

class GraphArea extends Component {

    duration_multiplier = 10;

    constructor(props) {
        super(props);

        socket.on("get-graph:return", data => {
            this.setState({
                ...this.state,
                isDataFetched: true,
                graph: data.graph,
                root_id: data.user,
            });
            this.props.updateRender(true);
        });

        this.state = {
            isDataFetched: false,
            graph : {},
            completed: 0,
            root_id: ""
        };
    }

    render(){
        const minDegree = parseInt(this.props.getMinDegree());
        if(!this.state.isDataFetched || !this.props.getRender()) return null;

        return (
            <div
                style={{
                    height: "100%",
                    width: "100%"
                }}
            >
                <Sigma
                    renderer="webgl"
                    style={{
                        width: "100%",
                        maxWidth: "100%",
                        height: "100%"
                    }}
                    graph={this.state.graph}
                    settings={{
                        drawEdges: true,
                        clone: false,
                        scalingMode: "outside",
                        maxNodeSize: 15,
                        minNodeSize: 2,
                        batchEdgesDrawing: true,
                        labelThreshold: 8,
                        defaultLabelColor: "#AAAAAA",
                        zoomMin: 0.02,
                        zoomMax: 3,
                        zoomingRatio: 1.2
                    }}>
                    <SigmaEnableWebGL />
                    <RandomizeNodePositions/>
                    <Filter nodesBy={function (n) {
                        return this.degree(n.id) >= minDegree;
                    }} />
                    <RelativeSize initialSize={2}/>


                    <ForceAtlas2
                        barnesHutOptimize
                        worker
                        gravity={1}
                        scalingRatio={1.5}
                        iterationsPerRender={parseInt(Math.ceil(this.state.graph.nodes.length / 30000))}
                        timeout={this.state.graph.nodes.length * this.duration_multiplier}
                    />
                    <SigmaColors
                        wait={this.duration_multiplier * this.state.graph.nodes.length}
                        root={this.state.root_id}
                    />
                </Sigma>

            </div>
        )
    }
}

class SigmaColors extends React.Component {

    colorTimer = null;

    componentWillUnmount(){
        clearInterval(this.colorTimer);
    }

    constructor(props){
        super(props);
        this.s = props.sigma;
        const colorInterval = 500;
        let time_passed = 0;
        this.s.cameras[0].goTo({ x: 0, y: 0, angle: 0, ratio: 2 });
        this.s.settings({
            edgeColor: 'default',
            defaultEdgeColor: 'rgba(20, 30, 50, 0)'
        });

        this.props.sigma.graph.nodes().forEach(n => {
            n.x = Math.random() * 3;
            n.y = Math.random();
        });
        this.calculateColors();

        this.colorTimer = setInterval(() => {
            if(time_passed >= this.props.wait){
                clearInterval(this.colorTimer);
            }
            time_passed += colorInterval;
            this.calculateColors()
        }, colorInterval);
    }

    calculateColors(){
        let xFactor, yFactor;
        let xLowest, yLowest, xHighest, yHighest;
        let nodesX, nodesY;

        nodesX = this.s.graph.nodes().map((node)=>{return node.x});
        nodesY = this.s.graph.nodes().map((node)=>{return node.y});
        xLowest = Math.min(-1, Math.min(...nodesX));
        xHighest = Math.max(...nodesX);
        yLowest = Math.min(-1, Math.min(...nodesY));
        yHighest = Math.max(...nodesY);
        xFactor = 255 / (xHighest + Math.abs(xLowest));
        yFactor = 255 / (yHighest + Math.abs(yLowest));

        this.s.graph.nodes().forEach(node => {
            let r,g,b;
            b = Math.max(parseInt((node.x + Math.abs(xLowest)) * xFactor), 50);
            g = Math.max(parseInt((node.y + Math.abs(yLowest)) * yFactor), 50);
            r = 20;
            if(node.part_of_path){
                node.size = node.size + 5;
                node.color = `rgb(${255}, ${g}, ${b})`;
            }else{
                node.color = `rgb(${r}, ${g}, ${b})`;
            }

        })
    }
    render(){
        return null;
    }
}

const mapStateToProps = state => ({
    getMinDegree(){
        return state.setting.minDegree
    },
    getSteamId(){
        return state.state.steamid
    },
    getRender(){
        return state.state.render
    }

});


const mapDispatchToProps = dispatch => ({
    updateRender(render){
        dispatch({type: 'SET_RENDER', render});
    }
});

const actor = (state, dispatch) => {
    console.log(state);
    if(state.state.steamid !== state.state.oldSteamid){
        dispatch({type: 'SET_STEAMID', steamid: state.state.steamid, oldSteamid: state.state.steamid});
        dispatch({type: 'SET_RENDER', render: false});
        const userData = {user: state.state.steamid};
        socket.emit("get-graph", userData);
    }
};
let acting = false;
store.subscribe(()=> {
    if(!acting){
        acting = true;
        actor(store.getState(), store.dispatch);
        acting = false;
    }

});

export default connect(mapStateToProps, mapDispatchToProps)(GraphArea);