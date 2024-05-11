export function print(logs, type, msg) {
    if(logs === false) return
    switch(type){
        case "warn":
            console.warn(msg)
            break;
        case "error":
            console.error(msg)
            break;
        case "log":
            console.log(msg)
            break;
        default:
            console.log(msg)
            break;
    }
}