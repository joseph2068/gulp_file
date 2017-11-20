var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
// var jade = require('gulp-jade');
// var sass = require('gulp-sass');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var cleanCSS = require('gulp-clean-css');
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence');
var envOptions = {
    string: 'env',
    default: {
        env: 'develop'
    }
}

var options = minimist(process.argv.slice(2), envOptions);
console.log(options);

gulp.task('clean', function () {
    return gulp.src(['./.tmp', './public'], {
            read: false
        })
        .pipe($.clean());
});

gulp.task('copyHTML', function () {
    return gulp.src('./source/**/*.html')
        .pipe(gulp.dest('./public/'))
})

gulp.task('jade', function () {
    // var YOUR_LOCALS = {};

    gulp.src('./source/**/*.jade')
        .pipe($.plumber())
        .pipe($.jade({
            // locals: YOUR_LOCALS
            pretty: true
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream())
});

gulp.task('sass', function () {
    var plugins = [
        autoprefixer({
            browsers: ['last 2 version', '> 5%', 'ie 8']
        })
    ];
    return gulp.src('./source/scss/**/*.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass().on('error', $.sass.logError))
        //編譯完成CSSgulp
        .pipe($.postcss(plugins))
        .pipe($.if(options.env === 'production', cleanCSS()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.stream())
});

gulp.task('babel', () =>
    gulp.src('./source/js/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel({
        presets: ['env']
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(options.env === 'production', $.uglify({
        compress: {
            drop_console: true
        }
    })))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream())
);

gulp.task('bower', function () {
    return gulp.src(mainBowerFiles({
            "overrides": {
                "vue": { // 套件名稱
                    "main": "dist/vue.js" // 取用的資料夾路徑
                }
            }
        }))
        .pipe(gulp.dest('./.tmp/vendors'))
});

gulp.task('vendorJs', ['bower'], function () {
    return gulp.src(['./.tmp/vendors/**/**.js'])
        .pipe($.order([
            'jquery.js',
            'bootstrap.js'
        ]))
        .pipe($.concat('vendor.js'))
        .pipe($.if(options.env === 'production', $.uglify()))
        .pipe(gulp.dest('./public/js'))
})

gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: './public'
        },
        reloadDebounce: 2000
    })
});

gulp.task('image-min', () =>
    gulp.src('./source/img/*')
    .pipe($.if(options.env === 'production', $.imagemin()))
    .pipe(gulp.dest('./public/img'))
);

gulp.task('watch', function () {
    gulp.watch('./source/scss/**/*.scss', ['sass']);
    gulp.watch('./source/**/*.jade', ['jade']);
    gulp.watch('./source/js/**/*.js', ['babel']);
});

//交付前的專案建立
gulp.task('build', gulpSequence('clean', 'jade', 'sass', 'babel', 'vendorJs', 'image-min'));

//開發環境
gulp.task('default', ['jade', 'sass', 'babel', 'vendorJs', 'image-min', 'browser-sync', 'watch']);