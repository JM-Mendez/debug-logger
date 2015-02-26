'use strict';

var util = require('util'),
    vmDebug = require('debug'),
    streamSpy = require('./stream-spy');


exports = module.exports = debugLogger;
exports.getForeColor = getForeColor;
exports.getBackColor = getBackColor;
exports.debug = vmDebug;

exports.config = function config(options){
  options = options || {};
  if(options.ensureNewline){
    ensureNewline();
  }
  if(options.inspectOptions){
    exports.inspectOptions = options.inspectOptions;
  }
  return debugLogger;
};

exports.inspectOptions = {};

exports.colors = {
  black :   0,
  red :     1,
  green :   2,
  yellow :  3,
  blue :    4,
  magenta : 5,
  cyan :    6,
  white :   7
};
exports.colorReset = '\x1b[0m';

exports.levels = {
  trace : {
    color : getForeColor('cyan'),
    prefix :       'TRACE  ',
    namespaceSuffix : ':trace',
    level : 0
  },
  debug : {
    color : getForeColor('blue'),
    prefix :       'DEBUG  ',
    namespaceSuffix : ':debug',
    level : 1
  },
  log : {
    color : '',
    prefix : '      LOG    ',
    level : 2
  },
  info : {
    color : getForeColor('green'),
    prefix : '      INFO   ',
    level : 3
  },
  warn : {
    color : getForeColor('yellow'),
    prefix : '      WARN   ',
    level : 4
  },
  error : {
    color : getForeColor('red'),
    prefix : '      ERROR  ',
    level : 5
  }
};

exports.styles = {
  underline : '\x1b[4m'
};


var ensureNewlineEnabled = false;
var fd = parseInt(process.env.DEBUG_FD, 10) || 2;
function ensureNewline(){
  if(fd !== 1 && fd !== 2){ return; }
  streamSpy.enable();
  ensureNewlineEnabled = true;
  return debugLogger;
}

function getLogLevel(namespace) {
  if(!process.env.DEBUG_LEVEL) {
    return 0;
  }
  var debugLevel = process.env.DEBUG_LEVEL.toLowerCase();
  if(debugLevel.indexOf('*:') === 0){
    return hasLogLevel(debugLevel.slice(2)) || 0;
  }
  var hasLevel = hasLogLevel(debugLevel);
  if(hasLevel !== null){
    return hasLevel;
  }
  if(!namespace) {
    return 0;
  }
  //currently we will only process the first part of namespace
  var appNamespace = namespace.split(':')[0].toLowerCase();
  
  var debugLevelParts = debugLevel.split(',');
  
  var i;
  for(i = 0; i < debugLevelParts.length; i++){
    var parts = debugLevelParts[i].split(':');
    if(appNamespace === parts[0]){
      return hasLogLevel(parts[parts.length-1]) || 0;
    }
  }
  return 0;
}

function hasLogLevel(level) {
  if(!level) {
    return null;
  }
  if (!isNaN(level)){
    return level;
  }
  else if(isString(level) && exports.levels[level]){
    return exports.levels[level].level || 0;
  }
  return null;
}

function isString(str){
  return typeof str === 'string' || str instanceof String;
}

function hasFormattingElements(str){
  if(!str) { return false; }
  var res = false;
  ['%s', '%d', '%j'].forEach(function(elem){
    if(str.indexOf(elem) >= 0) { 
      res = true; 
    }
  });
  return res;
}

function getErrorMessage(e) {
  var errorStrings = [' ' + e];

  if (typeof e === 'undefined') {
    return errorStrings;
  }
  if (e === null) {
    return errorStrings;
  }
  if (e instanceof Date) {
    return errorStrings;
  }
  if (e instanceof Error) {
    errorStrings[0] = ' ' + e.toString();
    if (e.stack) {
      errorStrings[1] = 'Stack trace';
      errorStrings[2] = e.stack;
    }
    return errorStrings;
  }
  if (typeof e === 'object' || e instanceof Object) {
    var inspection = util.inspect(e, exports.inspectOptions);
    if(inspection.length < 55){
      errorStrings[0] = ' ' + inspection;
      return errorStrings;
    }
    if (typeof e.toString !== 'undefined') {
      errorStrings[0] = ' ' + e.toString();
    }
    errorStrings[1] = 'Inspected object';
    errorStrings[2] = inspection;
  }

  return errorStrings;
}

function getForeColor(color){
  return '\x1b[' + (30 + exports.colors[color]) + 'm';
}

function getBackColor(color){
  return '\x1b[' + (40 + exports.colors[color]) + 'm';
}

var debugInstances = {};
function getDebugInstance(namespace){
  if(!debugInstances[namespace]){
    debugInstances[namespace] = vmDebug(namespace);
  }
  return debugInstances[namespace]; 
}


function debugLogger(namespace) {
  var levels = exports.levels;
  var debugLoggers = { 'default': getDebugInstance.bind(this, namespace) };

  var logger = {};
  logger.logLevel = getLogLevel(namespace);
  
  Object.keys(levels).forEach(function(levelName) {
    var loggerNamespaceSuffix = levels[levelName].namespaceSuffix ? levels[levelName].namespaceSuffix : 'default';
    if(!debugLoggers[loggerNamespaceSuffix]){
      debugLoggers[loggerNamespaceSuffix] = getDebugInstance.bind(this, namespace + loggerNamespaceSuffix);
    }
    var levelLogger = debugLoggers[loggerNamespaceSuffix];
    var color = vmDebug.useColors ? levels[levelName].color : '';
    var reset = vmDebug.useColors ? exports.colorReset : '';
    var inspectionHighlight = vmDebug.useColors ? exports.styles.underline : '';

    function logFn() {
      if (logger.logLevel > logger[levelName].level) { return; }
      
      var levelLog = levelLogger();
      if(!levelLog.enabled) { return; }
      
      if (isString(arguments[0]) && hasFormattingElements(arguments[0])){
        arguments[0] = color + levels[levelName].prefix + reset + arguments[0];
        return levelLog.apply(this, arguments);
      }
      
      var selfArguments = arguments;
      var errorStrings = Object.keys(selfArguments).map(function(key){
        return getErrorMessage(selfArguments[key]);
      });
      var message = "";
      var inspections = "";
      
      var i, param;
      var n = 1;
      for(i=0; i<errorStrings.length; i++){
        param = errorStrings[i];
        message += param[0];
        if (param.length > 1) {
          var highlightStack = param[1].indexOf('Stack') >= 0 ? color : '';
          inspections += '\n' +
            inspectionHighlight + '___' + param[1] + ' #' + n++ + '___' + reset +'\n' +
            highlightStack + param[2] + reset;
        }
      };
      
      levelLog(color + levels[levelName].prefix + reset + message + inspections);
    };

    function logNewlineFn() {
      if (streamSpy.lastCharacter !== '\n') {
        vmDebug.log('');
      }
      logFn.apply(logFn, arguments);
    };

    logger[levelName] = ensureNewlineEnabled ? logNewlineFn : logFn;    
    logger[levelName].level = levels[levelName].level;
    logger[levelName].logger  = function(){ return levelLogger(); };
    logger[levelName].enabled = function(){ return logger.logLevel <= logger[levelName].level && levelLogger().enabled; };
  });

  return logger;
}
