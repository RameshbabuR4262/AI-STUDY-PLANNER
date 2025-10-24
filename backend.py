from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    profile = data.get('profile', {})
    subjects = data.get('subjects', [])

    try:
        start = datetime.fromisoformat(profile.get('start_date')).date()
        end = datetime.fromisoformat(profile.get('end_date')).date()
    except Exception:
        start = datetime.today().date()
        end = start + timedelta(days=30)

    total_days = (end - start).days + 1
    daily_hours = float(profile.get('daily_hours', 2))

    for s in subjects:
        s['exam_date_obj'] = datetime.fromisoformat(s['exam_date']).date()
        days_left = max((s['exam_date_obj'] - start).days, 0)
        s['urgency'] = (1 / (days_left + 1)) * s.get('weight', 5)
        s['hours_remaining'] = s.get('hours_needed', 5)

    total_urgency = sum(s['urgency'] for s in subjects) or 1
    schedule = []

    for i in range(total_days):
        day = start + timedelta(days=i)
        remaining = daily_hours
        sessions = []
        for s in sorted(subjects, key=lambda x: -x['urgency']):
            if remaining <= 0 or s['hours_remaining'] <= 0: continue
            share = (s['urgency'] / total_urgency) * daily_hours
            assign = min(s['hours_remaining'], round(min(share, remaining), 2))
            if assign <= 0: continue
            sessions.append({'subject': s['title'], 'hours': assign})
            s['hours_remaining'] -= assign
            remaining -= assign
        schedule.append({'date': day.isoformat(), 'sessions': sessions})

    return jsonify({'schedule': schedule})

if __name__ == '__main__':
    app.run(debug=True)