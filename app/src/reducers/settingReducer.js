const SET_MIN_DEGREE = 'SET_MIN_DEGREE';
const SET_HIDE_EDGES ='SET_HIDE_EDGES';
const TOGGLE_MARK_ROOT ='TOGGLE_MARK_ROOT';

const initialState = {
    minDegree: 2,
    hideEdges: false,
    markRoot: false
};

export default function settingReducer(state=initialState, action){

    switch(action.type){
        case SET_MIN_DEGREE:
            return {
                ...state,
                minDegree: action.minDegree,
            };
        case SET_HIDE_EDGES:
            return {
                ...state,
                hideEdges: action.hideEdges
            };
        case TOGGLE_MARK_ROOT:
            return {
                ...state,
                markRoot: !state.markRoot
            };

        default:
            return state;

    }

};