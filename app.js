/* =========================================================
   データ
   - 場所を調べる(LOCATIONS)と「キーワード」が手に入る
   - キーワードを持っていると、質問(qa)・場所・時系列などが開放される
   ========================================================= */
const VICTIM = { name: "小島 博（こじま ひろし）", age: 18, club: "野球部" };

const SCENE_BASIC = [
  "場所：21教室（空き教室）。段ボールが雑に置かれている。",
  "入り口から真正面の位置に小島の遺体が倒れている。",
  "争った形跡あり。遺体周りの机が倒れたり、本来の位置から遠くに動いている。"
];

/* 調べられる場所。req を持つ場所は、そのキーワードを得るまでロック */
const LOCATIONS = [
  {
    id: "body", icon: "🩸", name: "遺体の周辺", hint: "21教室・小島の遺体のそば",
    findings: [
      { kw: "小島のスマホ", title: "スマホ", text: "遺体の近くにスマホが置かれている。スマホケース裏の彼女とのプリクラから、被害者・小島のものだとわかった。" },
      { kw: "サバイバルナイフ", title: "凶器", text: "血がべっとり付いたサバイバルナイフ。凶器と思われる。しかし、ナイフには指紋が付いていなかった。" },
      { kw: "DM", title: "ダイイングメッセージ", text: "遺体の付近に「DM」と書かれている。" }
    ]
  },
  {
    id: "desk", icon: "🧸", name: "教卓の近く", hint: "21教室・教卓のあたり",
    findings: [
      { kw: "クマのキーホルダー", title: "小さいクマのキーホルダー", text: "教卓の近くに落ちていた。持ち主は篠田しおりのもののようだ。（本人たちにも質問できそうだ）" }
    ]
  },
  {
    id: "box", icon: "📦", name: "現場の段ボール", hint: "21教室・死体の近くに置かれた段ボール",
    findings: [
      { kw: "段ボールの切れ目", title: "段ボール", text: "死体の近くにあった段ボールには、ひっかいたような切れ目があった。" }
    ]
  },
  {
    id: "phone", icon: "📱", name: "小島のスマホを調べる", hint: "遺体の近くで見つけたスマホ",
    autoHint: "まず遺体の周辺を調べよう。",
    findings: [
      { kw: "緑朝日", auto: () => has("小島のスマホ"), title: "不審なメッセージ", text: "受信：「文化祭当日の10:15に21教室にきてください。あなたにどうしても話したいことがあります」\n送信アカウント名は「緑朝日」と書かれていた。" }
    ]
  },
  {
    id: "staff", icon: "🏫", name: "職員室", hint: "第一発見後、先生を呼びに行った場所",
    findings: [
      { kw: "10:40の通報", auto: () => true, silent: true, title: "先生の証言", text: "「吉本さんは事件の発見後に私を呼びに来ました。かなり慌てていた様子でした。時間は10:40だったかな」" }
    ]
  },
  {
    id: "staff2", icon: "🗂️", name: "職員室で名簿を確認", hint: "先生に名前を聞いてみる",
    autoHint: "「緑朝日」を容疑者全員に聞いてから、先生に聞いてみよう。",
    findings: [
      { kw: "実在しない人物", auto: () => has("緑朝日") && SUSPECTS.every(s => askedTag(s.id, "midori")), title: "先生の回答", text: "「緑朝日～？そんな名前の人はこの学校にいないなぁ～」" }
    ]
  },
  {
    id: "stage", icon: "🎭", name: "ステージ付近", hint: "体育館のステージ発表会場",
    autoHint: "石田の証言を聞いてみよう。ステージ付近で確かめられることがあるかもしれない。",
    findings: [
      { kw: "ステージ鑑賞は不完全", auto: () => state.opened.includes("ishida"), title: "近藤 漢大の証言（ステージ）", text: "「ステージ発表が始まったころは、体育館に人が集まっていました。でも、発表をずっと見ていたかどうかまでは…一人ひとり確認していませんからね」\n→「ステージを見ていた」という証言だけでは、完全なアリバイではない。" },
      { kw: "体育館のトイレ", auto: () => has("10:08の目撃"), title: "近藤 漢大の証言（トイレ）", text: "「体育館付近の男子トイレは混んでたっていろんな人が言ってたよ。女子トイレはちょっと前に故障してたらしくて今もなお使えないらしい」" }
    ]
  },
  {
    id: "baseball", icon: "⚾", name: "野球部員に聞く", hint: "小島と同じ野球部のメンバー",
    autoHint: "石田の「恨み」を聞いてみよう。野球部員から詳しい話が聞けるかもしれない。",
    findings: [
      { kw: "石田と小島の確執", auto: () => state.asked.includes("ishida:0"), title: "野球部員の証言", text: "「小島と石田は1年の頃から折り合いが悪かったよ。小島は篠田と付き合い始めてから、そのことを石田によく自慢していた。聞いていた俺もムカついていたよ。でもまさか死ぬなんてな」\n→ 小島は石田に恋愛関係で恨まれていた。" }
    ]
  },
  {
    id: "class", icon: "🎒", name: "教室でクラスメイトに聞く", hint: "小島たちのクラスの教室",
    autoHint: "容疑者への質問や、不審なメッセージの手がかりをもとに、クラスメイトに聞けることがありそうだ。",
    findings: [
      { kw: "しおりの愚痴", auto: () => state.asked.includes("shinoda:0"), title: "クラスメイトの証言", text: "クラスメイトによると、篠田しおりは小島への恨みつらみを愚痴っていたことがあるらしい。" },
      { kw: "小島のDM自慢", auto: () => has("緑朝日"), title: "ジョン・ブーマーの証言", text: "「小島はサイテーな奴でした。しおりという彼女がいるのにも関わらず、全く知らない他校の女子と連絡をしていることを自慢していました」\n→ 小島は知らない人からの突然のDMでも不思議に思わなかった可能性がある。" }
    ]
  },
  {
    id: "ishidaPhone", icon: "📲", name: "石田のスマホを見る", hint: "石田のSNSのフォロワー",
    autoHint: "「緑朝日」という名前が気になる。まず先生に聞いてみよう。",
    findings: [
      { kw: "石田のフォロワー", auto: () => has("実在しない人物"), title: "石田のフォロワー一覧", text: "佐藤拓海／山田陸／田中美咲／緑朝日／中村翔／伊藤理子／加藤悠人／鈴木健\n→ 同じ学校にいないはずの「緑朝日」をなぜフォロー？" }
    ]
  },
  {
    id: "shinodaPhone", icon: "📲", name: "篠田のスマホを見る", hint: "篠田のSNSのフォロワー",
    autoHint: "「緑朝日」という名前が気になる。まず先生に聞いてみよう。",
    findings: [
      { kw: "篠田のフォロワー", auto: () => has("実在しない人物"), title: "篠田のフォロワー一覧", text: "高橋美咲／松本大輝／井上結衣／木村蓮／林さくら／清水翔太／山口花音／森田陽斗\n→ 「緑朝日」という名前は見当たらない。" }
    ]
  },
  {
    id: "yoshimotoPhone", icon: "📲", name: "吉本のスマホを見る", hint: "吉本のSNSのフォロワー",
    autoHint: "「緑朝日」という名前が気になる。まず先生に聞いてみよう。",
    findings: [
      { kw: "吉本のフォロワー", auto: () => has("実在しない人物"), title: "吉本のフォロワー一覧", text: "斎藤かな／岡田拓也／前田七海／藤井海斗／石川莉子／村上颯太／長谷川愛／小林彩\n→ 「緑朝日」という名前は見当たらない。" }
    ]
  },
  {
    id: "deguchiPhone", icon: "📲", name: "出口のスマホを見る", hint: "出口のSNSのフォロワー",
    autoHint: "「緑朝日」という名前が気になる。まず先生に聞いてみよう。",
    findings: [
      { kw: "出口のフォロワー", auto: () => has("実在しない人物"), title: "出口のフォロワー一覧", text: "中島瑠奈／阿部大地／橋本美優／池田航／三浦ひなた／坂本悠／遠藤心愛／福田蒼\n→ 「緑朝日」という名前は見当たらない。" }
    ]
  },
  {
    id: "exhibit", icon: "🖼️", name: "展示担当に聞く", hint: "文化祭の展示を担当している人（教室の展示）",
    opener: { key: "exhibit1", label: "💬 展示担当の話を聞く" },
    autoHint: "出口の話を聞いてみよう。展示担当が何か覚えているかもしれない。",
    findings: [
      { kw: "篠田と吉本が教室へ戻る", auto: () => state.opened.includes("exhibit1"), title: "展示担当の証言（篠田・吉本）", text: "「篠田と吉本が一緒に教室の方へ戻っていっていたよ」\n→ 二人に「なぜ教室の方へ戻ったのか」を聞けそうだ。" },
      { kw: "出口は展示を見ていた", auto: () => state.opened.includes("deguchi"), title: "展示担当の証言（出口）", text: "「この人なら私たちの展示をゆっくり見てたよ！時間はわからないけど、人が少なかったタイミングだったからよく覚えてる」\n→ 出口は展示を見ていたが、時間まではわからない。" },
      { kw: "花形の時計の写真", auto: () => state.opened.includes("deguchi"), title: "展示担当の証言（時計）", text: "「その人は教室に展示してある花形の時計の写真撮ってたよ！」\n→ この情報から、出口は10:23ごろ現場の近くにいなかったことがわかる。" }
    ]
  }
];

