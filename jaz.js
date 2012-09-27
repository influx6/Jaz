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
      Logger = (function(title){
         var title = title;
         var logs = [];

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
               if(title) TerminalConsole.display(title);
               var iterator = _su.iterable(logs,function(e,i,b){
                  TerminalConsole.display(_su.makeString("\n",e));
                  count += 1;
               },function(e,i,b){
                  TerminalConsole.display("");
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
               this.assert.print();
               this.expect.print();
               this.suit.print();
            }
         }
      })();
      Asserts = (function(_scope){
         this.description = "Expects";
         if(!_scope) _scope = this;

         var plus = _su.makeString("",asc.fg.yellow,"÷",asc.reset),
             negative = _su.makeString("",asc.fg.yellow,"-",asc.reset),
             generateResponse = function(op,could,should,message,scope){
               var passed = _su.makeString(" ",asc.fg.magenta,negative," Assertion:",cres(op,asc.fg.cyan,asc.reset),"Status:",Passed,
                  "from:",cres(scope,asc.fg.yellow,asc.reset)),
                   failed = _su.makeString(" ",asc.fg.magenta,negative," Assertion:",cres(op,asc.fg.cyan,asc.reset),"Status:",Failed,
                  "from:",cres(scope,asc.fg.yellow,asc.reset)),
                   body = _su.makeString("","    ",plus," Checked:",_su.makeString(" ","if",could,message,should),asc.fg.red,asc.reset);
                  
                  return {
                     pass: _su.makeString("\n",passed,body),
                     fail: _su.makeString("\n",failed,body)
                  }
             },
             Log = LoggerManager.assert;

         return {
         
            isEqual: function(could,should){
               var response = generateResponse("isEqual(===)",could,should,"is equal to",_scope.desc);
               if(could !== should){
                  Log.log(response.fail);
                  //throw new Error("Failed");
                  return;
               }
                  Log.log(response.pass);
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
               it : function(desc,fn){
                  //add the desc as a property of fn 
                  fn.desc = desc; Array.prototype.push.call(this.specs,fn);
                  this.total = this.specs.length;
               },
               beforeEach : function(fn){
                   var self = this;
                   this.before = function(){ return fn.call(self); };
               },
               afterEach : function(fn){
                  var self = this;
                  this.after = function(){ return fn.call(self); };
               },
               run: function(){
                  //handle and run all the specs 
                  var self = this,it = _su.iterable(this.specs,function(e,i,b){
                     try{
                        //using forceful approach we take on each it and run them 
                        self.beforeEach.call(self);
                        e.call(self);
                        self.afterEach.call(self);
                        self.passed += 1;
                        self.logger.log(_su.makeString(" ","Spec:",e.desc,Passed));
                     }catch(j){
                        self.failed += 1;
                        self.logger.log(_su.makeString(" ","Spec:",e.desc,Failed));
                        if(self.showDebug) self.logger.log(_su.makeString(" ","SpecDebugTrace For:",e.desc,"\n",j));
                     }
                  },function(e,i,b){
                  
                  });
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
