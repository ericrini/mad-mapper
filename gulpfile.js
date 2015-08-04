var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var jasmine = require('gulp-jasmine');

gulp.task('jasmine', function (cb) {
	gulp.src(['**/*-spec.js'])
		.pipe(jasmine({
			verbose: true,
			includeStackTrace: true,
			timeout: 250
		}))
		.on('end', cb);
});

gulp.task('istanbul', function (cb) {
	gulp.src(['main.js'])
		.pipe(istanbul())
		.pipe(istanbul.hookRequire())
		.on('finish', function () {
			gulp.src(['**/*-spec.js'])
				.pipe(jasmine({
					verbose: true,
					includeStackTrace: true
				}))
				.pipe(istanbul.writeReports())
				.pipe(istanbul.enforceThresholds({ 
					thresholds: {
						global: 90 
					} 
				}))
				.on('end', cb);
		});
});