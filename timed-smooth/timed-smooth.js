module.exports = function(RED) {

  function time_array_to_msecs(time_array) {
    return 1e3 * time_array[0] + 1e-6 * time_array[1];
  }

  function mean(arr) {
    return arr.reduce(function(s,x) {
      return s+x;
    }, 0)/arr.length;
  }

  function max(arr) {
    return Math.max.apply(null, arr);
  }

  function min(arr) {
    return Math.min.apply(null, arr);
  }

  function median(arr) {
    // copy array and sort by time
    var sorted = arr.sort();
    var half = Math.floor(sorted.length/2);
    if (sorted.length % 2 == 0) {
      return (sorted[half-1] + sorted[half]) / 2.0;
    } else {
      return sorted[half];
    }
  }

  function stddev(arr) {
    var m = mean(arr);
    return Math.sqrt(mean(arr.map(function(val) {
      var d = val - m;
      return d*d;
    })));
  }

  function TimedSmoothNode(config) {
    RED.nodes.createNode(this, config);

    this.units = config.units || "s";
    this.action = config.action || "mean";
    this.op1 = config.op1 || 0;
    this.op1type = config.op1type || "num";
    this.perTopic = config.perTopic || false;

    if (this.op1type === 'val') {
      this.op1type = "num";
    }
    if ((this.op1type === "num") && (!isNaN(this.op1))) { this.op1 = Number(this.op1); }
    if (this.op1 == "null") { this.op1 = null; }

    this.values = {};

    var node = this;

    function clearValues(topic) {
      node.values[topic] = [];
    }

    function addValue(topic, value) {
      if (!node.values[topic]) {
        node.values[topic] = [];
      }
      node.values[topic].push({"time": process.hrtime(), "value": value});
    }

    function cleanValues(topic, interval) {
      while(node.values[topic] && node.values[topic].length > 0 && time_array_to_msecs(process.hrtime(node.values[topic][0].time)) > interval) {
        node.values[topic].shift();
      }
    }

    function calcValue(topic, action) {
      var values = node.values[topic].map(function(val) {
        return val.value;
      });

      if (action==='median') {
        return median(values);
      } else if (action==='max') {
        return max(values);
      } else if (action==='min') {
        return min(values);
      } else if (action==='mean') {
        return mean(values);
      } else if (action==='stddev') {
        return stddev(values);
      } else {
        return 0;
      }
    }

    node.on('input', function(msg) {
      var topic;
      if (node.perTopic) {
        topic = msg.topic;
      }

      // check if reset is set, clear timer
      if (msg.hasOwnProperty("reset")) {
        clearValues(topic);
      }

      var interval;
      if (node.op1type === 'flow' || node.op1type === 'global') {
        interval = RED.util.evaluateNodeProperty(node.op1,node.op1type,node,msg);
      } else {
        interval = node.op1;
      }

      if (node.units == "s") { interval = interval * 1000; }
      if (node.units == "min") { interval = interval * 1000 * 60; }
      if (node.units == "hr") { interval = interval * 1000 * 60 * 60; }

      cleanValues(topic, interval);

      addValue(topic, msg.payload);

      node.status({fill:"green", shape:"dot", text:""+node.values[topic].length});

      msg.payload = calcValue(topic, node.action);
      node.send(msg);

    });

    node.on('close', function() {
    });
  }
  RED.nodes.registerType("timed-smooth", TimedSmoothNode);
}
