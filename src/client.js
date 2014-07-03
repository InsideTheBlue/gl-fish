var sockjs_url = '/echo';
var sockjs = new SockJS(sockjs_url);

sockjs.onopen = function() {
    //console.log('[*] open', sockjs.protocol);
};
sockjs.onmessage = function(e) {
    //console.log('[.] message', e.data);
    var minData = 0; //10;
    var maxData = 180; //50;
    var percData = 1 - (Math.min(Math.max(e.data, minData), maxData) - minData) / (maxData - minData);

    if(setLight){
        setLight(percData);
    }

    console.log(e.data, percData);
};
sockjs.onclose = function() {
    //console.log('[*] close');
};
