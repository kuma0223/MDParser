var MDBuilder = function(){
    var me = this;
    var input = ""
    var inputs
    var pointer

    this.BuildHtml = function(markdown){
        input = markdown.trim();
        inputs = input.split(/\r?\n/)
        pointer = 0

        var output = "";
        var buf = new HtmlBuffer()

        while(true){
            var str = NextLine()
            if(str==null){
                output += buf.pop()
                break;
            }
            //区切り
            if(str.length==0){
                output += buf.pop()
                continue;
            }
            //表題
            if(paser_h.test(str)){
                output += buf.pop()
                buf.add(paser_h.text(str), paser_h.tag(str))
                output += buf.pop()
                continue;
            }
            //水平線
            if(paser_hr.test(str)){
                output += buf.pop();
                output += paser_hr.tag(str);
                continue;
            }
            //リスト
            if(paser_olul.test(str)){
                output += buf.pop();
                Back();
                output += ReadListBlock();
                continue;
            }
            //テーブル
            if(paser_table.test(str, Peek())){
                output += buf.pop();
                Back();
                output += ReadTableBlock();
                continue;
            }

            //通常文書
            buf.add(str);
            if(str.endsWith("  ")) buf.add("<br />")
        }
        return output;
    }

    //ol,ulブロックを読み進める
    function ReadListBlock(){
        var str = NextLine();
        var tag = paser_olul.tag(str);
        var ind = paser_olul.indent(str);

        var ret = "<" + tag +">";
        var buf = new HtmlBuffer()

        buf.add(paser_olul.text(str),"li");
        while(true){
            str = Peek()
            if(str == null) break;
            if(str.length == 0) break;
            if(!paser_olul.test(str)) break;

            var nextInd = paser_olul.indent(str);
            if(ind > nextInd){
                break;
            }else if(ind < nextInd){
                buf.add(ReadListBlock());
            }else{
                ret += buf.pop();
                buf.add(paser_olul.text(NextLine()), "li")
            }
        }
        ret += buf.html();
        ret += "</" + tag + ">";
        return ret 
    }

    //テーブルブロックを読み進める
    function ReadTableBlock(){
        var str = NextLine();
        var row = paser_table.texts(str);
        var colMax = row.length;

        function mkTd(str){
            return "<td>" + str + "</td>";
        }

        //ヘッダ
        var ret = "<table><thead><tr>"
        row.forEach(x => { ret += "<th>" + x.trim() + "</th>"});
        ret += "</tr></thead><tbody>"
        NextLine();　//---分
        //レコード
        while(true){
            str = Peek();
            if(str == null || !paser_table.test1(str)) break;
            paser_table.texts(NextLine()).forEach(x => {
                ret += "<td>" + x.trim() + "</td>";
            });
            ret+="</tr>"
        }
        ret += "</tbody></table>"
        return ret;
    }

    function NextLine(){
        if(inputs.length <= pointer) return null
        var s = inputs[pointer]
        pointer++
        return s
    }
    function Back(){
        if(pointer>0) pointer--;
    }
    function Peek(){
        if(inputs.length <= pointer) return null
        return inputs[pointer]
    }

    //----------------------------------------
    //パーサ群
    var paser_h = new function(){
        var regex = /^#+ +/

        this.test = function(str){
            return regex.test(str);
        }
        this.tag = function(str){
            var h = str.match(regex)[0];
            return "h" + (""+h).indexOf(" ");
        }
        this.text = function(str){
            return str.replace(regex, "")
        }
    }
    var paser_olul = new function(){
        var regex = /^\s*([-*]|[1-9]\.) +/
        var regexUl = /^\s*[-*] +/
        var regexOl = /^\s*[1-9]\. +/

        this.test = function(str){
            return regex.test(str);
        }
        this.tag = function(str){
            if(regexOl.test(str)) return "ol";
            if(regexUl.test(str)) return "ul";
            return "ol";
        }
        this.text = function(str){
            return str.replace(regex, "")
        }
        this.indent = function(str){
            var indent = str.match(/^\s*/)[0].replace(/\t/, "    ")
            return Math.floor(indent.length / 4)
        }
    }
    var paser_hr = new function(){
        var regex = /^\s*((- *){3,}|(\* *){3,})\s*$/

        this.test = function(str){
            return regex.test(str);
        }
        this.tag = function(str){
            return "<hr />";
        }
    }
    var paser_table = new function(){
        var me = this
        var regex1 = /^\s*\|.*\|\s*$/
        var regex2 = /^\s*(\|\s*:?-+:?\s*)+\|\s*$/

        this.test1 = function(str){
            return regex1.test(str);
        }
        this.test = function(str1, str2){
            if(!regex1.test(str1)) return false;
            if(!regex2.test(str2)) return false;
            return me.texts(str1).length == me.texts(str2).length;
        }
        this.texts = function(str){
            var spl = str.split("|");
            return spl.slice(1, spl.length-1);
        }
    }

    //----------------------------------------
    //バッファオブジェクト
    var HtmlBuffer = function(){
        var me = this
        this.buf = ""
        this.tag = ""
        this.attr = ""

        this.clear = function(){
            me.buf = ""
            me.tag = ""
            me.attr = ""
        }
        this.add = function(str, tag){
            me.buf += str.trim();
            if(tag != undefined){
                me.tag = tag
            }else if(me.tag == ""){
                me.tag = "p"
            }
        }
        this.html = function(){
            if(me.tag=="" || me.buf=="") return "";
            var ret = "<" + me.tag + " " + me.attr + ">"
                + me.buf + "</" + me.tag + ">";
            return ret;
        }
        this.pop = function(){
            var ret = me.html()
            me.clear()
            return ret;
        }
    }
}