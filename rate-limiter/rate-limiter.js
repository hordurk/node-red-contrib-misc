module.exports = function(RED) {

  function time_array_to_msecs(time_array) {
    return 1e3 * time_array[0] + 1e-6 * time_array[1];
  }

  function RateLimiterNode(config) {
    RED.nodes.createNode(this, config);

    this.interval = config.interval || 0; // seconds
    this.units = config.units || "s";
    this.perTopic = config.perTopic || true;

    if (this.units == "s") { this.interval = this.interval * 1000; }
    if (this.units == "min") { this.interval = this.interval * 1000 * 60; }
    if (this.units == "hr") { this.interval = this.interval * 1000 * 60 * 60; }

    this.lastMsg = {};
    this.timer = undefined;

    var node = this;

    function clearStatus() {
      node.status({});
    }

    node.on('input', function(msg) {
      var topic;
      if (node.perTopic) {
        topic = msg.topic;
      }

      var last = node.lastMsg[topic];

      if (last === undefined || time_array_to_msecs(process.hrtime(last)) > this.interval) {
        node.send(msg);
        this.lastMsg[topic] = process.hrtime();
        node.status({fill:"green", shape:"dot", text:"msg passed"});
        clearTimeout(node.timer);
        node.timer = setTimeout(clearStatus, 3000);
      }
    });

    node.on('close', function() {
      if (node.timer) {
        clearTimeout(node.timer);
      }
    });
  }
  RED.nodes.registerType("rate-limiter", RateLimiterNode);
}
