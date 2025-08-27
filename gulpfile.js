const path = require('path');
const { task, src, dest } = require('gulp');

task('build:icons', copyIcons);

function copyIcons() {
	const nodeSource = path.resolve('nodes', '**', '*.{png,svg}');
	const nodeDestination = path.resolve('dist', 'nodes');

	src(nodeSource).pipe(dest(nodeDestination));

	// Copy all lib files and folders
	const libSource = path.resolve('lib');
	const libDestination = path.resolve('dist', 'lib');

	return src(libSource + '/**/*').pipe(dest(libDestination));
}
