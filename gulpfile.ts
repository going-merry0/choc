import del from "del";
import gulp from "gulp";
import jsonfile from "jsonfile";
import sourcemaps from "gulp-sourcemaps";
import ts from "gulp-typescript";
import PluginError from "plugin-error";

import tslint from "gulp-tslint";
import prettier from "gulp-prettier-plugin";

const src = ["./src/**/*.ts", "./test/**/*.ts"];
const tsProject = ts.createProject("tsconfig.json");

gulp.task("typescript", () => {
  return gulp
    .src(src, { base: "." })
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write(".", { includeContent: false, sourceRoot: __dirname }))
    .pipe(gulp.dest("dist"));
});

gulp.task("copyFiles", () => {
  return gulp.src(["src/**/*.png", "src/**/*.json"]).pipe(gulp.dest("dist"));
});

gulp.task("prettier", () => {
  const cfg = jsonfile.readFileSync("./.prettierrc", { throws: false });
  if (cfg === null) {
    throw new PluginError({
      plugin: "prettier",
      message: "missing or deformed .prettierrc"
    });
  }
  return (
    gulp
      .src(src)
      // @ts-ignore
      .pipe(prettier(cfg, { filter: true }))
      .pipe(gulp.dest((file: any) => file.base))
  );
});

gulp.task("tslint", () =>
  gulp
    .src(src)
    .pipe(
      tslint({
        formatter: "stylish"
      })
    )
    .pipe(
      tslint.report({
        allowWarnings: true,
        summarizeFailureOutput: true
      })
    )
);

gulp.task("clean", () => {
  return del("dist/*");
});

gulp.task("copyTestFile", () => {
  return gulp.src(["test/**/*.class"], { base: "." }).pipe(gulp.dest("dist"));
});

gulp.task("build", gulp.series("clean", "typescript", "copyTestFile"));
