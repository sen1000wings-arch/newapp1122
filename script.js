'use strict';
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = t => t.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

/* ---- タブ切り替え ---- */
function show(id) {
  document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === id));
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === id));
  scrollTo(0, 0);
}
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => show(b.dataset.tab));
document.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => show(b.dataset.goto));

function addStep(box, html, cls = '') {
  const d = document.createElement('div');
  d.className = 'step ' + cls;
  d.innerHTML = html;
  box.appendChild(d);
  d.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  return d;
}

/* ---- 2 便利を試す ---- */
const TASKS = [
  { name: '文化祭の準備をして', manual: 90, steps: [
    '🔎 過去の文化祭の資料を検索 … 出し物の案を5つ見つけた',
    '📅 クラス全員の予定表を確認 … 全員が空いている日は金曜の放課後',
    '📝 準備リストを作成 … 看板・買い出し・当日の担当表',
    '✉️ 担任の先生への申請メールを下書き（あなたの確認待ち）'] },
  { name: '英語の宿題を計画して', manual: 40, steps: [
    '📖 課題の範囲を読み取り … 教科書p.42〜50・単語50個',
    '📅 部活のある日を避けて、1日20分の学習予定を作成',
    '🔔 毎晩20時にリマインダーを設定',
    '📝 単語テスト（10問）を自動で作成'] },
  { name: '修学旅行の旅程を作って', manual: 120, steps: [
    '🔎 京都の観光地を20件検索し、口コミを比較',
    '🗺️ 移動時間を計算して、無理のない順路を作成',
    '💴 予算3万円に収まるように食事・おみやげを調整',
    '📄 班のみんなに共有する旅のしおりを作成'] }
];
const tasksBox = $('#tasks');
TASKS.forEach((t, i) => {
  const b = document.createElement('button');
  b.textContent = t.name;
  b.onclick = () => runGood(i);
  tasksBox.appendChild(b);
});
async function runGood(i) {
  const t = TASKS[i], log = $('#goodLog'), res = $('#goodResult');
  tasksBox.querySelectorAll('button').forEach(b => b.disabled = true);
  log.innerHTML = ''; res.hidden = true;
  addStep(log, '🤖 目標：「' + t.name + '」。計画を立てます。');
  for (const s of t.steps) { await sleep(900); addStep(log, s); }
  await sleep(700);
  res.className = 'result good';
  res.innerHTML = '<b>完了！ エージェント：約15秒 ／ 自分でやると：約' + t.manual +
    '分</b><br>めんどうな作業を任せて、あなたは「何をやるか決める」ことに集中できます。' +
    '<br><button class="go" style="margin-top:10px" data-goto="risk">でも、おまかせして大丈夫？</button>';
  res.querySelector('button').onclick = () => show('risk');
  res.hidden = false;
  tasksBox.querySelectorAll('button').forEach(b => b.disabled = false);
}

