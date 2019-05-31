var MDBuilder = function(){
    var me = this;
    var input = ""
    var inputs
    var pointer

    this.BuildHtml = function(markdown){
        input = markdown.trim();
        inputs = input.split(/\r?\n/)
        pointer = 0

        var buf = new HtmlBuffer()

        while(true){
            var str = NextLine()
            if(str==null){
                break;
            }
            //区切り
            if(str.length==0){
                buf.popAll()
                continue;
            }
            //見出し
            if(paser_h.test(str)){
                buf.popAll()
                buf.push(paser_h.tag(str), paser_h.text(str))
                buf.popAll()
                continue;
            }
            //水平線
            if(paser_hr.test(str)){
                buf.popAll();
                buf.addNoEscape("<hr />");
                continue;
            }
            //リスト
            if(paser_olul.test(str)){
                var isblock = buf.currentTag() == "li";
                var indent = paser_olul.indent(str);
                var oldindent = isblock ? paser_olul.indent(PeekPrevLine()) : -1;
                if(indent-oldindent > 1){
                    //noproc
                }else{
                    if(!isblock) buf.popAll();
                    
                    var tag = paser_olul.tag(str);
                    var txt = paser_olul.text(str);
                    if(oldindent < indent){
                        buf.push(tag);
                        buf.push("li", txt);
                    }else if(oldindent > indent){
                        buf.pop();
                        for(var i=0;i<oldindent-indent;i++){ buf.pop(); buf.pop(); }
                        buf.push("li", txt);
                    }else{
                        buf.pop();
                        buf.push("li", txt);
                    }
                    continue;
                }
            }
            //テーブル（開始）
            if(paser_table.test(str, PeekNextLine())){
                buf.popAll();
                buf.push("table");
                buf.push("thead");
                buf.push("tr");
                paser_table.texts(str).forEach(function(x){
                    buf.push("th", x.trim())
                    buf.pop();
                });
                buf.pop();
                buf.pop();
                buf.push("tbody");
                NextLine(); //--分
                continue;
            }
            //テーブル（レコード）
            if(buf.currentTag()=="tbody" && paser_table.test1(str)){
                buf.push("tr");
                paser_table.texts(str).forEach(function(x){
                    buf.push("td", x.trim())
                    buf.pop();
                });
                buf.pop()
                continue;
            }
            //pre
            if(paser_pre.test(str)){
                if(buf.currentTag() == "pre"){
                    buf.add("\n");
                    buf.add(paser_pre.text(str));
                }else{
                    buf.popAll();
                    buf.push("pre", paser_pre.text(str));
                }
                continue;
            }
            //引用
            if(paser_blockquote.test(str)){
                var isblock = buf.currentTag() == "blockquote";
                var indent = paser_blockquote.indent(str);
                
                if(!isblock){
                    buf.popAll();
                    buf.push("blockquote");
                }else{
                    buf.addNoEscape("<br />");
                }
                for(var i=0; i<indent; i++){
                    buf.push("span","", "class='blockquoteNest'");
                }
                buf.add(paser_blockquote.text(str));
                for(var i=0; i<indent; i++){
                    buf.pop();
                }
                continue;
            }
            //コード
            if(paser_code.test(str)){
                buf.popAll();
                buf.push("pre", ""
                    , "class='codeblock code_" + paser_code.type(str) + "'");
                var i=0;
                while(true){
                    str = NextLine();
                    if(str==null || paser_code.test(str)) break;
                    if(i>0) buf.add("\n");
                    buf.add(str);
                    i++;
                }
                continue;
            }

            //一部タグの終了判定
            if(buf.currentTag() == "tbody"
            || buf.currentTag() == "li"
            || buf.currentTag() == "blockquote") buf.popAll();
            
            //通常文書
            if(buf.currentTag() == "") buf.push("p", str);
            else buf.add(str);

            if(/  $/.test(str)) buf.addNoEscape("<br />")
        }
        return buf.output();
    }

    function NextLine(){
        if(inputs.length <= pointer) return null
        var s = inputs[pointer]
        pointer++
        return s
    }
    function PeekPrevLine(){
        var p = pointer-2
        if(p<0) return null
        return inputs[p]
    }
    function Back(){
        if(pointer>0) pointer--;
    }
    function PeekNextLine(){
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
    var paser_pre = new function(){
        var regex=/^( {4,}|\t)/
        this.test = function(str){
            return regex.test(str);
        }
        this.tag = function(str){
            return "pre";
        }
        this.text = function(str){
            return str.replace(regex,"");
        }
    }
    var paser_blockquote = new function(){
        var regex = /^\s*(>+) */
        this.test = function(str){
            return regex.test(str);
        }
        this.indent = function(str){
            return regex.exec(str)[1].length;
        }
        this.text = function(str){
            return str.replace(regex,"");
        }
    }
    var paser_code = new function(){
        var regex = /^\s*'{3,}\s*/
        this.test = function(str){
            return regex.test(str);
        }
        this.type = function(str){
            return str.replace(regex,"");
        }
    }

    //----------------------------------------
    //バッファオブジェクト
    var HtmlBuffer = function(){
        var me = this
        this.p = 0;
        this.tag = [""]
        this.buf = [""]
        this.attr = [""]

        this.isEmpty = function(){
            return me.buf=="" && me.tag==""
        }
        this.push = function(tag, str, attr){
            if(me.tag.length <= me.p){
                me.tag.push(null);
                me.buf.push(null);
                me.attr.push(null);
            }
            me.p++;
            me.tag[me.p]=tag;
            me.buf[me.p]=(str==undefined ? "" : me.escape(str));
            me.attr[me.p]=(attr==undefined ? "" : attr);
        }
        this.add = function(str){
            me.buf[me.p] += me.escape(str);
        }
        this.addNoEscape = function(str){
            me.buf[me.p] += str;
        }
        this.pop = function(){
            if(me.p<=0) return;
            var ret = me.html(me.tag[me.p], me.buf[me.p], me.attr[me.p]);
            me.tag[me.p] = null;
            me.buf[me.p] = null;
            me.attr[me.p] = null;
            me.p--;
            me.buf[me.p] += ret;
        }
        this.popAll = function(){
            while(me.p>0) me.pop();
        }
        this.output = function(){
            me.popAll();
            return me.buf[0];
        }
        this.html = function(tag, text, attr){
            var ret = "<" + tag + " " + attr + ">"
                + text + "</" + tag + ">";
            return ret;
        }
        this.currentTag =function(){
            if(me.p<1) return "";
            return me.tag[me.p];
        }
        this.escape = function(str){
            str = str.replace(">", "&gt;")
            str = str.replace("<", "&lt;")
            str = str.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            str = str.replace(/\*(.+?)\*/g, "<em>$1</em>")
            str = str.replace(/`(.+?)`/g, "<span class='inlinecode'>$1</span>")
            return str;
        }
    }
}