/* 容疑者。qa の req=必要キーワード / gives=聞き出すと得られるキーワード
   note=補足メモ(noteReq を持っているときだけ表示) */
const SUSPECTS = [
  {
    id: "shinoda", name: "篠田 しおり", read: "しのだ しおり", age: 17, club: "バドミントン部", relation: "小島の恋人",
    statement: "私と優菜は今日一日中一緒にいたの。朝から体育館で劇や演奏を見ていたから教室の方には行ってないわ。たまにトイレに出て一緒にいなかった時間はあるけど数分よ！\n21教室に行った理由はスマホのバッテリーが少なくなっていたから、教室においてあるモバイルバッテリーを取りに行っていたのよ。取りに行ったついでに展示を見て回ろうとしたときに21教室の前を通ったからよ！私を疑っているの？？私じゃないわ！第一大切な彼氏が誰かに殺されているのよ！被害者は私もよ！早く捕まえて！",
    qa: [
      { q: "小島博に恨みはありますか？", a: "そんなのないわ！だって私たちが高校1年の頃から付き合っているのよ！そんな小さな不満も気にしなくなるわ！",
        note: "⚠ クラスメイトの証言と食い違う。しおりは小島への恨みを愚痴っていた。", noteReq: "しおりの愚痴" },
      { q: "事件現場に落ちていたこのキーホルダーに見覚えはありますか？", req: "クマのキーホルダー", gives: "しおりのキーホルダー紛失",
        a: "あっ！それ私のです！なんで現場に落ちてるんだろう…？このキーホルダーいつもカバンにつけているんですけど、先週ぐらいだったかな、どこかに落としちゃって。" },
      { q: "クラスメイトから聞きました。あなた小島博のことを恋愛関連で恨んでいたらしいですね。", req: "しおりの愚痴",
        a: "うっ。そうよ正直私はあの人のことを最低な男だと思っていたわ。付き合って一か月もたたない間に他の女とDMしたり、インスタのストーリーに別の女といる写真を上げたりしてたのよ！そりゃ恨むなってのが無理な話よ！" },
      { q: "展示担当の人から、あなたと吉本さんが一緒に教室の方へ戻っていくのを見たと聞きました。何をしに戻ったのですか？", req: "篠田と吉本が教室へ戻る",
        a: "教室へモバイルバッテリーを取りに行っていたのよ、スマホを今朝充電してくるのを忘れて5％しかなかったの" },
      { q: "「緑朝日」という名前に心当たりはありますか？", tag: "midori", req: "緑朝日",
        a: "緑朝日？知らないわ。誰なの、その人…。" }
    ]
  },
  {
    id: "yoshimoto", name: "吉本 優菜", read: "よしもと ゆうな", age: 18, club: "簿記部", relation: "クラスの学級委員長",
    statement: "しおりと一緒に行動していたわ。私がしおりの後に21教室の中を見て…。あの時なぜか冷静に先生を呼ばなきゃって思って呼びに行ったわ。ほらあるじゃない、自分より大きい反応をしている人を見ると冷静になるやつ。そんな感じだったのよ。",
    qa: [
      { q: "小島博に恨みはありますか？",
        a: "恨み…。こんなことがあったからすべて話します。私は前回の期末テストでカンニング行為をしたの。そしたらカンニングの証拠を小島に握られてしまって。その弱みをいいことに毎日パシリのように裏でこき使われたわ。思いつく恨みはこれくらいね。でも殺しまではいかないわ。カンニングをした私が悪いもの。戒めだと思って毎日やっていたわ。" },
      { q: "事件現場に落ちていたこのキーホルダーに見覚えはありますか？", req: "クマのキーホルダー",
        a: "それしおりのやつかも…！最近なくしてしょんぼりしてたわ。なんで落ちてるんだろう" },
      { q: "しおりさんと離れていたトイレの時間は、どこのトイレを使っていましたか？", gives: "10:08の目撃",
        a: "えっと。なぜその質問を？使っていた場所は本館の2階の女子トイレです。体育館近くの女子トイレは故障していて、しょうがなく本館の女子トイレを使いました。あっ、その時石田君を見ました。商業棟の方から渡り廊下を渡っているところを見ました。たしか時間は10:08ぐらいだったかな。私、癖で腕時計を頻繁に確認する癖があるんです！それでたまたま記憶してまして。",
        note: "★ 重要証言：石田は10:08に体育館にいなかった。" },
      { q: "展示担当の人から、しおりさんと一緒に教室の方へ戻っていくのを見たと聞きました。なぜ戻ったのですか？", req: "篠田と吉本が教室へ戻る", gives: "10:35の移動",
        a: "しおりの充電が残り少なかったのだから教室へ取りに行ったわ。さっき戻ったばかりというのにね。確か時間は10:35だったわ" },
      { q: "「緑朝日」という名前に心当たりはありますか？", tag: "midori", req: "緑朝日",
        a: "聞いたことないわね。うちの学校にそんな名前の子はいないと思うけど。" }
    ]
  },
  {
    id: "deguchi", name: "出口 真央", read: "でぐち まお", age: 18, club: "帰宅部", relation: "",
    statement: "1年生や2年生の展示を見ていました…。一緒に行動していた人はいません。ボッチなんで…。\n2階の方で悲鳴が聞こえて、お化け屋敷はないはずなのにと見に行ったところ小島が死んでいて…",
    qa: [
      { q: "小島博に恨みはありますか？",
        a: "恨みならいくらでも出てきますよ…。私は小島にいじめられていましたから。最初の頃はからかい交じりの悪口だったのですが。最近は人格否定や家族まで否定されていて…正直耐えれませんでした。でも、殺す勇気はありません。あまり言っていいことではないのは分かっていますけど、殺されて当然の存在です。" },
      { q: "事件現場に落ちていたこのキーホルダーに見覚えはありますか？", req: "クマのキーホルダー",
        a: "どこかで見たことある気がするけど…私のではないわ" },
      { q: "死体付近に「DM」と書いてありました。この文字に見覚えは？", req: "DM",
        a: "DM私のイニシャルとでも言いたいんですか？ふつうそんな証拠残して去りませんよ。" },
      { q: "「緑朝日」という名前に心当たりはありますか？", tag: "midori", req: "緑朝日",
        a: "知りません…。誰ですか、それ。" }
    ]
  },
  {
    id: "ishida", name: "石田 真広", read: "いしだ まひろ", age: 18, club: "野球部", relation: "小島と同じ野球部",
    statement: "俺はその時間体育館でステージ発表を見ていたよ。トイレに行こうと体育館近くのトイレに行ったら混んでてよ。しょうがないから2階の教室近くのトイレに行ったんだ。トイレから出たところで悲鳴が聞こえて…。見に行ったら見てらんないぐらい血が出てる小島がいてよ。\n正直言って小島がドッキリでからかおうとしてるだけだと思ったけど。悲鳴が聞こえてもピクリともしないから違うと思ったぜ。",
    qa: [
      { q: "小島博に恨みはありますか？",
        a: "恨みか…。そんなの恨みがない人の方が少ないと思うぜ。あいつは正真正銘のクズだったからな。俺もあいつの言動にはイライラしてたぜ。",
        note: "野球部員の証言：高1の頃、小島と石田は篠田が好きだったが、1年後期に小島に取られた。以降、毎日自慢や煽りを繰り返され、怒りが募っていた。", noteReq: "石田と小島の確執" },
      { q: "事件現場に落ちていたこのキーホルダーに見覚えはありますか？", req: "クマのキーホルダー", gives: "石田はキーホルダーを知っていた",
        a: "あぁ、それはたぶんしおりのやつだ。この前なくしたらしい。何で知ってるかって？悪いかよ",
        note: "⚠ しおりがなくしたことを、なぜ石田が知っている？" },
      { q: "爪を見せていただいてもいいですか？", req: "段ボールの切れ目", gives: "石田の爪の汚れ",
        a: "爪？いいけど…。ほんとだ！だいぶ汚れてるなぁ。学校に来てからも少し段ボールで組み立てとかしてたからかな～。手洗ったんだけどなぁ",
        note: "⚠ 現場の段ボールにはひっかき傷があった。" },
      { q: "「緑朝日」という名前に心当たりはありますか？", tag: "midori", req: "緑朝日",
        a: "は？知らねぇよ、そんな名前。",
        note: "⚠ 石田のフォロワーには「緑朝日」がいた。", noteReq: "石田のフォロワー" }
    ]
  }
];

