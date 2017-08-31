const SET_STEAMID = 'SET_STEAMID';
const SET_RENDER = 'SET_RENDER';

const initialState = {
    steamid: null,
    oldSteamid: null,
    render: true
};

export default function stateReducer(state=initialState, action){

    switch(action.type){
        case SET_STEAMID:
            return {
                steamid: action.steamid,
                oldSteamid: action.oldSteamid,
                render: state.render
            };
        case SET_RENDER:
            return {
                steamid: state.steamid,
                oldSteamid: state.oldSteamid,
                render: action.render
            };

        default:
            return state;

    }

};