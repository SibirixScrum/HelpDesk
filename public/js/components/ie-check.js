var div = document.createElement("div");
div.innerHTML = "<!--[if IE 9]><i></i><![endif]-->";
var isIeLessThan9 = (div.getElementsByTagName("i").length == 1);

module.exports = isIeLessThan9;