/* 時系列。req を満たすまで「？？？」で表示。extra は extraReq を満たすと追記 */
const TIMELINE = [
  { time: "10:00", title: "ステージ発表開始", body: "ステージ発表が始まる。",
    extra: "石田は「ステージ発表を見ていた」と話していたが、吉本の証言によりこれが嘘だとわかる。", extraReq: "10:08の目撃" },
  { time: "10:08", title: "吉本が石田を目撃", req: "10:08の目撃",
    body: "吉本がトイレへ向かう際、商業棟と本館をつなぐ渡り廊下を歩く石田を見かけた。吉本は頻繁に腕時計を確認する癖があり、時間を覚えていた。石田はその付近にいたことがわかる。" },
  { time: "10:15", title: "小島が呼び出された時間", req: "緑朝日", body: "「緑朝日」から、21教室に来るよう指定されていた時刻。" },
  { time: "10:23", title: "出口は現場の近くにいなかった", req: "花形の時計の写真", body: "展示担当の証言から、出口は10:23ごろ現場の近くにいなかったことがわかる。" },
  { time: "10:30", title: "小島の死亡推定時刻", body: "21教室で死亡。", crime: true },
  { time: "10:35", title: "篠田と吉本が教室の方へ戻る", req: "10:35の移動", body: "篠田の充電が残り少なかったため、篠田と吉本が教室の方へ戻った。" },
  { time: "10:40", title: "遺体の発見", body: "篠田と吉本が21教室を通りかかったタイミングで小島の遺体を発見。篠田は腰が抜けてその場に残り、吉本は冷静に職員室へ先生を呼びに行った。" }
];

