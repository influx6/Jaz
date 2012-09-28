//basic tester for specific functions,till replacement by jasmine
var Jaz = (function(globals){

   //first setup extensions
   var extensions = {},
       extmgr = globals.extmgr(extensions);
     
      //execute the extenions
      globals.su(extmgr);

   //main functions 
  var _su = extensions.SU,
      Time = Date,
      newline = "\n",
      tabline = "\t",
      spaceline = " ",
       //ascii colors range from 30 t0 36,where 30 is black
      asc = globals.asc,
      Failed = _su.makeString("",asc.extra.boldOn , asc.fg.red ,"Failed!", asc.reset),
      Passed = _su.makeString("",asc.extra.boldOn , asc.fg.green ,"Passed!", asc.reset),
      clockIt = function(fn){
         var start = Time.getTime();
         fn.call(this);
         var end = Time.getTime() - start;
         return end;
      },
      cres = function(message,color,reset){
            return _su.makeString(" ",asc.extra.boldOn,color,message,reset,asc.extra.boldOff);
      },
      TerminalConsole = {
         display:function(message){
            console.log(asc.reset,message);
         },
         warn:function(message){
            console.log(asc.fg.margenta,message,asc.reset);
         },
         error:function(message){
            console.log(asc.fg.red,message,asc.reset);
         }
      },
      Logger = (function(title,debug){
         var title = title, debug = debug,logs = [];

         return {

            log: function(message){
               logs.push(message);
               return this;
            },

            warn: function(message){
               logs.push(_su.makeString(ascolor()))
            },

            print: function(){
               var count = 0;
               if(title && debug) TerminalConsole.display(title);
               var iterator = _su.iterable(logs,function(e,i,b){
                  TerminalConsole.display(_su.makeString("\n",e));
                  count += 1;
               },function(e,i,b){
                  if(!debug) return;
                  //TerminalConsole.display("");
                  TerminalConsole.display(_su.makeString("",cres("Total Log Count:",asc.fg.cyan,asc.reset),count));
               });

               while(iterator.next());
            }
         }

      }),
      LoggerManager = (function(){
         return {
            assert: Logger("Assert Log Reports:"),
            expect: Logger("Expectations Log Reports:"),
            suite: Logger("Suite Log Reports:"),
            report: function(){
               this.suite.print();
               this.assert.print();
               this.expect.print();
            }
         }
      })(),
      Asserts = (function(_scope){
         this.description = "Expects";
         if(!_scope) _scope = this;

         var wrapToString = function(code){ return ("'"+code+"'"); },
             generateResponse = function(op,could,should,message,scope){

               if(_su.isString(could)) could = wrapToString(could);
               if(_su.isString(should)) should = wrapToString(should);
               if(_su.isDate(could)) could = could.getTime();
               if(_su.isDate(should)) should = should.getTime();
               if(_su.isNull(could)) could = 'Null';
               if(_su.isNull(should)) should = 'Null';
               if(_su.isUndefined(could)) could = 'Undefined';
               if(_su.isUndefined(should)) should = 'Undefined';

               var passed = _su.makeString(" ",asc.fg.margenta," - Assertion:",cres(op,asc.fg.cyan,asc.reset),
                     asc.fg.margenta,"Status:",Passed, asc.fg.margenta,"From:",cres(scope,asc.fg.cyan,asc.reset)),
                   failed = _su.makeString(" ",asc.fg.margenta," - Assertion:",cres(op,asc.fg.cyan,asc.reset),
                     asc.fg.margenta,"Status:",Failed,asc.fg.margenta,"From:",cres(scope,asc.fg.cyan,asc.reset)),
                   body = _su.makeString(" ","   ",asc.fg.green," + Checked:",asc.reset,
                     cres(_su.makeString(" ","if",could,message,should),asc.fg.cyan,asc.reset));
                  
                  return {
                     pass: _su.makeString("\n",passed,body),
                     fail: _su.makeString("\n",failed,body)
                  }
             },
             Log = LoggerManager.assert,
             AssertError = new Error("Assertion Error!"),
             responseHandler = function(state,response){
                  if(!state){ Log.log(response.fail); throw AssertError; return false; }
                  Log.log(response.pass);
                  return true;

             };

         return {
         
            isEqual: function(could,should){
               var response = generateResponse("isEqual(===)",could,should,"is equal to",_scope.desc);

               if(_su.isType(could) !== _su.isType(should)){ 
                  return responseHandler(false,response);
               }
               if(_su.isDate(could) && _su.isDate(should) && could.getTime() !== should.getTime()){ 
                  return responseHandler(false,response);
               }
               if(could !== should){ 
                  return responseHandler(false,response);
               }

               return responseHandler(true,response);
                 
            },
         
         }
      }),
      Expects = (function(){
         var Console = LoggerManager.expect,
             expectations = {},
             rejections = {},
             expectDetail = function(color,reset,type,i,message){
               return _su.makeString("",type,i,cres(message,color,reset));
             };

         return{

            done: function(){
               _su.forEach(expectations,function(e,i){
                  if(!e){
                     Console.log(expectDetail(asc.fg.red,asc.reset,cres("+ Expectations:",asc.fg.yellow,asc.reset),i,"is still unfullfilled!"));
                     return;
                  }
                  Console.log(expectDetail(asc.fg.green,asc.reset,cres("+ Expectations:",asc.fg.yellow,asc.reset),i,"is fullfilled!"));
                  return;
               },this);
               _su.forEach(rejections,function(e,i){
                  if(!e){
                     Console.log(expectDetail(asc.fg.red,asc.reset,cres("- Rejections:",asc.fg.yellow,asc.reset),i,"is rejected!"));
                     return;
                  }
                  Console.log(expectDetail(asc.fg.red,asc.reset,cres("- Rejections:",asc.fg.yellow,asc.reset),i,"is still unrejected!"));
                  return;
               },this);

            },

            fulfil: function(e){
               if(expectations[e]){
                  expectations[e] = true;
               }
               return;
            },

            reject: function(e){
               if(rejections[e]){
                  rejections[e] = false;
               }
               return;
            },

            agreeTo: function(e){
               if(e in expectations) return;
               expectations[e] = false;
            },

            refuseTo: function(e){
               if(e in rejections) return;
               rejections[e] = true;
            },

        };

      }),

      Suite = (function(){
         
         var SuiteManager = {
               showDebug: false,
               logger : LoggerManager.suite,
               specs : {},
               before : null,
               after : null,
               total : 0,
               passed : 0,
               failed : 0,
               sandbox: {},
               it : function(desc,fn){
                  //add the desc as a property of fn 
                  fn.desc = desc; Array.prototype.push.call(this.specs,fn);
                  this.total = this.specs.length;
               },
               beforeEach : function(fn){
                   var self = this;
                   this.before = function(){ return fn.call(self.sandbox); };
               },
               afterEach : function(fn){
                  var self = this;
                  this.after = function(){ return fn.call(self.sandbox); };
               },
               run: function(){
                  //handle and run all the specs 

                  var self = this,
                      it = _su.iterable(this.specs,function(e,i,b){
                         //make a clean scope
                        try{
                           //using forceful approach we take on each it and run them 
                           if(self.before) self.before();
                           self.sandbox.desc = e.desc;
                           e.call(self.sandbox);
                           if(self.after) self.after();
                           self.passed += 1;
                        }catch(j){
                           self.failed += 1;
                        }
                  },function(e,i,b){
                     self.logger.log(_su.makeString(" ",cres("Suite:",asc.fg.margenta,asc.reset),
                        self.title,cres("Total:",asc.fg.margenta,asc.reset),
                        self.total,cres("Passed:",asc.fg.margenta,asc.reset),self.passed,
                        cres("Failed:",asc.fg.red,asc.reset),self.failed));
                        LoggerManager.report();
                        self.logger.log(" ");
                  });

                  while(it.next());
               }
         };



      return{
         create: function(title,func){
            //to create encapsulate specs 
            // create("kicker tester",function(){
            // variable definitions heres
            //
            // it("should do something", function(){
            //       expects(this).isEqual(1,1);
            // });
            //
            //});
            var current = SuiteManager;
            current.title = title;
            //run the func to prepare the suite 
            func.call(current);

            return current;
         }
      }
   })();


   return {
      suite: Suite,
      expects: Expects,
      asserts: Asserts,
      logger: Logger,
      logManager: LoggerManager,
      version: "0.1",
      license: "mit",
   };

})(require("./globals"));

module.exports = Jaz;
