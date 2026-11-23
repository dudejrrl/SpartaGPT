// Pyodide 안에서 실행되는 파이썬 런타임 (데이터 생성 / 코드 실행 / 채점)
// String.raw 로 감싸서 파이썬 코드의 역슬래시가 그대로 유지되도록 합니다.
window.PY_RUNTIME = String.raw`
import os, io, sys, json, contextlib, traceback, warnings, linecache
import numpy as np
import pandas as pd

HIDDEN = '/tmp/_hidden'
pd.set_option('display.max_columns', 30)
pd.set_option('display.width', 160)


def _ci(a, lo=0, hi=100):
    return np.clip(np.round(a), lo, hi).astype(int)


def _sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))


def make_data():
    os.makedirs('data', exist_ok=True)
    os.makedirs(HIDDEN, exist_ok=True)
    rng = np.random.default_rng(2024)

    # ---------------- 작업형1: 학생 성적 ----------------
    n = 200
    study = np.round(rng.gamma(4.0, 1.8, n), 1)
    math = _ci(45 + 3.2 * study + rng.normal(0, 10, n)).astype(float)
    english = _ci(55 + 1.5 * study + rng.normal(0, 12, n)).astype(float)
    science = _ci(0.5 * math + 30 + rng.normal(0, 8, n)).astype(float)
    students = pd.DataFrame({
        'id': ['S%03d' % i for i in range(1, n + 1)],
        'gender': rng.choice(['M', 'F'], n),
        'class': rng.choice(['A', 'B', 'C', 'D'], n, p=[.3, .25, .25, .2]),
        'city': rng.choice(['서울', '부산', '대구', '인천', '광주'], n, p=[.35, .2, .15, .15, .15]),
        'study_hours': study,
        'math': math,
        'english': english,
        'science': science,
        'absent': rng.poisson(3, n),
    })
    students['city'] = students['city'].astype(object)
    for col, k in [('math', 9), ('english', 14), ('city', 6)]:
        idx = rng.choice(n, k, replace=False)
        students.loc[idx, col] = np.nan
    students.to_csv('data/students.csv', index=False)

    # ---------------- 작업형1: 매장 판매 ----------------
    m = 1200
    dates = pd.Timestamp('2023-01-01') + pd.to_timedelta(rng.integers(0, 365, m), unit='D')
    cat = rng.choice(['식품', '의류', '전자'], m, p=[.5, .3, .2])
    base = {'식품': 8000, '의류': 35000, '전자': 120000}
    price = np.round(np.array([base[c] for c in cat]) * rng.uniform(0.7, 1.3, m), -2).astype(int)
    qty = rng.integers(1, 6, m) + ((dates.month >= 11) & (cat == '전자')).astype(int) * rng.integers(0, 4, m)
    sales = pd.DataFrame({
        'date': dates.strftime('%Y-%m-%d'),
        'store': rng.choice(['강남점', '홍대점', '잠실점'], m),
        'category': cat,
        'qty': qty,
        'price': price,
    }).sort_values('date').reset_index(drop=True)
    sales.to_csv('data/sales.csv', index=False)

    # ---------------- 작업형2: 고객 이탈 (이진분류) ----------------
    N = 1000
    age = rng.integers(19, 70, N).astype(float)
    tenure = rng.integers(1, 72, N)
    contract = rng.choice(['월간', '1년', '2년'], N, p=[.55, .25, .2])
    fee = np.round(rng.uniform(20000, 120000, N), -2)
    calls = rng.poisson(1.5, N)
    region = rng.choice(['수도권', '충청', '영남', '호남', '강원'], N).astype(object)
    ceff = pd.Series(contract).map({'월간': 0.9, '1년': -0.4, '2년': -1.3}).values
    z = 0.3 - 0.045 * tenure + 0.5 * calls + 1.5e-5 * (fee - 60000) + ceff - 0.01 * (age - 40) + rng.normal(0, 0.5, N)
    churn = (rng.random(N) < _sigmoid(z)).astype(int)
    df = pd.DataFrame({'cust_id': ['C%04d' % i for i in range(1, N + 1)],
                       'age': age, 'gender': rng.choice(['남', '여'], N), 'tenure': tenure,
                       'contract': contract, 'monthly_fee': fee, 'support_calls': calls,
                       'region': region, 'churn': churn})
    df.loc[rng.choice(N, 30, replace=False), 'age'] = np.nan
    df.loc[rng.choice(N, 20, replace=False), 'region'] = np.nan
    tr, te = df.iloc[:700], df.iloc[700:]
    tr.to_csv('data/churn_train.csv', index=False)
    te.drop(columns='churn').to_csv('data/churn_test.csv', index=False)
    te[['cust_id', 'churn']].to_csv(HIDDEN + '/churn.csv', index=False)

    # ---------------- 작업형2: 중고차 가격 (회귀) ----------------
    N = 1000
    brand = rng.choice(['현대', '기아', '제네시스', '쉐보레', '르노'], N, p=[.35, .3, .1, .15, .1])
    year = rng.integers(2010, 2024, N)
    mileage = np.clip((2024 - year) * rng.normal(14000, 4000, N), 500, None).round(-2)
    fuel = rng.choice(['가솔린', '디젤', '하이브리드', '전기'], N, p=[.5, .3, .15, .05])
    engine = rng.choice([1000, 1600, 2000, 2500, 3300], N, p=[.1, .35, .3, .15, .1])
    bbase = pd.Series(brand).map({'현대': 3000, '기아': 2900, '제네시스': 5500, '쉐보레': 2500, '르노': 2400}).values
    feff = pd.Series(fuel).map({'가솔린': 1.0, '디젤': 1.05, '하이브리드': 1.2, '전기': 1.4}).values
    price = bbase * feff * (engine / 2000) ** 0.6 * np.exp(-0.09 * (2024 - year)) - mileage * 0.004
    price = np.round(np.clip(price + rng.normal(0, 150, N), 150, None))
    df = pd.DataFrame({'car_id': ['V%04d' % i for i in range(1, N + 1)], 'brand': brand, 'year': year,
                       'mileage': mileage, 'fuel': fuel, 'engine_cc': engine,
                       'accident': rng.poisson(0.4, N), 'price': price})
    df.loc[df['accident'] > 0, 'price'] = (df['price'] * (1 - 0.07 * df['accident'])).round()
    tr, te = df.iloc[:700], df.iloc[700:]
    tr.to_csv('data/car_train.csv', index=False)
    te.drop(columns='price').to_csv('data/car_test.csv', index=False)
    te[['car_id', 'price']].to_csv(HIDDEN + '/car.csv', index=False)

    # ---------------- 작업형2: 회원 등급 (다중분류) ----------------
    N = 900
    visits = rng.poisson(8, N)
    spend = np.round(rng.gamma(2.0, 150000, N) + visits * 20000, -3)
    months = rng.integers(1, 60, N)
    app = rng.choice(['Y', 'N'], N, p=[.6, .4])
    coupon = rng.poisson(2, N)
    score = spend / 100000 + 0.25 * visits + 0.03 * months + (app == 'Y') * 0.8 + rng.normal(0, 0.8, N)
    grade = np.where(score > np.quantile(score, .75), 'Gold', np.where(score > np.quantile(score, .4), 'Silver', 'Bronze'))
    df = pd.DataFrame({'member_id': ['M%04d' % i for i in range(1, N + 1)], 'visits': visits,
                       'total_spend': spend, 'months': months, 'app_user': app,
                       'coupon_used': coupon, 'age_group': rng.choice(['20대', '30대', '40대', '50대이상'], N),
                       'grade': grade})
    tr, te = df.iloc[:630], df.iloc[630:]
    tr.to_csv('data/member_train.csv', index=False)
    te.drop(columns='grade').to_csv('data/member_test.csv', index=False)
    te[['member_id', 'grade']].to_csv(HIDDEN + '/member.csv', index=False)

    # ---------------- 작업형3: 통계 검정용 ----------------
    before = np.round(rng.normal(145, 12, 30), 1)
    after = np.round(before - rng.normal(4, 6, 30), 1)
    pd.DataFrame({'id': range(1, 31), 'before': before, 'after': after}).to_csv('data/bp.csv', index=False)

    a = np.round(rng.normal(72, 10, 35), 1)
    b = np.round(rng.normal(66, 10.5, 40), 1)
    pd.DataFrame({'class': ['A'] * 35 + ['B'] * 40, 'score': np.r_[a, b]}).to_csv('data/class_scores.csv', index=False)

    fert = pd.DataFrame({'fertilizer': np.repeat(['A', 'B', 'C'], 20),
                         'yield': np.round(np.r_[rng.normal(50, 5, 20), rng.normal(53, 5, 20), rng.normal(56, 5, 20)], 2)})
    fert.sample(frac=1, random_state=1).to_csv('data/fertilizer.csv', index=False)

    g = rng.choice(['남', '여'], 300)
    pm = {'남': [.5, .2, .3], '여': [.35, .4, .25]}
    drink = [rng.choice(['커피', '차', '주스'], p=pm[x]) for x in g]
    pd.DataFrame({'gender': g, 'drink': drink}).to_csv('data/survey.csv', index=False)

    peas = rng.choice(['RY', 'RG', 'WY', 'WG'], 400, p=[9 / 16, 3 / 16, 3 / 16, 1 / 16])
    pd.DataFrame({'type': peas}).to_csv('data/peas.csv', index=False)

    n2 = 400
    gre = np.round(rng.normal(580, 110, n2), -1).clip(200, 800)
    gpa = np.round(rng.normal(3.4, 0.38, n2), 2).clip(2.0, 4.5)
    rank = rng.integers(1, 5, n2)
    zz = -4.5 + 0.004 * gre + 0.9 * gpa - 0.45 * rank
    admit = (rng.random(n2) < _sigmoid(zz)).astype(int)
    pd.DataFrame({'admit': admit, 'gre': gre, 'gpa': gpa, 'rank': rank}).to_csv('data/admission.csv', index=False)

    n3 = 120
    area = np.round(rng.uniform(40, 140, n3), 1)
    rooms = np.clip(np.round(area / 30 + rng.normal(0, .6, n3)), 1, 5).astype(int)
    hage = rng.integers(0, 35, n3)
    dist = np.round(rng.uniform(0.2, 6, n3), 2)
    hp = 18 * area + 120 * rooms - 25 * hage - 180 * dist + 900 + rng.normal(0, 150, n3)
    pd.DataFrame({'area': area, 'rooms': rooms, 'age': hage, 'distance': dist,
                  'price': np.round(hp)}).to_csv('data/house.csv', index=False)

    pd.DataFrame({'weight': np.round(rng.normal(101.2, 3.0, 25), 1)}).to_csv('data/snack.csv', index=False)


def _clean_tb(e):
    # 라이브러리 내부 프레임은 숨기고 사용자 코드(main.py) 줄만 보여줌
    frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == 'main.py']
    out = ''
    if frames:
        out = 'Traceback (most recent call last):\n' + ''.join(traceback.format_list(frames))
    return out + ''.join(traceback.format_exception_only(type(e), e))


def run_code(code):
    make_data()
    for f in ['result.csv']:
        if os.path.exists(f):
            os.remove(f)
    linecache.cache['main.py'] = (len(code), None, code.splitlines(True), 'main.py')
    buf = io.StringIO()
    ok = True
    ns = {'__name__': '__main__'}
    with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf), warnings.catch_warnings():
        warnings.simplefilter('ignore')
        try:
            exec(compile(code, 'main.py', 'exec'), ns)
        except SystemExit:
            pass
        except BaseException as e:
            ok = False
            buf.write(_clean_tb(e))
    return json.dumps({'out': buf.getvalue(), 'ok': ok}, ensure_ascii=False)


def check_model(cfg_json):
    cfg = json.loads(cfg_json)
    r = {'ok': False, 'msg': '', 'score': None}
    if not os.path.exists('result.csv'):
        r['msg'] = "result.csv 파일이 없습니다. to_csv('result.csv', index=False) 로 저장했는지 확인하세요."
        return json.dumps(r, ensure_ascii=False)
    try:
        res = pd.read_csv('result.csv')
    except Exception as e:
        r['msg'] = 'result.csv 를 읽을 수 없습니다: %s' % e
        return json.dumps(r, ensure_ascii=False)
    truth = pd.read_csv(HIDDEN + '/' + cfg['key'] + '.csv')
    col = cfg['col']
    if col not in res.columns:
        r['msg'] = "result.csv 에 '%s' 컬럼이 없습니다. 현재 컬럼: %s" % (col, list(res.columns))
        return json.dumps(r, ensure_ascii=False)
    extra = [c for c in res.columns if c != col]
    if extra:
        r['msg'] = "result.csv 에는 '%s' 컬럼 하나만 있어야 합니다. (불필요한 컬럼: %s — index=False 를 빠뜨리지 않았나요?)" % (col, extra)
        return json.dumps(r, ensure_ascii=False)
    if len(res) != len(truth):
        r['msg'] = 'result.csv 의 행 수가 %d 입니다. 테스트 데이터 행 수(%d)와 같아야 합니다.' % (len(res), len(truth))
        return json.dumps(r, ensure_ascii=False)
    pred = res[col]
    y = truth[cfg['target']]
    if pred.isnull().any():
        r['msg'] = '예측값에 결측치(NaN)가 %d개 있습니다.' % int(pred.isnull().sum())
        return json.dumps(r, ensure_ascii=False)
    try:
        from sklearn.metrics import roc_auc_score, f1_score, mean_squared_error
        m = cfg['metric']
        if m == 'auc':
            if not pd.api.types.is_numeric_dtype(pred):
                r['msg'] = 'pred 컬럼은 이탈(1) 확률(0~1 숫자)이어야 합니다.'
                return json.dumps(r, ensure_ascii=False)
            if pred.min() < 0 or pred.max() > 1:
                r['msg'] = 'pred 값은 0~1 사이 확률이어야 합니다. predict_proba(...)[:, 1] 을 사용하세요.'
                return json.dumps(r, ensure_ascii=False)
            score = roc_auc_score(y, pred)
            r['ok'] = bool(score >= cfg['threshold'])
            r['msg'] = 'ROC-AUC = %.4f (통과 기준 ≥ %.2f)' % (score, cfg['threshold'])
        elif m == 'rmse':
            score = float(np.sqrt(mean_squared_error(y, pred.astype(float))))
            r['ok'] = bool(score <= cfg['threshold'])
            r['msg'] = 'RMSE = %.2f (통과 기준 ≤ %.0f)' % (score, cfg['threshold'])
        elif m == 'f1_macro':
            p = pred.astype(str)
            bad = sorted(set(p) - set(y.astype(str)))
            if bad:
                r['msg'] = '알 수 없는 등급 값이 있습니다: %s (Bronze/Silver/Gold 중 하나여야 함)' % bad[:5]
                return json.dumps(r, ensure_ascii=False)
            score = f1_score(y.astype(str), p, average='macro')
            r['ok'] = bool(score >= cfg['threshold'])
            r['msg'] = 'macro F1 = %.4f (통과 기준 ≥ %.2f)' % (score, cfg['threshold'])
        r['score'] = float(score)
    except Exception as e:
        r['msg'] = '채점 중 오류: %s' % e
    return json.dumps(r, ensure_ascii=False)
`;