/* 推理。犯人と根拠(必要キーワードがそろうと表示) */
const ANSWER = "ishida";
const REASONS = [
  { req: ["10:08の目撃"], text: "アリバイの嘘：石田は体育館でステージを見ていたと言うが、吉本が10:08に商業棟〜本館の渡り廊下を歩く石田を目撃している。" },
  { req: ["石田と小島の確執"], text: "動機：1年の頃に好きだった篠田を小島に取られ、毎日自慢・煽りを受けていた。" },
  { req: ["クマのキーホルダー", "石田はキーホルダーを知っていた"], text: "キーホルダー：しおりがなくしたことを石田は知っていた。小島が拾ったものを、争いの際にポケットから落としたと考えれば、現場にあった理由が説明できる（しおりが犯人とは限らない）。" },
  { req: ["段ボールの切れ目", "石田の爪の汚れ"], text: "爪の汚れ：現場の段ボールにはひっかき傷。石田は段ボール作業のせいと言うが、争った時に付いた汚れの可能性が高い。" },
  { req: ["緑朝日", "小島のDM自慢", "石田のフォロワー"], text: "緑朝日：学校にいない人物からの呼び出し。小島は知らない相手からのDMでも不思議に思わなかった。その「緑朝日」を石田がフォローしている。" },
  { req: ["DM", "緑朝日"], text: "ダイイングメッセージ「DM」：出口のイニシャルではなく、呼び出しに使われたダイレクトメッセージ（緑朝日）を指している。" },
  { req: ["サバイバルナイフ"], text: "凶器に指紋がない：計画的に呼び出して犯行に及び、痕跡を消したことを示唆する。" },
  { req: ["花形の時計の写真"], text: "出口：展示担当の証言から、10:23ごろ現場の近くにいなかった。「DM」が出口のイニシャルだという疑いは弱まる。" }
];

