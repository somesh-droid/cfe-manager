const fs=require('fs'),path=require('path');
const {minify}=require('terser');
const CleanCSS=require('clean-css');
const src=__dirname+'/src', out=__dirname+'/dist';
(async()=>{
 const shell=fs.readFileSync(src+'/shell.html','utf8');
 const title=shell.match(/<title>.*?<\/title>/)[0];
 const links=shell.match(/<link[^>]+>/g).join('\n');
 const css=shell.match(/<style>([\s\S]*?)<\/style>/)[1];
 const body=shell.slice(shell.indexOf('</style>')+8, shell.indexOf('<script>')).trim();
 const reset='*,*::before,*::after{box-sizing:border-box}html,body{margin:0}body{font-size:14px}img{max-width:100%}[hidden]{display:none!important}';
 const mcss=new CleanCSS({level:1}).minify(reset+css).styles;
 let eng=fs.readFileSync(src+'/engine.js','utf8').replace("if (typeof module !== 'undefined') module.exports = SIM;","");
 const FILES=['core.js','manager.js','portals.js','onboard.js','fulfil.js','ops.js','app.js'];
 const opt={compress:{passes:2},mangle:true,format:{comments:false}};
 fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out+'/js',{recursive:true});
 fs.writeFileSync(out+'/styles.css',mcss);
 fs.writeFileSync(out+'/js/engine.js',(await minify(eng,opt)).code);
 for (const f of FILES) fs.writeFileSync(out+'/js/'+f,(await minify(fs.readFileSync(src+'/'+f,'utf8'),opt)).code);
 const html=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${title}
<meta name="description" content="CFE Manager: prototype of Reliance's hourly clean-energy service. Simulated data.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect width='20' height='20' rx='5' fill='%23143D6B'/%3E%3Cpath d='M3 14 L7 6 L10 11 L13 4 L17 14' fill='none' stroke='white' stroke-width='2' stroke-linejoin='round'/%3E%3C/svg%3E">
${links}
<link rel="stylesheet" href="styles.css">
</head>
<body>
${body}
<script src="js/engine.js"></script>
${FILES.map(f=>'<script src="js/'+f+'"></script>').join('\n')}
</body>
</html>
`;
 fs.writeFileSync(out+'/index.html',html);
 for(const f of ['index.html','styles.css',...fs.readdirSync(out+'/js').map(x=>'js/'+x)]) console.log(f, fs.statSync(out+'/'+f).size);
})();
