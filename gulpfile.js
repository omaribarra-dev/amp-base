const gulp = require('gulp-help')(require('gulp'));
const runSequence = require('run-sequence'); //Se instala para correr las secuencias en las tareas
const config = require('./tasks/config');



gulp.task('build', 'runs a more lightweight build, meant for development and not production', function (cb) {
    runSequence(
        //'escape', 
        'img',
         'templateapi', 
         'postcss', //'posthtml', 'www', 
         cb);
});
//escape es para escapar y cambiar los caracteres raros https://github.com/parshap/html-escape


//Coloca las imagenes de la fuente o SRC a la carpeta de dist
 gulp.task('img', function () {
     //console.log('plugin IMG');
     return gulp.src(config.src.img).pipe(gulp.dest(config.dest.img));
 });

//Colova los arvhivos de template en sus carptetas correspondientes 
gulp.task('templateapi', function () {
    return gulp.src(config.src.templateApi).pipe(gulp.dest(config.dest.templateApi));
});

//Tarea de PostCSS
gulp.task('postcss', 'build postcss files', function () {
    const plugins = [
        require('postcss-import')(),
        require('autoprefixer')(),
        require('postcss-calc')(),
        require('postcss-color-function')(),
        require('postcss-custom-properties')(),
        require('postcss-discard-comments')(),
        require('postcss-custom-media')(),
        require('cssnano')({ zindex: false }),
    ];
    const replace = require('gulp-replace');
    const options = {};
    return gulp.src(config.src.css.concat(config.src.css_ignore))
        .pipe(postcss(plugins, options))
        .pipe(replace('!important', ''))
        .pipe(gulp.dest(config.dest.css))
});