/* =========================================================
   状態管理（ブラウザに保存）
   ========================================================= */
/* =========================================================
   ★ 運営が編集する場所 ★
   現実の現場に隠すキーワード（コード）の一覧です。
   左：ゲーム内の手がかり名（変更しない）／右：現場に隠す文字列（自由に変更OK）
   入力時は、大文字小文字・全角半角・ひらがなカタカナ・ハイフン・空白を区別しません。
   ========================================================= */
const CODES = {
  "小島のスマホ":         "200417",          // 遺体のそばのスマホ
  "サバイバルナイフ":     "KNIFE",           // 凶器のナイフ
  "DM":                   "DIEMESSAGE",      // 遺体付近の「DM」の文字
  "クマのキーホルダー":   "BEARCHARACTER",   // 教卓の近くのキーホルダー
  "段ボールの切れ目":     "SLICEBOX"         // 現場の段ボール
};

LOCATIONS.forEach(l => l.findings.forEach(f => {
  f.code = CODES[f.kw];
  if (!f.code && !f.auto) console.warn("CODES に未設定の手がかり:", f.kw);
}));

function norm(s) {
  return String(s).normalize("NFKC").toLowerCase()
    .replace(/[\s\-_ー]/g, "")
    .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
}
function findByCode(code) {
  for (const l of LOCATIONS)
    for (const f of l.findings)
      if (f.code && norm(f.code) === code) return { l, f };
  return null;
}

const STORE_KEY = "bunkasai-nazo-v4";
let state = loadState();
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && Array.isArray(s.found) && Array.isArray(s.asked)) { if (!Array.isArray(s.opened)) s.opened = []; if (typeof s.accused !== "string") s.accused = ""; return s; }
  } catch (e) {}
  return { found: [], asked: [], opened: [], accused: "" };
}
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

const toList = r => (r ? [].concat(r) : []);
const has = k => state.found.includes(k);
const hasAll = r => toList(r).every(has);
const qKey = (sid, i) => sid + ":" + i;
const askedTag = (sid, tag) => { const s = SUSPECTS.find(x => x.id === sid); return !!s && s.qa.some((q, i) => q.tag === tag && state.asked.includes(qKey(sid, i))); };

const ALL_KW = (() => {
  const set = [];
  LOCATIONS.forEach(l => l.findings.forEach(f => set.push(f.kw)));
  SUSPECTS.forEach(s => s.qa.forEach(q => q.gives && set.push(q.gives)));
  return set;
})();

