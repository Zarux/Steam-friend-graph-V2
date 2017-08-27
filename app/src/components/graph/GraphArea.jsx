import React, {Component} from 'react';
import socket from '../../socket'
import store from '../../store'
import {Sigma, ForceAtlas2, RelativeSize, SigmaEnableWebGL, RandomizeNodePositions, Filter} from 'react-sigma';
import LinearProgress from 'material-ui/LinearProgress';

function embedProps(elements, extraProps) {
    return React.Children.map(elements,
        (element) => React.cloneElement(element, extraProps))
}

export default class GraphArea extends Component {

    duration_multiplier = 10;

    constructor(props) {
        super(props);
        const userData = {user: this.props.id};
        socket.emit("get-graph", userData);
        socket.on("get-graph:return", data => {
            console.log(data.graph);
            this.setState({
                ...this.state,
                isDataFetched: true,
                graph: data.graph,
                root_id: userData.user,
            });

            this.begin_loading(this.duration_multiplier * this.state.graph.nodes.length);
        });

        this.state = {
            isDataFetched: false,
            graph : {},
            completed: 0,
            root_id: "",
        };
    }

    begin_loading(duration){
        const interval = 0.1;
        let time_passed = 0;
        duration = duration / 1000;
        const t = setInterval(() => {
            if(time_passed > duration){
                clearInterval(t);
            }
            time_passed += interval;
            this.setState({...this.state, completed: this.state.completed = (time_passed / duration) * 100})
        }, interval * 1000)
    }


    render(){
        if(!this.state.isDataFetched) return null;
        const minDegree = store.getState().setting.minDegree;
        const hideEdges = store.getState().setting.hideEdges;

        return (
            <div
                style={{
                    height: "100%",
                    width: "100%"
                }}
            >
                {this.state.completed >= 99.9 ? "" :
                    <LinearProgress
                        mode="determinate"
                        value={this.state.completed}
                        style={{
                            height: "50px"
                        }}
                    />
                }
                <Sigma
                    renderer="webgl"
                    style={{
                        maxWidth:"inherit",
                        height:"100%"
                    }}
                    graph={this.state.graph}
                    settings={{drawEdges: !hideEdges, clone: false, scalingMode: "outside", maxNodeSize: 10, minNodeSize: 1.5}}>
                    <SigmaEnableWebGL />
                    <RandomizeNodePositions/>
                    <Filter nodesBy={function (n) {
                        return this.degree(n.id) > minDegree;
                    }} />
                    <RelativeSize initialSize={5}/>


                    <ForceAtlas2
                        startingIterations={0}
                        barnesHutOptimize={this.state.graph.nodes.length > 2000}
                        worker
                        iterationsPerRender={this.state.graph.nodes.length > 5000 ? 100 : 2}
                        linLogMode
                        timeout={this.duration_multiplier * this.state.graph.nodes.length}
                    />
                    <SigmaColors wait={this.duration_multiplier * this.state.graph.nodes.length} root={this.state.root_id}/>
                </Sigma>

            </div>
        )
    }
}

class SigmaColors extends React.Component {

    constructor(props){
        super(props);
        this.s = props.sigma;
        const colorInterval = 500;
        let time_passed = 0;
        this.s.cameras[0].goTo({ x: 0, y: 0, angle: 0, ratio: 2 });
        this.s.settings({
            edgeColor: 'default',
            defaultEdgeColor: 'rgba(20, 30, 50, 0)',
            minEdgeSize: 0.01,
            maxEdgeSize: 0.1,
        });

        this.props.sigma.graph.nodes().forEach(n => {
            n.x = Math.random() * 3;
            n.y = Math.random() * 3;
        });
        this.calculateColors();
        const t = setInterval(() => {
            if(time_passed >= this.props.wait){
                clearInterval(t);
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
            node.color = `rgb(${r}, ${g}, ${b})`;
        })
    }
    render(){
        return null;
    }
}