module.exports = function(RED) {

  function IfGateNode(config) {
    RED.nodes.createNode(this, config);

    this.topic = config.topic || "enable";
    this.initialState = config.initialState || "disabled";
    this.controlProp = config.controlProp || "";

    this.state = this.initialState === "enabled";

    var node = this;

    function setStatus() {
      node.status({fill:(node.state ? "green" : "red"), shape:"dot"});
    }

    setStatus();

    node.on('input', function(msg) {

      if (node.topic != "" && msg.hasOwnProperty('topic') && node.topic===msg.topic) {
        this.state = msg.payload;
        setStatus();
        return;
      }
      if (node.controlProp != "" && msg.hasOwnProperty(this.controlProp)) {
        this.state = msg[controlProp];
        setStatus();
        return;
      }

      if (node.state) {
        node.send(msg);
      }

    });

  }
  RED.nodes.registerType("if-gate", IfGateNode);
}
