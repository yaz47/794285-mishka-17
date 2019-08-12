'use strict';

const {
  src,
  dest,
  parallel,
  series,
  watch
} = require('gulp');

const plumber = require('gulp-plumber');
const sourcemap = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const del = require('del');
const concat = require('gulp-concat');

const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const svgstore = require('gulp-svgstore');

const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const csso = require('gulp-csso');

const babel = require('gulp-babel');
const uglify = require('gulp-uglify');

const posthtml = require('gulp-posthtml');
const include = require('posthtml-include');
const htmlmin = require('gulp-htmlmin');

const browserSync = require('browser-sync').create();

function cleanImages() {
  return del([
      'source/img/**',
      '!source/img',
      '!source/img/exclude-**',
      '!source/img/exclude-*/**/*'
    ]);
}

function optimizeImages() {
  return src('source/img/exclude-original/**/*.{png,jpg,svg}', {
      base: 'source/img/exclude-original'
    })
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(dest('source/img'));
}

function createWebp() {
  return src('source/img/exclude-original/**/*.{png,jpg}', {
      base: 'source/img/exclude-original'
    })
    .pipe(webp({quality: 90}))
    .pipe(dest('source/img'));
}

function cleanBuild() {
  return del('build');
}

function copyBuild() {
  return src([
      'source/fonts/**/*.{woff,woff2}',
      'source/img/**',
      '!source/img/exclude-*/**',
      'source/*.ico'
    ], {
      base: 'source'
    })
    .pipe(dest('build'));
}

function createBuildCss() {
  return src('source/sass/style.scss')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(csso())
    .pipe(rename('style.min.css'))
    .pipe(sourcemap.write('.'))
    .pipe(dest('build/css'))
    .pipe(browserSync.stream());
}

function createSourceCss() {
  return src('source/sass/style.scss')
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded',
      sourceComments: true
    }))
    .pipe(rename('style.css'))
    .pipe(dest('source/css'));
}

function createBuildJs() {
  return src([
      'source/js/polyfill.js',
      'source/js/script.js',
      'source/js/picturefill.min.js',
      'source/js/pixelglass.min.js'
    ])
    .pipe(sourcemap.init())
    .pipe(concat('script.min.js'))
    .pipe(babel())
    .pipe(uglify({
      toplevel: true
      }))
    .pipe(sourcemap.write('.'))
    .pipe(dest('build/js'));
}

function createSprite() {
  return src('source/img/exclude-sprite/*.svg')
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(dest('build/img'));
}

function createBuildHtml() {
  return src('source/*.html')
    .pipe(posthtml([
      include({
        root: './build/'
      })
    ]))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest('build'));
}

function refreshServer(done) {
  browserSync.reload();
  done();
}

function initServer() {
  browserSync.init({
    server: 'build/',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  watch('source/sass/**/*.{scss,sass}',
    series(createBuildCss, createSourceCss));
  watch('source/img/exclude-original/**',
    series(exports.build, refreshServer));
  watch('source/js/**/*.js',
    series(exports.js, refreshServer));
  watch('source/img/exclude-sprite/**/*.svg',
    series(createSprite, createBuildHtml, refreshServer));
  watch('source/*.html',
    series(createBuildHtml, refreshServer));
}

exports.images = series(cleanImages, optimizeImages, createWebp);
exports.js = createBuildJs;
exports.build = series(
  exports.images, cleanBuild, copyBuild,
  parallel(series(createBuildCss, createSourceCss), createSprite, exports.js),
  createBuildHtml
);
exports.start = series(exports.build, initServer);
