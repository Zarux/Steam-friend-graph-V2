import { createStore, combineReducers } from 'redux';
import settingReducer from './reducers/settingReducer';
import stateReducer from './reducers/stateReducer'

const reducer = combineReducers({
    setting: settingReducer,
    state: stateReducer
});

export default createStore(reducer);