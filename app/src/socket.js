const port = 7000;
const host = window.location.hostname;

const socket = io.connect(`${host}:${port}`);

export default socket;