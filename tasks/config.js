module.exports={
    src:{
        img: 'img/**',
        templateApi: 'templates/*/api/*.json',
        css: ['css/**/*.css'],
        css_ignore: ['!css/**/_*.css', '!css/ampstart-base/**/*.css', '!css/**/page-vars.css'],
        www_pages: 'www/**/*.html',
        data: ['*/**/*.json', '!templates/*/data/*.json'],

    },
    dest:{
        img:'dist/img/', //Ruta de imagen a carpeta final
        templateApi: 'dist/templates',
        css: 'dist/css/',
        www_pages: 'dist',
        default: 'dist',
    }
}