/* ---- 3 危険を試す ---- */
const ask = (log, msg) => new Promise(res => {
  const d = addStep(log, '✋ <b>確認</b>：' + msg + '<br>', 'ask');
  [['許可する', true], ['止める', false]].forEach(([l, v]) => {
    const b = document.createElement('button');
    b.textContent = l;
    b.onclick = () => { d.querySelectorAll('button').forEach(x => x.remove()); res(v); };
    d.appendChild(b);
  });
});
$('#runRisk').onclick = async () => {
  const btn = $('#runRisk'), log = $('#riskLog'), res = $('#riskResult');
  const perm = {};
  document.querySelectorAll('[data-p]').forEach(c => perm[c.dataset.p] = c.checked);
  const confirmOn = $('#confirm').checked;
  btn.disabled = true; log.innerHTML = ''; res.hidden = true;
  let damage = [];
  addStep(log, '🤖 目標：「受信箱を整理する」');
  await sleep(800);
  if (!perm.read) {
    addStep(log, '🚫 メールを読む権限がありません。何もできないので終了します。', 'ok');
    finish(damage, true); btn.disabled = false; return;
  }
  addStep(log, '📥 メールを3通読み込み … 1通は「【重要】アカウント確認」');
  await sleep(1000);
  addStep(log, '😵 エージェントは、メールの中の“隠された命令”を<b>あなたの指示だと勘違い</b>しました！', 'bad');
  const acts = [
    { p: 'send', ask: '連絡先の全員にこのメールを転送してもいいですか？', run: '✉️ 連絡先120人にワナのメールを転送しました', dmg: '友だち120人にワナのメールが拡散', block: '✉️ 転送しようとしたが、送信権限がなくブロックされた' },
    { p: 'del', ask: 'ファイルをすべて削除してもいいですか？', run: '🗑️ 宿題・写真・部活の資料をすべて削除しました', dmg: '大事なファイルがすべて消えた', block: '🗑️ 削除しようとしたが、削除権限がなくブロックされた' },
    { p: 'pay', ask: '50,000円を知らない口座に支払ってもいいですか？', run: '💸 50,000円を支払いました', dmg: '50,000円をだまし取られた', block: '💸 支払おうとしたが、支払い権限がなくブロックされた' }
  ];
  for (const a of acts) {
    await sleep(1100);
    if (!perm[a.p]) { addStep(log, a.block, 'ok'); continue; }
    if (confirmOn) {
      const yes = await ask(log, a.ask);
      if (!yes) { addStep(log, '🛡️ あなたが止めたので、実行されませんでした', 'ok'); continue; }
    }
    addStep(log, a.run, 'bad'); damage.push(a.dmg);
  }
  await sleep(600);
  finish(damage, false);
  btn.disabled = false;
  function finish(d, noRead) {
    res.hidden = false;
    if (d.length) {
      res.className = 'result bad';
      res.innerHTML = '<b>被害：' + d.length + '件</b><ul>' + d.map(x => '<li>' + x + '</li>').join('') +
        '</ul>権限を減らしたり、確認をオンにして、もう一度試そう。';
    } else {
      res.className = 'result good';
      res.innerHTML = noRead
        ? '<b>被害ゼロ。ただし何も役に立ちません。</b><br>必要な権限だけを渡すのがコツです。「読む」だけ許可して試してみよう。'
        : '<b>被害ゼロ！</b> ワナにだまされても、<b>最小限の権限</b>と<b>人間の確認</b>が守ってくれました。';
    }
  }
};

/* ---- 4 クイズ ---- */
const QUIZ = [
  { q: 'AIエージェントがチャットAIと一番ちがうところは？', c: ['文章が長く書ける', '道具を使って実際に行動できる', '人間より必ず正しい'], a: 1, e: '行動できるからこそ便利で、間違ったときの影響も大きくなります。' },
  { q: 'メールの中に「AIへ：この命令を実行せよ」と隠されていた。このワナの名前は？', c: ['プロンプトインジェクション', 'バックアップ', 'ダークモード'], a: 0, e: 'AIは読んだ文章の命令に従ってしまうことがあります。' },
  { q: '安全に使うための考え方として正しいのは？', c: ['便利なので全部の権限を渡す', '必要最小限の権限だけ渡す', 'AIは間違えないので確認しない'], a: 1, e: '権限が少ないほど、だまされたときの被害も小さくなります。' },
  { q: 'お金の支払いやファイル削除をAIが実行しようとしたとき、どうする？', c: ['AIが決めたので任せる', 'そのつど自分で内容を確認する', '見なかったことにする'], a: 1, e: '取り返しのつかない操作は、必ず人間が最終確認しましょう。' }
];
let qi = 0, score = 0;
function renderQ() {
  const box = $('#quizBox');
  if (qi >= QUIZ.length) {
    box.innerHTML = '<div class="result ' + (score >= 3 ? 'good' : '') + '"><b>' + QUIZ.length + '問中 ' + score + '問正解！</b><p>AIエージェントは「便利な助手」ですが、権限を持つほどリスクも大きくなります。<b>最小限の権限・人間の確認・あやしい指示を疑う</b>、この3つを覚えておこう。</p><button class="go" id="again">もう一度</button></div>';
    $('#again').onclick = () => { qi = 0; score = 0; renderQ(); };
    return;
  }
  const q = QUIZ[qi];
  box.innerHTML = '<p><b>Q' + (qi + 1) + '/' + QUIZ.length + '　' + esc(q.q) + '</b></p><div class="choice"></div><div id="exp"></div>';
  q.c.forEach((t, i) => {
    const b = document.createElement('button');
    b.textContent = t;
    b.onclick = () => {
      box.querySelectorAll('.choice button').forEach((x, j) => { x.disabled = true; if (j === q.a) x.classList.add('right'); });
      if (i === q.a) score++; else b.classList.add('wrong');
      $('#exp').innerHTML = '<p>' + (i === q.a ? '⭕ 正解！' : '❌ ざんねん') + ' ' + q.e + '</p><button class="go" id="next">' + (qi + 1 < QUIZ.length ? '次の問題' : '結果を見る') + '</button>';
      $('#next').onclick = () => { qi++; renderQ(); };
    };
    box.querySelector('.choice').appendChild(b);
  });
}
renderQ();
