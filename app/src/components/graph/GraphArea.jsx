import React, {Component} from 'react';
import socket from '../../socket'
import {Sigma, ForceAtlas2, RelativeSize, SigmaEnableWebGL, RandomizeNodePositions, Filter} from 'react-sigma';
import LinearProgress from 'material-ui/LinearProgress';
import { connect } from 'react-redux'
import store from '../../store'

class GraphArea extends Component {

    duration_multiplier = 8;

    constructor(props) {
        super(props);

        socket.on("get-graph:return", data => {

            this.setState({
                ...this.state,
                isDataFetched: true,
                graph: data.graph,
                root_id: data.user,
                selectedNode: data.user
            });
            this.props.updateRender(true);
        });

        this.state = {
            isDataFetched: false,
            graph : {},
            completed: 0,
            root_id: "",
            selectedNode: "",
            nodeInfo: {}
        };
    }

    handleNodeClicked = (node) => {
        const trueNode = node.data.node;
        this.setState({
            ...this.state,
            selectedNode: {
                personaname: trueNode.personaname,
                realname: trueNode.realname,
                loccountrycode: trueNode.loccountrycode,
                friends: trueNode.friends,
                communityid: trueNode.communityid,
                steamid: trueNode.steamid
            }
        })
    };

    render(){
        const minDegree = parseInt(this.props.getSetting().minDegree);
        console.log(this.props.getSetting().markRoot);
        if(!this.state.isDataFetched || !this.props.getRender()) return null;

        return (
            <div
                style={{
                    height: "100%",
                    width: "100%"
                }}
            >
                <div
                    style={{
                        display: 'none',
                        border: "1px solid black",
                        float: "left",
                        height: "25%",
                        width: "15%",
                        position: "fixed",
                        marginTop: "5px",
                        backgroundColor: "ivory"
                    }}
                >
                    Name: {this.state.selectedNode.realname} <br />
                    Alias: {this.state.selectedNode.personaname} <br />
                    Country: {this.state.selectedNode.loccountrycode} <br />

                </div>
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
                        gravity={parseInt(Math.ceil(this.state.graph.nodes.length / 10000)) + 1}
                        iterationsPerRender={2 ** (parseInt(Math.ceil(this.state.graph.nodes.length / 3000)))}
                        timeout={this.state.graph.nodes.length * this.duration_multiplier}
                    />
                    <SigmaColors
                        wait={this.duration_multiplier * this.state.graph.nodes.length}
                        root={this.state.root_id}
                        markRoot={this.props.getSetting().markRoot}
                    />
                    <SigmaEvents handleNodeClicked={this.handleNodeClicked}/>
                </Sigma>

            </div>
        )
    }
}

class SigmaEvents extends React.Component {

    constructor(props){
        super(props);
        this.s = props.sigma;
        this.s.bind('clickNode', this.props.handleNodeClicked)
    }

    render(){
        return null
    }
}

class SigmaColors extends React.Component {

    colorTimer = null;
    rootSize = null;

    componentWillUnmount(){
        clearInterval(this.colorTimer);
    }

    componentDidUpdate(){
        console.log(this.props.markRoot);
        if(this.props.markRoot && this.props.root){
            this.s.graph.nodes(this.props.root).size = this.rootSize + 3;
        }else{
            this.s.graph.nodes(this.props.root).size = this.rootSize;
        }
        this.calculateColors();
        this.s.refresh()
    }

    constructor(props){
        super(props);
        this.s = props.sigma;
        const colorInterval = 500;
        let time_passed = 0;
        this.s.cameras[0].goTo({ x: 0, y: 0, angle: 0, ratio: 2 });
        this.s.settings({
            edgeColor: 'default',
            defaultEdgeColor: 'rgba(30, 30, 30, 0)'
        });

        this.props.sigma.graph.nodes().forEach(n => {
            n.x = Math.random() * 3;
            n.y = Math.random();
        });

        this.rootSize = this.s.graph.nodes(this.props.root).size;

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
        let xFactor, yFactor;//, zFactor;
        let xLowest, yLowest, xHighest, yHighest;//, zLowest, zHighest;
        let nodesX, nodesY;//, nodesZ;

        nodesX = this.s.graph.nodes().map((node)=>{return node.x});
        nodesY = this.s.graph.nodes().map((node)=>{return node.y});
        //nodesZ = this.s.graph.nodes().map((node)=>{return this.s.graph.degree(node.id)});
        xLowest = Math.min(-1, Math.min(...nodesX));
        xHighest = Math.max(...nodesX);
        yLowest = Math.min(-1, Math.min(...nodesY));
        yHighest = Math.max(...nodesY);
        //zLowest = Math.min(...nodesZ);
        //zHighest = Math.min(Math.max(...nodesZ), 20);

        xFactor = 255 / (xHighest + Math.abs(xLowest));
        yFactor = 255 / (yHighest + Math.abs(yLowest));
        //zFactor = 70 / zHighest;

        this.s.graph.nodes().forEach(node => {
            let r,g,b;
            let z = Math.min(20, this.s.graph.degree(node.id));
            g = Math.max(parseInt((node.x + Math.abs(xLowest)) * xFactor), 100);
            b = Math.max(parseInt((node.y + Math.abs(yLowest)) * yFactor), 100);
            r = 0;
            //r = Math.max(parseInt(z * zFactor), 10);
            if(this.props.markRoot && node.id === this.props.root){
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
    getSetting(){
        return state.setting
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