var div = document.createElement("div");
div.innerHTML = "<!--[if IE 9]><i></i><![endif]-->";
var isIeLessThan9 = (div.getElementsByTagName("i").length == 1);

if (isIeLessThan9) {
    if (!window.console) window.console = {};
    if (!window.console.log) window.console.log = function () {};
}

module.exports = isIeLessThan9;