# MDParser

MarkdownテキストをHTMLへ変換するjavascriptライブラリです。

## USAGE

MDParser.jsを読み込みます。

```
<script src="MDParser.js" type="text/javascript"></script>
```

MDParserオブジェクトをを作成して、BuildHtmlメソッドにマークダウン文字列を渡すとHTMLタグ文字列が返されます。

```
var paser = new MDParser().;
var html = paser.BuildHtml(markdown);
```

## SAMPLE

https://yudachi-shinko.com/mdbox/
