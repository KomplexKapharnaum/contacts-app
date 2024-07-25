ICON = {}
ICON.tem = document.getElementById("icons-template")

ICON.get = function(name) {
    const icon = ICON.tem.cloneNode(true).content.querySelector("#icon-" + name + " svg");
    return icon;
}