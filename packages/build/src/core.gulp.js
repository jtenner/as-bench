// TODO create build task instead of default

function defaultTask(cb) {
  console.log("TODO build @as-bench/core with tsc");

  /// ...

  cb();
}

function clean() {
  /// ...
}

function tsc() {
  /// ...
}

exports.default = defaultTask;
