var gulp = require('gulp');
var concat = require('gulp-concat');
var less = require('gulp-less');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var clean = require("gulp-clean");
var merge = require("merge-stream");

function onError(err) {
    console.log(err);
        this.emit('end');
}

function styles(){
    return gulp.src("./src/less/main.less")
        .pipe(less())
        .on("error", onError)
        .pipe(gulp.dest("./dist/css/"));
}

function scripts(){
    return browserify('./src/js/main.js', {
        standalone: "Octree"
    })
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulp.dest('./dist/js/'));
}

gulp.task("scripts", scripts);

gulp.task("styles", styles);

gulp.task('clean', function() {
    return gulp.src("dist").pipe(clean());
});

//prepares dist folder, by copying everything except less, js sources and misc folder
gulp.task("dist", ["clean"], function(){
    return gulp.src(["src/**/*", "!src/less/**/*", "!src/less", "!src/js/**/*", "!src/misc/**/*", "!src/misc"])
        .pipe(gulp.dest("dist"));
});

gulp.task("compile", ["dist"], function(){
    return merge(styles(), scripts());
});

gulp.task("build", ["compile"], function (){
    var a = gulp.src("dist/js/**/*.js")
        .pipe(uglify())
        .pipe(gulp.dest("dist/js/"));

    var b = gulp.src("dist/img/**/*")
        // Pass in options to the task
        .pipe(imagemin({optimizationLevel: 5}))
        .pipe(gulp.dest('dist/img'));

    return merge(a, b);
});

gulp.task('default', ["compile"], function() {
    gulp.watch(["src/js/**/*.js"], ['scripts']);
    gulp.watch(["src/less/**/*.less"], ['styles']);
});
