"""One-off helper used in the pilot: decodes post images pulled from Meta (via the browser) into raw/meta_img."""
import json, sys, base64, os, re, glob
TR='/root/.claude/projects/-home-claude/847fa6ab-631f-5579-8c68-68032aa83b55/tool-results'
OUT='/home/claude/tatva-dash/pipeline/raw/meta_img'
done=set(json.load(open(OUT+'/_done.json'))) if os.path.exists(OUT+'/_done.json') else set()
meta=json.load(open(OUT+'/_meta.json')) if os.path.exists(OUT+'/_meta.json') else {}
files=sys.argv[1:] or sorted(glob.glob(TR+'/mcp-remote-devices-Claude_Browser__javascript_tool-*.txt'))
n=0
for f in files:
    if f in done: continue
    try:
        arr=json.load(open(f)); txt=arr[0]['text']
    except Exception as e:
        continue
    # strip trailing "(captured at origin..." if present
    try:
        d,_=json.JSONDecoder().raw_decode(txt.lstrip())
        if isinstance(d,str): d=json.loads(d)
    except Exception:
        continue
    if not isinstance(d,dict) or not all(isinstance(v,dict) and 'data' in v for v in d.values()): continue
    for k,v in d.items():
        b=base64.b64decode(v['data'].split(',',1)[1])
        open(f'{OUT}/{k}.jpg','wb').write(b)
        meta[k]={'w':v['w'],'h':v['h'],'txt':v.get('txt','')}
        n+=1
    done.add(f)
json.dump(sorted(done),open(OUT+'/_done.json','w'))
json.dump(meta,open(OUT+'/_meta.json','w'),ensure_ascii=False)
print('new',n,'total',len(meta))