function gain(kws) {
  const fresh = toList(kws).filter(k => !has(k));
  fresh.forEach(k => state.found.push(k));
  if (fresh.length) toast("🔑 キーワード入手：" + fresh.join("・"));
  saveState();
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
const nl = s => s.replace(/\n/g, "<br>");

/* 条件を満たした「auto」の手がかりを、キーワード入力なしで解放する */
function syncAuto() {
  const released = [];
  let changed = true;
  while (changed) {
    changed = false;
    LOCATIONS.forEach(l => l.findings.forEach(f => {
      if (f.auto && !has(f.kw) && f.auto()) { state.found.push(f.kw); released.push(f); changed = true; }
    }));
  }
  if (released.length) {
    saveState();
    const loud = released.filter(f => !f.silent);
    if (loud.length) toast("🔓 新しい情報が解放：" + loud.map(f => f.title).join("・"));
  }
}

/* =========================================================
   ★ 話者（セリフ）の設定 ★
   img に画像ファイルを指定すると、セリフの左側にその顔が出ます。
   画像を差し替えたいときは images フォルダの同名ファイルを置き換えるか、
   下の img のパスを書き換えてください。
   img を書かない人は icon（絵文字）が表示されます。
   ========================================================= */
const CHARS = {
  /* 容疑者：images フォルダに下のファイル名で写真を入れると自動で表示されます。
     （まだ無いあいだは icon が表示されます） */
  shinoda:   { name: "篠田 しおり",     img: "images/shinoda.jpg",   icon: "👤" },
  yoshimoto: { name: "吉本 優菜",       img: "images/yoshimoto.jpg", icon: "👤" },
  deguchi:   { name: "出口 真央",       img: "images/deguchi.jpg",   icon: "👤" },
  ishida:    { name: "石田 真広",       img: "images/ishida.jpg",    icon: "👤" },
  /* 関係者 */
  teacher:   { name: "先生",            img: "images/teacher.jpg",   icon: "🧑‍🏫" },
  kondo:     { name: "近藤 漢大",       img: "images/kondo.jpg",     icon: "🎤" },
  baseball:  { name: "野球部員",        img: "images/baseball.jpg",  icon: "⚾" },
  john:      { name: "ジョン・ブーマー", img: "images/john.jpg",      icon: "🎒" },
  exhibit:   { name: "展示担当",        img: "images/exhibit.jpg",   icon: "🖼️" }
};
/* 手がかり名 → 話している人（証言として表示するもの） */
const SPEAKERS = {
  "10:40の通報": "teacher",
  "実在しない人物": "teacher",
  "ステージ鑑賞は不完全": "kondo",
  "体育館のトイレ": "kondo",
  "石田と小島の確執": "baseball",
  "小島のDM自慢": "john",
  "篠田と吉本が教室へ戻る": "exhibit",
  "出口は展示を見ていた": "exhibit",
  "花形の時計の写真": "exhibit"
};

function imgFail(el) {
  const d = document.createElement("div");
  d.className = "avatar ph";
  d.textContent = el.dataset.icon || (el.alt || "?").charAt(0);
  el.replaceWith(d);
}
function avatarHtml(c) {
  return c.img
    ? `<img class="avatar" src="${c.img}" alt="${c.name}" data-icon="${c.icon || ""}" loading="lazy" onerror="imgFail(this)">`
    : `<div class="avatar ph">${c.icon || "💬"}</div>`;
}
/* 左に顔、右にふきだし */
function sayHtml(key, html) {
  const c = CHARS[key];
  if (!c) return `<p>${html}</p>`;
  return `<div class="say"><div class="who">${avatarHtml(c)}<div class="who-name">${c.name}</div></div>` +
         `<div class="bubble">${html}</div></div>`;
}

/* =========================================================
   描画
   ========================================================= */
const $content = document.getElementById("content");
let currentTab = "overview";
let suspectFilter = "all";
let guess = "";
let lastMsg = null;

const renderers = {
  overview() {
    return `
      <h2>事件概要</h2>
      <div class="card">
        <span class="badge red">被害者</span>
        <div class="suspect-name">${VICTIM.name}<small>${VICTIM.age}歳 / ${VICTIM.club}</small></div>
        <p class="muted">文化祭の最中、空き教室で遺体となって発見された。</p>
      </div>
      <h3>現場の状況</h3>
      <div class="card"><ul>${SCENE_BASIC.map(s => `<li>${s}</li>`).join("")}</ul>
        <p class="muted">現場のくわしい様子は「捜査」タブで調べよう。</p></div>
      <h3>容疑者</h3>
      <div class="grid">
        ${SUSPECTS.map(s => `
          <div class="card">
            <span class="badge blue">容疑者</span>
            <div class="suspect-name">${s.name}<small>${s.age}歳</small></div>
            <p class="muted">${s.club}${s.relation ? "／" + s.relation : ""}</p>
          </div>`).join("")}
      </div>
      <div class="card" style="margin-top:16px">
        <strong>遊び方</strong>
        <ol>
          <li>事件現場を探したり、関係者に話しかけることで隠された<span class="kw-badge">キーワード</span>を見つける。</li>
          <li>「捜査」タブにキーワードを入力すると、証拠や証言が開示される。</li>
          <li>手に入れた情報で、容疑者への新しい質問や、調べられる場所が増えていく。証言を読んだり質問したりすると、キーワードなしで新しい情報が解放されることもある。</li>
          <li>「手がかり帳」で情報を整理し、「推理」タブで犯人を指名しよう。</li>
        </ol>
      </div>
    `;
  },

  search() {
    return `
      <h2>捜査</h2>
      <p class="muted">現実の現場で見つけたキーワードを入力すると、証拠や証言が開示されます。</p>
      <form id="code-form" class="code-form" autocomplete="off">
        <input id="code-input" class="code-input" placeholder="見つけたキーワードを入力" autocapitalize="off" autocorrect="off" spellcheck="false">
        <button class="btn go" type="submit">送信</button>
      </form>
      ${lastMsg ? `<div class="card ${lastMsg.ok ? "msg-ok" : "msg-ng"}"><strong>${lastMsg.ok ? "✅ " : "❌ "}${lastMsg.text}</strong>${lastMsg.html || ""}</div>` : ""}
      <h3>捜査エリア</h3>
      <div class="grid">
        ${LOCATIONS.map(l => {
          const allAuto = l.findings.every(f => f.auto);
          const gotAny = l.findings.some(f => has(f.kw));
          const locked = (l.req && !has(l.req)) || (allAuto && !gotAny && !l.opener);
          const done = l.findings.every(f => has(f.kw));
          if (locked) {
            return `<div class="card loc locked">
              <div class="loc-title">🔒 ${l.name}</div>
              <p class="muted">${l.lockHint || l.autoHint || "まだ調べられない。"}</p></div>`;
          }
          const got = l.findings.filter(f => has(f.kw));
          const codeLeft = l.findings.filter(f => !f.auto && !has(f.kw)).length;
          const autoLeft = l.findings.filter(f => f.auto && !has(f.kw)).length;
          const badge = done
            ? `<span class="badge green">${allAuto ? "解放済み" : "すべて発見"}</span>`
            : `<span class="badge">🔎 ${got.length} / ${l.findings.length}</span>` +
              (codeLeft ? `<p class="muted">この場所のキーワードは、現実のどこかに隠されている。</p>` : "") +
              (autoLeft ? `<p class="muted">🔒 ${l.autoHint || "まだ聞けることがありそうだ…"}</p>` : "");
          return `<div class="card loc ${done ? "done" : ""}">
            <div class="loc-title">${l.icon} ${l.name}</div>
            <p class="muted">${l.hint}</p>
            ${l.opener && !state.opened.includes(l.opener.key) ? `<button class="ask-btn" data-open="${l.opener.key}">${l.opener.label}</button>` : ""}
            ${badge}${got.map(findingHtml).join("")}
          </div>`;
        }).join("")}
      </div>`;
  },

  suspects() {
    return `
      <h2>容疑者</h2>
      <div class="suspect-select" id="chips">
        <button class="chip ${suspectFilter === "all" ? "on" : ""}" data-id="all">全員</button>
        ${SUSPECTS.map(s => `<button class="chip ${suspectFilter === s.id ? "on" : ""}" data-id="${s.id}">${s.name}</button>`).join("")}
      </div>
      ${SUSPECTS.filter(s => suspectFilter === "all" || s.id === suspectFilter).map(suspectCard).join("")}
    `;
  },

  notebook() {
    const n = state.found.length, total = ALL_KW.length;
    const foundFindings = LOCATIONS.flatMap(l => l.findings.filter(f => has(f.kw)).map(f => ({ f, l })));
    return `
      <h2>手がかり帳</h2>
      <div class="card">
        <strong>集めたキーワード ${n} / ${total}</strong>
        <div class="progress"><div style="width:${Math.round(n / total * 100)}%"></div></div>
        ${n ? state.found.map(k => `<span class="kw-badge">${k}</span>`).join("") : '<p class="muted">まだキーワードがありません。「捜査」タブで場所を調べよう。</p>'}
      </div>
      <h3>見つけた証拠・証言</h3>
      ${foundFindings.length
        ? foundFindings.map(({ f, l }) => `<div class="card"><span class="badge">${l.name}</span>${findingHtml(f)}</div>`).join("")
        : '<p class="muted">まだありません。</p>'}
      <div style="margin-top:20px"><button class="btn sub small" id="reset">最初からやり直す</button></div>
    `;
  },

  timeline() {
    return `
      <h2>時系列の整理</h2>
      <p class="muted">手がかりが増えると、空白が埋まっていきます。</p>
      <div class="timeline">
        ${TIMELINE.map(t => {
          if (t.req && !has(t.req)) {
            return `<div class="tl-item locked"><div class="tl-time">${t.time}</div>
              <div class="card"><strong>？？？</strong><p class="muted">まだ手がかりが足りない。</p></div></div>`;
          }
          const extra = t.extra && has(t.extraReq) ? `<p style="color:var(--accent)">${t.extra}</p>` : "";
          return `<div class="tl-item ${t.crime ? "crime" : ""}">
            <div class="tl-time">${t.time}</div>
            <div class="card"><strong>${t.title}</strong><p>${t.body}</p>${extra}</div></div>`;
        }).join("")}
      </div>`;
  },

  deduction() {
    const done = !!state.accused;
    return `
      <h2>推理</h2>
      <div class="card">
        <p>${done ? "指名はすでに行いました。犯人の指名は一度だけです。" : "犯人だと思う人物を選んで、「この人が犯人だ」を押してください。<br><strong>※ 指名できるのは一度だけです。慎重に選んでください。</strong>"}</p>
        <div class="radio-list">
          ${SUSPECTS.map(s => `<label><input type="radio" name="culprit" value="${s.id}" ${state.accused === s.id || (!done && guess === s.id) ? "checked" : ""} ${done ? "disabled" : ""}>${s.name}</label>`).join("")}
        </div>
        ${done ? "" : '<button class="btn" id="accuse">この人が犯人だ</button>'}
      </div>
      <div id="verdict">${done ? verdictHtml(state.accused) : ""}</div>
    `;
  }
};

function findingHtml(f) {
  const sp = SPEAKERS[f.kw];
  let body;
  if (sp) {
    const [speech, ...rest] = f.text.split("\n");
    body = sayHtml(sp, nl(speech)) + (rest.length ? `<p class="muted">${nl(rest.join("\n"))}</p>` : "");
  } else {
    body = `<p>${nl(f.text)}</p>`;
  }
  return `<div class="finding"><strong>${f.title}</strong>${body}
    <div class="kw">🔑 <span class="kw-badge">${f.kw}</span></div></div>`;
}

function verdictHtml(g) {
  if (g !== ANSWER) {
    return `<div class="card result-ng"><strong>❌ 違うようだ…</strong>
      <p>指名は一度きりです。この事件の捜査はここで終了です。</p></div>`;
  }
  const s = SUSPECTS.find(x => x.id === ANSWER);
  const unlocked = REASONS.filter(r => hasAll(r.req)).length;
  return `<div class="card result-ok">
      <span class="badge green">正解</span>
      <div class="suspect-name">犯人は ${s.name} だ！</div>
      <p class="muted">根拠 ${unlocked} / ${REASONS.length} をつかんでいる</p>
    </div>
    <div class="card"><h3 style="margin-top:0">推理の根拠</h3>
      ${REASONS.map((r, i) => `<div class="clue"><span class="no">${i + 1}</span><div>${
        hasAll(r.req) ? r.text : '<span class="muted">？？？（この根拠にはまだ手がかりが足りない）</span>'}</div></div>`).join("")}
    </div>`;
}

function suspectCard(s) {
  const qs = s.qa.map((q, i) => {
    const asked = state.asked.includes(qKey(s.id, i));
    const open = !q.req || has(q.req);
    if (asked) {
      const note = q.note && (!q.noteReq || has(q.noteReq))
        ? `<div class="note">${q.note}</div>` : "";
      return `<div class="qa"><div class="q">Q：${q.q}</div>${sayHtml(s.id, "「" + nl(q.a) + "」")}${note}
        ${q.gives ? `<div class="kw" style="margin-top:6px">🔑 <span class="kw-badge">${q.gives}</span></div>` : ""}</div>`;
    }
    if (open) return `<button class="ask-btn" data-ask="${s.id}:${i}">❓ ${q.q}</button>`;
    return `<div class="ask-locked">🔒 まだ聞けない質問（手がかりが必要）</div>`;
  }).join("");
  return `<div class="card">
    <div class="suspect-head">
      <div class="suspect-name">${s.name}<small>${s.read}</small></div>
      <div><span class="badge">${s.age}歳</span><span class="badge">${s.club}</span></div>
    </div>
    ${s.relation ? `<p class="muted">${s.relation}</p>` : ""}
    <h3>最初の証言</h3>${state.opened.includes(s.id) ? sayHtml(s.id, nl(s.statement)) : `<button class="ask-btn" data-open="${s.id}">💬 最初の証言を聞く</button>`}
    <h3>質問する</h3>${qs}
  </div>`;
}

function show(tab) {
  currentTab = tab;
  syncAuto();
  $content.innerHTML = renderers[tab]();
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
}

/* =========================================================
   イベント
   ========================================================= */
document.getElementById("tabs").addEventListener("click", e => {
  const btn = e.target.closest(".tab");
  if (btn) { lastMsg = null; show(btn.dataset.tab); window.scrollTo({ top: 0 }); }
});

$content.addEventListener("click", e => {
  const y = window.scrollY;
  const openBtn = e.target.closest("[data-open]");
  if (openBtn) {
    const id = openBtn.dataset.open;
    if (!state.opened.includes(id)) { state.opened.push(id); saveState(); }
    show(currentTab); window.scrollTo({ top: y });
    return;
  }
  const askBtn = e.target.closest("[data-ask]");
  if (askBtn) {
    const [sid, idx] = askBtn.dataset.ask.split(":");
    const s = SUSPECTS.find(x => x.id === sid);
    const q = s && s.qa[+idx];
    if (q && (!q.req || has(q.req)) && !state.asked.includes(qKey(sid, idx))) {
      state.asked.push(qKey(sid, idx));
      if (q.gives) gain(q.gives); else saveState();
      show(currentTab); window.scrollTo({ top: y });
    }
    return;
  }
  const chip = e.target.closest(".chip");
  if (chip) { suspectFilter = chip.dataset.id; show("suspects"); return; }

  if (e.target.id === "reset") {
    if (confirm("集めたキーワードと質問の記録をすべて消して、最初からやり直しますか？")) {
      state = { found: [], asked: [], opened: [], accused: "" }; saveState(); guess = ""; show("notebook");
    }
    return;
  }
  if (e.target.id === "accuse") {
    const sel = document.querySelector('input[name="culprit"]:checked');
    const box = document.getElementById("verdict");
    if (!sel) { box.innerHTML = '<div class="card"><p>犯人を選んでください。</p></div>'; return; }
    const name = SUSPECTS.find(x => x.id === sel.value).name;
    if (!confirm(`${name} を犯人として指名します。指名は一度だけで、やり直せません。よろしいですか？`)) return;
    state.accused = sel.value; guess = sel.value; saveState();
    show("deduction");
  }
});

/* キーワード入力 */
$content.addEventListener("submit", e => {
  if (e.target.id !== "code-form") return;
  e.preventDefault();
  const code = norm(document.getElementById("code-input").value);
  if (!code) return;
  const hit = findByCode(code);
  if (!hit) {
    lastMsg = { ok: false, text: "そのキーワードでは何も見つからなかった…。もう一度、現場をよく探してみよう。" };
  } else if (has(hit.f.kw)) {
    lastMsg = { ok: false, text: "そのキーワードはすでに入力済みです。" };
  } else if (hit.l.req && !has(hit.l.req)) {
    lastMsg = { ok: false, text: "そのキーワードは、今はまだ意味がわからない…。他の手がかりを集めてから、もう一度試そう。" };
  } else {
    gain([hit.f.kw]);
    lastMsg = { ok: true, text: "新しい発見：" + hit.f.title, html: findingHtml(hit.f) };
  }
  show("search");
  const input = document.getElementById("code-input");
  if (input) input.focus();
});

show("overview");
