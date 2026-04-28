from flask import Blueprint, request, g
from datetime import datetime
from middleware.auth import auth_required
from utils.database import get_db, query, fetch_list, fetch_one
from utils.responses import success

adaptive_routes = Blueprint('adaptive_routes', __name__)
ALLOWED = {'dashboard','lifeos-dash','checkin','rotina','habitos','plano','metas','financas','energia-mental','notas','exportar','feedback','suporte'}


def _top_modules(uid: str):
    rows = fetch_list(query(
        get_db().table('user_module_usage')
            .select('module_id, open_count, last_opened_at')
            .eq('user_id', uid)
            .order('open_count', desc=True)
            .limit(5)
    ))
    return [r.get('module_id') for r in rows if r.get('module_id') in ALLOWED]


@adaptive_routes.post('/api/adaptive/track')
@auth_required
def track_module_usage():
    body = request.get_json(silent=True) or {}
    module_id = str(body.get('module_id', '')).strip()
    if module_id not in ALLOWED:
        return success({'tracked': False})
    db = get_db()
    existing = fetch_one(query(
        db.table('user_module_usage')
          .select('id, open_count')
          .eq('user_id', g.uid)
          .eq('module_id', module_id)
          .limit(1)
    ))
    if existing.get('id'):
        query(db.table('user_module_usage').update({
            'open_count': int(existing.get('open_count') or 0) + 1,
            'last_opened_at': datetime.utcnow().isoformat()
        }).eq('id', existing['id']))
    else:
        query(db.table('user_module_usage').insert({
            'user_id': g.uid,
            'module_id': module_id,
            'open_count': 1,
        }))
    return success({'tracked': True, 'top_modules': _top_modules(g.uid)})


@adaptive_routes.get('/api/adaptive/home')
@auth_required
def adaptive_home():
    top = _top_modules(g.uid)
    suggestions = []
    if top:
        suggestions.append(f"Você usa mais: {', '.join(top[:3])}.")
    if 'financas' in top:
        suggestions.append('Deixe suas finanças em dia registrando entradas e saídas primeiro.')
    if 'metas' in top and 'checkin' not in top:
        suggestions.append('Faça o check-in para ligar suas metas ao progresso diário.')
    return success({'top_modules': top, 'suggestions': suggestions, 'default_module': top[0] if top else 'dashboard'})
