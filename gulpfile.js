const gulp = require('gulp-help')(require('gulp'));
const runSequence = require('run-sequence'); //Se instala para correr las secuencias en las tareas
const config = require('./tasks/config');
const util = require('gulp-util');
const Mustache = require('mustache');
const fs = require('fs');
const posthtml = require('gulp-posthtml');
const postcss = require('gulp-postcss');//para usar postcss
const through = require('through2');
const path = require('path');
let partialsMap = {};
const merge = require('deepmerge');
const server = require('gulp-webserver');
const argv = require('minimist')(process.argv.slice(2));


gulp.task('build', 'runs a more lightweight build, meant for development and not production', function (cb) {
    runSequence(
        //'escape', 
        'img',
         'templateapi', 
         'postcss', //'posthtml', 'www', 
         'www',
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
     //   require('autoprefixer')(),
     //   require('postcss-calc')(),
     //   require('postcss-color-function')(),
     //   require('postcss-custom-properties')(),
     //   require('postcss-discard-comments')(),
      //  require('postcss-custom-media')(),
        require('cssnano')({ zindex: false }),
    ];
    const replace = require('gulp-replace');
    const options = {};
    return gulp.src(config.src.css.concat(config.src.css_ignore))
        .pipe(postcss(plugins, options))
        .pipe(replace('!important', ''))
        .pipe(gulp.dest(config.dest.css))
});

function inlineCheckScript(node) {
    return false;
}
function inlineCheckStyle(node) {
    return node.tag === 'link' && node.attrs && node.attrs.rel === 'stylesheet' &&
        'amp-custom' in node.attrs && node.attrs.href;
}
function getPartials(acc, embedderDir, template) {
    // Assume {{}} as mustache start/end tags
    const partialRegexp = new RegExp('{{>\\s*(\\S+)\\s*}}', 'g');
    var partialMatch = null;
    var partialPath = null;
    var partialTemplate = null;
    var absPathToTemplate = null;
    while ((partialMatch = partialRegexp.exec(template))) {
        partialPath = partialMatch[1];
        absPathToTemplate = path.resolve(embedderDir, partialPath);
        if (!acc[partialPath]) {
            try {
                partialTemplate = fs.readFileSync(absPathToTemplate).toString();
            } catch (e) {
                util.log(util.colors.red(e.message));
            }
            acc[partialPath] = partialTemplate;
        }
        getPartials(acc, path.dirname(absPathToTemplate), partialTemplate);
    }
    return acc;
}
function mustacheStream() {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        const fileDirectory = path.dirname(file.path);
        const partials = getPartials(
            partialsMap, path.dirname(file.path), file.contents.toString());

        let fileContents = Mustache.render(
            file.contents.toString(), getData(fileDirectory, file.path), partials);

        // Replaces <%title%> to {{title}} which allows the use of amp-mustache.
        fileContents = fileContents.replace(/<%/g, '{{').replace(/%>/g, '}}');
        file.contents = new Buffer(fileContents);
        cb(null, file);
    });
}
function getData(fileDirectory, opt_path) {
    /**
     * Data for each template is determined by the following:
     * 1) Does a template and folder data exist? If so, merge the two and apply
     *    to the template.
     * 2) Is there *only* a template specific json file? If so apply it to the
     *    template.
     * 3) Does *only* a data.json file exist in the folder? If so, apply it to the
     *    template.
     * 4) Otherwise set the data to be the root /data.json.
     */
    const dataFile = 'data.json'
    const folderData = fileDirectory + '/' + dataFile;
    const templateData = (opt_path || '').replace(/html$/, 'json');
    let data = dataFile;

    const templateDataExists =
        opt_path && templateData && fs.existsSync(templateData);

    const folderDataExists = fs.existsSync(folderData);

    // Merges template and folder data if both exist.
    if (templateDataExists && folderDataExists) {
        return merge(
            JSON.parse(fs.readFileSync(folderData)),
            JSON.parse(fs.readFileSync(templateData)));
    }

    // Checks if template specific data exists.
    else if (templateDataExists) {
        data = templateData;
    }
    // Checks for a data.json file in the current folder.
    else if (folderDataExists) {
        data = folderData;
    }
    return JSON.parse(fs.readFileSync(data));
}

const inlineTransformation = {
  script: {
    check: inlineCheckScript,
  },
  style: {
    check: inlineCheckStyle,
  }
};


gulp.task('www', function () {
    const plugins = [
        require('posthtml-include')({ encoding: 'utf-8' }),
        require('posthtml-inline-assets')({
            from: config.dest.www_pages,
            inline: inlineTransformation,
        }),
    ];
    const options = {};
    return gulp.src(config.src.www_pages)
        .pipe(mustacheStream())
        .pipe(posthtml(plugins, options))
        .pipe(gulp.dest(config.dest.www_pages))
});

gulp.task('serve', 'Host a livereloading development webserver for amp start', ['watch:dev'], function () {
    gulp.src(config.dest.default).pipe(server({
        livereload: true,
        host: 'localhost',
        port: argv.port || 8000,
        directoryListing: { enable: true, path: 'dist' },
    }));
});

gulp.task('watch:dev', 'watch stuff, (more) minimal watching for development, without validation', ['build:dev'], function () {
    return gulp.watch(
        [
             config.src.www_pages,
            config.src.css, config.src.data, config.src.img
        ],
        function (event) {
            runSequence(['build:dev']);
        });
});

gulp.task('build:dev', 'runs a more lightweight build, meant for development and not production', function (cb) {
    runSequence(
         'img', 'templateapi', 'postcss', 'www', cb);
});