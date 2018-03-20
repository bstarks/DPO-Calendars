module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		config: {
			ver: '3.1.0',
			src: '../3.1.0/src/',
			dest: '../3.1.0/dist/'
		},
		concat: {
			options: {
				separator: ';'
			},
			dist: {
				src: ['../src/**/*.js'],
				dest: '../dist/<%= pkg.name %>.js'
			}
		},
		uglify: {
			//options: {
			//	banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			//},
			dist: {
				files: {
					//'../dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
					'<%= config.dest %>udcCal.min.js': ['<%= config.src %>udcCal.js']
				}
			}
		},
		cssmin: {
			target: {
				files: {
					'<%= config.dest %>udcCal.min.css': ['<%= config.src %>udcCal.css']
				}
			}
		},
		htmlmin: {                                     // Task 
			dist: {                                      // Target 
				options: {                                 // Target options 
					removeComments: true,
					collapseWhitespace: true
				},
				files: {                                   // Dictionary of files 
					//'dist/contact.html': 'src/contact.html',     // 'destination': 'source' 
					'<%= config.dest %>udcCal_singleFile.min.html': '<%= config.dest %>udcCal_singleFile.min.html',
					'<%= config.dest %>udcCal.min.html': '<%= config.dest %>udcCal.min.html'

				}
			}/*,
			dev: {                                       // Another target 
				files: {
					'dist/index.html': 'src/index.html',
					'dist/contact.html': 'src/contact.html'
				}
			}*/
		},
		'string-replace': {
			dist: {
				files: {
					//'dest/': 'src/**',
					//'prod/': ['src/*.js', 'src/*.css'],
					'<%= config.dest %>udcCal_singleFile.html': '<%= config.src %>udcCal.html'
					//'../0.3.1/dist/udcCal_singleFile.html': ['../0.3.1/src/udcCal.js', '../0.3.1/src/udcCal.css']
				},
				options: {
					replacements: [{
						pattern: '<script src="udcCal.js"></script>',
						replacement: '<script><%= grunt.file.read(config.src + "udcCal.js") %></script>'
					}, {
						pattern: '<link rel="stylesheet" href="udcCal.css" />',
						replacement: '<style><%= grunt.file.read(config.src + "udcCal.css") %></style>'
					}]
				}
			},
			dist1: {
				files: {
					//'dest/': 'src/**',
					//'prod/': ['src/*.js', 'src/*.css'],
					'<%= config.dest %>udcCal_singleFile.min.html': '<%= config.src %>udcCal.html'
					//'../0.3.1/dist/udcCal_singleFile.html': ['../0.3.1/src/udcCal.js', '../0.3.1/src/udcCal.css']
				},
				options: {
					replacements: [{
						pattern: '<script src="udcCal.js"></script>',
						replacement: '<script><%= grunt.file.read(config.dest + "udcCal.min.js") %></script>'
					}, {
						pattern: '<link rel="stylesheet" href="udcCal.css" />',
						replacement: '<style><%= grunt.file.read(config.dest + "udcCal.min.css") %></style>'
					}]
				}
			},
			min: {
				files: {
					'<%= config.dest %>udcCal.min.html': '<%= config.src %>udcCal.html'
				},
				options: {
					replacements: [{
						pattern: '<script src="udcCal.js">',
						replacement: '<script src="udcCal.min.js">'
					}, {
						pattern: '<link rel="stylesheet" href="udcCal.css" />',
						replacement: '<link rel="stylesheet" href="udcCal.min.css" />'
					}]
				}
			}
		},
		qunit: {
			files: ['../test/**/*.html']
		},
		jshint: {
			files: ['Gruntfile.js', '<%= config.src %>udcCal.js'], // '../0.3.0/src/**/*.js', '../0.3.0/test/**/*.js'],
			options: {
				// options here to override JSHint defaults
				globals: {
					//jQuery: true,
					console: true,
					module: true,
					document: true
				}
			}
		}/*,
		watch: {
			files: ['<%= jshint.files %>'],
			tasks: ['jshint', 'qunit']
		}*/
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-string-replace');
	grunt.loadNpmTasks('grunt-contrib-htmlmin');
	//grunt.loadNpmTasks('grunt-contrib-jshint');
	//grunt.loadNpmTasks('grunt-contrib-qunit');
	//grunt.loadNpmTasks('grunt-contrib-watch');
	//grunt.loadNpmTasks('grunt-contrib-concat');

	//grunt.registerTask('test', ['jshint', 'qunit']);
	
	// $ npm install --save-dev grunt-contrib-clean grunt-contrib-coffee grunt-contrib-compass grunt-contrib-compress grunt-contrib-concat grunt-contrib-connect grunt-contrib-copy grunt-contrib-cssmin grunt-contrib-csslint grunt-contrib-handlebars grunt-contrib-htmlmin grunt-contrib-imagemin grunt-contrib-jade grunt-contrib-jasmine grunt-contrib-jshint grunt-contrib-jst grunt-contrib-less grunt-contrib-nodeunit grunt-contrib-qunit grunt-contrib-requirejs grunt-contrib-sass grunt-contrib-stylus grunt-contrib-uglify grunt-contrib-watch grunt-contrib-yuidoc grunt-contrib-symlink

	grunt.registerTask('default', ['uglify','cssmin','string-replace','htmlmin']); // [/*'jshint', 'qunit', 'concat', */'uglify']);
	grunt.registerTask('pocket', ['uglify','cssmin','string-replace','htmlmin']); // [/*'jshint', 'qunit', 'concat', */'uglify']);

};