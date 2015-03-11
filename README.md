[![npm version](https://badge.fury.io/js/debug-logger.svg)](http://badge.fury.io/js/debug-logger)

debug-logger
============

A thin wrapper for visionmedia/debug logger, adding levels and colored output.

## Overview
[visionmedia/debug](https://github.com/visionmedia/debug) is a ubitiquous logging library with 1000+ dependants. Given how widespread it is and the convenience of namespaces it is a great logger for library modules.
`debug-logger` is a convenience wrapper around `debug` that adds level based coloured output. Each instance of `debug-logger` will lazily instantiate several instances of `debug` such as `namespace:info`, `namespace:warn`, `namespace:error`, etc. All these are configurable. `debug-logger` has no dependencies besides `debug`.

At AppsCot we use `debug-logger` in [waterline-orientdb](https://github.com/appscot/waterline-orientdb).

## Instalation
```javascript
npm install debug-logger -S
```

## Usage
```javascript
var log = require('debug-logger')('myapp');

log.trace("I'm a trace output");
log.debug("I'm a debug output");
log.log("I'm a log output");
log.info("I'm an info output");
log.warn("I'm a warn output");
log.error("I'm an error output");
```
![screenshot](https://raw.githubusercontent.com/wiki/appscot/debug-logger/ScreenShot.png)

### Inspect error/object
```javascript
var err = new Error('error message');
err.stack = 'the stack\nline2\nline3';

log.error('Something failed:', err);

var obj = {
  anumber : 1234,
  astring : 'str',
  adate : new Date(),
  aboolean : true
};
log.info("let's inspect 'obj'", obj);
```
![inspect error/object](https://raw.githubusercontent.com/wiki/appscot/debug-logger/error_object.png)

### Original `debug` instances and enabled property
```javascript
log.info.logger()("the default instance of debug, using 'myapp' namespace");
log.debug.logger()("the debug instance of debug, using 'myapp:debug' namespace");

if (log.debug.enabled()) {
  // This only runs if environment variable DEBUG includes "myapp:debug" namespace
  log.debug("Debug is enabled");
}
```
![enabled](https://raw.githubusercontent.com/wiki/appscot/debug-logger/enabled.png)

### util.inspect options
Full `util.inspect` options available at [nodejs.org](http://nodejs.org/api/util.html#util_util_inspect_object_options).
```javascript
var debugLogger = require('debug-logger');
debugLogger.inspectOptions = {
  colors : true
};
log.info('By enabling colors we get this nice colored example:', {
  anumber : 1234,
  astring : 'str',
  adate : new Date(),
  aboolean : true
});
```
![inspect](https://raw.githubusercontent.com/wiki/appscot/debug-logger/inspect.png)

### Customize available log levels
```javascript
debugLogger.levels.error.color = debugLogger.colors.magenta;
debugLogger.levels.error.prefix = 'ERROR ';

var customColorLog = debugLogger('myapp');
customColorLog.error("I'm a 'magenta' error output");
```
![customize log](https://raw.githubusercontent.com/wiki/appscot/debug-logger/customize_log.png)

### Add log levels
```javascript
debugLogger.levels.silly = {
  color : debugLogger.colors.magenta,
  prefix : 'SILLY  ',
  namespaceSuffix : ':silly'
};

var sillyLog = debugLogger('myapp');
sillyLog.silly("I'm a silly output");
```
![add log levels](https://raw.githubusercontent.com/wiki/appscot/debug-logger/silly.png)

### Filter log level (instead of namespace)
```sh
export DEBUG_LEVEL=info
```
Only info level and above logs will be outputted.

More examples in the [examples folder](https://github.com/appscot/debug-logger/blob/master/examples).

## Reference

### Instance Methods

Assuming log is an instance of debug-logger (`var log = require('debug-logger')('myapp');`).

#### `log.trace([data][, ...])`
#### `log.debug([data][, ...])`
#### `log.log([data][, ...])`
#### `log.info([data][, ...])`
#### `log.warn([data][, ...])`
#### `log.error([data][, ...])`
Prints the data prepended by log level. If the terminal supports colors, each level will have a specific color. If an Error is provided, the toString() and call stack will be outputted. If an Object is provided the toString() and util.inspect() will be outputted. Example:
```
  myapp:debug I'm a debug output +0ms
  myapp:info  I'm an info output +1ms
```
This function can take multiple arguments in a printf()-like way, if formatting elements are not found in the first string then util.inspect is used on each argument.

#### `log[level].logger()`
Returns the default debug instance used by `level`.

#### `log[level].enabled()`
Boolean indicating if `level`'s logger is enabled.

### Module

#### `.config(obj)`
Configures debug-logger. Returns `debug-logger` to allow chaining operations.

#### `.debug`
Returns visionmedia/debug module.
