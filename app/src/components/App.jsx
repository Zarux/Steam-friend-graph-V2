import React, {Component} from 'react';
import {BrowserRouter as Router, Route} from 'react-router-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Graph from './graph/Graph'
import { Provider } from 'react-redux';
import store from "../store";


import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();


const appPalette = {
    primary1Color: "#1690DB",
};

const theme = getMuiTheme({
    palette: appPalette
});

export default class App extends Component{

    render() {
        return (
            <Provider store={store}>
                <MuiThemeProvider muiTheme={theme}>
                    <Router>
                        <div className="app" style={{
                            height: "100%",
                            width: "100%"
                        }}>
                            <Route exact path="/:id" component={Graph}/>
                        </div>
                    </Router>
                </MuiThemeProvider>
            </Provider>
        );
    }
}
