var globalEnv = {
   stub: require("stub"),
   extmgr: require("extensionmgr") /* extmgr = extension manager*/,
   su: require("stub/extensions/stub.su") /* su = SU utility extension for stub */,
   asc: require("ascolor"),

};

module.exports=globalEnv;
