"""Independent checks on the built dataset against the raw Meta export."""
import json, re, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, '..', 'app', 'src', 'data', 'tgs.json')))
raw = json.load(open(os.path.join(HERE, 'raw', 'meta_posts.json')))
fails = []
def check(ok, msg):
    if not ok: fails.append(msg)

def tot(v):
    if v is None: return 0
    if isinstance(v, str): return float(re.match(r'[\d,.]+', v.strip()).group(0).replace(',', ''))
    return v
def ads(v):
    m = re.search(r'([\d,.]+)\s+from ads', v) if isinstance(v, str) else None
    return float(m.group(1).replace(',', '')) if m else 0

# 1. monthly organic views straight from raw rows (own accounts, no stories)
for m in D['months']:
    if m['kind'] != 'report': continue
    mo = m['id']
    rows = [r for r in raw if r['date'].startswith(mo) and r['type'] != 'Story'
            and 'jumpytalks' not in r['account'] and 'basketball' not in r['account']]
    org = sum(tot(r['Views']) - ads(r['Views']) for r in rows)
    check(abs(org - m['summary']['views_org']) < 1, f"{mo} organic views {org} != {m['summary']['views_org']}")
    paid = sum(ads(r['Views']) for r in rows)
    check(abs(paid - m['summary']['views_ads']) < 1, f"{mo} paid views {paid} != {m['summary']['views_ads']}")
    fol = sum(tot(r['Follows']) for r in rows)
    check(abs(fol - m['summary']['follows']) < 1, f"{mo} follows {fol} != {m['summary']['follows']}")
    # plan status counts add up
    pl = [p for p in D['plan'] if p['month'] == mo]
    check(sum(m['summary']['status'].values()) == len(pl), f'{mo} status counts')
    check(m['summary']['delivered'] == sum(1 for p in pl if p['contentId']), f'{mo} delivered')

# 2. every raw post is represented exactly once
ids = [i for c in D['content'] for i in c['ids']]
check(len(ids) == len(set(ids)), 'duplicate post ids across content')
feed = [r for r in raw if r['type'] != 'Story' and r['date'] >= '2026-07']
check(len(ids) == len(feed), f'content covers {len(ids)} raw rows, expected {len(feed)}')

# 3. plan <-> content links are consistent
C = {c['id']: c for c in D['content']}
seen = set()
for p in D['plan']:
    if p['contentId']:
        c = C.get(p['contentId'])
        check(c is not None, f"{p['id']} points at missing content")
        check(p['contentId'] not in seen, f"{p['contentId']} matched twice"); seen.add(p['contentId'])
        check(c['planId'] == p['id'], f"{p['id']} back-link")
        check(abs(p['lag']) <= 11, f"{p['id']} lag {p['lag']} looks wrong")
for c in D['content']:
    check((c['marker'] == 'planned') == bool(c['planId']), f"{c['id']} marker/plan mismatch")
    check(c['boosted'] == (c['metrics']['views_ads'] > 0 or c['metrics']['reach_ads'] > 0), f"{c['id']} boosted flag")

# 4. images exist and are whole posts (stored size matches the recorded aspect)
pub = os.path.join(HERE, '..', 'app', 'public')
for obj in D['content'] + D['plan']:
    img = obj.get('image') or obj.get('creative')
    if not img: continue
    f = os.path.join(pub, img['src'])
    check(os.path.exists(f), f"missing file {img['src']}")
    if os.path.exists(f):
        w, h = Image.open(f).size
        check(abs(w / h - img['w'] / img['h']) < 0.02, f"{img['src']} aspect {w}x{h} vs {img['w']}x{img['h']}")

# 5. client-facing numbers are straight sums of organic Meta fields
for c in D['content']:
    m, p = c['metrics'], c['plain']
    check(p['reached'] == m['reach_org'], f"{c['id']} reached")
    check(p['reactions'] == m['likes_org'] + m['comments_org'], f"{c['id']} reactions")
    check(p['passedOn'] == m['shares_org'] + m['saves_org'], f"{c['id']} passedOn")
for mo in D['months']:
    if mo['kind'] != 'report': continue
    own = [c for c in D['content'] if c['month'] == mo['id'] and c['family'] == 'tgs']
    for k in ('reached', 'reactions', 'passedOn', 'follows'):
        check(abs(sum(c['plain'][k] for c in own) - mo['summary']['plain'][k]) < 1, f"{mo['id']} plain {k}")
    check(sum(mo['summary']['verdicts'].values()) == len(own), f"{mo['id']} every own post has a verdict")

print('OK' if not fails else '\n'.join(fails))
print(f"checked {len(D['content'])} posts, {len(D['plan'])} plan rows")
