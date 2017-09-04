module.exports = function(RED) {

  function time_array_to_msecs(time_array) {
    return 1e3 * time_array[0] + 1e-6 * time_array[1];
  }

  function MsgHoldNode(config) {
    RED.nodes.createNode(this, config);

    this.units = config.units || "s";
    this.policy = config.policy || "first";
    this.op1 = config.op1 || 0;
    this.op1type = config.op1type || "num";

    if (this.op1type === 'val') {
      this.op1type = "num";
    }
    if ((this.op1type === "num") && (!isNaN(this.op1))) { this.op1 = Number(this.op1); }
    if (this.op1 == "null") { this.op1 = null; }

    this.lastMsg = {};
    this.timer = undefined;

    var node = this;

    function resetTimer() {
      clearTimeout(node.timer);
      node.timer = undefined;
      node.msg = undefined;
    }

    function sendMsg() {
      node.send(node.msg);
      resetTimer();
      node.status({});
    }

    node.on('input', function(msg) {

      // check if reset is set, clear timer
      if (msg.hasOwnProperty("reset")) {
          resetTimer();
          node.status({text:"reset"});
          return;
      }

      if (!node.timer || node.policy === 'reset') {

        var interval;
        if (node.op1type === 'flow' || node.op1type === 'global') {
          interval = RED.util.evaluateNodeProperty(node.op1,node.op1type,node,msg);
        } else {
          interval = node.op1;
        }

        if (node.units == "s") { interval = interval * 1000; }
        if (node.units == "min") { interval = interval * 1000 * 60; }
        if (node.units == "hr") { interval = interval * 1000 * 60 * 60; }

        resetTimer();

        node.msg = msg;
        node.timer = setTimeout(sendMsg, interval);
        node.status({text:"holding"});
      }
      if(node.policy === 'latest') {
        node.msg = msg;
        node.status({text:"holding latest"});
      }

    });

    node.on('close', function() {
      if (node.timer) {
        clearTimeout(node.timer);
      }
    });
  }
  RED.nodes.registerType("msg-hold", MsgHoldNode);
}
