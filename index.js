/**
 * Exterme Go Horse TypeScript import refactoring lib
 *
 * TODO LIST
 * - Generate import path from classes that was not imported in file
 * - Convert this to TypeScript code and remove the 'Extreme Go Horse' code
 * - Write unit tests to each situation of file importation or refactoring
 * - Convert it into a VSCode plugin
 * - Publish this in npm
 * - Write code to cover importation from node_modules
 */
const fs = require('fs');
const args = process.argv.splice(2);
const config = { dir: process.cwd() };
args.forEach(arg => {
	if (/^--dir=.*$/.test(arg)) {
		let subdir = arg.replace(/^.*=/, '');
		if (subdir === '.') {
			subdir = '';
		}
		config.dir = `${process.cwd()}\\${subdir}`;
	}
});

const exportMapByClass = {};
const exportMapByPath = {};

function Directory(path) {
	this.path = path;
	this.content = [];

	this.forEach = function(calle){
		this.content.forEach((f) => calle(f));
	}

	// constructor
	fs.readdirSync(this.path).forEach(path => {
		const fullpath = `${this.path}\\${path}`;
		if (fs.lstatSync(fullpath).isDirectory()) {
			this.content.push(new Directory(fullpath));
		} else {
			if (/\.ts$/.test(fullpath)) {
				this.content.push(new TSFile(fullpath));
			}
		}
	});
}

function TSFile(path) {
	this.path = path.replace(/\/|(\\\\)|\\/g, '/');
	this.content = String(fs.readFileSync(this.path));
	this.exports = [];
	this.imports = {};

	exportMapByPath[this.path] = this;

	(this.content.match(/import.*["'].*["'];?/g) || []).forEach(_import => {
		_import = new TSFileImport(this.path, _import);
		this.imports[_import.from] = _import;
	});

	(this.content.match(/export\s+(class|enum)\s+[^\s]*\s*{/g) || []).forEach(match => {
		var thisClass = match.replace(/^export\s+(class|enum)\s+|\s*{$/g, '');
		this.exports.push(thisClass);
		var arr = exportMapByClass[thisClass] || [];
		arr.push(this);
		exportMapByClass[thisClass] = arr;
	});
}

function TSFileImport(path, _import) {
	var parentPath = path.replace(/[\/\\][^\/\\]*$/, '');
	this._import = _import;
	this.classes = _import.replace(/^import {|}.*$|\s/g, '').trim().split(',');
	this.from = fundirPaths(parentPath, _import.replace(/^[^'"]*|['"]\.?|;/g, ''))+'.ts';
	this.fromNodeModules = !_import.match(/['"](\.|app\/)/);
}

function pathGenerator(importer, importing) {
	importer = importer.replace(/\/|(\\\\)|\\/g, '/').replace(/\/[^\/]*\.ts$/, '').split('/');
	importing = importing.replace(/\/|(\\\\)|\\/g, '/').split('/');
	var length = importer.length;
	var importFinal = '';

	for (let i = 0; i < importer.length; i++) {
		if (importer[i] !== importing[i]) {
			length = i;
			break;
		}
	}

	var relativeImport = importer.splice(length);
	importing = importing.splice(length);
	if (relativeImport.length == 0) {
		importFinal = './';
	} else {
		relativeImport.forEach(() => importFinal += '../');
	}

	return importFinal + importing.join('/').replace(/\.ts$/, '');
}

function fundirPaths(basePath, restoPath) {
    basePath = basePath.replace(/\/|(\\\\)|\\/g, '/').split('/');
    restoPath = restoPath.replace(/\/|(\\\\)|\\/g, '/').split('/');
    let quantosRetorna = 0;

    restoPath.forEach((resto) => {
        if (resto) {
            if (resto == '..') {
                basePath.pop();
            } else {
                basePath.push(resto);
            }
        }
    });

    return basePath.join('/');
}

(function reviewCode(project){
	project.forEach(item => {
		if (item instanceof Directory) {
			reviewCode(item);
		} else {
			Object.keys(item.imports).forEach(importation => {
				if (!item.imports[importation].fromNodeModules) {
					if (!exportMapByPath[importation]) {
						var pathAntigoDaClasse = null, naoUsar = false;
                        item.imports[importation].classes.forEach((cls) => {
							if (!pathAntigoDaClasse) {
								pathAntigoDaClasse = exportMapByClass[cls];
							} else if (pathAntigoDaClasse != exportMapByClass[cls]) {
								console.error(`O sistema não importará automaticamente a classe ${cls} pois ela possui mais de um path`); 
								naoUsar = true;
							}
						});

                        if (!pathAntigoDaClasse) {
                            naoUsar = true;}

						if (pathAntigoDaClasse && pathAntigoDaClasse.length > 1) {
							naoUsar = true;
							console.error('Uma classe tem mais de um path, o refatorador não irá reimportá-la');
						}

						if (!naoUsar) {
                            console.log(`Problema em "${item.imports[importation]._import}", corrigindo com "${pathAntigoDaClasse[0].path}"`);
							var newImport = item.imports[importation]._import.replace(/from.*$/, `from '${pathGenerator(item.path, pathAntigoDaClasse[0].path)}';`);
							item.content = item.content.replace(item.imports[importation]._import, newImport);
							fs.writeFileSync(item.path, item.content);
						}
					}
				}
			});
		}
	});
})(new Directory(config.dir));
