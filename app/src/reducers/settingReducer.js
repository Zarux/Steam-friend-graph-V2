const SET_MIN_DEGREE = 'SET_MIN_DEGREE';
const SET_HIDE_EDGES ='SET_HIDE_EDGES';

const initialState = {
    minDegree: 1,
    hideEdges: false
};

export default function settingReducer(state=initialState, action){

    switch(action.type){
        case SET_MIN_DEGREE:
            return {
                minDegree: action.minDegree,
                hideEdges: state.hideEdges
            };
        case SET_HIDE_EDGES:
            return {
                minDegree: state.minDegree,
                hideEdges: action.hideEdges
            };

        default:
            return state;

    }

};