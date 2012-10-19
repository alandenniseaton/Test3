
(function(){
    var url = window.location.hash.substr(1);

    if (url) {
        window.location.replace(url);
    }
})();
