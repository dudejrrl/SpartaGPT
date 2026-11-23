(() => {
  'use strict';

  const PROBLEMS = window.PROBLEMS;
  const BY_ID = Object.fromEntries(PROBLEMS.map(p => [p.id, p]));
  const TYPE_NAME = { 1: '작업형 1', 2: '작업형 2', 3: '작업형 3' };
  const TYPE_DESC = {
    1: '데이터 전처리 · 집계 — 답을 print() 로 출력',
    2: '머신러닝 모델링 — result.csv 제출',
    3: '통계 검정 · 회귀분석 — 통계량/p-value',
  };
  const LS_KEY = 'bda-practice-v1';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ------------------------------------------------------------------
  // 저장소 (localStorage)
  // ------------------------------------------------------------------
  function loadStore() {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY));
      if (s && s.problems) return s;
    } catch (e) { /* 사용 불가 → 메모리만 */ }
    return { problems: {} };
  }
  let store = loadStore();
  let storageOk = true;
  function persist() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(store)); storageOk = true; }
    catch (e) { storageOk = false; }
  }
  const rec = id => (store.problems[id] ||= { code: null, answers: [], status: null, attempts: 0, solvedEver: false });

  // ------------------------------------------------------------------
  // Pyodide
  // ------------------------------------------------------------------
  let pyodide = null;
  const expectedCache = {};
  function setPyStatus(kind, text) {
    const el = $('#pyStatus');
    el.className = 'py-status ' + kind;
    $('#pyStatusText').textContent = text;
    el.title = text;
  }
  const pyReady = (async () => {
    if (typeof loadPyodide !== 'function') {
      setPyStatus('error', 'Pyodide 로드 실패 (인터넷 연결 확인)');
      throw new Error('pyodide script not loaded');
    }
    setPyStatus('loading', '파이썬 엔진 로딩 중…');
    pyodide = await loadPyodide();
    setPyStatus('loading', 'pandas · scikit-learn · scipy 설치 중…');
    await pyodide.loadPackage(['numpy', 'pandas', 'scikit-learn', 'scipy']);
    pyodide.runPython(window.PY_RUNTIME);
    setPyStatus('ready', '파이썬 준비 완료');
  })();
  pyReady.catch(e => { console.error(e); setPyStatus('error', '파이썬 로드 실패: ' + e.message); });

  let busy = false;
  async function runPy(code) {
    await pyReady;
    try { await pyodide.loadPackagesFromImports(code); } catch (e) { /* 없는 모듈은 실행 시 에러로 표시 */ }
    const fn = pyodide.globals.get('run_code');
    try { return JSON.parse(fn(code)); } finally { fn.destroy(); }
  }
  async function checkModelPy(cfg) {
    const fn = pyodide.globals.get('check_model');
    try { return JSON.parse(fn(JSON.stringify(cfg))); } finally { fn.destroy(); }
  }
  const nextFrame = () => new Promise(r => setTimeout(r, 30));

  async function getExpected(p) {
    if (expectedCache[p.id]) return expectedCache[p.id];
    const r = await runPy(p.solution);
    if (!r.ok) throw new Error('정답 코드 실행 오류\n' + r.out);
    const lines = r.out.split('\n').map(s => s.trim()).filter(Boolean);
    const exp = lines.slice(-p.parts.length);
    expectedCache[p.id] = exp;
    return exp;
  }

  // ------------------------------------------------------------------
  // 채점
  // ------------------------------------------------------------------
  const normStr = s => String(s ?? '').trim().replace(/^['"]|['"]$/g, '').trim().toLowerCase();
  function comparePart(part, user, exp) {
    if (user == null || String(user).trim() === '') return false;
    if (part.kind === 'num') {
      const u = parseFloat(String(user).replace(/,/g, '').trim());
      const e = parseFloat(exp);
      if (Number.isNaN(u) || Number.isNaN(e)) return false;
      return Math.abs(u - e) <= (part.tol ?? 1e-6) + 1e-9;
    }
    return normStr(user) === normStr(exp);
  }

  // ------------------------------------------------------------------
  // 에디터 (CodeMirror, 없으면 textarea)
  // ------------------------------------------------------------------
  function makeEditor(host, value, onChange) {
    if (window.CodeMirror) {
      const cm = CodeMirror(host, {
        value, mode: 'python', lineNumbers: true, indentUnit: 4, tabSize: 4,
        matchBrackets: true, lineWrapping: false,
        extraKeys: {
          Tab: c => c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection('    ', 'end'),
          'Shift-Tab': c => c.indentSelection('subtract'),
          'Ctrl-/': 'toggleComment', 'Cmd-/': 'toggleComment',
        },
      });
      cm.on('change', onChange);
      return { get: () => cm.getValue(), set: v => cm.setValue(v), focus: () => cm.focus(), refresh: () => cm.refresh() };
    }
    const ta = document.createElement('textarea');
    ta.className = 'fallback-editor';
    ta.spellcheck = false;
    ta.value = value;
    ta.addEventListener('input', onChange);
    ta.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.setRangeText('    ', s, ta.selectionEnd, 'end');
        onChange();
      }
    });
    host.appendChild(ta);
    return { get: () => ta.value, set: v => { ta.value = v; }, focus: () => ta.focus(), refresh: () => {} };
  }

  // ------------------------------------------------------------------
  // 사이드바 / 진행률
  // ------------------------------------------------------------------
  function statusIcon(id) {
    const r = store.problems[id];
    if (!r) return ['', '○'];
    if (r.status === 'solved') return ['solved', '✓'];
    if (r.status === 'wrong') return ['wrong', '✗'];
    if (r.code != null) return ['', '•'];
    return ['', '○'];
  }
  function renderSidebar(activeId) {
    let html = '';
    for (const t of [1, 2, 3]) {
      const list = PROBLEMS.filter(p => p.type === t);
      const solved = list.filter(p => store.problems[p.id]?.status === 'solved').length;
      html += `<div class="group-title"><span>${TYPE_NAME[t]}</span><span class="cnt">${solved}/${list.length}</span></div>`;
      for (const p of list) {
        const [cls, icon] = statusIcon(p.id);
        html += `<a class="p-item${p.id === activeId ? ' active' : ''}" href="#/exam/${p.id}">
          <span class="st ${cls}">${icon}</span><span class="ttl">${esc(p.title)}</span></a>`;
      }
    }
    $('#problemList').innerHTML = html;
    const solved = PROBLEMS.filter(p => store.problems[p.id]?.status === 'solved').length;
    $('#progressText').textContent = `${solved} / ${PROBLEMS.length}`;
    $('#progressBar').style.width = (solved / PROBLEMS.length * 100) + '%';
  }

  // ------------------------------------------------------------------
  // 홈
  // ------------------------------------------------------------------
  function renderHome() {
    current = null;
    renderSidebar(null);
    const cards = [1, 2, 3].map(t => {
      const list = PROBLEMS.filter(p => p.type === t);
      const solved = list.filter(p => store.problems[p.id]?.status === 'solved').length;
      const next = list.find(p => store.problems[p.id]?.status !== 'solved') || list[0];
      return `<div class="type-card t${t}"><h2>${TYPE_NAME[t]}</h2><p>${TYPE_DESC[t]}</p>
        <div class="stat">${list.length}문제 · 해결 ${solved}</div>
        <a class="btn primary small" href="#/exam/${next.id}">${solved ? '이어서 풀기' : '시작하기'} →</a></div>`;
    }).join('');
    $('#main').innerHTML = `
      <section class="hero"><h1>빅데이터분석기사 실기 연습장</h1>
      <p>브라우저에서 실제 파이썬(pandas · scikit-learn · scipy · statsmodels)이 동작합니다. 설치 없이 바로 풀어보세요.</p></section>
      <div class="type-grid">${cards}</div>
      <div class="card howto"><h3 style="margin-top:0">사용 방법</h3><ol>
        <li>왼쪽 목록에서 문제를 고르고, 에디터에 코드를 작성한 뒤 <b>▶ 실행</b> (<kbd>Ctrl</kbd>+<kbd>Enter</kbd>).</li>
        <li><b>작업형 1·3</b>: 답을 <code>print()</code> 로 출력한 뒤 답안 칸에 입력하고 <b>답안 체크</b>. <b>출력에서 가져오기</b>를 누르면 마지막 출력 줄이 자동으로 채워집니다.</li>
        <li><b>작업형 2</b>: <code>result.csv</code> 를 저장하는 코드를 작성하고 <b>제출 및 채점</b>. 숨겨진 정답과 비교해 점수를 계산합니다.</li>
        <li>코드는 입력하는 동안 자동 저장되며 <b>💾 저장</b> (<kbd>Ctrl</kbd>+<kbd>S</kbd>)으로 직접 저장할 수도 있습니다. 틀리면 해설과 정답 코드를 볼 수 있습니다.</li>
        <li>진도는 이 브라우저에 저장됩니다. 다른 기기로 옮기려면 왼쪽 아래 <b>진도 내보내기 / 불러오기</b>를 사용하세요.</li>
      </ol><p class="note">처음 실행 시 파이썬 엔진과 패키지(약 30MB)를 내려받느라 10~30초 정도 걸릴 수 있습니다. 실제 시험 환경처럼 자동완성은 없으니 <code>dir()</code>, <code>help()</code> 사용에 익숙해지세요.</p></div>`;
  }

  // ------------------------------------------------------------------
  // 문제 화면
  // ------------------------------------------------------------------
  let current = null; // { p, editor }
  let saveTimer = null;

  function renderProblem(p) {
    const r = rec(p.id);
    const idx = PROBLEMS.indexOf(p);
    const prev = PROBLEMS[idx - 1], next = PROBLEMS[idx + 1];
    const stBadge = r.status === 'solved' ? '<span class="badge solved">해결</span>'
      : r.status === 'wrong' ? '<span class="badge wrong">오답</span>' : '';

    let answerHtml;
    if (p.model) {
      answerHtml = `<div class="card answer-card"><h3>제출</h3>
        <p class="note" style="margin-top:0">작성한 코드를 처음부터 다시 실행해 <code>result.csv</code> 를 만들고, 숨겨진 정답과 비교해 채점합니다.</p>
        <div class="answer-actions"><button class="btn success" id="checkBtn">✔ 제출 및 채점</button></div></div>`;
    } else {
      const parts = p.parts.map((pt, i) => {
        const v = r.answers[i] ?? '';
        const input = pt.kind === 'choice'
          ? `<select data-i="${i}"><option value="">선택</option>${pt.options.map(o => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`
          : `<input data-i="${i}" type="text" inputmode="${pt.kind === 'num' ? 'decimal' : 'text'}" autocomplete="off" value="${esc(v)}" placeholder="${pt.kind === 'num' ? '숫자' : '문자'}">`;
        return `<div class="part" id="part${i}"><label>${esc(pt.label)}</label><div class="row">${input}<span class="mark"></span></div></div>`;
      }).join('');
      answerHtml = `<div class="card answer-card"><h3>답안</h3><div class="parts">${parts}</div>
        <div class="answer-actions">
          <button class="btn success" id="checkBtn">✔ 답안 체크</button>
          <button class="btn" id="fillBtn" title="실행 결과의 마지막 출력 줄을 답안 칸에 채웁니다">⤓ 출력에서 가져오기</button>
        </div></div>`;
    }

    $('#main').innerHTML = `
      <div class="p-head"><span class="badge t${p.type}">${TYPE_NAME[p.type]}</span><span class="badge lv">난이도 ${p.level}</span>${stBadge}</div>
      <h1 class="p-title">${esc(p.title)}</h1>
      <div class="card desc">${p.desc}
        <div class="files"><span>데이터:</span>${p.files.map(f => `<span class="chip">${f}</span>`).join('')}
          <button class="btn small" id="previewBtn">데이터 미리보기</button></div>
      </div>
      <div class="card editor-card">
        <div class="toolbar">
          <button class="btn primary" id="runBtn">▶ 실행 <kbd>Ctrl+Enter</kbd></button>
          <button class="btn" id="saveBtn">💾 저장 <kbd>Ctrl+S</kbd></button>
          <button class="btn" id="hintBtn">💡 힌트</button>
          <button class="btn ghost" id="resetBtn">↺ 초기화</button>
          <span class="spacer"></span><span class="saved-at" id="savedAt"></span>
        </div>
        <div id="editorHost"></div>
        <div id="hintArea"></div>
        <div class="console-wrap">
          <div class="console-head"><span>실행 결과</span><button class="btn small ghost" id="clearBtn">지우기</button></div>
          <pre class="console" id="console"><span class="muted">▶ 실행을 누르면 결과가 여기에 표시됩니다.</span></pre>
        </div>
      </div>
      ${answerHtml}
      <div id="resultArea"></div>
      <div id="explainArea"></div>
      <div class="pager">
        ${prev ? `<a class="btn" href="#/exam/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a class="btn" href="#/exam/${next.id}">${esc(next.title)} →</a>` : '<span></span>'}
      </div>`;

    const editor = makeEditor($('#editorHost'), r.code ?? p.starter, () => scheduleSave());
    current = { p, editor, lastOut: '' };
    renderSavedAt();
    renderSidebar(p.id);

    $('#runBtn').onclick = () => runCurrent();
    $('#saveBtn').onclick = () => saveNow(true);
    $('#resetBtn').onclick = () => {
      if (!confirm('코드를 처음 상태로 되돌릴까요? (저장된 코드가 사라집니다)')) return;
      editor.set(p.starter); saveNow(false); toast('초기 코드로 되돌렸습니다');
    };
    $('#hintBtn').onclick = () => {
      const h = $('#hintArea');
      h.innerHTML = h.innerHTML ? '' : `<div class="hint-box" style="margin:0 12px 12px">💡 ${p.hint}</div>`;
    };
    $('#clearBtn').onclick = () => { $('#console').className = 'console'; $('#console').textContent = ''; };
    $('#previewBtn').onclick = () => previewData(p);
    $('#checkBtn').onclick = () => (p.model ? checkModel(p) : checkValue(p));
    if (!p.model) {
      $('#fillBtn').onclick = () => fillFromOutput(p);
      $('.answer-card').addEventListener('input', e => {
        const i = e.target.dataset.i;
        if (i == null) return;
        r.answers[+i] = e.target.value;
        e.target.closest('.part').classList.remove('ok', 'bad');
        e.target.closest('.part').querySelector('.mark').textContent = '';
        persist();
      });
      $('.answer-card').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') checkValue(p); });
    }
    if (r.status === 'wrong') renderExplain(p, false);
    window.scrollTo(0, 0);
  }

  function renderSavedAt() {
    const r = current && store.problems[current.p.id];
    const el = $('#savedAt');
    if (!el) return;
    if (!storageOk) { el.textContent = '⚠ 브라우저 저장소를 사용할 수 없어 저장되지 않습니다'; return; }
    el.textContent = r?.savedAt ? '저장됨 ' + new Date(r.savedAt).toLocaleTimeString('ko-KR') : '';
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveNow(false), 700);
  }
  function saveNow(showToast) {
    clearTimeout(saveTimer);
    if (!current) return;
    const r = rec(current.p.id);
    r.code = current.editor.get();
    r.savedAt = Date.now();
    persist();
    renderSavedAt();
    if (showToast) toast(storageOk ? '저장했습니다' : '저장 실패: 브라우저 저장소를 사용할 수 없습니다');
    renderSidebarStatusOnly();
  }
  function renderSidebarStatusOnly() {
    if (current) renderSidebar(current.p.id);
  }

  function setConsole(out, ok) {
    const c = $('#console');
    if (!c) return;
    c.className = 'console' + (ok ? '' : ' err');
    if (out.trim() === '') c.innerHTML = '<span class="muted">(출력 없음 — print() 로 결과를 출력하세요)</span>';
    else c.textContent = out;
  }
  function setBusy(b, label) {
    busy = b;
    for (const id of ['runBtn', 'checkBtn', 'previewBtn']) { const el = $('#' + id); if (el) el.disabled = b; }
    if (b) { const c = $('#console'); if (c) { c.className = 'console'; c.innerHTML = `<span class="muted">${label}</span>`; } }
  }

  async function runCurrent() {
    if (!current || busy) return;
    const { p, editor } = current;
    saveNow(false);
    setBusy(true, pyodide ? '실행 중…' : '파이썬 엔진을 준비하는 중입니다… (첫 실행은 시간이 걸립니다)');
    await nextFrame();
    try {
      const t0 = performance.now();
      const r = await runPy(editor.get());
      if (current?.p !== p) return;
      current.lastOut = r.out;
      setConsole(r.out + `\n` + `[${r.ok ? '완료' : '오류'}] ${((performance.now() - t0) / 1000).toFixed(2)}초`, r.ok);
      return r;
    } catch (e) {
      setConsole('파이썬 실행 환경 오류: ' + e.message, false);
    } finally { setBusy(false); }
  }

  async function previewData(p) {
    if (busy) return;
    setBusy(true, '데이터를 불러오는 중…');
    await nextFrame();
    const code = 'import pandas as pd\n' + p.files.map(f =>
      `_d = pd.read_csv('${f}')\nprint('==== ${f}  shape =', _d.shape)\nprint(_d.head())\nprint()\nprint(_d.dtypes.to_frame('dtype').T.to_string())\nprint('\\n결측치:', dict(_d.isnull().sum()[lambda s: s > 0]) or '없음')\nprint()`).join('\n');
    try { const r = await runPy(code); setConsole(r.out, r.ok); }
    catch (e) { setConsole('파이썬 실행 환경 오류: ' + e.message, false); }
    finally { setBusy(false); }
  }

  function fillFromOutput(p) {
    const out = current?.lastOut || '';
    const lines = out.split('\n').map(s => s.trim()).filter(Boolean);
    if (!lines.length) { toast('먼저 ▶ 실행을 눌러 답을 출력하세요'); return; }
    const take = lines.slice(-p.parts.length);
    const offset = p.parts.length - take.length;
    const r = rec(p.id);
    take.forEach((v, k) => {
      const i = k + offset;
      const el = $(`[data-i="${i}"]`);
      if (!el) return;
      el.value = v;
      if (el.tagName === 'SELECT' && el.value !== v) el.value = p.parts[i].options.find(o => normStr(o) === normStr(v)) || '';
      r.answers[i] = el.value;
      el.closest('.part').classList.remove('ok', 'bad');
      el.closest('.part').querySelector('.mark').textContent = '';
    });
    persist();
    toast(`마지막 ${take.length}줄을 답안 칸에 채웠습니다`);
  }

  function markResult(p, ok) {
    const r = rec(p.id);
    r.attempts = (r.attempts || 0) + 1;
    r.status = ok ? 'solved' : 'wrong';
    if (ok) { r.solvedEver = true; r.solvedAt = Date.now(); }
    persist();
    renderSidebar(p.id);
    const head = $('.p-head');
    head.querySelectorAll('.badge.solved, .badge.wrong').forEach(b => b.remove());
    head.insertAdjacentHTML('beforeend', ok ? '<span class="badge solved">해결</span>' : '<span class="badge wrong">오답</span>');
  }

  async function checkValue(p) {
    if (busy) return;
    const r = rec(p.id);
    const inputs = p.parts.map((_, i) => $(`[data-i="${i}"]`).value);
    inputs.forEach((v, i) => { r.answers[i] = v; });
    persist();
    if (inputs.every(v => String(v).trim() === '')) { toast('답안을 입력하세요'); return; }
    setBusy(true, '채점 중…');
    $('#console').className = 'console';
    await nextFrame();
    let exp;
    try { exp = await getExpected(p); }
    catch (e) { setBusy(false); setConsole(String(e.message), false); return; }
    setBusy(false);
    if (current?.lastOut) setConsole(current.lastOut, true);
    else $('#console').innerHTML = '<span class="muted">▶ 실행을 누르면 결과가 여기에 표시됩니다.</span>';

    const results = p.parts.map((pt, i) => comparePart(pt, inputs[i], exp[i]));
    results.forEach((ok, i) => {
      const el = $('#part' + i);
      el.classList.toggle('ok', ok); el.classList.toggle('bad', !ok);
      el.querySelector('.mark').textContent = ok ? '✓' : '✗';
    });
    const nOk = results.filter(Boolean).length;
    const allOk = nOk === results.length;
    markResult(p, allOk);
    if (allOk) {
      $('#resultArea').innerHTML = `<div class="result ok">🎉 정답입니다! <span class="sub">모든 답이 맞았습니다. 풀이 방법을 비교해 보세요.</span>
        <div style="margin-top:10px"><button class="btn small" id="showExplainBtn">해설 보기</button></div></div>`;
      $('#explainArea').innerHTML = '';
      $('#showExplainBtn').onclick = () => renderExplain(p, true);
    } else {
      $('#resultArea').innerHTML = `<div class="result bad">✗ 오답입니다 (${nOk}/${results.length} 정답)
        <span class="sub">틀린 칸은 빨간색으로 표시됩니다. 아래 해설을 참고해 다시 풀어보세요.</span></div>`;
      renderExplain(p, false);
    }
    $('#resultArea').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function checkModel(p) {
    if (busy) return;
    saveNow(false);
    setBusy(true, pyodide ? '코드 실행 및 채점 중…' : '파이썬 엔진을 준비하는 중입니다…');
    await nextFrame();
    try {
      const r = await runPy(current.editor.get());
      current.lastOut = r.out;
      setConsole(r.out, r.ok);
      if (!r.ok) {
        $('#resultArea').innerHTML = `<div class="result bad">✗ 코드 실행 중 오류가 발생했습니다 <span class="sub">실행 결과 창의 오류 메시지를 확인하세요.</span></div>`;
        markResult(p, false);
        renderExplain(p, false);
        return;
      }
      const c = await checkModelPy(p.model);
      markResult(p, c.ok);
      if (c.ok) {
        $('#resultArea').innerHTML = `<div class="result ok">🎉 통과! <span class="sub">${esc(c.msg)}</span>
          <div style="margin-top:10px"><button class="btn small" id="showExplainBtn">해설 보기</button></div></div>`;
        $('#explainArea').innerHTML = '';
        $('#showExplainBtn').onclick = () => renderExplain(p, true);
      } else {
        $('#resultArea').innerHTML = `<div class="result bad">✗ 통과하지 못했습니다 <span class="sub">${esc(c.msg)}</span></div>`;
        renderExplain(p, false);
      }
    } catch (e) {
      setConsole('파이썬 실행 환경 오류: ' + e.message, false);
    } finally { setBusy(false); }
    $('#resultArea').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderExplain(p, solved) {
    $('#explainArea').innerHTML = `<div class="card explain"><h3>📘 해설</h3>${p.explain}
      <div class="reveal" id="reveal">
        <button class="btn small" id="revealBtn">${p.model ? '풀이 코드 보기' : '정답 및 풀이 코드 보기'}</button>
      </div></div>`;
    $('#revealBtn').onclick = async () => {
      const box = $('#reveal');
      let table = '';
      if (!p.model) {
        box.innerHTML = '<span class="note">정답 계산 중…</span>';
        try {
          const exp = await getExpected(p);
          table = `<table class="answer-table"><tr><th>문항</th><th>정답</th></tr>${p.parts.map((pt, i) => `<tr><td>${esc(pt.label)}</td><td><code>${esc(exp[i])}</code></td></tr>`).join('')}</table>`;
        } catch (e) { table = `<p class="note">정답 계산 실패: ${esc(e.message)}</p>`; }
      }
      box.innerHTML = `${table}<b>풀이 코드</b><pre><code>${esc(p.solution)}</code></pre>
        <button class="btn small" id="loadSolBtn">풀이 코드를 에디터로 불러오기</button>
        <span class="note"> (현재 코드는 덮어쓰기 됩니다)</span>`;
      $('#loadSolBtn').onclick = () => {
        if (!confirm('에디터의 코드를 풀이 코드로 바꿀까요?')) return;
        current.editor.set(p.solution); saveNow(false); toast('풀이 코드를 불러왔습니다');
        window.scrollTo({ top: $('.editor-card').offsetTop - 70, behavior: 'smooth' });
      };
    };
    if (!solved) $('#explainArea').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ------------------------------------------------------------------
  // 기타 UI
  // ------------------------------------------------------------------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  document.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'Enter') { e.preventDefault(); runCurrent(); }
    else if (mod && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveNow(true); }
  });

  $('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
  $('#problemList').addEventListener('click', e => { if (e.target.closest('.p-item')) $('#sidebar').classList.remove('open'); });

  $('#exportBtn').onclick = () => {
    if (current) saveNow(false);
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bigdata-practice-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#importInput').onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data.problems) throw new Error('형식 오류');
      store = data; persist(); route(); toast('진도를 불러왔습니다');
    } catch (err) { alert('불러오기 실패: ' + err.message); }
    e.target.value = '';
  };
  $('#resetAllBtn').onclick = () => {
    if (!confirm('모든 코드와 풀이 기록을 삭제할까요? 되돌릴 수 없습니다.')) return;
    store = { problems: {} }; persist(); route(); toast('초기화했습니다');
  };

  function route() {
    const m = location.hash.match(/^#\/exam\/([\w-]+)/);
    if (current) saveNow(false);
    if (m && BY_ID[m[1]]) renderProblem(BY_ID[m[1]]);
    else renderHome();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', () => { if (current) saveNow(false); });
  route();
})();
