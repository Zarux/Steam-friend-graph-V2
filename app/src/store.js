import { createStore, combineReducers } from 'redux';
import settingReducer from './reducers/settingReducer';

const reducer = combineReducers({
    setting: settingReducer,
});

export default createStore(reducer);