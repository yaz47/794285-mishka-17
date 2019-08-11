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

const posthtml = require('gulp-posthtml');
const include = require('posthtml-include');

const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const csso = require('gulp-csso');

const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const svgstore = require('gulp-svgstore');

function copyBuild() {
  return src([
      'source/fonts/**/*.{woff,woff2}',
      'source/img/**',
      '!source/img/exclude-*/**',
      'source/js/**',
      'source/*.ico'
    ], {
      base: 'source'
    })
    .pipe(dest('build'));
}

function cleanBuild() {
  return del('build');
}

function createBuildHtml() {
  return src('source/*.html')
    .pipe(posthtml([
      include({
        root: './build/'
      })
    ]))
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
    .pipe(dest('source/css'))
}

function initServer() {
  browserSync.init({
    server: 'build/',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  watch('source/sass/**/*.{scss,sass}', parallel(createBuildCss, createSourceCss));
  watch('source/img/exclude-*/**', series(exports.build, refreshServer));
  watch('source/*.html', series(createBuildHtml, refreshServer));
}

function refreshServer(done) {
  browserSync.reload();
  done();
}

function cleanImages() {
  return del(['source/img/**', '!source/img/exclude-*/**']);
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

function createSprite() {
  return src('source/img/exclude-sprite/*.svg')
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(dest('build/img'));
}

exports.images = parallel(optimizeImages, createWebp);
exports.build = series(
  cleanBuild, copyBuild,
  parallel(createBuildCss, createSourceCss, createSprite),
  createBuildHtml
);
exports.start = series(exports.build, initServer);
