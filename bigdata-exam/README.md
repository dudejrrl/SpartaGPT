# 빅분기 실기 연습장

빅데이터분석기사 실기(작업형 1·2·3)를 브라우저에서 연습하는 정적 사이트입니다.
[Pyodide](https://pyodide.org) 로 실제 파이썬(pandas, scikit-learn, scipy, statsmodels)이 브라우저 안에서 실행됩니다.

## 실행
- `index.html` 을 브라우저로 열거나, GitHub Pages 등 정적 호스팅에 올리면 됩니다.
- 로컬 서버: `python3 -m http.server` 후 `http://localhost:8000/bigdata-exam/`
- 첫 실행 시 Pyodide와 패키지(약 30MB)를 CDN에서 내려받습니다.

## 기능
- 작업형1 12문제, 작업형2 3문제, 작업형3 8문제
- 코드 실행(Ctrl+Enter), 자동 저장 + 저장(Ctrl+S), 진도 내보내기/불러오기(JSON)
- 답안 체크: 정답은 풀이 코드를 실제로 실행해서 계산하므로 데이터와 항상 일치
- 작업형2: `result.csv` 를 숨겨진 정답과 비교해 ROC-AUC / RMSE / macro F1 로 채점
- 틀리면 해설, 정답, 풀이 코드(에디터로 불러오기) 표시

## 문제 추가
`js/problems.js` 에 객체를 추가하세요. 풀이 코드(`solution`)가 print 하는 마지막 N줄이 N개 답안 칸의 정답이 됩니다.
데이터는 `js/runtime.js` 의 `make_data()` 에서 고정 시드로 생성됩니다.
