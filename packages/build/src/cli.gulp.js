const gulp = require("gulp");
const { series, dest } = gulp;
const debug = require("gulp-debug");
const ts = require("gulp-typescript");
const sourcemaps = require('gulp-sourcemaps');
const vinylPaths = require("vinyl-paths");
const del = require("del");

/** enum for gulp events, used for lifecycles */
const gEvents = {
  END: "end",
};

/** various paths, and settings for our gulp tasks*/
const config = {
  paths: {
    lib: "../../cli/lib",
    src: "../../cli/src"
  },
  clean: {
    src: {
      allowEmpty: true,
    },
    del: {
      force: true,
    },
    debug: {
      title: "|-> clean:",
    },
  },
  tsc: {
    base: "../../cli/tsconfig.json",
    amd: {
      outFile: "../../cli/lib/as-bench.cli.amd.js",
      module: "amd",
      declaration: true,
    },
    debug: {
      title: "|-> tsc:",
    },
  }
};

/**
 * This clean task looks for our lib folder in our cli package, removes
 * its files recursively and itself. 
 */
function clean() {
  return new Promise(function (resolve, reject) {
    const vp = vinylPaths();
    gulp
      .src(config.paths.lib, config.clean.src)
      .pipe(vp)
      .pipe(debug(config.clean.debug))
      .pipe(gulp.dest(config.paths.lib))
      .on(gEvents.END, async () => {
        try {
          await del(vp.paths, config.clean.del);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
}

/**
 * typescript compiler task which will create a project object, and apply
 * addition settings for building an amd module. This task additionally
 * will auto generate our declaration types as well. 
 */
function tscAmd() {
  const tsProject = ts.createProject(config.tsc.base, config.tsc.amd);

  return new Promise(function (resolve, reject) {
    tsProject
      .src()
      .pipe(sourcemaps.init())
      .pipe(debug(config.tsc.debug))
      .pipe(tsProject()).js
      .pipe(sourcemaps.write({sourceRoot: config.paths.src}))
      .pipe(dest(config.paths.lib))
      .on(gEvents.END, async () => {
        try {
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
}

function tsc() {
  const tsProject = ts.createProject(config.tsc.base, config.tsc.amd);

  return new Promise(function (resolve, reject) {
    tsProject
      .src()
      .pipe(sourcemaps.init())
      .pipe(debug(config.tsc.debug))
      .pipe(tsProject()).js
      .pipe(sourcemaps.write())
      .pipe(dest(config.paths.lib))
      .on(gEvents.END, async () => {
        try {
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
}

module.exports = {
  clean: clean,
  build: series(clean, tsc),
};
