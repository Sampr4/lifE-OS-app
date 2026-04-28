from flask import Blueprint, request, g
from middleware.auth import auth_required
from utils.database import get_db, query, fetch_list, fetch_one
from utils.responses import success, error

feedback_routes = Blueprint('feedback_routes', __name__)


def _normalize_row(row):
    user = row.get('users') or {}
    return {
        'id': row.get('id'),
        'author_id': row.get('user_id'),
        'author_name': user.get('name', 'Usuário'),
        'author_initials': user.get('initials', 'U'),
        'content': row.get('content', ''),
        'rating': int(row.get('rating') or 0),
        'category': row.get('category', 'geral'),
        'created_at': str(row.get('created_at', '')),
        'score': int(row.get('relevance_score') or 0),
        'mine': row.get('user_id') == g.uid,
    }


@feedback_routes.get('/api/feedbacks')
@auth_required
def list_feedbacks():
    order = (request.args.get('order') or 'recent').strip().lower()
    db = get_db()
    sel = ('id, user_id, content, rating, category, relevance_score, created_at, '
           'users:user_id(name, initials)')
    builder = db.table('feedback_posts').select(sel).limit(50)
    if order == 'relevant':
        builder = builder.order('relevance_score', desc=True).order('created_at', desc=True)
    else:
        builder = builder.order('created_at', desc=True)
    rows = fetch_list(query(builder))
    return success([_normalize_row(r) for r in rows])


@feedback_routes.post('/api/feedbacks')
@auth_required
def create_feedback():
    body = request.get_json(silent=True) or {}
    content = str(body.get('content', '')).strip()
    if len(content) < 3:
        return error('MISSING_FIELD', 'content is required.', 400)
    rating = max(1, min(5, int(body.get('rating', 5))))
    category = str(body.get('category', 'geral')).strip()[:50] or 'geral'
    relevance = max(0, min(100, rating * 20 + min(len(content) // 8, 20)))
    res = query(
        get_db().table('feedback_posts').insert({
            'user_id': g.uid,
            'content': content[:1200],
            'rating': rating,
            'category': category,
            'relevance_score': relevance,
        }).select('id, user_id, content, rating, category, relevance_score, created_at').single()
    )
    row = fetch_one(res)
    if not row:
        return error('DB_ERROR', 'Failed to save feedback.', 500)
    user = fetch_one(query(get_db().table('users').select('name, initials').eq('id', g.uid).limit(1)))
    row['users'] = user
    return success(_normalize_row(row), status=201)
