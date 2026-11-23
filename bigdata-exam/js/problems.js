// 문제 은행
// parts: 답안 칸. 풀이 코드(solution)를 실제로 실행해서 print 한 줄 순서대로 정답이 됩니다.
//   kind: 'num' (숫자, tol 허용오차) | 'str' (문자열) | 'choice' (선택지)
// model: 작업형2 채점 설정 (result.csv 를 숨겨진 정답과 비교)
const py = String.raw;

const HEAD1 = py`import pandas as pd
import numpy as np

df = pd.read_csv('data/students.csv')
`;

window.PROBLEMS = [
  // =====================================================================
  // 작업형 1
  // =====================================================================
  {
    id: 't1-first-shape', type: 1, level: '하', title: '데이터의 첫 모양 (shape)',
    files: ['data/students.csv'],
    desc: `<p><code>data/students.csv</code> 는 어느 학교 학생 200명의 성적 데이터입니다.</p>
<p>데이터를 불러와 <b>(1) 행(row)의 개수</b>와 <b>(2) 열(column)의 개수</b>를 차례로 출력하세요.</p>`,
    parts: [{ label: '(1) 행의 개수', kind: 'num', tol: 0 }, { label: '(2) 열의 개수', kind: 'num', tol: 0 }],
    starter: HEAD1 + py`
# 코드를 작성하고 답을 print() 로 출력하세요
`,
    solution: HEAD1 + py`
print(df.shape[0])
print(df.shape[1])
`,
    hint: '<code>df.shape</code> 는 (행 수, 열 수) 튜플을 돌려줍니다.',
    explain: `<p><code>df.shape</code> 는 <code>(행 수, 열 수)</code> 형태의 튜플입니다. 인덱스로 각각 꺼내면 됩니다.</p>
<ul><li>행 수: <code>df.shape[0]</code> 또는 <code>len(df)</code></li>
<li>열 수: <code>df.shape[1]</code> 또는 <code>len(df.columns)</code></li></ul>
<p>⚠️ <code>df.size</code> 는 <b>행×열 전체 셀 수</b>이므로 헷갈리지 마세요. 데이터를 처음 받으면 <code>df.head()</code>, <code>df.info()</code> 로 구조를 확인하는 습관을 들이세요.</p>`,
  },
  {
    id: 't1-missing-count', type: 1, level: '하', title: '결측치가 가장 많은 컬럼',
    files: ['data/students.csv'],
    desc: `<p><code>students.csv</code> 에서 <b>결측치(NaN)가 가장 많은 컬럼명</b>과 <b>그 컬럼의 결측치 개수</b>를 차례로 출력하세요.</p>`,
    parts: [{ label: '(1) 컬럼명', kind: 'str' }, { label: '(2) 결측치 개수', kind: 'num', tol: 0 }],
    starter: HEAD1 + '\n',
    solution: HEAD1 + py`
na = df.isnull().sum()
print(na.idxmax())
print(na.max())
`,
    hint: '<code>df.isnull().sum()</code> → 컬럼별 결측치 수. 최댓값의 인덱스는 <code>idxmax()</code>.',
    explain: `<p><code>df.isnull()</code> 은 결측이면 True 인 같은 크기의 DataFrame 을 만들고, <code>.sum()</code> 하면 컬럼별 True 개수(=결측치 수)가 됩니다.</p>
<pre>na = df.isnull().sum()   # 컬럼별 결측치 Series
na.idxmax()              # 값이 가장 큰 인덱스(컬럼명)
na.max()                 # 그 값</pre>
<p><code>na.sort_values(ascending=False)</code> 로 확인해도 됩니다. <code>isna()</code> 와 <code>isnull()</code> 은 같은 함수입니다.</p>`,
  },
  {
    id: 't1-fillna-std', type: 1, level: '중', title: '중앙값 대체 전후 표준편차',
    files: ['data/students.csv'],
    desc: `<p><code>math</code> 컬럼의 결측치를 <b>math 컬럼의 중앙값</b>으로 채우려 합니다.</p>
<p><b>채우기 전 표준편차 − 채운 후 표준편차</b> 를 구해 <b>소수 넷째 자리에서 반올림</b>(소수 셋째 자리까지)하여 출력하세요.</p>
<p class="note">표준편차는 pandas 기본값(<code>std()</code>, 표본표준편차)을 사용합니다.</p>`,
    parts: [{ label: '표준편차 차이', kind: 'num', tol: 0.0011 }],
    starter: HEAD1 + '\n',
    solution: HEAD1 + py`
before = df['math'].std()
filled = df['math'].fillna(df['math'].median())
after = filled.std()
print(round(before - after, 3))
`,
    hint: '<code>fillna(df["math"].median())</code> 후 <code>std()</code> 를 다시 계산하세요.',
    explain: `<ol><li>채우기 전 표준편차: <code>df['math'].std()</code> — pandas 는 결측치를 자동으로 제외하고 계산합니다.</li>
<li>중앙값으로 채우기: <code>df['math'].fillna(df['math'].median())</code></li>
<li>채운 뒤 표준편차를 구하고 차이를 <code>round(x, 3)</code>.</li></ol>
<p>중앙값처럼 가운데 값을 여러 개 채워 넣으면 데이터가 가운데로 몰리므로 <b>표준편차는 줄어듭니다</b> → 차이는 양수가 나와야 정상입니다.</p>
<p>⚠️ <code>np.std()</code> 는 기본이 모표준편차(ddof=0)라 값이 다릅니다. 문제에서 지정이 없으면 pandas 의 <code>.std()</code> 를 쓰세요.</p>`,
  },
  {
    id: 't1-iqr-outlier', type: 1, level: '중', title: 'IQR 이상치 개수',
    files: ['data/students.csv'],
    desc: `<p><code>study_hours</code> 컬럼에서 IQR 방식으로 이상치를 찾으려 합니다.</p>
<p>Q1 − 1.5×IQR 보다 작거나 Q3 + 1.5×IQR 보다 큰 값을 이상치라 할 때, <b>이상치의 개수</b>를 출력하세요.</p>`,
    parts: [{ label: '이상치 개수', kind: 'num', tol: 0 }],
    starter: HEAD1 + '\n',
    solution: HEAD1 + py`
q1 = df['study_hours'].quantile(0.25)
q3 = df['study_hours'].quantile(0.75)
iqr = q3 - q1
cond = (df['study_hours'] < q1 - 1.5 * iqr) | (df['study_hours'] > q3 + 1.5 * iqr)
print(cond.sum())
`,
    hint: '<code>quantile(0.25)</code>, <code>quantile(0.75)</code> 로 사분위수를 구하고, 조건을 <code>|</code> 로 묶으세요.',
    explain: `<p>IQR(사분위 범위) = Q3 − Q1 입니다.</p>
<pre>q1 = s.quantile(0.25); q3 = s.quantile(0.75)
iqr = q3 - q1
outlier = (s < q1 - 1.5*iqr) | (s > q3 + 1.5*iqr)
outlier.sum()   # True 의 개수</pre>
<p>⚠️ 파이썬의 <code>or</code>/<code>and</code> 대신 pandas 에서는 <code>|</code>/<code>&</code> 를 쓰고, 각 조건은 반드시 <b>괄호</b>로 감싸야 합니다.</p>`,
  },
  {
    id: 't1-group-mean', type: 1, level: '하', title: '반별 평균이 가장 높은 반',
    files: ['data/students.csv'],
    desc: `<p><code>class</code> 별 <code>english</code> 평균을 구했을 때, <b>(1) 평균이 가장 높은 반</b>과 <b>(2) 그 평균값</b>(소수 셋째 자리에서 반올림)을 출력하세요.</p>`,
    parts: [{ label: '(1) 반', kind: 'str' }, { label: '(2) 평균', kind: 'num', tol: 0.006 }],
    starter: HEAD1 + '\n',
    solution: HEAD1 + py`
g = df.groupby('class')['english'].mean()
print(g.idxmax())
print(round(g.max(), 2))
`,
    hint: '<code>df.groupby("class")["english"].mean()</code>',
    explain: `<p><code>groupby</code> 는 "~별로" 집계할 때 사용합니다.</p>
<pre>g = df.groupby('class')['english'].mean()
g.idxmax(), g.max()</pre>
<p>결측치는 평균 계산에서 자동 제외됩니다. 여러 통계를 한 번에 보려면 <code>.agg(['mean','count'])</code> 를 활용하세요.</p>`,
  },
  {
    id: 't1-top10-replace', type: 1, level: '중', title: '상위 10개 값 대체 후 평균',
    files: ['data/students.csv'],
    desc: `<p><code>math</code> 컬럼을 내림차순 정렬했을 때 <b>상위 10개의 값을 10번째로 큰 값으로 대체</b>합니다.</p>
<p>그 후 <code>study_hours</code> 가 <b>10 이상</b>인 학생들의 <code>math</code> 평균을 소수 셋째 자리에서 반올림하여 출력하세요. (결측치는 그대로 둡니다)</p>`,
    parts: [{ label: '평균', kind: 'num', tol: 0.006 }],
    starter: HEAD1 + '\n',
    solution: HEAD1 + py`
df = df.sort_values('math', ascending=False).reset_index(drop=True)
tenth = df['math'].iloc[9]
df.loc[:9, 'math'] = tenth
print(round(df[df['study_hours'] >= 10]['math'].mean(), 2))
`,
    hint: '정렬 후 <code>reset_index(drop=True)</code> 를 하면 <code>df.loc[:9, "math"]</code> 로 상위 10개를 바꿀 수 있습니다.',
    explain: `<ol><li><code>sort_values('math', ascending=False)</code> — NaN 은 기본적으로 맨 뒤로 갑니다.</li>
<li><code>reset_index(drop=True)</code> 로 인덱스를 0부터 다시 매깁니다.</li>
<li>10번째 값은 0부터 세므로 <code>iloc[9]</code>.</li>
<li><code>df.loc[:9, 'math'] = tenth</code> — <code>loc</code> 의 슬라이싱은 <b>끝 값(9)을 포함</b>하므로 0~9, 10개 행입니다.</li></ol>
<p>⚠️ <code>iloc[:9]</code> 는 9를 포함하지 않습니다(9개). loc/iloc 슬라이싱 차이는 자주 나오는 함정입니다.</p>`,
  },
  {
    id: 't1-minmax', type: 1, level: '중', title: 'Min-Max 스케일링',
    files: ['data/students.csv'],
    desc: `<p><code>science</code> 컬럼을 Min-Max 스케일링(0~1 변환)한 뒤, <b>변환된 값이 0.7 이상인 학생 수</b>를 출력하세요.</p>`,
    parts: [{ label: '학생 수', kind: 'num', tol: 0 }],
    starter: HEAD1 + '\n',
    solution: HEAD1 + py`
s = df['science']
scaled = (s - s.min()) / (s.max() - s.min())
print((scaled >= 0.7).sum())
`,
    hint: '(x − min) / (max − min). sklearn 의 <code>MinMaxScaler</code> 를 써도 됩니다.',
    explain: `<p>Min-Max 스케일링 공식: <code>(x - min) / (max - min)</code>. 최솟값은 0, 최댓값은 1 이 됩니다.</p>
<pre>from sklearn.preprocessing import MinMaxScaler
scaled = MinMaxScaler().fit_transform(df[['science']])   # 2차원으로 넣어야 함</pre>
<p>⚠️ sklearn 스케일러는 <code>df[['science']]</code> 처럼 <b>대괄호 두 개</b>(DataFrame)로 넣어야 합니다. 표준화(Z-score)는 <code>StandardScaler</code> 입니다.</p>`,
  },
  {
    id: 't1-zscore', type: 1, level: '중', title: 'Z-score 이상치',
    files: ['data/students.csv'],
    desc: `<p><code>absent</code>(결석 일수) 컬럼을 표준화(Z = (x − 평균) / 표준편차)했을 때 <b>|Z| &gt; 2</b> 인 학생 수를 출력하세요.</p>
<p class="note">평균, 표준편차는 pandas 의 <code>mean()</code>, <code>std()</code> 를 사용합니다.</p>`,
    parts: [{ label: '학생 수', kind: 'num', tol: 0 }],
    starter: HEAD1 + '\n',
    solution: HEAD1 + py`
s = df['absent']
z = (s - s.mean()) / s.std()
print((z.abs() > 2).sum())
`,
    hint: '<code>z.abs() &gt; 2</code> 조건의 합계.',
    explain: `<p>Z-score 는 평균에서 표준편차 몇 배만큼 떨어져 있는지를 나타냅니다.</p>
<pre>z = (s - s.mean()) / s.std()
(z.abs() > 2).sum()</pre>
<p>⚠️ <code>StandardScaler</code> 는 모표준편차(ddof=0)를 쓰기 때문에 pandas 결과와 미세하게 다를 수 있습니다. 경계값 근처에서는 개수가 달라질 수 있으니 문제에서 지정한 방법을 따르세요.</p>`,
  },
  {
    id: 't1-dropna-quantile', type: 1, level: '중', title: '결측 제거 후 앞 70% 사분위수',
    files: ['data/students.csv'],
    desc: `<p>결측치가 하나라도 있는 행을 모두 제거한 뒤, <b>앞에서부터 70%</b>의 데이터만 사용합니다. (행 수 × 0.7 을 정수로 변환한 개수)</p>
<p>이 데이터에서 <code>english</code> 의 <b>1사분위수(Q1)</b>를 소수 셋째 자리에서 반올림하여 출력하세요.</p>`,
    parts: [{ label: 'Q1', kind: 'num', tol: 0.006 }],
    starter: HEAD1 + '\n',
    solution: HEAD1 + py`
d = df.dropna()
d = d.iloc[:int(len(d) * 0.7)]
print(round(d['english'].quantile(0.25), 2))
`,
    hint: '<code>dropna()</code> → <code>iloc[:int(len(d)*0.7)]</code> → <code>quantile(0.25)</code>',
    explain: `<ol><li><code>df.dropna()</code> : 결측치가 하나라도 있는 행 제거 (특정 컬럼만 볼 때는 <code>subset=[...]</code>)</li>
<li><code>int(len(d) * 0.7)</code> 개만큼 <code>iloc</code> 로 자르기 — 위치 기반이므로 iloc 사용</li>
<li><code>quantile(0.25)</code> 가 1사분위수</li></ol>
<p>⚠️ dropna 후에는 인덱스가 띄엄띄엄 남으므로 <code>loc[:n]</code> 을 쓰면 엉뚱한 개수가 선택됩니다. 반드시 <code>iloc</code> 를 쓰세요.</p>`,
  },
  {
    id: 't1-corr', type: 1, level: '중', title: '상관계수가 가장 큰 변수',
    files: ['data/students.csv'],
    desc: `<p><code>math</code> 와 나머지 수치형 변수(<code>study_hours, english, science, absent</code>) 사이의 피어슨 상관계수를 구했을 때,</p>
<p><b>(1) 상관계수의 절댓값이 가장 큰 변수명</b>과 <b>(2) 그 상관계수</b>(소수 넷째 자리에서 반올림)를 출력하세요.</p>`,
    parts: [{ label: '(1) 변수명', kind: 'str' }, { label: '(2) 상관계수', kind: 'num', tol: 0.0011 }],
    starter: HEAD1 + '\n',
    solution: HEAD1 + py`
cols = ['study_hours', 'english', 'science', 'absent']
c = df[cols + ['math']].corr()['math'].drop('math')
name = c.abs().idxmax()
print(name)
print(round(c[name], 3))
`,
    hint: '<code>df[cols].corr()["math"]</code> 에서 자기 자신(math)은 빼고 <code>abs().idxmax()</code>.',
    explain: `<p><code>corr()</code> 는 상관계수 행렬을 만듭니다. 기본은 피어슨이며 <code>method='spearman'</code> 등으로 바꿀 수 있습니다.</p>
<pre>c = df[cols + ['math']].corr()['math'].drop('math')
name = c.abs().idxmax()   # 절댓값 기준으로 찾고
c[name]                   # 출력은 원래 부호 그대로</pre>
<p>⚠️ 자기 자신과의 상관계수(1.0)를 빼는 것을 잊지 마세요. 또 문자열 컬럼이 섞여 있으면 오류가 나므로 수치형만 선택합니다(<code>numeric_only=True</code>).</p>`,
  },
  {
    id: 't1-sales-month', type: 1, level: '중', title: '월별 매출 최대인 달',
    files: ['data/sales.csv'],
    desc: `<p><code>data/sales.csv</code> 는 2023년 매장 판매 기록입니다. 매출 = <code>qty × price</code> 입니다.</p>
<p>월별 총매출을 구했을 때 <b>(1) 총매출이 가장 큰 월</b>(1~12 정수)과 <b>(2) 그 월의 총매출</b>(정수)을 출력하세요.</p>`,
    parts: [{ label: '(1) 월', kind: 'num', tol: 0 }, { label: '(2) 총매출', kind: 'num', tol: 0.5 }],
    starter: py`import pandas as pd

df = pd.read_csv('data/sales.csv')
`,
    solution: py`import pandas as pd

df = pd.read_csv('data/sales.csv')
df['date'] = pd.to_datetime(df['date'])
df['sales'] = df['qty'] * df['price']
m = df.groupby(df['date'].dt.month)['sales'].sum()
print(m.idxmax())
print(int(m.max()))
`,
    hint: '<code>pd.to_datetime()</code> 후 <code>.dt.month</code> 로 그룹화하세요.',
    explain: `<p>CSV 에서 읽은 날짜는 문자열이므로 먼저 <code>pd.to_datetime()</code> 으로 변환해야 <code>.dt</code> 접근자를 쓸 수 있습니다.</p>
<pre>df['date'] = pd.to_datetime(df['date'])
df['sales'] = df['qty'] * df['price']
df.groupby(df['date'].dt.month)['sales'].sum()</pre>
<p>자주 쓰는 dt 속성: <code>.dt.year, .dt.month, .dt.day, .dt.dayofweek(월=0), .dt.day_name(), .dt.quarter</code></p>`,
  },
  {
    id: 't1-weekday', type: 1, level: '중', title: '요일별 판매수량',
    files: ['data/sales.csv'],
    desc: `<p><code>sales.csv</code> 에서 <b>2023년 하반기(7월~12월)</b> 동안 <code>store</code> 가 <b>'강남점'</b> 인 데이터만 사용합니다.</p>
<p>요일별 총 판매수량(<code>qty</code>)이 가장 많은 요일을 영어 세 글자(<code>Mon, Tue, Wed, Thu, Fri, Sat, Sun</code>)로 출력하세요.</p>`,
    parts: [{ label: '요일', kind: 'choice', options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    starter: py`import pandas as pd

df = pd.read_csv('data/sales.csv')
`,
    solution: py`import pandas as pd

df = pd.read_csv('data/sales.csv')
df['date'] = pd.to_datetime(df['date'])
d = df[(df['date'].dt.month >= 7) & (df['store'] == '강남점')]
w = d.groupby(d['date'].dt.day_name())['qty'].sum()
print(w.idxmax()[:3])
`,
    hint: '<code>.dt.day_name()</code> 은 "Monday" 같은 영어 요일명을 돌려줍니다.',
    explain: `<p>조건 두 개를 <code>&amp;</code> 로 묶어 필터링한 뒤, 요일로 그룹화합니다.</p>
<pre>d = df[(df['date'].dt.month >= 7) & (df['store'] == '강남점')]
d.groupby(d['date'].dt.day_name())['qty'].sum()</pre>
<p><code>dt.dayofweek</code> 를 쓰면 월요일=0 ~ 일요일=6 숫자가 나옵니다. 날짜 범위는 <code>df['date'] &gt;= '2023-07-01'</code> 처럼 문자열 비교로도 필터링할 수 있습니다.</p>`,
  },

  // =====================================================================
  // 작업형 2
  // =====================================================================
  {
    id: 't2-churn-auc', type: 2, level: '중', title: '고객 이탈 예측 (이진분류, ROC-AUC)',
    files: ['data/churn_train.csv', 'data/churn_test.csv'],
    desc: `<p>통신사 고객 데이터로 <b>이탈 여부(churn: 1=이탈)</b>를 예측하세요.</p>
<ul><li>학습: <code>data/churn_train.csv</code> (700행, 타깃 <code>churn</code> 포함)</li>
<li>평가: <code>data/churn_test.csv</code> (300행, 타깃 없음)</li></ul>
<p><b>제출 형식</b>: 테스트 데이터 순서대로 <b>이탈 확률</b>을 <code>pred</code> 컬럼 하나에 담아 <code>result.csv</code> 로 저장 (index 없이, 300행)</p>
<pre>pred
0.123
0.871
...</pre>
<p>평가지표: <b>ROC-AUC ≥ 0.75</b> 이면 통과</p>`,
    model: { key: 'churn', target: 'churn', col: 'pred', metric: 'auc', threshold: 0.75 },
    starter: py`import pandas as pd

train = pd.read_csv('data/churn_train.csv')
test = pd.read_csv('data/churn_test.csv')

# 1. 데이터 확인 (train.info(), train.isnull().sum() ...)
# 2. 전처리 (결측치, 범주형 인코딩)
# 3. 모델 학습 및 검증
# 4. 예측 후 저장: pd.DataFrame({'pred': ...}).to_csv('result.csv', index=False)
`,
    solution: py`import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

train = pd.read_csv('data/churn_train.csv')
test = pd.read_csv('data/churn_test.csv')

y = train.pop('churn')
X = train.drop(columns=['cust_id'])
X_test = test.drop(columns=['cust_id'])

# 결측치 처리 (학습 데이터 기준 값 사용)
med = X['age'].median()
X['age'] = X['age'].fillna(med)
X_test['age'] = X_test['age'].fillna(med)
X['region'] = X['region'].fillna('missing')
X_test['region'] = X_test['region'].fillna('missing')

# 원-핫 인코딩: train/test 를 합쳐서 컬럼을 맞춤
all_ = pd.get_dummies(pd.concat([X, X_test]))
X, X_test = all_.iloc[:len(X)], all_.iloc[len(X):]

# 검증
X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, random_state=0, stratify=y)
model = RandomForestClassifier(n_estimators=300, min_samples_leaf=5, random_state=0)
model.fit(X_tr, y_tr)
print('검증 AUC:', round(roc_auc_score(y_val, model.predict_proba(X_val)[:, 1]), 4))

# 전체 데이터로 재학습 후 예측
model.fit(X, y)
pred = model.predict_proba(X_test)[:, 1]
pd.DataFrame({'pred': pred}).to_csv('result.csv', index=False)
print(pd.read_csv('result.csv').shape)
`,
    hint: '<code>pd.get_dummies</code> 로 범주형을 숫자로 바꾸고, <code>predict_proba(X_test)[:, 1]</code> 로 확률을 구하세요.',
    explain: `<p><b>작업형2 기본 흐름</b></p>
<ol><li><b>확인</b>: <code>info()</code>, <code>isnull().sum()</code>, <code>describe()</code> 로 결측치와 자료형 파악 (age, region 에 결측 있음)</li>
<li><b>분리</b>: 타깃 <code>y = train.pop('churn')</code>, 식별자 <code>cust_id</code> 는 학습에서 제외</li>
<li><b>결측치</b>: 수치형은 중앙값/평균, 범주형은 최빈값 또는 'missing' 같은 새 범주로 대체. <b>대체 값은 train 기준</b>으로 test 에도 동일하게 적용</li>
<li><b>인코딩</b>: <code>pd.get_dummies</code> — train/test 를 합쳐서 하면 컬럼 불일치 오류를 막을 수 있음</li>
<li><b>검증</b>: <code>train_test_split</code> 으로 검증셋을 떼어 지표 확인</li>
<li><b>제출</b>: AUC 는 <b>확률</b>로 평가하므로 <code>predict()</code>(0/1) 가 아니라 <code>predict_proba()[:, 1]</code></li></ol>
<p>⚠️ 자주 하는 실수: <code>to_csv</code> 에서 <code>index=False</code> 누락 → 불필요한 컬럼 생김 / test 의 행 순서를 섞음 / 컬럼명을 <code>pred</code> 가 아닌 다른 이름으로 저장</p>`,
  },
  {
    id: 't2-car-rmse', type: 2, level: '중', title: '중고차 가격 예측 (회귀, RMSE)',
    files: ['data/car_train.csv', 'data/car_test.csv'],
    desc: `<p>중고차 정보로 <b>가격(price, 단위: 만원)</b>을 예측하세요.</p>
<ul><li>학습: <code>data/car_train.csv</code> (700행, 타깃 <code>price</code> 포함)</li>
<li>평가: <code>data/car_test.csv</code> (300행)</li></ul>
<p><b>제출 형식</b>: 테스트 데이터 순서대로 예측 가격을 <code>pred</code> 컬럼에 담아 <code>result.csv</code> 로 저장 (index 없이, 300행)</p>
<p>평가지표: <b>RMSE ≤ 300</b> 이면 통과</p>`,
    model: { key: 'car', target: 'price', col: 'pred', metric: 'rmse', threshold: 300 },
    starter: py`import pandas as pd

train = pd.read_csv('data/car_train.csv')
test = pd.read_csv('data/car_test.csv')

`,
    solution: py`import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

train = pd.read_csv('data/car_train.csv')
test = pd.read_csv('data/car_test.csv')

y = train.pop('price')
X = train.drop(columns=['car_id'])
X_test = test.drop(columns=['car_id'])

all_ = pd.get_dummies(pd.concat([X, X_test]))
X, X_test = all_.iloc[:len(X)], all_.iloc[len(X):]

X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, random_state=0)
model = RandomForestRegressor(n_estimators=300, random_state=0)
model.fit(X_tr, y_tr)
rmse = np.sqrt(mean_squared_error(y_val, model.predict(X_val)))
print('검증 RMSE:', round(rmse, 2))

model.fit(X, y)
pd.DataFrame({'pred': model.predict(X_test)}).to_csv('result.csv', index=False)
print(pd.read_csv('result.csv').head())
`,
    hint: '회귀 문제이므로 <code>RandomForestRegressor</code> 를 사용하고 <code>predict()</code> 값을 그대로 제출합니다.',
    explain: `<p>회귀 문제는 분류와 흐름이 같고 모델과 지표만 다릅니다.</p>
<ul><li>모델: <code>RandomForestRegressor</code>, <code>LinearRegression</code>, <code>GradientBoostingRegressor</code> 등</li>
<li>RMSE: <code>np.sqrt(mean_squared_error(y_true, y_pred))</code> — 작을수록 좋음</li>
<li>brand, fuel 같은 문자열 컬럼은 반드시 인코딩해야 fit 에서 오류가 나지 않습니다.</li></ul>
<p>💡 연식(year)과 주행거리(mileage)가 가격에 가장 큰 영향을 줍니다. <code>model.feature_importances_</code> 로 확인해 보세요.</p>`,
  },
  {
    id: 't2-member-f1', type: 2, level: '상', title: '회원 등급 예측 (다중분류, macro F1)',
    files: ['data/member_train.csv', 'data/member_test.csv'],
    desc: `<p>쇼핑몰 회원의 이용 정보로 <b>회원 등급(grade: Bronze / Silver / Gold)</b>을 예측하세요.</p>
<ul><li>학습: <code>data/member_train.csv</code> (630행)</li>
<li>평가: <code>data/member_test.csv</code> (270행)</li></ul>
<p><b>제출 형식</b>: 예측 <b>등급 문자열</b>을 <code>pred</code> 컬럼에 담아 <code>result.csv</code> 로 저장 (index 없이, 270행)</p>
<p>평가지표: <b>macro F1 ≥ 0.65</b> 이면 통과</p>`,
    model: { key: 'member', target: 'grade', col: 'pred', metric: 'f1_macro', threshold: 0.65 },
    starter: py`import pandas as pd

train = pd.read_csv('data/member_train.csv')
test = pd.read_csv('data/member_test.csv')

`,
    solution: py`import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score

train = pd.read_csv('data/member_train.csv')
test = pd.read_csv('data/member_test.csv')

y = train.pop('grade')
X = train.drop(columns=['member_id'])
X_test = test.drop(columns=['member_id'])

all_ = pd.get_dummies(pd.concat([X, X_test]))
X, X_test = all_.iloc[:len(X)], all_.iloc[len(X):]

X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, random_state=0, stratify=y)
model = RandomForestClassifier(n_estimators=300, random_state=0)
model.fit(X_tr, y_tr)
print('검증 macro F1:', round(f1_score(y_val, model.predict(X_val), average='macro'), 4))

model.fit(X, y)
pd.DataFrame({'pred': model.predict(X_test)}).to_csv('result.csv', index=False)
print(pd.read_csv('result.csv')['pred'].value_counts())
`,
    hint: '다중분류는 <code>predict()</code> 결과(클래스명)를 그대로 제출합니다. F1 은 <code>average="macro"</code>.',
    explain: `<p>다중분류에서 F1 을 구할 때는 <code>average</code> 를 지정해야 합니다.</p>
<ul><li><code>macro</code>: 클래스별 F1 의 단순 평균 (클래스 불균형에 민감)</li>
<li><code>weighted</code>: 클래스 비율로 가중 평균</li></ul>
<p>제출값은 확률이 아니라 <b>클래스 라벨</b>(Bronze/Silver/Gold)입니다. <code>stratify=y</code> 로 검증셋의 클래스 비율을 유지하면 검증 점수가 더 안정적입니다.</p>
<p>💡 total_spend, visits, months, app_user 가 등급을 결정하는 핵심 변수입니다.</p>`,
  },

  // =====================================================================
  // 작업형 3
  // =====================================================================
  {
    id: 't3-paired-ttest', type: 3, level: '중', title: '대응표본 t-검정 (혈압약 효과)',
    files: ['data/bp.csv'],
    desc: `<p>환자 30명에게 혈압약을 투여하고 투여 전(<code>before</code>), 후(<code>after</code>) 혈압을 측정했습니다. 약 투여 후 <b>혈압이 감소했는지</b> 검정하려 합니다. (차이 = after − before, 정규성 가정)</p>
<ul><li>H0: μ<sub>d</sub> ≥ 0 (감소하지 않았다), H1: μ<sub>d</sub> &lt; 0 (감소했다)</li></ul>
<p>(1) 차이(after − before)의 표본평균 (소수 셋째 자리에서 반올림)<br>
(2) 검정통계량 (소수 넷째 자리에서 반올림)<br>
(3) p-value (소수 다섯째 자리에서 반올림)<br>
(4) 유의수준 0.05 에서 귀무가설 채택/기각</p>`,
    parts: [{ label: '(1) 차이 평균', kind: 'num', tol: 0.006 }, { label: '(2) 검정통계량', kind: 'num', tol: 0.0011 },
            { label: '(3) p-value', kind: 'num', tol: 0.00011 }, { label: '(4) 결론', kind: 'choice', options: ['채택', '기각'] }],
    starter: py`import pandas as pd
from scipy import stats

df = pd.read_csv('data/bp.csv')
`,
    solution: py`import pandas as pd
from scipy import stats

df = pd.read_csv('data/bp.csv')
d = df['after'] - df['before']
print(round(d.mean(), 2))
t, p = stats.ttest_rel(df['after'], df['before'], alternative='less')
print(round(t, 3))
print(round(p, 4))
print('기각' if p < 0.05 else '채택')
`,
    hint: '<code>stats.ttest_rel(after, before, alternative="less")</code> — 인자 순서가 차이의 방향을 결정합니다.',
    explain: `<p>같은 대상을 두 번 측정했으므로 <b>대응표본 t-검정</b>(<code>ttest_rel</code>)입니다.</p>
<pre>stats.ttest_rel(a, b, alternative='less')   # H1: mean(a - b) < 0</pre>
<ul><li><code>ttest_rel(a, b)</code> 는 <b>a − b</b> 의 평균을 검정합니다. 순서를 바꾸면 통계량 부호가 바뀌고, alternative 도 'greater' 로 바꿔야 합니다.</li>
<li><code>alternative</code>: 'two-sided'(기본), 'less', 'greater'</li>
<li>p-value &lt; 0.05 → 귀무가설 <b>기각</b></li></ul>
<p>참고: 차이 d 에 대한 단일표본 검정 <code>stats.ttest_1samp(d, 0, alternative='less')</code> 와 결과가 같습니다.</p>`,
  },
  {
    id: 't3-ind-ttest', type: 3, level: '중', title: '독립표본 t-검정 (두 반 비교)',
    files: ['data/class_scores.csv'],
    desc: `<p>A반과 B반의 시험 점수(<code>score</code>) 평균에 차이가 있는지 검정하려 합니다. (정규성 가정, 양측검정)</p>
<p>(1) Levene 등분산 검정의 p-value (소수 다섯째 자리에서 반올림)<br>
(2) (1) 의 결과(유의수준 0.05)를 반영한 독립표본 t-검정 통계량 (A − B 방향, 소수 넷째 자리에서 반올림)<br>
(3) t-검정의 p-value (소수 다섯째 자리에서 반올림)<br>
(4) 유의수준 0.05 에서 귀무가설(두 반의 평균은 같다) 채택/기각</p>`,
    parts: [{ label: '(1) 등분산 p-value', kind: 'num', tol: 0.00011 }, { label: '(2) t 통계량', kind: 'num', tol: 0.0011 },
            { label: '(3) p-value', kind: 'num', tol: 0.00011 }, { label: '(4) 결론', kind: 'choice', options: ['채택', '기각'] }],
    starter: py`import pandas as pd
from scipy import stats

df = pd.read_csv('data/class_scores.csv')
`,
    solution: py`import pandas as pd
from scipy import stats

df = pd.read_csv('data/class_scores.csv')
a = df[df['class'] == 'A']['score']
b = df[df['class'] == 'B']['score']
lp = stats.levene(a, b).pvalue
print(round(lp, 4))
t, p = stats.ttest_ind(a, b, equal_var=(lp > 0.05))
print(round(t, 3))
print(round(p, 4))
print('기각' if p < 0.05 else '채택')
`,
    hint: 'Levene p &gt; 0.05 → 등분산 → <code>ttest_ind(a, b, equal_var=True)</code>, 아니면 <code>equal_var=False</code>(Welch).',
    explain: `<p>서로 다른 두 집단 비교 → <b>독립표본 t-검정</b>. 먼저 등분산성을 확인합니다.</p>
<ol><li><code>stats.levene(a, b)</code> : H0 = 두 집단 분산이 같다. p &gt; 0.05 이면 등분산 가정</li>
<li><code>stats.ttest_ind(a, b, equal_var=True/False)</code> — False 이면 Welch's t-test</li></ol>
<p>⚠️ <code>ttest_ind</code> 의 기본값은 <code>equal_var=True</code> 입니다. 이분산인데 기본값으로 돌리면 통계량이 달라집니다.</p>
<p>정규성 검정이 필요하면 <code>stats.shapiro(a)</code>, 정규성을 만족하지 않으면 비모수 검정 <code>stats.mannwhitneyu(a, b)</code> 를 사용합니다.</p>`,
  },
  {
    id: 't3-anova', type: 3, level: '중', title: '일원분산분석 (비료 효과)',
    files: ['data/fertilizer.csv'],
    desc: `<p>세 종류의 비료(<code>fertilizer</code>: A, B, C)에 따라 수확량(<code>yield</code>) 평균에 차이가 있는지 일원분산분석으로 검정하세요. (정규성·등분산 가정)</p>
<p>(1) F 통계량 (소수 넷째 자리에서 반올림)<br>
(2) p-value (소수 다섯째 자리에서 반올림)<br>
(3) 유의수준 0.05 에서 귀무가설(모든 그룹 평균이 같다) 채택/기각</p>`,
    parts: [{ label: '(1) F 통계량', kind: 'num', tol: 0.0011 }, { label: '(2) p-value', kind: 'num', tol: 0.00011 },
            { label: '(3) 결론', kind: 'choice', options: ['채택', '기각'] }],
    starter: py`import pandas as pd
from scipy import stats

df = pd.read_csv('data/fertilizer.csv')
`,
    solution: py`import pandas as pd
from scipy import stats

df = pd.read_csv('data/fertilizer.csv')
groups = [g['yield'] for _, g in df.groupby('fertilizer')]
f, p = stats.f_oneway(*groups)
print(round(f, 3))
print(round(p, 4))
print('기각' if p < 0.05 else '채택')
`,
    hint: '그룹별로 나눈 뒤 <code>stats.f_oneway(a, b, c)</code>',
    explain: `<p>3개 이상 집단의 평균 비교 → <b>분산분석(ANOVA)</b>.</p>
<pre>a = df[df['fertilizer']=='A']['yield']   # B, C 도 동일
stats.f_oneway(a, b, c)</pre>
<p>statsmodels 로 분산분석표를 만들 수도 있습니다:</p>
<pre>from statsmodels.formula.api import ols
from statsmodels.stats.anova import anova_lm
model = ols('Q("yield") ~ C(fertilizer)', data=df).fit()
print(anova_lm(model))</pre>
<p>(yield 는 파이썬 예약어라 formula 에서는 <code>Q("yield")</code> 로 감쌉니다.) 귀무가설이 기각되면 어느 그룹이 다른지 사후검정(Tukey HSD)을 진행합니다.</p>`,
  },
  {
    id: 't3-chi2-indep', type: 3, level: '중', title: '카이제곱 독립성 검정',
    files: ['data/survey.csv'],
    desc: `<p>300명에게 선호 음료(<code>drink</code>: 커피/차/주스)를 조사했습니다. <b>성별(gender)과 선호 음료가 독립인지</b> 검정하세요.</p>
<p>(1) 카이제곱 통계량 (소수 넷째 자리에서 반올림)<br>
(2) 자유도<br>
(3) p-value (소수 다섯째 자리에서 반올림)<br>
(4) 유의수준 0.05 에서 귀무가설(두 변수는 독립이다) 채택/기각</p>`,
    parts: [{ label: '(1) 카이제곱 통계량', kind: 'num', tol: 0.0011 }, { label: '(2) 자유도', kind: 'num', tol: 0 },
            { label: '(3) p-value', kind: 'num', tol: 0.00011 }, { label: '(4) 결론', kind: 'choice', options: ['채택', '기각'] }],
    starter: py`import pandas as pd
from scipy import stats

df = pd.read_csv('data/survey.csv')
`,
    solution: py`import pandas as pd
from scipy import stats

df = pd.read_csv('data/survey.csv')
table = pd.crosstab(df['gender'], df['drink'])
chi2, p, dof, expected = stats.chi2_contingency(table)
print(round(chi2, 3))
print(dof)
print(round(p, 4))
print('기각' if p < 0.05 else '채택')
`,
    hint: '<code>pd.crosstab</code> 으로 교차표를 만든 뒤 <code>stats.chi2_contingency(table)</code>',
    explain: `<p>두 범주형 변수의 관련성 → <b>카이제곱 독립성 검정</b>.</p>
<pre>table = pd.crosstab(df['gender'], df['drink'])
chi2, p, dof, expected = stats.chi2_contingency(table)</pre>
<ul><li>자유도 = (행 수 − 1) × (열 수 − 1) = (2−1)×(3−1) = 2</li>
<li>⚠️ 2×2 표일 때는 기본으로 Yates 연속성 보정이 적용됩니다. 문제에서 보정하지 말라고 하면 <code>correction=False</code></li>
<li>원본 데이터가 아니라 <b>교차표</b>를 넣어야 합니다.</li></ul>`,
  },
  {
    id: 't3-chi2-gof', type: 3, level: '중', title: '카이제곱 적합도 검정 (멘델 법칙)',
    files: ['data/peas.csv'],
    desc: `<p>완두콩 400개의 형질(<code>type</code>: RY, RG, WY, WG)을 관찰했습니다. 이론적 비율이 <b>RY:RG:WY:WG = 9:3:3:1</b> 을 따르는지 검정하세요.</p>
<p>(1) 카이제곱 통계량 (소수 넷째 자리에서 반올림)<br>
(2) p-value (소수 다섯째 자리에서 반올림)<br>
(3) 유의수준 0.05 에서 귀무가설(관측 분포가 이론 비율을 따른다) 채택/기각</p>`,
    parts: [{ label: '(1) 카이제곱 통계량', kind: 'num', tol: 0.0011 }, { label: '(2) p-value', kind: 'num', tol: 0.00011 },
            { label: '(3) 결론', kind: 'choice', options: ['채택', '기각'] }],
    starter: py`import pandas as pd
from scipy import stats

df = pd.read_csv('data/peas.csv')
`,
    solution: py`import pandas as pd
import numpy as np
from scipy import stats

df = pd.read_csv('data/peas.csv')
order = ['RY', 'RG', 'WY', 'WG']
obs = df['type'].value_counts().reindex(order).values
ratio = np.array([9, 3, 3, 1]) / 16
exp = ratio * obs.sum()
chi2, p = stats.chisquare(obs, f_exp=exp)
print(round(chi2, 3))
print(round(p, 4))
print('기각' if p < 0.05 else '채택')
`,
    hint: '관측도수와 기대도수(비율×전체 개수)의 <b>순서</b>를 맞춰 <code>stats.chisquare(obs, f_exp=exp)</code>',
    explain: `<p>한 범주형 변수가 특정 분포를 따르는지 → <b>적합도 검정</b>.</p>
<ol><li>관측도수: <code>value_counts()</code> — 기본으로 빈도순 정렬이므로 <code>reindex(order)</code> 로 순서를 맞춥니다.</li>
<li>기대도수: 비율 × 전체 개수 (<b>합이 관측도수 합과 같아야</b> 함)</li>
<li><code>stats.chisquare(obs, f_exp=exp)</code></li></ol>
<p>⚠️ 관측과 기대의 순서가 어긋나면 엉뚱한 통계량이 나옵니다. 자유도는 범주 수 − 1 = 3 입니다.</p>`,
  },
  {
    id: 't3-onesample', type: 3, level: '하', title: '단일표본 t-검정 (과자 무게)',
    files: ['data/snack.csv'],
    desc: `<p>과자 회사는 한 봉지의 평균 무게가 <b>100g</b> 이라고 주장합니다. 25봉지를 측정한 <code>weight</code> 데이터로 주장이 맞는지 양측검정하세요.</p>
<p>(1) Shapiro-Wilk 정규성 검정 p-value (소수 다섯째 자리에서 반올림)<br>
(2) 단일표본 t-검정 통계량 (소수 넷째 자리에서 반올림)<br>
(3) p-value (소수 다섯째 자리에서 반올림)<br>
(4) 유의수준 0.05 에서 귀무가설(평균 = 100) 채택/기각</p>`,
    parts: [{ label: '(1) 정규성 p-value', kind: 'num', tol: 0.00011 }, { label: '(2) t 통계량', kind: 'num', tol: 0.0011 },
            { label: '(3) p-value', kind: 'num', tol: 0.00011 }, { label: '(4) 결론', kind: 'choice', options: ['채택', '기각'] }],
    starter: py`import pandas as pd
from scipy import stats

df = pd.read_csv('data/snack.csv')
`,
    solution: py`import pandas as pd
from scipy import stats

df = pd.read_csv('data/snack.csv')
print(round(stats.shapiro(df['weight']).pvalue, 4))
t, p = stats.ttest_1samp(df['weight'], 100)
print(round(t, 3))
print(round(p, 4))
print('기각' if p < 0.05 else '채택')
`,
    hint: '<code>stats.shapiro(x)</code>, <code>stats.ttest_1samp(x, 100)</code>',
    explain: `<ul><li>정규성 검정: <code>stats.shapiro(x)</code> — H0: 정규분포를 따른다. p &gt; 0.05 → 정규성 만족 → t-검정 사용</li>
<li>단일표본 t-검정: <code>stats.ttest_1samp(x, popmean)</code></li>
<li>정규성을 만족하지 않으면 비모수 검정 <code>stats.wilcoxon(x - 100)</code></li></ul>
<p>결과 객체는 튜플처럼 풀 수도 있고(<code>t, p = ...</code>), <code>.statistic</code>, <code>.pvalue</code> 속성으로 꺼낼 수도 있습니다.</p>`,
  },
  {
    id: 't3-logit', type: 3, level: '상', title: '로지스틱 회귀 (합격 여부)',
    files: ['data/admission.csv'],
    desc: `<p>대학원 지원자 400명의 <code>gre</code>, <code>gpa</code>, <code>rank</code> 로 합격 여부(<code>admit</code>: 1=합격)를 설명하는 로지스틱 회귀모형을 적합하세요. (statsmodels, 상수항 포함, rank 는 수치형으로 사용)</p>
<p>(1) <code>gpa</code> 의 회귀계수 (소수 넷째 자리에서 반올림)<br>
(2) <code>gpa</code> 가 1 증가할 때의 오즈비 (소수 넷째 자리에서 반올림)<br>
(3) 모형의 잔차이탈도(residual deviance, −2 × 로그우도) (소수 셋째 자리에서 반올림)</p>`,
    parts: [{ label: '(1) gpa 계수', kind: 'num', tol: 0.0011 }, { label: '(2) 오즈비', kind: 'num', tol: 0.0011 },
            { label: '(3) 잔차이탈도', kind: 'num', tol: 0.011 }],
    starter: py`import pandas as pd
import numpy as np
from statsmodels.formula.api import logit

df = pd.read_csv('data/admission.csv')
`,
    solution: py`import pandas as pd
import numpy as np
from statsmodels.formula.api import logit

df = pd.read_csv('data/admission.csv')
model = logit('admit ~ gre + gpa + rank', data=df).fit(disp=0)
coef = model.params['gpa']
print(round(coef, 3))
print(round(np.exp(coef), 3))
print(round(-2 * model.llf, 2))
`,
    hint: '<code>logit("admit ~ gre + gpa + rank", data=df).fit()</code> → <code>params</code>, <code>llf</code>',
    explain: `<p>종속변수가 0/1 인 회귀 → <b>로지스틱 회귀</b>.</p>
<pre>model = logit('admit ~ gre + gpa + rank', data=df).fit()
print(model.summary())</pre>
<ul><li>회귀계수: <code>model.params['gpa']</code> (로그 오즈의 증가량)</li>
<li>오즈비: <code>np.exp(계수)</code> — gpa 1 증가 시 합격 오즈가 몇 배가 되는지</li>
<li>잔차이탈도: <code>-2 * model.llf</code> (llf = 로그우도). GLM 으로 적합하면 <code>model.deviance</code> 로도 구할 수 있습니다.</li>
<li>p-value: <code>model.pvalues</code></li></ul>
<p>⚠️ <code>sm.Logit(y, X)</code> 를 쓸 때는 <code>sm.add_constant(X)</code> 로 상수항을 직접 추가해야 합니다. formula API 는 자동으로 포함됩니다. rank 를 범주형으로 쓰라고 하면 <code>C(rank)</code>.</p>`,
  },
  {
    id: 't3-ols', type: 3, level: '중', title: '다중 선형 회귀 (집값)',
    files: ['data/house.csv'],
    desc: `<p><code>house.csv</code> 로 <code>price ~ area + rooms + age + distance</code> 다중 선형 회귀모형을 적합하세요. (statsmodels ols, 상수항 포함)</p>
<p>(1) 결정계수 R² (소수 넷째 자리에서 반올림)<br>
(2) <code>area</code> 의 회귀계수 (소수 넷째 자리에서 반올림)<br>
(3) area=85, rooms=3, age=10, distance=2.5 인 집의 예측 가격 (소수 셋째 자리에서 반올림)</p>`,
    parts: [{ label: '(1) R²', kind: 'num', tol: 0.0011 }, { label: '(2) area 계수', kind: 'num', tol: 0.0011 },
            { label: '(3) 예측 가격', kind: 'num', tol: 0.011 }],
    starter: py`import pandas as pd
from statsmodels.formula.api import ols

df = pd.read_csv('data/house.csv')
`,
    solution: py`import pandas as pd
from statsmodels.formula.api import ols

df = pd.read_csv('data/house.csv')
model = ols('price ~ area + rooms + age + distance', data=df).fit()
print(round(model.rsquared, 3))
print(round(model.params['area'], 3))
new = pd.DataFrame({'area': [85], 'rooms': [3], 'age': [10], 'distance': [2.5]})
print(round(model.predict(new)[0], 2))
`,
    hint: '<code>model.rsquared</code>, <code>model.params</code>, <code>model.predict(새 DataFrame)</code>',
    explain: `<pre>model = ols('price ~ area + rooms + age + distance', data=df).fit()
print(model.summary())</pre>
<ul><li>결정계수: <code>model.rsquared</code> (수정 결정계수는 <code>rsquared_adj</code>)</li>
<li>회귀계수: <code>model.params</code>, p-value: <code>model.pvalues</code>, 신뢰구간: <code>model.conf_int()</code></li>
<li>예측: 학습 때와 <b>같은 컬럼명</b>을 가진 DataFrame 을 <code>predict()</code> 에 넣습니다.</li></ul>
<p>sklearn <code>LinearRegression</code> 으로도 계수와 R²(<code>score</code>) 는 같게 나오지만, p-value 등 통계량은 statsmodels 에서만 제공됩니다.</p>`,
  },
];
